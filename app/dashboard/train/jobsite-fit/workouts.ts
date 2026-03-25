// Jobsite Fit — guided bodyweight workout data

export type Exercise = {
  id: string;
  name: string;
  duration: number; // seconds
  instruction: string;
};

export type Workout = {
  id: string;
  title: string;
  duration: number; // minutes (approximate)
  difficulty: "Easy" | "Medium" | "Hard";
  targetArea: string;
  description: string;
  restDuration: number; // seconds between exercises
  exercises: Exercise[];
};

export const WORKOUTS: Workout[] = [
  {
    id: "morning-warmup",
    title: "Morning Warm-Up",
    duration: 5,
    difficulty: "Easy",
    targetArea: "Full Body",
    description:
      "Dynamic stretches to wake your body up and get your joints ready for the day.",
    restDuration: 10,
    exercises: [
      {
        id: "neck-rolls",
        name: "Neck Rolls",
        duration: 30,
        instruction:
          "Slowly roll your head in a circle. Gentle and controlled — no forcing.",
      },
      {
        id: "shoulder-circles",
        name: "Shoulder Circles",
        duration: 20,
        instruction: "Roll both shoulders forward, then backward.",
      },
      {
        id: "arm-cross-swings",
        name: "Arm Cross Swings",
        duration: 20,
        instruction:
          "Swing arms across your chest and open wide. Keep them loose.",
      },
      {
        id: "hip-circles",
        name: "Hip Circles",
        duration: 30,
        instruction:
          "Hands on hips. Draw big circles with your hips. Both directions.",
      },
      {
        id: "torso-twist",
        name: "Torso Twist",
        duration: 20,
        instruction:
          "Feet shoulder width. Twist left and right. Let your arms swing naturally.",
      },
      {
        id: "leg-swings",
        name: "Leg Swings",
        duration: 20,
        instruction:
          "Hold a wall for balance. Swing each leg forward and back.",
      },
      {
        id: "ankle-circles",
        name: "Ankle Circles",
        duration: 20,
        instruction: "Lift one foot. Rotate at the ankle. Switch sides.",
      },
      {
        id: "calf-raises",
        name: "Slow Calf Raises",
        duration: 20,
        instruction:
          "Rise on your toes slowly, lower slowly. Feel the full stretch.",
      },
    ],
  },
  {
    id: "lunch-blast",
    title: "Lunch Break Blast",
    duration: 10,
    difficulty: "Hard",
    targetArea: "Full Body",
    description:
      "High-intensity bodyweight circuit. Gets your heart pumping in 10 minutes flat.",
    restDuration: 15,
    exercises: [
      {
        id: "jumping-jacks",
        name: "Jumping Jacks",
        duration: 45,
        instruction: "Full range of motion. Arms all the way up, legs wide.",
      },
      {
        id: "bodyweight-squats",
        name: "Bodyweight Squats",
        duration: 40,
        instruction:
          "Feet shoulder width, chest up. Squat until thighs are parallel to the floor.",
      },
      {
        id: "push-ups",
        name: "Push-Ups",
        duration: 40,
        instruction:
          "Hands shoulder width. Lower chest to floor. Modify on knees if needed.",
      },
      {
        id: "high-knees",
        name: "High Knees",
        duration: 45,
        instruction:
          "Drive knees to hip height alternating. Pump your arms.",
      },
      {
        id: "mountain-climbers",
        name: "Mountain Climbers",
        duration: 40,
        instruction:
          "Plank position. Drive knees to chest alternating. Fast pace.",
      },
      {
        id: "burpees",
        name: "Burpees",
        duration: 35,
        instruction:
          "Squat down, kick feet out, push-up, jump up. Modify by stepping instead of jumping.",
      },
      {
        id: "squat-jumps",
        name: "Squat Jumps",
        duration: 40,
        instruction:
          "Squat low, explode up. Land soft. Modify: skip the jump.",
      },
      {
        id: "plank",
        name: "Plank Hold",
        duration: 45,
        instruction:
          "Body straight from head to heels. Breathe. Squeeze everything.",
      },
    ],
  },
  {
    id: "end-of-day",
    title: "End of Day Cooldown",
    duration: 10,
    difficulty: "Easy",
    targetArea: "Full Body",
    description:
      "Slow, deliberate stretches to release tension and help your body recover overnight.",
    restDuration: 10,
    exercises: [
      {
        id: "quad-left",
        name: "Quad Stretch — Left",
        duration: 30,
        instruction:
          "Stand on right foot. Pull left heel to glute. Hold a wall for balance.",
      },
      {
        id: "quad-right",
        name: "Quad Stretch — Right",
        duration: 30,
        instruction:
          "Stand on left foot. Pull right heel to glute. Hold a wall for balance.",
      },
      {
        id: "hamstring-fold",
        name: "Hamstring Forward Fold",
        duration: 45,
        instruction:
          "Feet together. Hinge slowly forward. Let your head hang heavy.",
      },
      {
        id: "hip-flexor-left",
        name: "Hip Flexor Stretch — Left",
        duration: 45,
        instruction:
          "Step right foot back into a lunge. Drop right knee down. Push hips forward gently.",
      },
      {
        id: "hip-flexor-right",
        name: "Hip Flexor Stretch — Right",
        duration: 45,
        instruction:
          "Step left foot back into a lunge. Drop left knee down. Push hips forward gently.",
      },
      {
        id: "chest-opener",
        name: "Chest Opener",
        duration: 45,
        instruction:
          "Clasp hands behind back. Open your chest and look up slightly.",
      },
      {
        id: "shoulder-left",
        name: "Shoulder Stretch — Left",
        duration: 30,
        instruction:
          "Pull left arm across your chest with right hand. Relax your shoulder.",
      },
      {
        id: "shoulder-right",
        name: "Shoulder Stretch — Right",
        duration: 30,
        instruction:
          "Pull right arm across your chest with left hand. Relax your shoulder.",
      },
      {
        id: "forward-fold",
        name: "Seated Forward Fold",
        duration: 60,
        instruction:
          "Sit on the floor, legs out. Reach toward your toes. Hold where you feel it.",
      },
      {
        id: "knee-hug",
        name: "Supine Knee Hug",
        duration: 60,
        instruction:
          "Lie on your back. Pull both knees to your chest. Rock gently side to side.",
      },
    ],
  },
  {
    id: "weekend-warrior",
    title: "Weekend Warrior",
    duration: 15,
    difficulty: "Medium",
    targetArea: "Full Body",
    description:
      "Full-body strength circuit. Three rounds of compound moves to build functional power.",
    restDuration: 15,
    exercises: [
      {
        id: "squats-1",
        name: "Bodyweight Squats",
        duration: 45,
        instruction:
          "Feet shoulder width. Squat deep. Drive through your heels on the way up.",
      },
      {
        id: "push-ups-1",
        name: "Push-Ups",
        duration: 45,
        instruction: "Chest to floor. Full extension at top.",
      },
      {
        id: "lunges-1",
        name: "Alternating Lunges",
        duration: 45,
        instruction: "Step forward, lower back knee toward floor. Alternate legs.",
      },
      {
        id: "squat-pulses",
        name: "Squat Pulses",
        duration: 40,
        instruction: "Hold a half squat. Small pulses down and up. Feel the burn.",
      },
      {
        id: "wide-push-ups",
        name: "Wide Push-Ups",
        duration: 40,
        instruction:
          "Hands wider than shoulders. Targets chest more than standard.",
      },
      {
        id: "side-lunges",
        name: "Side Lunges",
        duration: 40,
        instruction:
          "Step wide to the side and bend that knee. Alternate sides.",
      },
      {
        id: "jump-squats",
        name: "Jump Squats",
        duration: 35,
        instruction: "Squat low, explode up. Land soft. Modify: no jump.",
      },
      {
        id: "diamond-push-ups",
        name: "Diamond Push-Ups",
        duration: 40,
        instruction:
          "Hands close together forming a diamond shape. Targets triceps.",
      },
      {
        id: "forward-lunges",
        name: "Forward Lunges",
        duration: 40,
        instruction:
          "Alternate legs. Keep your chest tall, front knee over your foot.",
      },
      {
        id: "plank-hold",
        name: "Plank Hold",
        duration: 60,
        instruction: "Hold strong. Squeeze everything. Breathe through it.",
      },
      {
        id: "superman",
        name: "Superman Hold",
        duration: 45,
        instruction:
          "Lie face down. Lift arms, chest, and legs simultaneously. Hold 3s, lower.",
      },
      {
        id: "glute-bridges",
        name: "Glute Bridges",
        duration: 45,
        instruction:
          "Lie on your back, knees bent. Push hips up and squeeze at the top.",
      },
    ],
  },
  {
    id: "back-saver",
    title: "Back Saver",
    duration: 5,
    difficulty: "Easy",
    targetArea: "Core & Back",
    description:
      "Targeted core and back work to protect your spine and reduce pain from long days on your feet.",
    restDuration: 10,
    exercises: [
      {
        id: "cat-cow",
        name: "Cat-Cow Stretch",
        duration: 45,
        instruction:
          "On hands and knees. Arch your back up (cat), then let it sag (cow). Move slowly.",
      },
      {
        id: "bird-dog-left",
        name: "Bird Dog — Left",
        duration: 20,
        instruction:
          "On hands and knees. Extend left arm and right leg simultaneously. Hold 2s.",
      },
      {
        id: "bird-dog-right",
        name: "Bird Dog — Right",
        duration: 20,
        instruction:
          "On hands and knees. Extend right arm and left leg simultaneously. Hold 2s.",
      },
      {
        id: "dead-bug",
        name: "Dead Bug",
        duration: 40,
        instruction:
          "Lie on your back, arms up. Lower opposite arm and leg slowly. Control the movement.",
      },
      {
        id: "glute-bridge",
        name: "Glute Bridge",
        duration: 45,
        instruction:
          "Lie on back, knees bent. Push hips up. Squeeze glutes at top for 2 seconds.",
      },
      {
        id: "superman-hold",
        name: "Superman Hold",
        duration: 30,
        instruction:
          "Lie face down. Lift arms, chest and legs. Hold 3 seconds, lower.",
      },
      {
        id: "pelvic-tilts",
        name: "Pelvic Tilts",
        duration: 30,
        instruction:
          "Lie on back, knees bent. Gently flatten your lower back into the floor. Release.",
      },
    ],
  },
  {
    id: "grip-recovery",
    title: "Grip & Forearm Recovery",
    duration: 5,
    difficulty: "Easy",
    targetArea: "Hands & Arms",
    description:
      "Release tension in your hands and forearms after a day of gripping, twisting, and lifting.",
    restDuration: 8,
    exercises: [
      {
        id: "wrist-circles",
        name: "Wrist Circles",
        duration: 30,
        instruction:
          "Arms extended. Rotate wrists in full circles. Both directions.",
      },
      {
        id: "finger-spread",
        name: "Finger Spread & Squeeze",
        duration: 30,
        instruction:
          "Spread fingers as wide as possible, hold 2s. Make a fist, hold 2s. Repeat.",
      },
      {
        id: "wrist-flexor-left",
        name: "Wrist Flexor Stretch — Left",
        duration: 30,
        instruction:
          "Extend left arm, palm facing up. Gently pull fingers back with your other hand.",
      },
      {
        id: "wrist-flexor-right",
        name: "Wrist Flexor Stretch — Right",
        duration: 30,
        instruction:
          "Extend right arm, palm facing up. Gently pull fingers back with your other hand.",
      },
      {
        id: "wrist-extensor-left",
        name: "Wrist Extensor Stretch — Left",
        duration: 30,
        instruction:
          "Extend left arm, palm facing down. Gently press hand downward with your other hand.",
      },
      {
        id: "wrist-extensor-right",
        name: "Wrist Extensor Stretch — Right",
        duration: 30,
        instruction:
          "Extend right arm, palm facing down. Gently press hand downward with your other hand.",
      },
      {
        id: "prayer-stretch",
        name: "Prayer Stretch",
        duration: 30,
        instruction:
          "Press palms together at chest height. Slowly lower your hands while keeping palms together.",
      },
      {
        id: "forearm-massage",
        name: "Forearm Self-Massage",
        duration: 45,
        instruction:
          "Use your thumb to work into the fleshy part of your forearm. Find the tight spots.",
      },
    ],
  },
];
