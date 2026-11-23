-- Permanent record of who did what and when (ARCHITECTURE 11.8, ADR-45).
-- No foreign keys: a deleted client keeps its history, and a logging row never fails
-- because of a related table.

CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  action text NOT NULL,
  client_id uuid,
  result text NOT NULL CHECK (result IN ('success', 'failure')),
  details jsonb,
  request_id text
);

CREATE INDEX activity_logs_created_at_idx ON activity_logs (created_at DESC);
CREATE INDEX activity_logs_user_idx ON activity_logs (user_id, created_at DESC);
CREATE INDEX activity_logs_client_idx ON activity_logs (client_id, created_at DESC);

-- Same as the other tables: no policies, so Supabase's public Data API cannot read it
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
