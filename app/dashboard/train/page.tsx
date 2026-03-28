'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

type FocusArea = 'full'|'upper'|'lower'|'push'|'pull';
type WorkoutMode = 'preview'|'active'|'complete';

interface SetLog {
  set_number: number;
  reps: string;
  weight_kg: string;
  rpe: string;
  to_failure: boolean;
}

interface ExerciseLog {
  exercise_name: string;
  exercise_slug: string;
  prescribed_sets: number;
  prescribed_reps: number;
  prescribed_weight_kg: number;
  sets: SetLog[];
  expanded: boolean;
}

const TRADES: Record<string,string> = {
  'General Laborer':'general_laborer','Carpenter':'carpenter','Electrician':'electrician',
  'Plumber':'plumber','Ironworker':'ironworker','Mason':'mason','Roofer':'roofer',
  'HVAC Tech':'hvac_tech','Painter':'painter','Welder':'welder','Heavy Equipment':'heavy_equipment',
  'Lineman':'lineman','Pipefitter':'pipefitter','Scaffolder':'scaffolder','Millwright':'millwright',
};
const EQUIPMENT = ['none','barbell','dumbbell','kettlebell','bands','pullup_bar','bench','cable_machine'];
const GOALS = ['Build Strength','Injury Prevention','Endurance','Muscle Growth','Mobility','Fat Loss'];

function TrainPage(){
  const [uid,setUid]=useState('');
  const [loading,setLoading]=useState(true);
  const [onboarding,setOnboarding]=useState(true);
  const [onboardStep,setOnboardStep]=useState(0);
  const [workout,setWorkout]=useState<any>(null);
  const [focus,setFocus]=useState<FocusArea>('full');
  const [shift,setShift]=useState<'day'|'swing'|'night'>('day');

  /* workout tracking state */
  const [mode,setMode]=useState<WorkoutMode>('preview');
  const [sessionId,setSessionId]=useState<string|null>(null);
  const [startTime,setStartTime]=useState<Date|null>(null);
  const [elapsed,setElapsed]=useState(0);
  const [exerciseLogs,setExerciseLogs]=useState<ExerciseLog[]>([]);
  const [warmupDone,setWarmupDone]=useState<boolean[]>([]);
  const [cooldownDone,setCooldownDone]=useState<boolean[]>([]);
  const [overallRpe,setOverallRpe]=useState('');
  const [sessionNotes,setSessionNotes]=useState('');
  const [completionResult,setCompletionResult]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  /* onboard fields */
  const [age,setAge]=useState('');
  const [weight,setWeight]=useState('');
  const [heightFt,setHeightFt]=useState('');
  const [heightIn,setHeightIn]=useState('');
  const [sex,setSex]=useState('male');
  const [experience,setExperience]=useState('Beginner');
  const [squat,setSquat]=useState('');
  const [bench,setBench]=useState('');
  const [deadlift,setDeadlift]=useState('');
  const [ohp,setOhp]=useState('');
  const [trade,setTrade]=useState('General Laborer');
  const [equipment,setEquipment]=useState<string[]>(['none']);
  const [goals,setGoals]=useState<string[]>(['Build Strength']);

  const useMetric=false;
  const toDisplay=(kg:number)=>useMetric?kg:Math.round(kg*2.205);
  const unitLabel=useMetric?'kg':'lb';
  const toKg=(v:string)=>useMetric?parseFloat(v):parseFloat(v)/2.205;
  const kgToDisplay=(kg:number)=>useMetric?kg.toFixed(1):Math.round(kg*2.205).toString();
  const displayToKg=(v:string)=>useMetric?parseFloat(v)||0:(parseFloat(v)||0)/2.205;
  const expYears=(e:string)=>e==='Beginner'?0.5:e==='Intermediate'?3:7;

  /* timer */
  useEffect(()=>{
    if(mode==='active' && startTime){
      timerRef.current = setInterval(()=>{
        setElapsed(Math.floor((Date.now() - startTime.getTime())/1000));
      }, 1000);
      return ()=>{ if(timerRef.current) clearInterval(timerRef.current); };
    }
  },[mode, startTime]);

  const formatTime=(s:number)=>{
    const m=Math.floor(s/60);
    const sec=s%60;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  };

  useEffect(()=>{
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){window.location.href='/login';return;}
      setUid(user.id);
      const {data:prefs}=await supabase.from('user_training_preferences').select('id').eq('user_id',user.id).maybeSingle();
      if(prefs){setOnboarding(false);await loadWorkout(user.id);}
      setLoading(false);
    })();
  },[]);

  async function loadWorkout(userId?:string){
    setLoading(true);
    const id=userId||uid;
    const {data,error}=await supabase.rpc('recommend_workout_v2',{
      p_user_id:id, p_focus_area:focus, p_equipment:equipment, p_max_minutes:45
    });
    if(!error && data) setWorkout(data);
    else console.error('workout error',error);
    setLoading(false);
  }

  async function handleOnboard(){
    if(onboardStep<3){setOnboardStep(s=>s+1);return;}
    setLoading(true);
    const userId=uid;
    const heightCm=((parseFloat(heightFt)||0)*30.48)+((parseFloat(heightIn)||0)*2.54);
    const weightKg=useMetric?parseFloat(weight):parseFloat(weight)/2.205;
    const params:Record<string,any>={
      p_user_id:userId, p_body_weight_kg:weightKg, p_height_cm:heightCm, p_age:parseInt(age),
      p_sex:sex, p_training_years:expYears(experience), p_training_days_per_week:3,
      p_trade_slug:TRADES[trade]||'general_laborer', p_equipment:equipment,
      p_training_location:'mixed', p_max_minutes:45,
      p_goals:goals.map(g=>g.toLowerCase().replace(/ /g,'_')),
      p_restricted_movements:[] as string[], p_restricted_muscles:[] as string[]
    };
    if(squat){params.p_squat_weight=toKg(squat);params.p_squat_reps=5;}
    if(bench){params.p_bench_weight=toKg(bench);params.p_bench_reps=5;}
    if(deadlift){params.p_deadlift_weight=toKg(deadlift);params.p_deadlift_reps=5;}
    if(ohp){params.p_ohp_weight=toKg(ohp);params.p_ohp_reps=5;}
    const {error}=await supabase.rpc('onboard_user',params);
    if(error){console.error('onboard error',error);setLoading(false);return;}
    setOnboarding(false);
    await loadWorkout(userId);
  }

  async function logShift(s:'day'|'swing'|'night'){
    setShift(s);
    await supabase.from('user_training_preferences').update({shift_pattern:s}).eq('user_id',uid);
  }

  /* ── Start Workout ── */
  async function startWorkout(){
    if(!workout?.workout) return;
    const {data,error}=await supabase.from('workout_sessions').insert({
      user_id: uid,
      started_at: new Date().toISOString(),
      pre_fatigue_snapshot: workout.fatigue_state || {},
    }).select('id').single();

    if(error){console.error('session create error',error);return;}

    setSessionId(data.id);
    setStartTime(new Date());
    setMode('active');

    // Initialize exercise logs from prescribed workout
    const workoutArr = Array.isArray(workout.workout) ? workout.workout : [];
    const logs: ExerciseLog[] = workoutArr.map((ex:any)=>{
      const sets: SetLog[] = [];
      const numSets = ex.prescribed_sets || 3;
      const prescribedWeight = ex.prescribed_weight_kg || 0;
      for(let i=1;i<=numSets;i++){
        sets.push({
          set_number: i,
          reps: (ex.prescribed_reps||0).toString(),
          weight_kg: prescribedWeight > 0 ? kgToDisplay(prescribedWeight) : '',
          rpe: (ex.rpe_target||'').toString(),
          to_failure: false,
        });
      }
      return {
        exercise_name: ex.name,
        exercise_slug: ex.slug || ex.name?.toLowerCase().replace(/ /g,'_') || '',
        prescribed_sets: numSets,
        prescribed_reps: ex.prescribed_reps || 0,
        prescribed_weight_kg: prescribedWeight,
        sets,
        expanded: false,
      };
    });
    setExerciseLogs(logs);

    // Initialize warmup/cooldown checkboxes
    const warmupArr = Array.isArray(workout.warmup) ? workout.warmup : [];
    const cooldownArr = Array.isArray(workout.cooldown) ? workout.cooldown : [];
    setWarmupDone(warmupArr.map(()=>false));
    setCooldownDone(cooldownArr.map(()=>false));
  }

  /* ── Update Set Data ── */
  function updateSet(exIdx:number, setIdx:number, field:keyof SetLog, value:string|boolean){
    setExerciseLogs(prev=>{
      const next=[...prev];
      next[exIdx]={...next[exIdx], sets:[...next[exIdx].sets]};
      next[exIdx].sets[setIdx]={...next[exIdx].sets[setIdx], [field]: value};
      return next;
    });
  }

  function toggleExpand(exIdx:number){
    setExerciseLogs(prev=>{
      const next=[...prev];
      next[exIdx]={...next[exIdx], expanded:!next[exIdx].expanded};
      return next;
    });
  }

  function addSet(exIdx:number){
    setExerciseLogs(prev=>{
      const next=[...prev];
      const ex=next[exIdx];
      const lastSet = ex.sets[ex.sets.length-1];
      next[exIdx]={...ex, sets:[...ex.sets, {
        set_number: ex.sets.length+1,
        reps: lastSet?.reps || '',
        weight_kg: lastSet?.weight_kg || '',
        rpe: lastSet?.rpe || '',
        to_failure: false,
      }]};
      return next;
    });
  }

  function removeSet(exIdx:number, setIdx:number){
    setExerciseLogs(prev=>{
      const next=[...prev];
      const newSets = next[exIdx].sets.filter((_,i)=>i!==setIdx).map((s,i)=>({...s, set_number:i+1}));
      next[exIdx]={...next[exIdx], sets: newSets};
      return next;
    });
  }

  /* ── Complete Workout ── */
  async function completeWorkout(){
    if(!sessionId || saving) return;
    setSaving(true);

    const durationMin = Math.round(elapsed/60);
    const logs = exerciseLogs.map(ex=>({
      exercise_name: ex.exercise_name,
      exercise_slug: ex.exercise_slug,
      sets: ex.sets.filter(s=>parseInt(s.reps)>0).map(s=>({
        set_number: s.set_number,
        reps: parseInt(s.reps)||0,
        weight_kg: displayToKg(s.weight_kg),
        rpe: parseInt(s.rpe)||null,
        to_failure: s.to_failure,
      })),
    })).filter(ex=>ex.sets.length>0);

    const {data,error}=await supabase.rpc('complete_workout',{
      p_user_id: uid,
      p_session_id: sessionId,
      p_duration_minutes: durationMin,
      p_overall_rpe: parseInt(overallRpe)||null,
      p_notes: sessionNotes||null,
      p_exercise_logs: logs,
    });

    if(error){
      console.error('complete error',error);
      setSaving(false);
      return;
    }

    setCompletionResult(data);
    setMode('complete');
    if(timerRef.current) clearInterval(timerRef.current);
    setSaving(false);
  }

  /* ── New Workout after completion ── */
  async function newWorkout(){
    setMode('preview');
    setSessionId(null);
    setStartTime(null);
    setElapsed(0);
    setExerciseLogs([]);
    setCompletionResult(null);
    setOverallRpe('');
    setSessionNotes('');
    await loadWorkout();
  }

  const fatColor=(v:number)=>v>70?'bg-red-900 text-red-300':v>40?'bg-amber-900 text-amber-300':'bg-green-900 text-green-300';
  const fatigueArr = Array.isArray(workout?.fatigue_state) ? workout.fatigue_state : [];
  const crossArr = Array.isArray(workout?.cross_pillar) ? workout.cross_pillar : [];
  const warmupArr = Array.isArray(workout?.warmup) ? workout.warmup : [];
  const workoutArr = Array.isArray(workout?.workout) ? workout.workout : [];
  const cooldownArr = Array.isArray(workout?.cooldown) ? workout.cooldown : [];

  /* ── loading ── */
  if(loading && !workout){
    return(
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-lime-400 text-lg">Loading...</div>
      </div>
    );
  }

  /* ── onboarding ── */
  if(onboarding){
    const inputCls="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-lime-500 outline-none";
    const selCls="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white outline-none";
    return(
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-lg mx-auto px-4 pt-8">
          <h1 className="text-2xl font-bold mb-1">Build Your Program</h1>
          <p className="text-zinc-400 text-sm mb-6">Step {onboardStep+1} of 4</p>
          <div className="h-1 bg-zinc-800 rounded-full mb-6">
            <div className="h-1 bg-lime-500 rounded-full transition-all" style={{width:`${((onboardStep+1)/4)*100}%`}}/>
          </div>

          {onboardStep===0&&(
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Your Stats</h2>
              <input type="number" placeholder="Age" value={age} onChange={e=>setAge(e.target.value)} className={inputCls}/>
              <input type="number" placeholder={"Weight ("+unitLabel+")"} value={weight} onChange={e=>setWeight(e.target.value)} className={inputCls}/>
              <div className="flex gap-2">
                <input type="number" placeholder="Height (ft)" value={heightFt} onChange={e=>setHeightFt(e.target.value)} className={inputCls}/>
                <input type="number" placeholder="(in)" value={heightIn} onChange={e=>setHeightIn(e.target.value)} className={inputCls}/>
              </div>
              <select value={sex} onChange={e=>setSex(e.target.value)} className={selCls}>
                <option value="male">Male</option><option value="female">Female</option>
              </select>
              <select value={experience} onChange={e=>setExperience(e.target.value)} className={selCls}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
          )}

          {onboardStep===1&&(
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Known Lifts <span className="text-zinc-500 text-sm">(optional, {unitLabel})</span></h2>
              <input type="number" placeholder="Squat" value={squat} onChange={e=>setSquat(e.target.value)} className={inputCls}/>
              <input type="number" placeholder="Bench Press" value={bench} onChange={e=>setBench(e.target.value)} className={inputCls}/>
              <input type="number" placeholder="Deadlift" value={deadlift} onChange={e=>setDeadlift(e.target.value)} className={inputCls}/>
              <input type="number" placeholder="Overhead Press" value={ohp} onChange={e=>setOhp(e.target.value)} className={inputCls}/>
            </div>
          )}

          {onboardStep===2&&(
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Your Trade</h2>
              <select value={trade} onChange={e=>setTrade(e.target.value)} className={selCls}>
                {Object.keys(TRADES).map(t=><option key={t}>{t}</option>)}
              </select>
              <h2 className="font-semibold text-lg mt-4">Equipment</h2>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT.map(e=>(
                  <button key={e} onClick={()=>setEquipment(prev=>prev.includes(e)?prev.filter(x=>x!==e):[...prev,e])}
                    className={`px-3 py-1 rounded-full text-xs ${equipment.includes(e)?'bg-lime-500 text-black':'bg-zinc-800 text-zinc-400'}`}>
                    {e.replace(/_/g,' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {onboardStep===3&&(
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Goals</h2>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(g=>(
                  <button key={g} onClick={()=>setGoals(prev=>prev.includes(g)?prev.filter(x=>x!==g):[...prev,g])}
                    className={`px-3 py-2 rounded-full text-sm ${goals.includes(g)?'bg-lime-500 text-black':'bg-zinc-800 text-zinc-400'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {onboardStep>0&&(
              <button onClick={()=>setOnboardStep(s=>s-1)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold">Back</button>
            )}
            <button onClick={handleOnboard} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-lime-500 text-black font-bold transition" style={{opacity:loading?0.6:1}}>
              {loading ? 'Building...' : onboardStep < 3 ? 'Next' : 'Generate My Workout'}
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ── completion summary ── */
  if(mode==='complete' && completionResult){
    return(
      <div className="min-h-screen bg-zinc-950 text-white pb-24">
        <div className="max-w-lg mx-auto px-4 pt-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">&#9889;</div>
            <h1 className="text-3xl font-black mb-2">Workout Complete</h1>
            <p className="text-zinc-400">Great work out there.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-zinc-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-lime-400">{completionResult.duration_minutes}</p>
              <p className="text-xs text-zinc-500">minutes</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-lime-400">{completionResult.total_sets}</p>
              <p className="text-xs text-zinc-500">sets</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-lime-400">{completionResult.total_reps}</p>
              <p className="text-xs text-zinc-500">reps</p>
            </div>
          </div>

          {completionResult.total_volume_kg > 0 && (
            <div className="bg-zinc-900 rounded-xl p-4 mb-6 text-center">
              <p className="text-3xl font-bold text-lime-400">
                {useMetric ? completionResult.total_volume_kg : Math.round(completionResult.total_volume_kg * 2.205).toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500">total volume ({unitLabel})</p>
            </div>
          )}

          {/* post-workout fatigue */}
          {completionResult.fatigue_after && Array.isArray(completionResult.fatigue_after) && (
            <div className="bg-zinc-900 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">Updated Fatigue</h3>
              <div className="flex flex-wrap gap-2">
                {completionResult.fatigue_after.map((f:any,i:number)=>(
                  <span key={i} className={`text-xs px-2 py-1 rounded-full ${fatColor(f.decayed_score||0)}`}>
                    {f.muscle_slug} {Math.round(f.decayed_score||0)}%
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={newWorkout}
            className="w-full py-4 rounded-xl bg-lime-500 text-black font-bold text-lg mb-3">
            Generate Next Workout
          </button>
          <button onClick={()=>{setMode('preview');}}
            className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold">
            Back to Overview
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ── active workout (logging) ── */
  if(mode==='active'){
    return(
      <div className="min-h-screen bg-zinc-950 text-white pb-24">
        <div className="max-w-lg mx-auto px-4 pt-4">
          {/* sticky timer header */}
          <div className="sticky top-0 bg-zinc-950 z-10 pb-3 pt-2 border-b border-zinc-800 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Workout Active</h1>
                <p className="text-zinc-400 text-sm">{workout?.session?.focus_area || focus} focus</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-bold text-lime-400">{formatTime(elapsed)}</p>
                <p className="text-xs text-zinc-500">elapsed</p>
              </div>
            </div>
          </div>

          {/* warmup checklist */}
          {warmupArr.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">Warm-up</h3>
              {warmupArr.map((ex:any,i:number)=>(
                <button key={i} onClick={()=>setWarmupDone(prev=>{const n=[...prev];n[i]=!n[i];return n;})}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition ${warmupDone[i]?'bg-zinc-800/50 opacity-60':'bg-zinc-900'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${warmupDone[i]?'border-lime-500 bg-lime-500':'border-zinc-600'}`}>
                    {warmupDone[i] && <span className="text-xs text-black font-bold">&#10003;</span>}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${warmupDone[i]?'line-through text-zinc-500':''}`}>{ex.name}</p>
                    <p className="text-xs text-zinc-500">{ex.duration_seconds?ex.duration_seconds+'s':ex.sets_reps}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* main exercises with set logging */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-lime-400 mb-2">Exercises</h3>
            {exerciseLogs.map((ex,exIdx)=>(
              <div key={exIdx} className="bg-zinc-900 rounded-xl mb-3 overflow-hidden">
                <button onClick={()=>toggleExpand(exIdx)}
                  className="w-full flex items-center justify-between p-4">
                  <div className="text-left">
                    <p className="font-semibold">{ex.exercise_name}</p>
                    <p className="text-xs text-zinc-400">
                      {ex.sets.length} sets &bull; {ex.prescribed_reps} reps
                      {ex.prescribed_weight_kg > 0 && ` @ ${kgToDisplay(ex.prescribed_weight_kg)} ${unitLabel}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {ex.sets.filter(s=>parseInt(s.reps)>0).length}/{ex.sets.length}
                    </span>
                    <span className={`text-zinc-500 transition-transform ${ex.expanded?'rotate-180':''}`}>&#9660;</span>
                  </div>
                </button>

                {ex.expanded && (
                  <div className="px-4 pb-4">
                    {/* set headers */}
                    <div className="grid grid-cols-12 gap-1 text-xs text-zinc-500 mb-1 px-1">
                      <div className="col-span-1">Set</div>
                      <div className="col-span-3">{unitLabel}</div>
                      <div className="col-span-3">Reps</div>
                      <div className="col-span-2">RPE</div>
                      <div className="col-span-2">Fail</div>
                      <div className="col-span-1"></div>
                    </div>

                    {ex.sets.map((set,setIdx)=>(
                      <div key={setIdx} className="grid grid-cols-12 gap-1 items-center mb-2">
                        <div className="col-span-1 text-xs text-zinc-500 text-center">{set.set_number}</div>
                        <input type="number" value={set.weight_kg}
                          onChange={e=>updateSet(exIdx,setIdx,'weight_kg',e.target.value)}
                          className="col-span-3 bg-zinc-800 rounded px-2 py-2 text-sm text-white text-center outline-none focus:ring-1 focus:ring-lime-500"
                          placeholder="0"/>
                        <input type="number" value={set.reps}
                          onChange={e=>updateSet(exIdx,setIdx,'reps',e.target.value)}
                          className="col-span-3 bg-zinc-800 rounded px-2 py-2 text-sm text-white text-center outline-none focus:ring-1 focus:ring-lime-500"
                          placeholder="0"/>
                        <input type="number" value={set.rpe}
                          onChange={e=>updateSet(exIdx,setIdx,'rpe',e.target.value)}
                          className="col-span-2 bg-zinc-800 rounded px-2 py-2 text-sm text-white text-center outline-none focus:ring-1 focus:ring-lime-500"
                          placeholder="-" min="1" max="10"/>
                        <button onClick={()=>updateSet(exIdx,setIdx,'to_failure',!set.to_failure)}
                          className={`col-span-2 rounded py-2 text-xs font-semibold ${set.to_failure?'bg-red-900 text-red-300':'bg-zinc-800 text-zinc-500'}`}>
                          {set.to_failure?'Yes':'No'}
                        </button>
                        <button onClick={()=>removeSet(exIdx,setIdx)}
                          className="col-span-1 text-zinc-600 text-xs hover:text-red-400">&#10005;</button>
                      </div>
                    ))}

                    <button onClick={()=>addSet(exIdx)}
                      className="w-full py-2 rounded bg-zinc-800 text-zinc-400 text-xs mt-1 hover:bg-zinc-700">
                      + Add Set
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* cooldown checklist */}
          {cooldownArr.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">Cool-down</h3>
              {cooldownArr.map((ex:any,i:number)=>(
                <button key={i} onClick={()=>setCooldownDone(prev=>{const n=[...prev];n[i]=!n[i];return n;})}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition ${cooldownDone[i]?'bg-zinc-800/50 opacity-60':'bg-zinc-900'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${cooldownDone[i]?'border-lime-500 bg-lime-500':'border-zinc-600'}`}>
                    {cooldownDone[i] && <span className="text-xs text-black font-bold">&#10003;</span>}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${cooldownDone[i]?'line-through text-zinc-500':''}`}>{ex.name}</p>
                    <p className="text-xs text-zinc-500">{ex.duration_seconds?ex.duration_seconds+'s':ex.sets_reps}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* session notes + RPE */}
          <div className="mb-5 space-y-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">How hard was this workout? (RPE 1-10)</label>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                  <button key={n} onClick={()=>setOverallRpe(n.toString())}
                    className={`flex-1 py-2 rounded text-xs font-semibold transition ${
                      parseInt(overallRpe)===n
                        ? n<=3?'bg-green-600 text-white':n<=6?'bg-amber-600 text-white':n<=8?'bg-orange-600 text-white':'bg-red-600 text-white'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)}
              placeholder="Notes (optional)..."
              className="w-full bg-zinc-900 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-lime-500 resize-none"
              rows={2}/>
          </div>

          {/* complete button */}
          <button onClick={completeWorkout} disabled={saving}
            className="w-full py-4 rounded-xl bg-lime-500 text-black font-bold text-lg mb-3 disabled:opacity-50">
            {saving ? 'Saving...' : 'Complete Workout'}
          </button>
          <button onClick={()=>{if(confirm('Discard this workout?')){setMode('preview');if(timerRef.current)clearInterval(timerRef.current);}}}
            className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-500 font-semibold mb-6">
            Cancel Workout
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ── preview mode (original view + Start button) ── */
  const focusOptions: FocusArea[] = ['full','upper','lower','push','pull'];
  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* header + shift */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">TRAIN</h1>
          <div className="flex gap-2">
            {(['day','swing','night'] as const).map(s=>(
              <button key={s} onClick={()=>logShift(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${shift===s?'bg-lime-500 text-black':'bg-zinc-800 text-zinc-400'}`}>
                {s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* focus selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {focusOptions.map(f=>(
            <button key={f} onClick={()=>{setFocus(f);}}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${focus===f?'bg-lime-500 text-black':'bg-zinc-800 text-zinc-400'}`}>
              {f==='full'?'Full Body':f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>

        {/* fatigue */}
        {fatigueArr.length > 0 && (
          <div className="bg-zinc-900 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-2">Fatigue</h3>
            <div className="flex flex-wrap gap-2">
              {fatigueArr.map((f:any,i:number)=>(
                <span key={i} className={`text-xs px-2 py-1 rounded-full ${fatColor(f.decayed_score)}`}>
                  {f.muscle_slug} {Math.round(f.decayed_score)}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* cross-pillar */}
        {crossArr.length > 0 && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-1">Alerts</h3>
            {crossArr.map((c:any,i:number)=>(
              <p key={i} className="text-xs text-amber-200">{c.message || c}</p>
            ))}
          </div>
        )}

        {/* session stats */}
        {workout?.session && (
          <div className="bg-zinc-900 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-2">Session</h3>
            <p className="text-xs text-zinc-300">Focus: {workout.session.focus_area} &bull; Est. {workout.session.estimated_minutes} min</p>
            {workout.periodization_note && <p className="text-xs text-zinc-500 mt-1">{workout.periodization_note}</p>}
          </div>
        )}

        {/* warmup */}
        {warmupArr.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-2">Warm-up</h3>
            {warmupArr.map((ex:any,i:number)=>(
              <div key={i} className="bg-zinc-900 rounded-lg p-3 mb-2">
                <p className="text-sm font-medium">{ex.name}</p>
                <p className="text-xs text-zinc-400">{ex.duration_seconds ? ex.duration_seconds+'s' : ex.sets_reps}</p>
              </div>
            ))}
          </div>
        )}

        {/* main workout */}
        {workoutArr.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-lime-400 mb-2">Workout</h3>
            {workoutArr.map((ex:any,i:number)=>(
              <div key={i} className="bg-zinc-900 rounded-xl p-4 mb-3">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold">{ex.name}</p>
                  {ex.composite_score && <span className="text-xs text-zinc-500">Score {ex.composite_score.toFixed(1)}</span>}
                </div>
                <div className="flex gap-3 text-sm text-zinc-300">
                  <span>{ex.prescribed_sets}x{ex.prescribed_reps}</span>
                  {ex.prescribed_weight_kg > 0 && <span>{kgToDisplay(ex.prescribed_weight_kg)} {unitLabel}</span>}
                  {ex.rpe_target && <span>RPE {ex.rpe_target}</span>}
                </div>
                {ex.progression_note && <p className="text-xs text-zinc-500 mt-1">{ex.progression_note}</p>}
              </div>
            ))}
          </div>
        )}

        {/* cooldown */}
        {cooldownArr.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-2">Cool-down</h3>
            {cooldownArr.map((ex:any,i:number)=>(
              <div key={i} className="bg-zinc-900 rounded-lg p-3 mb-2">
                <p className="text-sm font-medium">{ex.name}</p>
                <p className="text-xs text-zinc-400">{ex.duration_seconds ? ex.duration_seconds+'s' : ex.sets_reps}</p>
              </div>
            ))}
          </div>
        )}

        {/* START WORKOUT button */}
        {workoutArr.length > 0 && (
          <button onClick={startWorkout}
            className="w-full py-4 rounded-xl bg-lime-500 text-black font-bold text-lg mb-3 hover:bg-lime-400 transition">
            Start Workout
          </button>
        )}

        {/* regenerate */}
        <button onClick={()=>loadWorkout()}
          className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold mb-6 hover:bg-zinc-700 transition">
          Regenerate Workout
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

export default TrainPage;
