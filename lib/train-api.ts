import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface OnboardingData {
  age: number;
  weight_kg: number;
  height_cm: number;
  sex: string;
  training_experience: string;
  years_training: number;
  trade: string;
  available_equipment: string[];
  goals: string[];
  known_lifts?: {
    squat_kg?: number;
    squat_reps?: number;
    bench_kg?: number;
    bench_reps?: number;
    deadlift_kg?: number;
    deadlift_reps?: number;
    ohp_kg?: number;
    ohp_reps?: number;
  };
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.205 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.205 * 10) / 10;
}

export async function getFatigueState(userId: string) {
  const { data, error } = await supabase.rpc('get_current_fatigue', { p_user_id: userId });
  if (error) throw error;
  return data || [];
}

export async function onboardUser(userId: string, d: OnboardingData) {
  const knownLifts: Record<string, any> = {};
  if (d.known_lifts) {
    if (d.known_lifts.squat_kg) knownLifts['Barbell Back Squat'] = { weight: d.known_lifts.squat_kg, reps: d.known_lifts.squat_reps || 5 };
    if (d.known_lifts.bench_kg) knownLifts['Barbell Bench Press'] = { weight: d.known_lifts.bench_kg, reps: d.known_lifts.bench_reps || 5 };
    if (d.known_lifts.deadlift_kg) knownLifts['Barbell Deadlift'] = { weight: d.known_lifts.deadlift_kg, reps: d.known_lifts.deadlift_reps || 5 };
    if (d.known_lifts.ohp_kg) knownLifts['Overhead Press'] = { weight: d.known_lifts.ohp_kg, reps: d.known_lifts.ohp_reps || 5 };
  }
  const { data, error } = await supabase.rpc('onboard_user', {
    p_user_id: userId, p_age: d.age, p_weight_kg: d.weight_kg, p_height_cm: d.height_cm,
    p_sex: d.sex, p_training_experience: d.training_experience, p_years_training: d.years_training,
    p_trade: d.trade, p_available_equipment: d.available_equipment, p_goals: d.goals, p_known_lifts: knownLifts
  });
  if (error) throw error;
  return data;
}

export async function getWorkoutRecommendation(userId: string, focusArea = 'full_body', duration = 45, equipment = ['barbell','dumbbell','bodyweight']) {
  const { data, error } = await supabase.rpc('recommend_workout_v2', {
    p_user_id: userId, p_focus_area: focusArea, p_duration_minutes: duration, p_available_equipment: equipment
  });
  if (error) throw error;
  return data;
      }

export async function logExerciseSet(userId: string, exerciseId: string, sets: number, reps: number, weightKg: number, rpe: number) {
  const { data, error } = await supabase.rpc('ingest_activity', {
    p_user_id: userId, p_activity_type: 'workout', p_activity_name: exerciseId,
    p_duration_minutes: sets * 3, p_intensity: rpe / 10, p_muscle_loads: null,
    p_notes: JSON.stringify({ sets, reps, weight_kg: weightKg, rpe })
  });
  if (error) throw error;
  return data;
}

export async function logWorkShift(userId: string, taskName: string, durationHours: number, intensity = 0.7) {
  const { data, error } = await supabase.rpc('ingest_activity', {
    p_user_id: userId, p_activity_type: 'occupational', p_activity_name: taskName,
    p_duration_minutes: durationHours * 60, p_intensity: intensity, p_muscle_loads: null, p_notes: null
  });
  if (error) throw error;
  return data;
}

export async function logRecovery(userId: string, sleepHours: number, sleepQuality: string, deepSleep = 0, hrv = 0) {
  const { data, error } = await supabase.rpc('process_recovery', {
    p_user_id: userId, p_sleep_hours: sleepHours, p_sleep_quality: sleepQuality,
    p_deep_sleep_hours: deepSleep, p_hrv_rmssd: hrv, p_resting_hr: 0
  });
  if (error) throw error;
  return data;
}

export async function getExercises() {
  const { data, error } = await supabase.from('exercises').select('*');
  if (error) throw error;
  return data || [];
}

export async function getMuscleGroups() {
  const { data, error } = await supabase.from('muscle_groups').select('*');
  if (error) throw error;
  return data || [];
}

export async function getTrades() {
  const { data, error } = await supabase.from('occupational_profiles').select('*').order('daily_met_estimate', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function checkOnboardingStatus(userId: string) {
  const { data, error } = await supabase.from('user_training_preferences').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
