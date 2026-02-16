-- Add access_key column to licenses table
ALTER TABLE public.licenses ADD COLUMN access_key text UNIQUE;

-- Create index for fast lookup
CREATE INDEX idx_licenses_access_key ON public.licenses (access_key) WHERE access_key IS NOT NULL;