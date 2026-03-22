CREATE TABLE user_profiles (
  id          uuid  PRIMARY KEY REFERENCES auth.users(id),
  full_name   text,
  role        text,
  company     text,
  created_at  timestamptz DEFAULT now()
);
