// pdt-mg-life-support.jsx — Minigame: Life Support (4 phases)

const FUSE_SLOTS = [
  { id:0, needed:15 }, { id:1, needed:20 }, { id:2, needed:10 },
  { id:3, needed:25 }, { id:4, needed:15 }, { id:5, needed:20 },
];
const FUSE_TRAY = [10,10,15,15,15,20,20,25,30,30];

const DUCT_IDS   = ['D1','D2','D3','D4','D5','D6'];
const DUCT_SEQ   = ['D1','D3','D5','D2','D4']; // correct activation order
const DUCT_DMGD  = ['D6']; // physically blocked

const MinigameLifeSupport = ({ onSuccess, onFailure }) => {
  const [phase,     setPhase]     = React.useState('fuses');
  const [fuseSlots, setFuseSlots] = React.useState(Array(6).fill(null));
  const [selTray,   setSelTray]   = React.useState(null); // selected tray index
  const [ductOn,    setDuctOn]    = React.useState([]);
  const [ductStep,  setDuctStep]  = React.useState(0);
  const [ductErr,   setDuctErr]   = React.useState(null);
  const [o2,        setO2]        = React.useState(18);
  const [co2,       setCo2]       = React.useState(0.08);
  const [o2Hold,    setO2Hold]    = React.useState(0);
  const [temp,      setTemp]      = React.useState(12);
  const [tempHold,  setTempHold]  = React.useState(0);
  const [timer,     setTimer]     = React.useState(120);

  React.useEffect(() => {
    const iv = setInterval(() => setTimer(t => { if(t<=1){onFailure();return 0;} return t-1; }), 1000);
    return () => clearInterval(iv);
  }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const phaseNum = { fuses:1, ducts:2, gases:3, temp:4 }[phase];

  // ── O2/CO2 zone hold ──────────────────────────────
  React.useEffect(() => {
    if (phase !== 'gases') return;
    const inZone = o2 >= 19.5 && o2 <= 21 && co2 >= 0.03 && co2 <= 0.05;
    if (!inZone) { setO2Hold(0); return; }
    const iv = setInterval(() => setO2Hold(h => { if(h>=4){clearInterval(iv);setPhase('temp');return 0;} return h+1; }), 1000);
    return () => clearInterval(iv);
  }, [phase, o2, co2]);

  // ── Temp zone hold ────────────────────────────────
  React.useEffect(() => {
    if (phase !== 'temp') return;
    const inZone = Math.abs(temp - 18) <= 2;
    if (!inZone) { setTempHold(0); return; }
    const iv = setInterval(() => setTempHold(h => { if(h>=3){clearInterval(iv);setTimeout(onSuccess,600);return 0;} return h+1; }), 1000);
    return () => clearInterval(iv);
  }, [phase, temp]);

  // ── O2 changes CO2 slightly ───────────────────────
  const handleO2 = v => { setO2(v); setCo2(c => Math.round((c + (v - o2) * 0.002) * 1000) / 1000); };

  // ── FUSE logic ────────────────────────────────────
  const tapSlot = (slotIdx) => {
    if (selTray === null) return;
    const amp = FUSE_TRAY[selTray];
    const next = [...fuseSlots]; next[slotIdx] = amp;
    setFuseSlots(next); setSelTray(null);
  };

  const fusesDone = fuseSlots.every((f,i) => f === FUSE_SLOTS[i].needed);
  const wrongFuses = fuseSlots.map((f,i)=>f!==null&&f!==FUSE_SLOTS[i].needed).filter(Boolean).length;

  // ── DUCT logic ────────────────────────────────────
  const tapDuct = (id) => {
    if (DUCT_DMGD.includes(id)) return;
    if (id !== DUCT_SEQ[ductStep]) {
      setDuctErr(id);
      setTimeout(() => setDuctErr(null), 500);
      return;
    }
    const next = [...ductOn, id];
    setDuctOn(next);
    setDuctStep(ductStep + 1);
    if (ductStep + 1 >= DUCT_SEQ.length) setTimeout(() => setPhase('gases'), 600);
  };

  const inO2Zone  = o2  >= 19.5 && o2  <= 21;
  const inCO2Zone = co2 >= 0.03 && co2 <= 0.05;
  const inTempZone = Math.abs(temp - 18) <= 2;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${C.dim}` }}>
        <div style={vt(20, C.main)}>LIFE SUPPORT — FASE {phaseNum}/4</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
          <span style={{ ...vt(17, timer<20?C.red:C.amber) }}>TIMER: {fmt(timer)}</span>
          <div style={{ display:'flex', gap:'6px' }}>
            {['FUSÍVEIS','DUTOS','GASES','TEMP'].map((l,i)=>(
              <span key={l} style={mono(9, phaseNum>i+1?C.bright:phaseNum===i+1?C.main:C.ghost)}>
                {phaseNum>i+1?'◆':phaseNum===i+1?'▶':'◇'}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', scrollbarWidth:'none' }}>

        {/* ── PHASE 1: FUSES ── */}
        {phase === 'fuses' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={mono(11, C.dim, { letterSpacing:'0.06em' })}>SUBSTITUIR FUSÍVEIS QUEIMADOS</div>
            <AsciiRule />
            {/* Slots */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
              {FUSE_SLOTS.map((slot,i) => {
                const placed = fuseSlots[i];
                const correct = placed === slot.needed;
                const wrong   = placed !== null && !correct;
                return (
                  <button key={i} onClick={()=>tapSlot(i)} style={{
                    ...vt(18, wrong?C.red:correct?C.bright:selTray!==null?C.amber:C.dim),
                    background: correct?C.ghost:wrong?'#1a0000':'transparent',
                    border:`1px solid ${wrong?C.red:correct?C.bright:selTray!==null?C.amber:C.dim}`,
                    padding:'10px 6px', cursor: selTray!==null?'pointer':'default',
                    minHeight:'56px', textAlign:'center', animation:wrong?'shake 0.3s':undefined,
                  }}>
                    <div style={mono(9,C.dim,{marginBottom:'3px'})}>SLOT {i+1}</div>
                    <div>{slot.needed}A</div>
                    {placed && <div style={mono(9,correct?C.bright:C.red)}>{placed}A {correct?'◆':'✗'}</div>}
                  </button>
                );
              })}
            </div>
            {/* Tray */}
            <div style={mono(10, C.dim, { marginTop:'6px', letterSpacing:'0.05em' })}>BANDEJA — TOCAR PARA SELECIONAR:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {FUSE_TRAY.map((amp,i) => {
                const used = fuseSlots.includes(amp) && fuseSlots.indexOf(amp) !== -1;
                return (
                  <button key={i} onClick={()=>setSelTray(selTray===i?null:i)} style={{
                    ...vt(18, selTray===i?C.bright:C.main),
                    background: selTray===i?C.ghost:'transparent',
                    border:`1px solid ${selTray===i?C.bright:C.dim}`,
                    padding:'8px 12px', cursor:'pointer', minHeight:'44px',
                    opacity: used?0.4:1,
                  }}>{amp}A</button>
                );
              })}
            </div>
            {fusesDone && <PDTButton variant="bright" onClick={()=>setPhase('ducts')} fullWidth>[ CONFIRMAR FUSÍVEIS ]</PDTButton>}
            {wrongFuses>0 && <div style={mono(10,C.amber)}>⚠ {wrongFuses} FUSÍVEL(IS) COM AMPERAGEM ERRADA</div>}
          </div>
        )}

        {/* ── PHASE 2: DUCTS ── */}
        {phase === 'ducts' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={mono(11,C.dim,{letterSpacing:'0.06em'})}>VENTILAÇÃO — ATIVAR SEQUÊNCIA</div>
            <div style={mono(10,C.dim)}>Ativar dutos funcionais em sequência. BLOQUEADOS: vermelho.</div>
            <AsciiRule />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginTop:'4px' }}>
              {DUCT_IDS.map(id => {
                const dmg   = DUCT_DMGD.includes(id);
                const on    = ductOn.includes(id);
                const err   = ductErr === id;
                const next  = DUCT_SEQ[ductStep] === id;
                return (
                  <button key={id} onClick={()=>tapDuct(id)} style={{
                    ...vt(22, dmg?C.red:err?C.red:on?C.bright:next?C.amber:C.dim),
                    background: on?C.ghost:dmg?'#1a0000':'transparent',
                    border:`2px solid ${dmg?C.red:err?C.red:on?C.bright:next?C.amber:C.dim}`,
                    padding:'14px', cursor:dmg?'not-allowed':'pointer', minHeight:'64px',
                    textShadow: on?glow(C.bright):err?glow(C.red):'none',
                    animation: err?'shake 0.3s':undefined,
                  }}>
                    {id}<br/>
                    <span style={mono(9,dmg?C.red:on?C.bright:C.dim)}>{dmg?'BLOQ':on?'ATIVO':'INATIVO'}</span>
                  </button>
                );
              })}
            </div>
            <div style={mono(10,C.dim,{marginTop:'4px'})}>PRÓXIMO: <span style={{color:C.amber}}>{DUCT_SEQ[ductStep] || '—'}</span></div>
          </div>
        )}

        {/* ── PHASE 3: GASES ── */}
        {phase === 'gases' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={mono(11,C.dim,{letterSpacing:'0.06em'})}>CALIBRAR GASES — MANTER 4s NA ZONA</div>
            <AsciiRule />
            {[
              { label:'O₂',  val:o2,  min:17, max:23, target:'19.5–21.0%', inZ:inO2Zone,  handler:handleO2, step:0.1 },
              { label:'CO₂', val:co2, min:0,  max:0.2, target:'0.030–0.050%', inZ:inCO2Zone, handler:v=>setCo2(Math.round(v*1000)/1000), step:0.001 },
            ].map(({ label, val, min, max, target, inZ, handler, step }) => (
              <div key={label} style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={vt(20,C.main)}>{label}</span>
                  <span style={{ ...vt(20,inZ?C.bright:C.amber), textShadow:inZ?glow(C.bright):'none' }}>
                    {val.toFixed(label==='O₂'?1:3)}% {inZ?'◆':'◇'}
                  </span>
                </div>
                <div style={mono(9,C.dim,{marginBottom:'2px'})}>ZONA: {target}</div>
                <input type="range" min={min} max={max} step={step} value={val}
                  onChange={e=>handler(+e.target.value)}
                  style={{ width:'100%', accentColor: inZ?C.bright:C.amber }}
                />
              </div>
            ))}
            {inO2Zone && inCO2Zone && (
              <div style={{ textAlign:'center' }}>
                <div style={{ ...vt(18,C.bright), textShadow:glow(C.bright) }}>◆ EM ZONA — MANTER {4-o2Hold}s</div>
                <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'4px' }}>
                  {[0,1,2,3].map(i=>(
                    <div key={i} style={{ width:'14px',height:'14px',borderRadius:'50%',
                      background:i<o2Hold?C.bright:C.ghost, boxShadow:i<o2Hold?`0 0 5px ${C.bright}`:'none' }}/>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 4: TEMPERATURE ── */}
        {phase === 'temp' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={mono(11,C.dim,{letterSpacing:'0.06em'})}>TEMPERATURA — ALVO: 18°C ±2°C</div>
            <AsciiRule />
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={vt(20,C.main)}>ATUAL:</span>
              <span style={{ ...vt(26, inTempZone?C.bright:C.amber), textShadow:inTempZone?glow(C.bright):'none' }}>
                {temp}°C {inTempZone?'◆':'◇'}
              </span>
            </div>
            <div style={{ position:'relative', height:'36px', background:'#001a08', border:`1px solid ${C.dim}` }}>
              <div style={{ position:'absolute', left:'53.3%', width:'13.3%', height:'100%', background:C.ghost }}/>
              <div style={{
                position:'absolute', top:'50%', transform:'translate(-50%,-50%)',
                left:`${((temp-5)/(35-5))*100}%`,
                width:'3px', height:'100%', background: inTempZone?C.bright:C.amber,
                boxShadow:`0 0 6px currentColor`,
              }}/>
              <div style={{ position:'absolute', bottom:'2px', left:'50%', transform:'translateX(-50%)', ...mono(8,C.dim) }}>16°──18°──20°</div>
            </div>
            <input type="range" min={5} max={35} value={temp}
              onChange={e=>{ setTemp(+e.target.value); setTempHold(0); }}
              style={{ width:'100%', accentColor:inTempZone?C.bright:C.amber }}
            />
            {inTempZone && (
              <div style={{ textAlign:'center' }}>
                <div style={{ ...vt(18,C.bright), textShadow:glow(C.bright) }}>◆ EM ZONA — MANTER {3-tempHold}s</div>
                <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'4px' }}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{ width:'14px',height:'14px',borderRadius:'50%',
                      background:i<tempHold?C.bright:C.ghost, boxShadow:i<tempHold?`0 0 5px ${C.bright}`:'none' }}/>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { MinigameLifeSupport });
