"use client";

import Link from "next/link";
import { use, useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Exercise = {
  name: string;
  muscles: string;
  sets: number;
  reps: string;
  note?: string;
};

type Tier = {
  exercises: Exercise[];
  restNote: string;
};

type Program = {
  title: string;
  description: string;
  weeks: number;
};

type CategoryData = {
  title: string;
  equipment: string;
  tiers: Record<number, Tier>;
  programs: Program[];
};

// ─── Workout data by category × duration ─────────────────────────────────────

const CATEGORY_DATA: Record<string, CategoryData> = {
  running: {
    title: "Running",
    equipment: "Shoes and open road",
    tiers: {
      15: {
        restNote: "Minimal rest — keep moving between efforts",
        exercises: [
          { name: "Easy Warm-Up Jog", muscles: "Full body activation", sets: 1, reps: "4 min", note: "Conversational pace" },
          { name: "Stride Intervals", muscles: "Quads · Glutes · Calves", sets: 4, reps: "30s on / 30s off", note: "90% effort" },
          { name: "Cool-Down Walk", muscles: "Full body", sets: 1, reps: "3 min" },
        ],
      },
      30: {
        restNote: "90s rest between hard efforts",
        exercises: [
          { name: "Easy Warm-Up Jog", muscles: "Full body activation", sets: 1, reps: "5 min", note: "Conversational pace" },
          { name: "Stride Intervals", muscles: "Quads · Glutes · Calves", sets: 6, reps: "30s on / 90s off", note: "80% effort" },
          { name: "Tempo Run", muscles: "Cardiovascular · Legs", sets: 1, reps: "12 min", note: "Comfortably hard pace" },
          { name: "Hill Repeats", muscles: "Glutes · Hamstrings · Calves", sets: 3, reps: "45s uphill" },
          { name: "Cool-Down Walk", muscles: "Full body", sets: 1, reps: "3 min" },
        ],
      },
      45: {
        restNote: "90s rest between hard efforts, full recovery on hills",
        exercises: [
          { name: "Dynamic Warm-Up", muscles: "Hips · Hamstrings · Calves", sets: 1, reps: "5 min", note: "Leg swings, high knees, A-skips" },
          { name: "Easy Warm-Up Jog", muscles: "Full body activation", sets: 1, reps: "5 min" },
          { name: "Stride Intervals", muscles: "Quads · Glutes · Calves", sets: 6, reps: "30s on / 90s off", note: "85% effort" },
          { name: "Tempo Run", muscles: "Cardiovascular · Legs", sets: 1, reps: "18 min", note: "Comfortably hard — 7/10 effort" },
          { name: "Hill Repeats", muscles: "Glutes · Hamstrings · Calves", sets: 5, reps: "60s uphill" },
          { name: "Cool-Down Walk + Stretch", muscles: "Full body", sets: 1, reps: "5 min" },
        ],
      },
      60: {
        restNote: "Full recovery between intervals — quality over speed",
        exercises: [
          { name: "Dynamic Warm-Up", muscles: "Hips · Hamstrings · Calves", sets: 1, reps: "5 min", note: "Leg swings, high knees, A-skips" },
          { name: "Easy Warm-Up Jog", muscles: "Full body activation", sets: 1, reps: "10 min" },
          { name: "Stride Intervals", muscles: "Quads · Glutes · Calves", sets: 8, reps: "30s on / 90s off", note: "85% effort" },
          { name: "Tempo Run", muscles: "Cardiovascular · Legs", sets: 1, reps: "20 min", note: "Sustained hard effort" },
          { name: "Hill Repeats", muscles: "Glutes · Hamstrings · Calves", sets: 6, reps: "60s uphill" },
          { name: "Easy Recovery Jog", muscles: "Active recovery", sets: 1, reps: "5 min" },
          { name: "Standing Calf Raises", muscles: "Calves · Ankle stability", sets: 3, reps: "20" },
          { name: "Cool-Down Walk + Full Stretch", muscles: "Hips · Hamstrings · Calves", sets: 1, reps: "8 min" },
        ],
      },
    },
    programs: [
      { title: "12-Week Base Build", description: "Build aerobic capacity from the ground up — zero to 30+ miles per week.", weeks: 12 },
      { title: "8-Week Speed Focus", description: "Increase your VO2 max and race pace with structured interval training.", weeks: 8 },
    ],
  },

  weightlifting: {
    title: "Weightlifting",
    equipment: "Barbell, rack, plates",
    tiers: {
      15: {
        restNote: "3 min rest between heavy sets",
        exercises: [
          { name: "Squat", muscles: "Quads · Glutes · Core", sets: 4, reps: "3", note: "Work up to a heavy triple" },
          { name: "Bench Press", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "3", note: "Heavy — 90% of max" },
          { name: "Deadlift", muscles: "Posterior chain · Traps · Core", sets: 1, reps: "5", note: "One all-out set" },
        ],
      },
      30: {
        restNote: "2-3 min rest between working sets",
        exercises: [
          { name: "Squat", muscles: "Quads · Glutes · Core", sets: 4, reps: "5", note: "Increase weight each set" },
          { name: "Bench Press", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "5" },
          { name: "Deadlift", muscles: "Posterior chain · Traps · Core", sets: 3, reps: "3" },
          { name: "Barbell Row", muscles: "Lats · Rhomboids · Biceps", sets: 3, reps: "6" },
          { name: "Face Pulls", muscles: "Rear delts · Rotator cuff", sets: 3, reps: "15", note: "Lighter weight, focus on squeeze" },
        ],
      },
      45: {
        restNote: "2 min rest on accessories, 3 min on main lifts",
        exercises: [
          { name: "Squat — Warm-Up Sets", muscles: "Quads · Glutes · Core", sets: 3, reps: "5", note: "50%, 70%, 80% of working weight" },
          { name: "Squat — Working Sets", muscles: "Quads · Glutes · Core", sets: 4, reps: "5" },
          { name: "Bench Press", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "6" },
          { name: "Romanian Deadlift", muscles: "Hamstrings · Glutes · Lower back", sets: 3, reps: "8" },
          { name: "Barbell Row", muscles: "Lats · Rhomboids · Biceps", sets: 4, reps: "6" },
          { name: "Overhead Press", muscles: "Shoulders · Triceps · Core", sets: 3, reps: "8" },
        ],
      },
      60: {
        restNote: "Full rest between main lifts — 3-4 min. 90s on accessories",
        exercises: [
          { name: "Squat — Warm-Up Sets", muscles: "Quads · Glutes · Core", sets: 3, reps: "5", note: "50%, 70%, 80% of working weight" },
          { name: "Squat — Working Sets", muscles: "Quads · Glutes · Core", sets: 5, reps: "5" },
          { name: "Bench Press", muscles: "Chest · Triceps · Shoulders", sets: 5, reps: "5" },
          { name: "Deadlift", muscles: "Posterior chain · Traps · Core", sets: 3, reps: "3", note: "Heavy" },
          { name: "Barbell Row", muscles: "Lats · Rhomboids · Biceps", sets: 4, reps: "6" },
          { name: "Overhead Press", muscles: "Shoulders · Triceps · Core", sets: 3, reps: "8" },
          { name: "Romanian Deadlift", muscles: "Hamstrings · Glutes", sets: 3, reps: "10" },
          { name: "Face Pulls", muscles: "Rear delts · Rotator cuff", sets: 3, reps: "15" },
        ],
      },
    },
    programs: [
      { title: "16-Week Powerlifting Foundation", description: "Build a strong base in squat, bench, and deadlift using linear progression.", weeks: 16 },
      { title: "8-Week Strength Peaking", description: "Peak your strength for a max effort test or competition.", weeks: 8 },
    ],
  },

  bodybuilding: {
    title: "Bodybuilding",
    equipment: "Dumbbells, cables, bench",
    tiers: {
      15: {
        restNote: "45-60s rest between sets — keep intensity high",
        exercises: [
          { name: "Incline Dumbbell Press", muscles: "Upper chest · Anterior delt", sets: 3, reps: "12" },
          { name: "Cable Fly", muscles: "Chest · Serratus", sets: 3, reps: "15", note: "Full stretch at bottom" },
          { name: "Tricep Pushdown", muscles: "Lateral & medial tricep head", sets: 3, reps: "20" },
        ],
      },
      30: {
        restNote: "60-90s rest between sets",
        exercises: [
          { name: "Incline Dumbbell Press", muscles: "Upper chest · Anterior delt", sets: 4, reps: "10-12" },
          { name: "Cable Fly", muscles: "Chest · Serratus", sets: 3, reps: "15", note: "Full stretch at bottom" },
          { name: "Flat Bench Press", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "8-10" },
          { name: "Overhead Tricep Extension", muscles: "Long head tricep", sets: 3, reps: "12" },
          { name: "Tricep Pushdown", muscles: "Lateral & medial tricep head", sets: 3, reps: "15-20" },
        ],
      },
      45: {
        restNote: "90s rest — last set of each exercise should be a struggle",
        exercises: [
          { name: "Incline Dumbbell Press", muscles: "Upper chest · Anterior delt", sets: 4, reps: "10-12" },
          { name: "Flat Barbell Bench Press", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "8" },
          { name: "Cable Fly", muscles: "Chest · Serratus", sets: 3, reps: "15", note: "Full stretch — controlled negative" },
          { name: "Dumbbell Shoulder Press", muscles: "Anterior & lateral delt", sets: 3, reps: "10" },
          { name: "Overhead Tricep Extension", muscles: "Long head tricep", sets: 3, reps: "12" },
          { name: "Tricep Pushdown", muscles: "Lateral & medial tricep head", sets: 3, reps: "20" },
        ],
      },
      60: {
        restNote: "90s rest — chase the pump, log every set",
        exercises: [
          { name: "Incline Dumbbell Press", muscles: "Upper chest · Anterior delt", sets: 4, reps: "10-12" },
          { name: "Flat Barbell Bench Press", muscles: "Chest · Triceps", sets: 4, reps: "8" },
          { name: "Cable Fly", muscles: "Chest · Serratus", sets: 3, reps: "15", note: "Full stretch — slow negative" },
          { name: "Dumbbell Shoulder Press", muscles: "Anterior & lateral delt", sets: 4, reps: "10" },
          { name: "Lateral Raise", muscles: "Lateral delt", sets: 3, reps: "15-20" },
          { name: "Overhead Tricep Extension", muscles: "Long head tricep", sets: 3, reps: "12" },
          { name: "Tricep Pushdown", muscles: "Lateral & medial tricep head", sets: 3, reps: "20" },
          { name: "Cable Lateral Raise", muscles: "Lateral delt", sets: 3, reps: "15", note: "Finishing isolation" },
        ],
      },
    },
    programs: [
      { title: "12-Week Hypertrophy Split", description: "A push/pull/legs program designed to maximize muscle growth.", weeks: 12 },
      { title: "16-Week Physique Build", description: "Full body recomposition with progressive overload and nutrition focus.", weeks: 16 },
    ],
  },

  "hybrid-functional": {
    title: "Hybrid / Functional",
    equipment: "Minimal — kettlebell or dumbbells optional",
    tiers: {
      15: {
        restNote: "30s rest between rounds — keep moving",
        exercises: [
          { name: "Burpee", muscles: "Full body · Conditioning", sets: 3, reps: "10" },
          { name: "Kettlebell Swing", muscles: "Posterior chain · Core", sets: 3, reps: "15", note: "Hip hinge, not squat" },
          { name: "Air Squat", muscles: "Quads · Glutes", sets: 3, reps: "20" },
        ],
      },
      30: {
        restNote: "45s rest between exercises, 2 min between rounds",
        exercises: [
          { name: "Kettlebell Swing", muscles: "Posterior chain · Core", sets: 4, reps: "20", note: "Hip hinge, not squat" },
          { name: "Burpee to Box Jump", muscles: "Full body · Power", sets: 4, reps: "8" },
          { name: "Dumbbell Thruster", muscles: "Legs · Shoulders · Core", sets: 3, reps: "12" },
          { name: "Farmer Carry", muscles: "Grip · Traps · Core · Legs", sets: 3, reps: "40 meters" },
          { name: "Battle Ropes", muscles: "Shoulders · Core · Conditioning", sets: 4, reps: "30s" },
        ],
      },
      45: {
        restNote: "45s rest between exercises — aim for minimal rest between rounds",
        exercises: [
          { name: "Dynamic Warm-Up", muscles: "Full body", sets: 1, reps: "5 min", note: "Jump rope or jumping jacks" },
          { name: "Kettlebell Swing", muscles: "Posterior chain · Core", sets: 5, reps: "20" },
          { name: "Burpee to Box Jump", muscles: "Full body · Power", sets: 4, reps: "8" },
          { name: "Dumbbell Thruster", muscles: "Legs · Shoulders · Core", sets: 4, reps: "12" },
          { name: "Farmer Carry", muscles: "Grip · Traps · Core · Legs", sets: 4, reps: "40 meters" },
          { name: "Battle Ropes", muscles: "Shoulders · Core · Conditioning", sets: 5, reps: "30s" },
        ],
      },
      60: {
        restNote: "60s rest between sets — log rounds completed",
        exercises: [
          { name: "Dynamic Warm-Up", muscles: "Full body", sets: 1, reps: "5 min", note: "Jump rope, high knees, arm circles" },
          { name: "Kettlebell Swing", muscles: "Posterior chain · Core", sets: 5, reps: "20" },
          { name: "Burpee to Box Jump", muscles: "Full body · Power", sets: 5, reps: "8" },
          { name: "Dumbbell Thruster", muscles: "Legs · Shoulders · Core", sets: 4, reps: "12" },
          { name: "Farmer Carry", muscles: "Grip · Traps · Core · Legs", sets: 4, reps: "40 meters" },
          { name: "Battle Ropes", muscles: "Shoulders · Core · Conditioning", sets: 5, reps: "30s" },
          { name: "Box Jump", muscles: "Quads · Glutes · Power", sets: 4, reps: "10" },
          { name: "Cool-Down Walk + Stretch", muscles: "Full body", sets: 1, reps: "5 min" },
        ],
      },
    },
    programs: [
      { title: "8-Week Conditioning Block", description: "Build work capacity and GPP with daily mixed-modal training.", weeks: 8 },
      { title: "12-Week Hybrid Athlete", description: "Combine strength training with aerobic conditioning for total fitness.", weeks: 12 },
    ],
  },

  calisthenics: {
    title: "Calisthenics",
    equipment: "Pull-up bar, parallel bars",
    tiers: {
      15: {
        restNote: "60s rest between sets",
        exercises: [
          { name: "Pull-Up", muscles: "Lats · Biceps · Rear delts", sets: 4, reps: "Max", note: "Full range of motion" },
          { name: "Dips", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "Max", note: "Chair or parallel bars" },
          { name: "Push-Up", muscles: "Chest · Triceps · Shoulders", sets: 3, reps: "20" },
        ],
      },
      30: {
        restNote: "90s rest between sets",
        exercises: [
          { name: "Pull-Up", muscles: "Lats · Biceps · Rear delts", sets: 5, reps: "Max", note: "Full range of motion" },
          { name: "Pike Press", muscles: "Shoulders · Triceps", sets: 4, reps: "10" },
          { name: "Dips", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "12", note: "Chair or parallel bars" },
          { name: "Push-Up to T-Rotation", muscles: "Chest · Shoulders · Obliques", sets: 4, reps: "10 each side" },
          { name: "Plank to Shoulder Tap", muscles: "Core · Stability", sets: 3, reps: "45s" },
        ],
      },
      45: {
        restNote: "90s rest — increase difficulty where possible (archer push-ups, L-sit holds)",
        exercises: [
          { name: "Scapular Pull-Up Warm-Up", muscles: "Scapula · Lats", sets: 2, reps: "10", note: "Activate the lats before loading" },
          { name: "Pull-Up", muscles: "Lats · Biceps · Rear delts", sets: 5, reps: "Max" },
          { name: "Pike Press", muscles: "Shoulders · Triceps", sets: 4, reps: "12" },
          { name: "Dips", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "12" },
          { name: "Push-Up to T-Rotation", muscles: "Chest · Shoulders · Obliques", sets: 4, reps: "10 each side" },
          { name: "L-Sit Hold", muscles: "Core · Hip flexors · Triceps", sets: 3, reps: "Max hold", note: "Use parallel bars or chairs" },
        ],
      },
      60: {
        restNote: "2 min rest on skill work, 90s on volume sets",
        exercises: [
          { name: "Scapular Pull-Up Warm-Up", muscles: "Scapula · Lats", sets: 3, reps: "10" },
          { name: "Pull-Up — Weighted or Max", muscles: "Lats · Biceps · Rear delts", sets: 5, reps: "Max" },
          { name: "Pike Press", muscles: "Shoulders · Triceps", sets: 4, reps: "12" },
          { name: "Dips", muscles: "Chest · Triceps · Shoulders", sets: 5, reps: "12" },
          { name: "Push-Up to T-Rotation", muscles: "Chest · Shoulders · Obliques", sets: 4, reps: "10 each side" },
          { name: "L-Sit Hold", muscles: "Core · Hip flexors · Triceps", sets: 4, reps: "Max hold" },
          { name: "Hollow Body Hold", muscles: "Core · Anterior chain", sets: 3, reps: "30s" },
          { name: "Hanging Knee Raise", muscles: "Core · Hip flexors", sets: 3, reps: "15" },
        ],
      },
    },
    programs: [
      { title: "10-Week Pull-Up Progression", description: "Go from 0 to 15+ pull-ups with structured negatives and volume work.", weeks: 10 },
      { title: "12-Week Skill Unlock", description: "Build toward muscle-ups, L-sits, and handstand progressions.", weeks: 12 },
    ],
  },

  "mobility-recovery": {
    title: "Mobility & Recovery",
    equipment: "Mat, foam roller",
    tiers: {
      15: {
        restNote: "Move slowly — hold each position fully",
        exercises: [
          { name: "Foam Roll — Thoracic Spine", muscles: "Upper back · Erectors", sets: 1, reps: "60s", note: "Pause on tight spots" },
          { name: "90/90 Hip Stretch", muscles: "Hip flexors · External rotators", sets: 2, reps: "45s each side" },
          { name: "World's Greatest Stretch", muscles: "Hips · Thoracic · Hamstrings", sets: 2, reps: "5 each side" },
        ],
      },
      30: {
        restNote: "No rush — this is recovery work",
        exercises: [
          { name: "Foam Roll — Thoracic Spine", muscles: "Upper back · Erectors", sets: 1, reps: "90s", note: "Pause on tight spots" },
          { name: "90/90 Hip Stretch", muscles: "Hip flexors · External rotators", sets: 3, reps: "60s each side" },
          { name: "World's Greatest Stretch", muscles: "Hips · Thoracic · Hamstrings", sets: 3, reps: "5 each side" },
          { name: "Dead Hang", muscles: "Shoulders · Lats · Grip", sets: 3, reps: "30-45s", note: "Full passive hang" },
          { name: "Diaphragmatic Breathing", muscles: "Nervous system reset", sets: 1, reps: "5 min", note: "4-count inhale, 8-count exhale" },
        ],
      },
      45: {
        restNote: "Hold positions longer — quality over quantity",
        exercises: [
          { name: "Foam Roll — Full Body", muscles: "Quads · IT band · Upper back", sets: 1, reps: "8 min", note: "Spend extra time on tight areas" },
          { name: "90/90 Hip Stretch", muscles: "Hip flexors · External rotators", sets: 3, reps: "90s each side" },
          { name: "World's Greatest Stretch", muscles: "Hips · Thoracic · Hamstrings", sets: 3, reps: "6 each side" },
          { name: "Pigeon Pose", muscles: "Glutes · Hip flexors · Piriformis", sets: 2, reps: "2 min each side" },
          { name: "Dead Hang", muscles: "Shoulders · Lats · Grip", sets: 4, reps: "45s" },
          { name: "Diaphragmatic Breathing", muscles: "Nervous system reset", sets: 1, reps: "8 min", note: "Box breathing — 4 in / 4 hold / 4 out / 4 hold" },
        ],
      },
      60: {
        restNote: "This is an active recovery session — no rush, no grind",
        exercises: [
          { name: "Foam Roll — Full Body", muscles: "Quads · IT band · Upper back · Calves", sets: 1, reps: "10 min" },
          { name: "90/90 Hip Stretch", muscles: "Hip flexors · External rotators", sets: 3, reps: "2 min each side" },
          { name: "World's Greatest Stretch", muscles: "Hips · Thoracic · Hamstrings", sets: 3, reps: "6 each side" },
          { name: "Pigeon Pose", muscles: "Glutes · Hip flexors · Piriformis", sets: 2, reps: "3 min each side" },
          { name: "Dead Hang", muscles: "Shoulders · Lats · Grip", sets: 4, reps: "60s" },
          { name: "Cat-Cow", muscles: "Thoracic spine · Core", sets: 3, reps: "10 cycles" },
          { name: "Child's Pose to Cobra", muscles: "Lumbar · Hip flexors · Core", sets: 3, reps: "60s each" },
          { name: "Diaphragmatic Breathing", muscles: "Nervous system reset", sets: 1, reps: "10 min", note: "4-count inhale, 8-count exhale" },
        ],
      },
    },
    programs: [
      { title: "4-Week Daily Mobility", description: "A daily 20-minute protocol to restore range of motion and reduce pain.", weeks: 4 },
      { title: "8-Week Recovery Focus", description: "Structured deload and tissue work for athletes coming off hard training blocks.", weeks: 8 },
    ],
  },

  rucking: {
    title: "Rucking",
    equipment: "Rucksack — 20-35 lbs recommended",
    tiers: {
      15: {
        restNote: "Keep moving — pace over distance",
        exercises: [
          { name: "Ruck March", muscles: "Legs · Core · Cardiovascular", sets: 1, reps: "1 mile", note: "15-18 min/mile pace with weight" },
          { name: "Bodyweight Squat", muscles: "Quads · Glutes · Hamstrings", sets: 3, reps: "15" },
          { name: "Calf Raises", muscles: "Calves · Ankle stability", sets: 3, reps: "20" },
        ],
      },
      30: {
        restNote: "Keep moving — use rest stops for supplemental work",
        exercises: [
          { name: "Ruck March", muscles: "Legs · Core · Cardiovascular", sets: 1, reps: "2 miles", note: "15-18 min/mile pace" },
          { name: "Weighted Step-Ups", muscles: "Glutes · Quads · Balance", sets: 3, reps: "12 each leg", note: "Use a bench or curb" },
          { name: "Bodyweight Squat", muscles: "Quads · Glutes · Hamstrings", sets: 3, reps: "20" },
          { name: "Overhead Ruck Press", muscles: "Shoulders · Triceps · Core", sets: 3, reps: "15", note: "Press the ruck overhead" },
          { name: "Calf Raises", muscles: "Calves · Ankle stability", sets: 3, reps: "25" },
        ],
      },
      45: {
        restNote: "Pace discipline — do not rush. Military standard is 15 min/mile",
        exercises: [
          { name: "Ruck March", muscles: "Legs · Core · Cardiovascular", sets: 1, reps: "3 miles", note: "15-18 min/mile pace" },
          { name: "Weighted Step-Ups", muscles: "Glutes · Quads · Balance", sets: 3, reps: "12 each leg" },
          { name: "Bodyweight Squat", muscles: "Quads · Glutes · Hamstrings", sets: 3, reps: "20" },
          { name: "Overhead Ruck Press", muscles: "Shoulders · Triceps · Core", sets: 3, reps: "15" },
          { name: "Reverse Lunge", muscles: "Quads · Glutes · Stability", sets: 3, reps: "10 each leg" },
          { name: "Calf Raises", muscles: "Calves · Ankle stability", sets: 3, reps: "25" },
        ],
      },
      60: {
        restNote: "Full event simulation — stay at pace, do supplemental work at rest stops",
        exercises: [
          { name: "Ruck March", muscles: "Legs · Core · Cardiovascular", sets: 1, reps: "4 miles", note: "15-18 min/mile pace with 35 lbs" },
          { name: "Weighted Step-Ups", muscles: "Glutes · Quads · Balance", sets: 4, reps: "12 each leg" },
          { name: "Bodyweight Squat", muscles: "Quads · Glutes · Hamstrings", sets: 4, reps: "20" },
          { name: "Overhead Ruck Press", muscles: "Shoulders · Triceps · Core", sets: 4, reps: "15" },
          { name: "Reverse Lunge", muscles: "Quads · Glutes · Stability", sets: 3, reps: "12 each leg" },
          { name: "Push-Up", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "15", note: "At rest stops" },
          { name: "Calf Raises", muscles: "Calves · Ankle stability", sets: 3, reps: "25" },
          { name: "Cool-Down Walk", muscles: "Full body", sets: 1, reps: "5 min", note: "Unweighted — let your body decompress" },
        ],
      },
    },
    programs: [
      { title: "8-Week Ruck Base", description: "Build the capacity to ruck 4+ miles with 35 lbs without breaking down.", weeks: 8 },
      { title: "12-Week GoRuck Prep", description: "Full preparation for a GoRuck or military-style endurance event.", weeks: 12 },
    ],
  },

  bodyweight: {
    title: "Bodyweight",
    equipment: "No equipment needed",
    tiers: {
      15: {
        restNote: "45s rest between sets — keep the pace up",
        exercises: [
          { name: "Push-Up", muscles: "Chest · Triceps · Shoulders", sets: 3, reps: "15" },
          { name: "Air Squat", muscles: "Quads · Glutes · Hamstrings", sets: 3, reps: "20" },
          { name: "Plank Hold", muscles: "Core · Shoulders", sets: 3, reps: "45s" },
        ],
      },
      30: {
        restNote: "60s rest between sets",
        exercises: [
          { name: "Push-Up", muscles: "Chest · Triceps · Shoulders", sets: 4, reps: "15" },
          { name: "Air Squat", muscles: "Quads · Glutes · Hamstrings", sets: 4, reps: "20" },
          { name: "Burpee", muscles: "Full body · Conditioning", sets: 3, reps: "10" },
          { name: "Plank Hold", muscles: "Core · Shoulders · Stability", sets: 3, reps: "45s" },
          { name: "Reverse Lunge", muscles: "Quads · Glutes · Balance", sets: 3, reps: "12 each leg" },
        ],
      },
      45: {
        restNote: "60-90s rest — add difficulty where you can (slow negatives, pause reps)",
        exercises: [
          { name: "Jumping Jack Warm-Up", muscles: "Full body activation", sets: 1, reps: "3 min" },
          { name: "Push-Up to T-Rotation", muscles: "Chest · Shoulders · Obliques", sets: 4, reps: "10 each side" },
          { name: "Air Squat", muscles: "Quads · Glutes · Hamstrings", sets: 4, reps: "25" },
          { name: "Burpee", muscles: "Full body · Conditioning", sets: 4, reps: "10" },
          { name: "Plank Hold", muscles: "Core · Shoulders · Stability", sets: 3, reps: "60s" },
          { name: "Reverse Lunge", muscles: "Quads · Glutes · Balance", sets: 3, reps: "15 each leg" },
        ],
      },
      60: {
        restNote: "90s rest — use the time. Go full effort on every set",
        exercises: [
          { name: "Jumping Jack Warm-Up", muscles: "Full body activation", sets: 1, reps: "3 min" },
          { name: "Push-Up to T-Rotation", muscles: "Chest · Shoulders · Obliques", sets: 4, reps: "10 each side" },
          { name: "Air Squat", muscles: "Quads · Glutes · Hamstrings", sets: 5, reps: "25" },
          { name: "Burpee", muscles: "Full body · Conditioning", sets: 4, reps: "12" },
          { name: "Plank Hold", muscles: "Core · Shoulders · Stability", sets: 4, reps: "60s" },
          { name: "Reverse Lunge", muscles: "Quads · Glutes · Balance", sets: 4, reps: "15 each leg" },
          { name: "Pike Press", muscles: "Shoulders · Triceps", sets: 3, reps: "12" },
          { name: "Cool-Down Stretch", muscles: "Hips · Hamstrings · Chest", sets: 1, reps: "5 min" },
        ],
      },
    },
    programs: [
      { title: "30-Day No Equipment Challenge", description: "Build full-body strength with zero gear in 30 days.", weeks: 4 },
      { title: "6-Week Jobsite Strong", description: "Functional movements you can run on a break or after a shift.", weeks: 6 },
    ],
  },
};

const FALLBACK: CategoryData = {
  title: "Workout",
  equipment: "Minimal",
  tiers: {
    15: { restNote: "60s rest", exercises: [
      { name: "Push-Up", muscles: "Chest · Triceps", sets: 3, reps: "15" },
      { name: "Squat", muscles: "Quads · Glutes", sets: 3, reps: "20" },
      { name: "Plank", muscles: "Core", sets: 3, reps: "45s" },
    ]},
    30: { restNote: "60s rest", exercises: [
      { name: "Push-Up", muscles: "Chest · Triceps", sets: 4, reps: "15" },
      { name: "Squat", muscles: "Quads · Glutes", sets: 4, reps: "20" },
      { name: "Burpee", muscles: "Full body", sets: 3, reps: "10" },
      { name: "Plank", muscles: "Core", sets: 3, reps: "45s" },
      { name: "Lunge", muscles: "Quads · Glutes", sets: 3, reps: "12 each" },
    ]},
    45: { restNote: "60-90s rest", exercises: [
      { name: "Warm-Up Jog", muscles: "Full body", sets: 1, reps: "3 min" },
      { name: "Push-Up", muscles: "Chest · Triceps", sets: 4, reps: "15" },
      { name: "Squat", muscles: "Quads · Glutes", sets: 4, reps: "20" },
      { name: "Burpee", muscles: "Full body", sets: 4, reps: "10" },
      { name: "Plank", muscles: "Core", sets: 3, reps: "60s" },
      { name: "Lunge", muscles: "Quads · Glutes", sets: 3, reps: "15 each" },
    ]},
    60: { restNote: "90s rest", exercises: [
      { name: "Warm-Up Jog", muscles: "Full body", sets: 1, reps: "5 min" },
      { name: "Push-Up", muscles: "Chest · Triceps", sets: 5, reps: "15" },
      { name: "Squat", muscles: "Quads · Glutes", sets: 5, reps: "20" },
      { name: "Burpee", muscles: "Full body", sets: 4, reps: "12" },
      { name: "Plank", muscles: "Core", sets: 4, reps: "60s" },
      { name: "Lunge", muscles: "Quads · Glutes", sets: 4, reps: "15 each" },
      { name: "Pike Press", muscles: "Shoulders · Triceps", sets: 3, reps: "12" },
      { name: "Cool-Down Stretch", muscles: "Full body", sets: 1, reps: "5 min" },
    ]},
  },
  programs: [
    { title: "8-Week General Fitness", description: "Build a foundation of strength and conditioning.", weeks: 8 },
    { title: "12-Week Total Body", description: "Full-body training for health and longevity.", weeks: 12 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_DURATIONS = [15, 30, 45, 60] as const;

function snapDuration(raw: number | null): 15 | 30 | 45 | 60 {
  if (!raw) return 30;
  const closest = VALID_DURATIONS.reduce((a, b) =>
    Math.abs(b - raw) < Math.abs(a - raw) ? b : a
  );
  return closest;
}

function durationLabel(mins: number) {
  return mins >= 60 ? "1 Hour" : `${mins} Min`;
}

type WorkoutState = "idle" | "active" | "logged";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ time?: string }>;
}) {
  const { category } = use(params);
  const { time } = use(searchParams);

  const rawMinutes = time ? parseInt(time, 10) : null;
  const duration = snapDuration(rawMinutes);
  const data = CATEGORY_DATA[category] ?? FALLBACK;
  const tier = data.tiers[duration];
  const workoutName = `${durationLabel(duration)} ${data.title} Workout`;

  const [workoutState, setWorkoutState] = useState<WorkoutState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (workoutState === "active") {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [workoutState]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function handleComplete() {
    setWorkoutState("logged");
    const durationMinutes = Math.max(1, Math.round(elapsed / 60));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("workout_logs").insert({
        user_id: user.id,
        workout_name: workoutName,
        exercises_completed: tier.exercises.length,
        duration_minutes: durationMinutes,
      });
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col px-6 py-10"
      style={{ backgroundColor: "#0A0A0A", color: "#E8E2D8" }}
    >
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-12 pb-28">

        {/* Header */}
        <header className="flex items-center gap-5">
          <Link
            href="/dashboard/body"
            className="flex items-center justify-center w-9 h-9 transition-opacity hover:opacity-60"
            style={{ border: "1px solid #252525", color: "#9A9A9A" }}
            aria-label="Back to Body"
          >
            <svg viewBox="0 0 20 20" fill="none" width={16} height={16}>
              <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em] uppercase mb-0.5"
              style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
            >
              Body · {data.title}
            </p>
            <h1
              className="text-3xl md:text-4xl font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-oswald)", color: "#E8E2D8" }}
            >
              Your {workoutName}
            </h1>
          </div>
        </header>

        {/* Today's Workout */}
        <section>
          <div style={{ backgroundColor: "#161616", border: "1px solid #252525", borderRadius: "12px" }}>
            {/* Card header */}
            <div
              className="px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              style={{ borderBottom: "1px solid #252525" }}
            >
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
                    style={{ color: "#C45B28", border: "1px solid #C45B28", fontFamily: "var(--font-inter)" }}
                  >
                    {durationLabel(duration)}
                  </span>
                  <span
                    className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
                    style={{ color: "#9A9A9A", border: "1px solid #252525", fontFamily: "var(--font-inter)" }}
                  >
                    {tier.exercises.length} Exercises
                  </span>
                </div>
                <p className="text-sm" style={{ color: "#9A9A9A" }}>{data.equipment}</p>
                <p className="text-xs mt-1 italic" style={{ color: "#9A9A9A" }}>{tier.restNote}</p>
              </div>
            </div>

            {/* Exercise list */}
            <div className="divide-y" style={{ borderColor: "#252525" }}>
              {tier.exercises.map((ex, i) => (
                <div key={`${ex.name}-${i}`} className="px-8 py-5 flex items-start gap-5">
                  <span
                    className="text-xs font-bold mt-0.5 w-5 shrink-0 text-right"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold" style={{ color: "#E8E2D8", fontFamily: "var(--font-inter)" }}>{ex.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{ex.muscles}</p>
                    {ex.note && (
                      <p className="text-xs mt-1 italic" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{ex.note}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-lg font-bold"
                      style={{ fontFamily: "var(--font-inter)", color: "#C45B28" }}
                    >
                      {ex.sets}&times;{ex.reps}
                    </p>
                    <p className="text-xs" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>sets &times; reps</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Workout footer */}
            <div className="px-8 py-6 flex flex-col gap-4" style={{ borderTop: "1px solid #252525" }}>
              {workoutState === "idle" && (
                <button
                  onClick={() => { setElapsed(0); setWorkoutState("active"); }}
                  className="w-full text-base uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.99]"
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontWeight: 600,
                    backgroundColor: "#C45B28",
                    color: "#0A0A0A",
                    borderRadius: "8px",
                    minHeight: "48px",
                  }}
                >
                  Start Workout
                </button>
              )}
              {workoutState === "active" && (
                <>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                    >
                      Elapsed
                    </span>
                    <span
                      className="text-4xl font-bold tabular-nums"
                      style={{ fontFamily: "var(--font-inter)", color: "#C45B28" }}
                    >
                      {formatTime(elapsed)}
                    </span>
                  </div>
                  <button
                    onClick={handleComplete}
                    className="w-full text-base uppercase tracking-widest transition-opacity hover:opacity-90 active:scale-[0.99]"
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontWeight: 600,
                      backgroundColor: "#C45B28",
                      color: "#0A0A0A",
                      borderRadius: "8px",
                      minHeight: "48px",
                    }}
                  >
                    Complete Workout
                  </button>
                </>
              )}
              {workoutState === "logged" && (
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#4CAF50", fontFamily: "var(--font-inter)" }}
                  >
                    Workout Logged
                  </span>
                  <span className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>
                    {formatTime(elapsed)} · {tier.exercises.length} exercises
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Programs */}
        <section>
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "#C45B28", fontFamily: "var(--font-inter)" }}
          >
            Programs
          </p>
          <div className="flex flex-col gap-4">
            {data.programs.map((program, i) => (
              <div
                key={program.title}
                className="px-8 py-6 flex flex-col gap-3"
                style={{
                  backgroundColor: "#161616",
                  border: `1px solid ${i === 0 ? "#C45B28" : "#252525"}`,
                  borderRadius: "12px",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3
                      className="text-xl font-bold uppercase"
                      style={{ fontFamily: "var(--font-inter)", color: "#E8E2D8" }}
                    >
                      {program.title}
                    </h3>
                    {i === 0 && (
                      <span
                        className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5"
                        style={{ backgroundColor: "#1E0E06", color: "#C45B28", fontFamily: "var(--font-inter)" }}
                      >
                        Recommended
                      </span>
                    )}
                  </div>
                  <span
                    className="text-sm font-semibold shrink-0"
                    style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}
                  >
                    {program.weeks}W
                  </span>
                </div>
                <p className="text-sm" style={{ color: "#9A9A9A", fontFamily: "var(--font-inter)" }}>{program.description}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
      <SpotifyPlayer category={category} />
      <BottomNav />
    </main>
  );
}
