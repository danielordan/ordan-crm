-- Clients and users tables (ARCHITECTURE section 11)

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  company_name_normalized text,
  address text,
  phone text,
  phone_digits text,
  email text,
  email_normalized text,
  origin_port text,
  origin_country text,
  destination_port text,
  incoterms text,
  shipment_type text CHECK (shipment_type IN ('FCL', 'LCL')),
  date_added timestamptz NOT NULL DEFAULT now(),
  processing_status text NOT NULL CHECK (processing_status IN ('Success', 'Failed')),
  error_details text
);

-- Duplicate safety (11.5): same company + email can exist only once
CREATE UNIQUE INDEX clients_company_email_unique
  ON clients (company_name_normalized, email_normalized)
  WHERE company_name_normalized IS NOT NULL AND email_normalized IS NOT NULL;

CREATE INDEX clients_company_idx ON clients (company_name_normalized);
CREATE INDEX clients_email_idx ON clients (email_normalized);
CREATE INDEX clients_date_added_idx ON clients (date_added DESC, id DESC);
CREATE INDEX clients_status_date_added_idx ON clients (processing_status, date_added DESC, id DESC);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id text NOT NULL UNIQUE,
  email text NOT NULL,
  name text,
  date_added timestamptz NOT NULL DEFAULT now()
);

-- RLS without policies blocks Supabase's public Data API.
-- The backend connects as the table owner and is not affected.
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
