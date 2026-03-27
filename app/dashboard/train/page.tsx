'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

type FocusArea = 'full'|'upper'|'lower'|'push'|'pull';

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
  const expYears=(e:string)=>e==='Beginner'?0.5:e==='Intermediate'?3:7;
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
  const fatColor=(v:number)=>v>70?'bg-red-900 text-red-300':v>40?'bg-amber-900 text-amber-300':'bg-green-900 text-green-300';
  const fatLabel=(v:number)=>v>70?'High':v>40?'Moderate':'Fresh';
  if(loading && !workout){
    return(<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-pulse text-lime-400 text-lg">Loading...</div></div>);
  }
  if(onboarding){
    const inputCls="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-lime-500 outline-none";
    const selCls="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white outline-none";
    return(
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-lg mx-auto px-4 pt-8">
          <h1 className="text-2xl font-bold mb-1">Build Your Program</h1>
          <p className="text-zinc-400 text-sm mb-6">Step {onboardStep+1} of 4</p>
          <div className="h-1 bg-zinc-800 rounded-full mb-6"><div className="h-1 bg-lime-500 rounded-full transition-all" style={{width:`${((onboardStep+1)/4)*100}%`}}/></div>
          {onboardStep===0&&(<div className="space-y-4">
            <h2 className="font-semibold text-lg">Your Stats</h2>
            <input type="number" placeholder="Age" value={age} onChange={e=>setAge(e.target.value)} className={inputCls}/>
            <input type="number" placeholder={"Weight ("+unitLabel+")"} value={weight} onChange={e=>setWeight(e.target.value)} className={inputCls}/>
            <div className="flex gap-2">
              <input type="number" placeholder="Height (ft)" value={heightFt} onChange={e=>setHeightFt(e.target.value)} className={inputCls}/>
              <input type="number" placeholder="(in)" value={heightIn} onChange={e=>setHeightIn(e.target.value)} className={inputCls}/>
            </div>
            <select value={sex} onChange={e=>setSex(e.target.value)} className={selCls}><option value="male">Male</option><option value="female">Female</option></select>
            <select value={experience} onChange={e=>setExperience(e.target.value)} className={selCls}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
          </div>)}
          {onboardStep===1&&(<div className="space-y-4">
            <h2 className="font-semibold text-lg">Known Lifts <span className="text-zinc-500 text-sm">(optional, {unitLabel})</span></h2>
            <input type="number" placeholder="Squat" value={squat} onChange={e=>setSquat(e.target.value)} className={inputCls}/>
            <input type="number" placeholder="Bench Press" value={bench} onChange={e=>setBench(e.target.value)} className={inputCls}/>
            <input type="number" placeholder="Deadlift" value={deadlift} onChange={e=>setDeadlift(e.target.value)} className={inputCls}/>
            <input type="number" placeholder="Overhead Press" value={ohp} onChange={e=>setOhp(e.target.value)} className={inputCls}/>
          </div>)}
          {onboardStep===2&&(<div className="space-y-4">
            <h2 className="font-semibold text-lg">Your Trade</h2>
            <select value={trade} onChange={e=>setTrade(e.target.value)} className={selCls}>{Object.keys(TRADES).map(t=><option key={t}>{t}</option>)}</select>
            <h2 className="font-semibold text-lg mt-4">Equipment</h2>
            <div className="flex flex-wrap gap-2">{EQUIPMENT.map(e=>(<button key={e} onClick={()=>setEquipment(prev=>prev.includes(e)?prev.filter(x=>x!==e):[...prev,e])} className={`px-3 py-1 rounded-full text-xs ${equipment.includes(e)?'bg-lime-500 text-black':'bg-zinc-800 text-zinc-400'}`}>{e.replace(/_/g,' ')}</button>))}</div>
          </div>)}
          {onboardStep===3&&(<div className="space-y-4">
            <h2 className="font-semibold text-lg">Goals</h2>
            <div className="flex flex-wrap gap-2">{GOALS.map(g=>(<button key={g} onClick={()=>setGoals(prev=>prev.includes(g)?prev.filter(x=>x!==g):[...prev,g])} className={`px-3 py-2 rounded-full text-sm ${goals.includes(g)?'bg-lime-500 text-black':'bg-zinc-800 text-zinc-400'}`}>{g}</button>))}</div>
          </div>)}
          <div className="mt-8 flex gap-3">
            {onboardStep>0&&(<button onClick={()=>setOnboardStep(s=>s-1)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold">Back</button>)}
            <button onClick={handleOnboard} disabled={loading} className="flex-1 py-3 rounded-xl bg-lime-500 text-black font-bold transition" style={{opacity:loading?0.6:1}}>{loading ? 'Building...' : onboardStep < 3 ? 'Next' : 'Generate My Workout'}</button>
          </div>
        </div><BottomNav />
      </div>
    );
  }
  const focusOptions: FocusArea[] = ['full','upper','lower','push','pull'];
  const fatigueArr = Array.isArray(workout?.fatigue_state) ? workout.fatigue_state : [];
  const crossArr = Array.isArray(workout?.cross_pillar) ? workout.cross_pillar : [];
  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">TRAIN</h1>
          <div className="flex gap-2">{(['day','swing','night'] as const).map(s=>(<button key={s} onClick={()=>logShift(s)} className={`px-3 py-1 rounded-full text-xs font-semibold ${shift===s?'bg-lime-500 text-black':'bg-zinc-800 text-zinc-400'}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>))}</div>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">{focusOptions.map(f=>(<button key={f} onClick={()=>{setFocus(f);}} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${focus===f?'bg-lime-500 text-black':'bg-zinc-800 text-zinc-400'}`}>{f==='full'?'Full Body':f.charAt(0).toUpperCase()+f.slice(1)}</button>))}</div>
        {fatigueArr.length > 0 && (<div className="bg-zinc-900 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">Fatigue</h3>
          <div className="flex flex-wrap gap-2">{fatigueArr.map((f:any,i:number)=>(<span key={i} className={`text-xs px-2 py-1 rounded-full ${fatColor(f.decayed_score)}`}>{f.muscle_slug} {Math.round(f.decayed_score)}%</span>))}</div>
        </div>)}
        {crossArr.length > 0 && (<div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-1">Alerts</h3>
          {crossArr.map((c:any,i:number)=>(<p key={i} className="text-xs text-amber-200">{c.message || c}</p>))}
        </div>)}
        {workout?.session && (<div className="bg-zinc-900 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">Session</h3>
          <p className="text-xs text-zinc-300">Focus: {workout.session.focus_area} &bull; Est. {workout.session.estimated_minutes} min</p>
          {workout.periodization_note && <p className="text-xs text-zinc-500 mt-1">{workout.periodization_note}</p>}
        </div>)}
        {workout?.warmup && Array.isArray(workout.warmup) && workout.warmup.length > 0 && (<div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">Warm-up</h3>
          {workout.warmup.map((ex:any,i:number)=>(<div key={i} className="bg-zinc-900 rounded-lg p-3 mb-2"><p className="text-sm font-medium">{ex.name}</p><p className="text-xs text-zinc-400">{ex.duration_seconds ? ex.duration_seconds+'s' : ex.sets_reps}</p></div>))}
        </div>)}
        {workout?.workout && Array.isArray(workout.workout) && workout.workout.length > 0 && (<div className="mb-4">
          <h3 className="text-sm font-semibold text-lime-400 mb-2">Workout</h3>
          {workout.workout.map((ex:any,i:number)=>(<div key={i} className="bg-zinc-900 rounded-xl p-4 mb-3">
            <div className="flex justify-between items-start mb-1"><p className="font-semibold">{ex.name}</p>{ex.composite_score && <span className="text-xs text-zinc-500">Score {ex.composite_score.toFixed(1)}</span>}</div>
            <div className="flex gap-3 text-sm text-zinc-300"><span>{ex.prescribed_sets}x{ex.prescribed_reps}</span>{ex.prescribed_weight_kg > 0 && <span>{ex.prescribed_weight_kg} kg</span>}{ex.rpe_target && <span>RPE {ex.rpe_target}</span>}</div>
            {ex.progression_note && <p className="text-xs text-zinc-500 mt-1">{ex.progression_note}</p>}
          </div>))}
        </div>)}
        {workout?.cooldown && Array.isArray(workout.cooldown) && workout.cooldown.length > 0 && (<div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">Cool-down</h3>
          {workout.cooldown.map((ex:any,i:number)=>(<div key={i} className="bg-zinc-900 rounded-lg p-3 mb-2"><p className="text-sm font-medium">{ex.name}</p><p className="text-xs text-zinc-400">{ex.duration_seconds ? ex.duration_seconds+'s' : ex.sets_reps}</p></div>))}
        </div>)}
        <button onClick={()=>loadWorkout()} className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold mb-6 hover:bg-zinc-700 transition">Regenerate Workout</button>
      </div><BottomNav />
    </div>
  );
}
export default TrainPage;
