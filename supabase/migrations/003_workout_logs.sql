CREATE TABLE workout_logs (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid        REFERENCES auth.users(id),
  workout_name         text        NOT NULL,
  exercises_completed  int,
  duration_minutes     int,
  created_at           timestamptz DEFAULT now()
);
