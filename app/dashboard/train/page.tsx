'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

type Step = 'loading' | 'onboarding' | 'workout';
type FocusArea = 'full_body' | 'upper' | 'lower' | 'core';

const TRADES = ['General Laborer','Carpenter','Electrician','Plumber','Ironworker','Mason/Bricklayer','Roofer','Painter','HVAC Technician','Heavy Equipment Operator','Welder','Pipefitter','Superintendent/Foreman'];
const EQUIPMENT = ['barbell','dumbbell','kettlebell','bodyweight','resistance_bands','pull_up_bar','cable_machine'];
const GOALS = ['Build Strength','Build Muscle','Improve Endurance','Lose Fat','Injury Prevention','General Fitness'];

export default function TrainPage() {
  const [step, setStep] = useState<Step>('loading');
  const [userId, setUserId] = useState('');
  const [useLbs, setUseLbs] = useState(true);
  const [focus, setFocus] = useState<FocusArea>('full_body');
  const [fatigue, setFatigue] = useState<any[]>([]);
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onboardStep, setOnboardStep] = useState(0);
  const [age, setAge] = useState(30);
  const [weightKg, setWeightKg] = useState(90);
  const [heightCm, setHeightCm] = useState(178);
  const [sex, setSex] = useState('male');
  const [experience, setExperience] = useState('intermediate');
  const [yearsTraining, setYearsTraining] = useState(2);
  const [trade, setTrade] = useState('General Laborer');
  const [equipment, setEquipment] = useState(['barbell','dumbbell','bodyweight']);
  const [goals, setGoals] = useState(['Build Strength']);
  const [squat, setSquat] = useState('');
  const [bench, setBench] = useState('');
  const [deadlift, setDeadlift] = useState('');
  const [ohp, setOhp] = useState('');

  const toDisplay = (kg: number) => useLbs ? Math.round(kg * 2.205) : Math.round(kg);
  const unitLabel = useLbs ? 'lbs' : 'kg';

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/auth'; return; }
      setUserId(user.id);
      const { data } = await supabase.from('user_training_preferences').select('*').eq('user_id', user.id).single();
      if (data) { loadWorkout(user.id); } else { setStep('onboarding'); }
    })();
  }, []);

  const loadWorkout = useCallback(async (uid: string) => {
    setLoading(true); setError('');
    try {
      const [fRes, wRes] = await Promise.all([
        supabase.rpc('get_current_fatigue', { p_user_id: uid }),
        supabase.rpc('recommend_workout_v2', { p_user_id: uid, p_focus_area: focus, p_duration_minutes: 45, p_available_equipment: equipment })
      ]);
      if (fRes.data) setFatigue(fRes.data);
      if (wRes.data) setWorkout(wRes.data);
      setStep('workout');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [focus, equipment]);

  const handleOnboard = async () => {
    setLoading(true);
    try {
      const toKg = (v: string) => useLbs ? Math.round(parseFloat(v) / 2.205) : parseFloat(v);
      const kl: Record<string, any> = {};
      if (squat) kl['Barbell Back Squat'] = { weight: toKg(squat), reps: 5 };
      if (bench) kl['Barbell Bench Press'] = { weight: toKg(bench), reps: 5 };
      if (deadlift) kl['Barbell Deadlift'] = { weight: toKg(deadlift), reps: 5 };
      if (ohp) kl['Overhead Press'] = { weight: toKg(ohp), reps: 5 };
      await supabase.rpc('onboard_user', {
        p_user_id: userId, p_age: age, p_weight_kg: weightKg, p_height_cm: heightCm,
        p_sex: sex, p_training_experience: experience, p_years_training: yearsTraining,
        p_trade: trade, p_available_equipment: equipment, p_goals: goals, p_known_lifts: kl
      });
      await loadWorkout(userId);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const logShift = async (hours: number) => {
    await supabase.rpc('ingest_activity', { p_user_id: userId, p_activity_type: 'occupational', p_activity_name: trade, p_duration_minutes: hours * 60, p_intensity: 0.7, p_muscle_loads: null, p_notes: null });
    await loadWorkout(userId);
  };

  const fatColor = (v: number) => v >= 70 ? '#ef4444' : v >= 40 ? '#f59e0b' : '#22c55e';
  const fatLabel = (v: number) => v >= 70 ? 'BLOCKED' : v >= 40 ? 'CAUTION' : 'FRESH';

  if (step === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#C45B28', fontFamily: 'var(--font-oswald)' }}>TRAIN</div>
        <div style={{ marginTop: 16, color: '#999' }}>Loading...</div>
      </div>
    </div>
  );

  if (step === 'onboarding') {
    const steps = [
      <div key="s0">
        <h2 style={{ color: '#C45B28', fontFamily: 'var(--font-oswald)', fontSize: 24, marginBottom: 24 }}>YOUR STATS</h2>
        {[{ l: 'Age', v: age, s: setAge }, { l: `Weight (${unitLabel})`, v: useLbs ? Math.round(weightKg*2.205) : weightKg, s: (v:number) => setWeightKg(useLbs ? Math.round(v/2.205) : v) }, { l: 'Height (cm)', v: heightCm, s: setHeightCm }].map(f =>
          <div key={f.l} style={{ marginBottom: 16 }}><label style={{ color: '#ccc', display: 'block', marginBottom: 4, fontSize: 14 }}>{f.l}</label>
            <input type="number" value={f.v} onChange={e => f.s(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', background: '#222', border: '1px solid #444', borderRadius: 8, color: '#fff', fontSize: 16 }} /></div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>{['male','female'].map(sv =>
          <button key={sv} onClick={() => setSex(sv)} style={{ flex: 1, padding: 10, background: sex===sv?'#C45B28':'#222', border: '1px solid #444', borderRadius: 8, color: '#fff', cursor: 'pointer', textTransform: 'capitalize' as const }}>{sv}</button>
        )}</div>
      </div>,
      <div key="s1">
        <h2 style={{ color: '#C45B28', fontFamily: 'var(--font-oswald)', fontSize: 24, marginBottom: 8 }}>YOUR LIFTS</h2>
        <p style={{ color: '#999', fontSize: 13, marginBottom: 20 }}>Working weight for 5 reps. Leave blank if unsure.</p>
        {[{ l: 'Squat', v: squat, s: setSquat },{ l: 'Bench', v: bench, s: setBench },{ l: 'Deadlift', v: deadlift, s: setDeadlift },{ l: 'OHP', v: ohp, s: setOhp }].map(f =>
          <div key={f.l} style={{ marginBottom: 16 }}><label style={{ color: '#ccc', display: 'block', marginBottom: 4, fontSize: 14 }}>{f.l} ({unitLabel})</label>
            <input type="number" value={f.v} onChange={e => f.s(e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px 12px', background: '#222', border: '1px solid #444', borderRadius: 8, color: '#fff', fontSize: 16 }} /></div>
        )}
        <select value={experience} onChange={e => setExperience(e.target.value)} style={{ width: '100%', padding: 10, background: '#222', border: '1px solid #444', borderRadius: 8, color: '#fff', marginBottom: 8 }}>
          <option value="beginner">Beginner (0-1 yr)</option><option value="intermediate">Intermediate (1-3 yr)</option><option value="advanced">Advanced (3+ yr)</option>
        </select>
      </div>,
      <div key="s2">
        <h2 style={{ color: '#C45B28', fontFamily: 'var(--font-oswald)', fontSize: 24, marginBottom: 16 }}>YOUR TRADE</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>{TRADES.map(t =>
          <button key={t} onClick={() => setTrade(t)} style={{ padding: '10px 8px', background: trade===t?'#C45B28':'#222', border: '1px solid #444', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer' }}>{t}</button>
        )}</div>
        <h3 style={{ color: '#C45B28', fontFamily: 'var(--font-oswald)', fontSize: 18, marginBottom: 12 }}>EQUIPMENT</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>{EQUIPMENT.map(e =>
          <button key={e} onClick={() => setEquipment(p => p.includes(e)?p.filter(x=>x!==e):[...p,e])} style={{ padding: '8px 14px', background: equipment.includes(e)?'#C45B28':'#222', border: '1px solid #444', borderRadius: 20, color: '#fff', fontSize: 13, cursor: 'pointer' }}>{e.replace('_',' ')}</button>
        )}</div>
      </div>,
      <div key="s3">
        <h2 style={{ color: '#C45B28', fontFamily: 'var(--font-oswald)', fontSize: 24, marginBottom: 16 }}>YOUR GOALS</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{GOALS.map(g =>
          <button key={g} onClick={() => setGoals(p => p.includes(g)?p.filter(x=>x!==g):[...p,g])} style={{ padding: '14px 10px', background: goals.includes(g)?'#C45B28':'#222', border: '1px solid #444', borderRadius: 8, color: '#fff', fontSize: 14, cursor: 'pointer' }}>{g}</button>
        )}</div>
      </div>
    ];
    return (
      <div style={{ minHeight: '100vh', background: '#111', color: '#fff' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-oswald)', fontSize: 28, color: '#C45B28' }}>TRAIN SETUP</h1>
            <span style={{ color: '#999', fontSize: 13 }}>Step {onboardStep+1}/4</span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>{steps.map((_,i) => <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=onboardStep?'#C45B28':'#333' }}/>)}</div>
          {error && <div style={{ background: '#7f1d1d', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>{error}</div>}
          {steps[onboardStep]}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            {onboardStep > 0 && <button onClick={() => setOnboardStep(s => s-1)} style={{ flex:1, padding:14, background:'#333', border:'none', borderRadius:8, color:'#fff', fontSize:16, cursor:'pointer' }}>Back</button>}
            <button onClick={() => onboardStep < 3 ? setOnboardStep(s => s+1) : handleOnboard()} disabled={loading}
              style={{ flex:2, padding:14, background:'#C45B28', border:'none', borderRadius:8, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', opacity: loading?0.6:1 }}>
              {loading ? 'Building...' : onboardStep < 3 ? 'Next' : 'Generate My Workout'}
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
        }

  // WORKOUT VIEW
  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#fff' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-oswald)', fontSize: 28, color: '#C45B28' }}>TRAIN</h1>
          <button onClick={() => setUseLbs(!useLbs)} style={{ color: '#C45B28', background: '#222', border: '1px solid #444', borderRadius: 20, padding: '4px 14px', fontSize: 13, cursor: 'pointer' }}>{useLbs ? 'lbs' : 'kg'}</button>
        </div>
        {error && <div style={{ background: '#7f1d1d', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' as const }}>{[4,6,8,10].map(h =>
          <button key={h} onClick={() => logShift(h)} style={{ padding: '8px 14px', background: '#222', border: '1px solid #444', borderRadius: 20, color: '#ccc', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>Log {h}hr shift</button>
        )}</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>{(['full_body','upper','lower','core'] as FocusArea[]).map(f =>
          <button key={f} onClick={() => { setFocus(f); loadWorkout(userId); }} style={{ flex:1, padding:'8px 4px', background: focus===f?'#C45B28':'#222', border:'1px solid #444', borderRadius:8, color:'#fff', fontSize:12, cursor:'pointer', textTransform:'capitalize' as const }}>{f.replace('_',' ')}</button>
        )}</div>
        {fatigue.length > 0 && (
          <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #333' }}>
            <h3 style={{ fontFamily: 'var(--font-oswald)', fontSize: 16, color: '#C45B28', marginBottom: 12 }}>MUSCLE STATUS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {fatigue.filter((f: any) => f.current_fatigue > 5).sort((a: any, b: any) => b.current_fatigue - a.current_fatigue).slice(0,8).map((f: any) =>
                <div key={f.muscle_group_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#ccc', textTransform: 'capitalize' as const }}>{f.muscle_name}</div>
                    <div style={{ height: 4, background: '#333', borderRadius: 2, marginTop: 4 }}><div style={{ height: '100%', width: Math.min(f.current_fatigue,100)+'%', background: fatColor(f.current_fatigue), borderRadius: 2 }} /></div>
                  </div>
                  <span style={{ fontSize: 10, color: fatColor(f.current_fatigue), fontWeight: 700 }}>{fatLabel(f.current_fatigue)}</span>
                </div>
              )}
            </div>
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Calculating your workout...</div>
        ) : workout ? (
          <div>
            {workout.cross_pillar && (
              <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 12, marginBottom: 16, border: '1px solid #C45B28', borderLeftWidth: 3 }}>
                <div style={{ fontSize: 12, color: '#C45B28', fontWeight: 700, marginBottom: 4 }}>CROSS-PILLAR</div>
                {workout.cross_pillar.fuel && <div style={{ fontSize: 12, color: '#ccc' }}>Fuel: {typeof workout.cross_pillar.fuel === 'object' ? JSON.stringify(workout.cross_pillar.fuel) : workout.cross_pillar.fuel}</div>}
              </div>
            )}
            {workout.session_summary && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ flex:1, background:'#1a1a1a', borderRadius:8, padding:10, textAlign:'center', border:'1px solid #333' }}>
                  <div style={{ fontSize:20, fontWeight:700, color:'#C45B28' }}>{workout.main_exercises?.length || 0}</div><div style={{ fontSize:11, color:'#999' }}>Exercises</div>
                </div>
                <div style={{ flex:1, background:'#1a1a1a', borderRadius:8, padding:10, textAlign:'center', border:'1px solid #333' }}>
                  <div style={{ fontSize:20, fontWeight:700, color:'#C45B28' }}>{workout.session_summary.phase || 'Accumulation'}</div><div style={{ fontSize:11, color:'#999' }}>Phase</div>
                </div>
              </div>
            )}
            {workout.warmup?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily:'var(--font-oswald)', fontSize:14, color:'#999', marginBottom:8, letterSpacing:1 }}>WARMUP</h3>
                {workout.warmup.map((ex: any, i: number) => <div key={i} style={{ background:'#1a1a1a', borderRadius:8, padding:'10px 14px', marginBottom:6, border:'1px solid #333', display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:14, color:'#ccc' }}>{ex.exercise_name}</span><span style={{ fontSize:12, color:'#666' }}>{ex.sets_reps}</span></div>)}
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily:'var(--font-oswald)', fontSize:14, color:'#C45B28', marginBottom:8, letterSpacing:1 }}>MAIN WORKOUT</h3>
              {workout.main_exercises?.map((ex: any, i: number) => (
                <div key={i} style={{ background:'#1a1a1a', borderRadius:12, padding:14, marginBottom:8, border:'1px solid #333' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <div><div style={{ fontSize:16, fontWeight:600, color:'#fff' }}>{ex.exercise_name}</div><div style={{ fontSize:12, color:'#666' }}>{ex.movement_pattern}</div></div>
                    <div style={{ fontSize:12, color:'#C45B28', fontWeight:700 }}>Score: {ex.score}</div>
                  </div>
                  <div style={{ display:'flex', gap:12 }}>
                    <div style={{ background:'#222', borderRadius:8, padding:'6px 12px' }}><div style={{ fontSize:11, color:'#999' }}>Sets x Reps</div><div style={{ fontSize:14, color:'#fff', fontWeight:600 }}>{ex.sets_reps}</div></div>
                    {ex.weight_prescription && <div style={{ background:'#222', borderRadius:8, padding:'6px 12px' }}><div style={{ fontSize:11, color:'#999' }}>Weight</div><div style={{ fontSize:14, color:'#fff', fontWeight:600 }}>{ex.weight_prescription.prescribed_weight ? toDisplay(ex.weight_prescription.prescribed_weight)+' '+unitLabel : ex.weight_prescription.note || 'BW'}</div></div>}
                  </div>
                </div>
              ))}
            </div>
            {workout.cooldown?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily:'var(--font-oswald)', fontSize:14, color:'#999', marginBottom:8, letterSpacing:1 }}>COOLDOWN</h3>
                {workout.cooldown.map((ex: any, i: number) => <div key={i} style={{ background:'#1a1a1a', borderRadius:8, padding:'10px 14px', marginBottom:6, border:'1px solid #333', display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:14, color:'#ccc' }}>{ex.exercise_name}</span><span style={{ fontSize:12, color:'#666' }}>{ex.sets_reps}</span></div>)}
              </div>
            )}
            <button onClick={() => loadWorkout(userId)} style={{ width:'100%', padding:14, background:'#C45B28', border:'none', borderRadius:8, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-oswald)', letterSpacing:1 }}>REGENERATE WORKOUT</button>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:40, color:'#999' }}>
            <p>No workout yet.</p>
            <button onClick={() => loadWorkout(userId)} style={{ marginTop:12, padding:'12px 24px', background:'#C45B28', border:'none', borderRadius:8, color:'#fff', cursor:'pointer' }}>Generate Workout</button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
                }
