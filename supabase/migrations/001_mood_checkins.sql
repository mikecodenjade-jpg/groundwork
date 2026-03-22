CREATE TABLE mood_checkins (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id),
  mood       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);
