create table public.artwork_appraisals (
  id uuid not null default gen_random_uuid (),
  condition text null,
  acquisition_cost numeric null,
  appraised_value numeric null,
  artist_info text null,
  recent_auction_references text[] null,
  notes text null,
  recommendation text null,
  appraisal_date date null,
  created_at timestamp with time zone null default now(),
  created_by uuid null,
  updated_at timestamp with time zone null,
  updated_by uuid null,
  deleted_at timestamp with time zone null,
  deleted_by uuid null,
  artwork_id uuid null,
  constraint artwork_appraisals_pkey primary key (id),
  constraint artwork_appraisals_artwork_id_fkey foreign KEY (artwork_id) references artworks (id)
) TABLESPACE pg_default;

create table public.artwork_appraisers (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  organization text null,
  created_by uuid null,
  updated_at timestamp without time zone null,
  updated_by uuid null,
  deleted_at timestamp without time zone null,
  deleted_by uuid null,
  user_id uuid null,
  constraint art_appraiser_pkey primary key (id),
  constraint artwork_appraisers_name_key unique (name),
  constraint artwork_appraiser_created_by_fkey foreign KEY (created_by) references profiles (id),
  constraint artwork_appraiser_deleted_by_fkey foreign KEY (deleted_by) references profiles (id),
  constraint artwork_appraiser_updated_by_fkey foreign KEY (updated_by) references profiles (id),
  constraint artwork_appraiser_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create table public.appraisal_appraisers (
  id uuid not null default gen_random_uuid (),
  appraisal_id uuid null,
  appraiser_id uuid null,
  created_at timestamp without time zone null,
  created_by uuid null,
  updated_at timestamp without time zone null,
  updated_by uuid null,
  deleted_at timestamp without time zone null,
  deleted_by uuid null,
  constraint appraisal_appraisers_pkey primary key (id),
  constraint appraisal_appraisers_appraisal_id_fkey foreign KEY (appraisal_id) references artwork_appraisals (id),
  constraint appraisal_appraisers_appraiser_id_fkey foreign KEY (appraiser_id) references artwork_appraisers (id) on delete CASCADE,
  constraint appraisal_appraisers_created_by_fkey foreign KEY (created_by) references profiles (id),
  constraint appraisal_appraisers_deleted_by_fkey foreign KEY (deleted_by) references profiles (id),
  constraint appraisal_appraisers_updated_by_fkey foreign KEY (updated_by) references profiles (id)
) TABLESPACE pg_default;