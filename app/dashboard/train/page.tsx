'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';


// supabase imported from @/lib/supabase


type Step = 'loading' | 'onboarding' | 'workout' | 'logging';
type FocusArea = 'full_body' | 'upper' | 'lower' | 'core';


interface FatigueEntry { muscle_group_id: string; muscle_name: string; current_fatigue: number; status: string; }
interface WorkoutExercise { exercise_name: string; score: number; sets_reps: string; weight_prescription: any; movement_pattern: string; }
interface WorkoutData { warmup: WorkoutExercise[]; main_exercises: WorkoutExercise[]; cooldown: WorkoutExercise[]; session_summary: any; cross_pillar: any; }


const TRADES = [
  'General Laborer','Carpenter','Electrician','Plumber','Ironworker','Mason/Bricklayer',
  'Roofer','Painter','HVAC Technician','Heavy Equipment Operator','Welder','Pipefitter','Superintendent/Foreman'
];
const EQUIPMENT_OPTIONS = ['barbell','dumbbell','kettlebell','bodyweight','resistance_bands','pull_up_bar','cable_machine'];
const GOAL_OPTIONS = ['Build Strength','Build Muscle','Improve Endurance','Lose Fat','Injury Prevention','General Fitness'];


export default function TrainPage() {
  const [step, setStep] = useState<Step>('loading');
  const [userId, setUserId] = useState<string>('');
  const [useLbs, setUseLbs] = useState(true);
  const [focus, setFocus] = useState<FocusArea>('full_body');
  const [fatigue, setFatigue] = useState<FatigueEntry[]>([]);
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  // Onboarding state
  const [onboardStep, setOnboardStep] = useState(0);
  const [age, setAge] = useState(30);
  const [weightKg, setWeightKg] = useState(90);
  const [heightCm, setHeightCm] = useState(178);
