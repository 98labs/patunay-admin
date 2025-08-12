-- Create artwork_appraisals table
CREATE TABLE IF NOT EXISTS public.artwork_appraisals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    artwork_id uuid NOT NULL,
    condition text,
    acquisition_cost numeric,
    appraised_value numeric,
    artist_info text,
    recent_auction_references text[],
    notes text,
    recommendation text,
    appraisal_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid DEFAULT auth.uid(),
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT artwork_appraisals_pkey PRIMARY KEY (id),
    CONSTRAINT artwork_appraisals_artwork_id_fkey FOREIGN KEY (artwork_id) 
        REFERENCES public.artworks(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Create artwork_appraisers table
CREATE TABLE IF NOT EXISTS public.artwork_appraisers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid DEFAULT auth.uid(),
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT artwork_appraisers_pkey PRIMARY KEY (id),
    CONSTRAINT artwork_appraisers_name_key UNIQUE (name)
);

-- Create junction table for appraisal-appraiser relationship
CREATE TABLE IF NOT EXISTS public.appraisal_appraisers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    appraisal_id uuid NOT NULL,
    appraiser_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid DEFAULT auth.uid(),
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT appraisal_appraisers_pkey PRIMARY KEY (id),
    CONSTRAINT appraisal_appraisers_appraisal_id_fkey FOREIGN KEY (appraisal_id) 
        REFERENCES public.artwork_appraisals(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT appraisal_appraisers_appraiser_id_fkey FOREIGN KEY (appraiser_id) 
        REFERENCES public.artwork_appraisers(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT appraisal_appraisers_unique UNIQUE (appraisal_id, appraiser_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artwork_appraisals_artwork_id ON public.artwork_appraisals(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_appraisals_deleted_at ON public.artwork_appraisals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_appraisal_appraisers_appraisal_id ON public.appraisal_appraisers(appraisal_id);
CREATE INDEX IF NOT EXISTS idx_appraisal_appraisers_appraiser_id ON public.appraisal_appraisers(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_appraisal_appraisers_deleted_at ON public.appraisal_appraisers(deleted_at);

-- Add RLS policies
ALTER TABLE public.artwork_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_appraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_appraisers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view appraisals
CREATE POLICY "Allow authenticated users to view appraisals"
    ON public.artwork_appraisals
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to create appraisals
CREATE POLICY "Allow authenticated users to create appraisals"
    ON public.artwork_appraisals
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own appraisals
CREATE POLICY "Allow authenticated users to update appraisals"
    ON public.artwork_appraisals
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to soft delete appraisals
CREATE POLICY "Allow authenticated users to soft delete appraisals"
    ON public.artwork_appraisals
    FOR UPDATE
    TO authenticated
    USING (deleted_at IS NULL)
    WITH CHECK (deleted_at IS NOT NULL);

-- Policies for artwork_appraisers
CREATE POLICY "Allow authenticated users to view appraisers"
    ON public.artwork_appraisers
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to create appraisers"
    ON public.artwork_appraisers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update appraisers"
    ON public.artwork_appraisers
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policies for appraisal_appraisers junction table
CREATE POLICY "Allow authenticated users to view appraisal-appraiser links"
    ON public.appraisal_appraisers
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to create appraisal-appraiser links"
    ON public.appraisal_appraisers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update appraisal-appraiser links"
    ON public.appraisal_appraisers
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_artwork_appraisals_updated_at
    BEFORE UPDATE ON public.artwork_appraisals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_artwork_appraisers_updated_at
    BEFORE UPDATE ON public.artwork_appraisers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_appraisal_appraisers_updated_at
    BEFORE UPDATE ON public.appraisal_appraisers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();