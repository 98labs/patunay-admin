-- Initial schema setup
-- This migration creates the base tables needed for the application

-- Create user role enum (old version)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    role user_role DEFAULT 'staff',
    phone text,
    avatar_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamp with time zone,
    deleted_by uuid REFERENCES auth.users(id),
    permissions text[] DEFAULT '{}'::text[]
);

-- Create artworks table
CREATE TABLE IF NOT EXISTS public.artworks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_number text UNIQUE NOT NULL,
    title text NOT NULL,
    description text,
    artist text NOT NULL,
    year integer,
    medium text,
    height numeric,
    width numeric,
    sizeUnit text DEFAULT 'cm',
    tag_id uuid,
    expirationDate timestamp with time zone,
    readWriteCount integer DEFAULT 0,
    provenance text,
    bibliography text[],
    collectors text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id text UNIQUE NOT NULL,
    active boolean DEFAULT true,
    issue_date timestamp with time zone DEFAULT now(),
    expiration_date timestamp with time zone,
    write_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),
    tag_issued_by uuid REFERENCES auth.users(id)
);

-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id uuid REFERENCES public.artworks(id) ON DELETE CASCADE,
    filename text NOT NULL,
    url text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    permission text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);

-- Create appraisals related tables
CREATE TABLE IF NOT EXISTS public.artwork_appraisers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id uuid REFERENCES public.artworks(id) ON DELETE CASCADE,
    appraisal_type text,
    appraiser_name text,
    appraisal_date date,
    current_value numeric,
    currency text DEFAULT 'USD',
    notes text,
    document_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Add foreign key constraint for tag_id in artworks
ALTER TABLE public.artworks 
    ADD CONSTRAINT artworks_tag_id_fkey 
    FOREIGN KEY (tag_id) 
    REFERENCES public.tags(id) 
    ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_artworks_artist ON public.artworks(artist);
CREATE INDEX IF NOT EXISTS idx_artworks_tag_id ON public.artworks(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_id ON public.tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_active ON public.tags(active);
CREATE INDEX IF NOT EXISTS idx_assets_artwork_id ON public.assets(artwork_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_appraisers ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view artworks" ON public.artworks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view tags" ON public.tags
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view assets" ON public.assets
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, created_at, updated_at)
    VALUES (new.id, new.created_at, new.created_at)
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();