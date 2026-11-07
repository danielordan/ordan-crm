-- Username + password accounts next to Google accounts (ARCHITECTURE 11.6, ADR-37)

ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD COLUMN username text;
ALTER TABLE users ADD COLUMN password_hash text;

-- Usernames are stored in lowercase, so this also makes them unique regardless of case
CREATE UNIQUE INDEX users_username_unique ON users (username) WHERE username IS NOT NULL;

-- Every user signs in one way or the other: Google, or username + password
ALTER TABLE users ADD CONSTRAINT users_sign_in_method CHECK (
  (google_id IS NOT NULL AND email IS NOT NULL)
  OR (username IS NOT NULL AND password_hash IS NOT NULL)
);
