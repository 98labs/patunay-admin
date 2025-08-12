-- Enable RLS on appraisal tables
ALTER TABLE public.artwork_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_appraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_appraisers ENABLE ROW LEVEL SECURITY;

-- Policies for artwork_appraisals
CREATE POLICY "Enable read access for authenticated users" ON public.artwork_appraisals
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.artwork_appraisals
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.artwork_appraisals
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON public.artwork_appraisals
    FOR DELETE TO authenticated
    USING (true);

-- Policies for artwork_appraisers
CREATE POLICY "Enable read access for authenticated users" ON public.artwork_appraisers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.artwork_appraisers
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.artwork_appraisers
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON public.artwork_appraisers
    FOR DELETE TO authenticated
    USING (true);

-- Policies for appraisal_appraisers
CREATE POLICY "Enable read access for authenticated users" ON public.appraisal_appraisers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.appraisal_appraisers
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.appraisal_appraisers
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON public.appraisal_appraisers
    FOR DELETE TO authenticated
    USING (true);