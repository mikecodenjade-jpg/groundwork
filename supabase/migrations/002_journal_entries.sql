CREATE TABLE journal_entries (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES auth.users(id),
  entry        text        NOT NULL,
  gratitude_1  text,
  gratitude_2  text,
  gratitude_3  text,
  created_at   timestamptz DEFAULT now()
);
