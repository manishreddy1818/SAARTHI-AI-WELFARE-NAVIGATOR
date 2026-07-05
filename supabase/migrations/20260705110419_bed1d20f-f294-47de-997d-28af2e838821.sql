
CREATE TYPE public.follow_up_status AS ENUM (
  'need_documents',
  'application_submitted',
  'waiting_approval',
  'benefit_received',
  'completed'
);

CREATE TABLE public.partner_citizens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile TEXT,
  age INTEGER,
  gender TEXT,
  state TEXT,
  district TEXT,
  occupation TEXT,
  monthly_income NUMERIC,
  education TEXT,
  marital_status TEXT,
  category TEXT,
  has_disability BOOLEAN DEFAULT false,
  household_size INTEGER,
  household_type TEXT,
  preferred_language TEXT,
  notes TEXT,
  status public.follow_up_status NOT NULL DEFAULT 'need_documents',
  estimated_benefits NUMERIC NOT NULL DEFAULT 0,
  applications_started INTEGER NOT NULL DEFAULT 0,
  applications_completed INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_citizens TO authenticated;
GRANT ALL ON public.partner_citizens TO service_role;
ALTER TABLE public.partner_citizens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners manage own citizens"
  ON public.partner_citizens
  FOR ALL
  TO authenticated
  USING (auth.uid() = partner_id)
  WITH CHECK (auth.uid() = partner_id);

CREATE TRIGGER partner_citizens_updated_at
  BEFORE UPDATE ON public.partner_citizens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_partner_citizens_partner ON public.partner_citizens(partner_id, last_activity_at DESC);
CREATE INDEX idx_partner_citizens_name ON public.partner_citizens USING gin (to_tsvector('simple', full_name));

CREATE TABLE public.partner_citizen_family (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id UUID NOT NULL REFERENCES public.partner_citizens(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  occupation TEXT,
  monthly_income NUMERIC,
  has_disability BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_citizen_family TO authenticated;
GRANT ALL ON public.partner_citizen_family TO service_role;
ALTER TABLE public.partner_citizen_family ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners manage own citizen family"
  ON public.partner_citizen_family
  FOR ALL
  TO authenticated
  USING (auth.uid() = partner_id)
  WITH CHECK (auth.uid() = partner_id);

CREATE INDEX idx_partner_citizen_family_citizen ON public.partner_citizen_family(citizen_id);
