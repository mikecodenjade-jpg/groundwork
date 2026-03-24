-- Add onboarding profile fields for new 5-screen onboarding flow
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS time_preference text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS priority_goals text[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS equipment_level text;
