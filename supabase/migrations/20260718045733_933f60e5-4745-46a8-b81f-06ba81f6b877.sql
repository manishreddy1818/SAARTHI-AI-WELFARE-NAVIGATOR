ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS other_disability_type TEXT;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS other_disability_type TEXT;

COMMENT ON COLUMN public.profiles.other_disability_type IS 'Free-text description when disability_type is "other".';
COMMENT ON COLUMN public.family_members.other_disability_type IS 'Free-text description when disability_type is "other".';