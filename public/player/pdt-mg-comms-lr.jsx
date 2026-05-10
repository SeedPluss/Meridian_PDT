// pdt-mg-comms-lr.jsx — Minigame: Comms Long Range (star map + dual dials + signal)

// Target sector coordinates (from Singh's documents)
const TARGET_SECTOR = { x: 240, y: 160, label: 'SECTOR 7-ALPHA', id: 'S7A' };
const SECTORS = [
  { x:80,  y:80,  label:'SECTOR 2-DELTA', id:'S2D' },
  { x:240, y:160, label:'SECTOR 7-ALPHA', id:'S7A' }, // correct
  { x:160, y:240, label:'SECTOR 4-ECHO',  id:'S4E' },
  { x:310, y:90,  label:'SECTOR 9-BRAVO', id:'S9B' },
  { x:50,  y:200, label:'SECTOR 1-FOXT.', id:'S1F' },
  { x:200, y:310, label:'SECTOR 6-KILO',  id:'S6K' },
];

const STARS = Array.from({length:120},(_,i)=>({
  x: (i * 137 + 50) % 400,
  y: (i * 97  + 30) % 400,
  r: i%7===0 ? 2 : i%3===0 ? 1.5 : 1,
  op: 0.3 + (i%5)*0.14,
}));

const FREQ_TARGET  = 642;  // MHz
const WAVE_TARGET  = 21.1; // cm

const MinigameCommsLR = ({ onSuccess, onFailure }) => {
  const [phase,     setPhase]     = React.useState('map');
  const [offset,    setOffset]    = React.useState({ x:0, y:0 });
  const [dragging,  setDragging]  = React.useState(null);
  const [selSector, setSelSector] = React.useState(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const [freq,      setFreq]      = React.useState(400);
  const [wave,      setWave]      = React.useState(10);
  const [dialHold,  setDialHold]  = React.useState(0);
  const [antAngle,  setAntAngle]  = React.useState(30);
  const [sigHold,   setSigHold]   = React.useState(0);
  const [timer,     setTimer]     = React.useState(90);
  const mapRef = React.useRef(null);

  React.useEffect(() => {
    const iv = setInterval(() => setTimer(t => { if(t<=1){onFailure();return 0;}return t-1;}), 1000);
    return () => clearInterval(iv);
  }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ── Map pan ───────────────────────────────────────
  const onPointerDown = (e) => {
    setDragging({ sx:e.clientX, sy:e.clientY, ox:offset.x, oy:offset.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    setOffset({ x: dragging.ox+(e.clientX-dragging.sx), y: dragging.oy+(e.clientY-dragging.sy) });
  };
  const onPointerUp = () => setDragging(null);

  const tapSector = (e, sec) => {
    e.stopPropagation();
    setSelSector(sec.id);
  };

  // ── Dial hold ─────────────────────────────────────
  const freqOk = Math.abs(freq - FREQ_TARGET) <= 5;
  const waveOk = Math.abs(wave - WAVE_TARGET) <= 0.5;
  const bothOk = freqOk && waveOk;

  React.useEffect(() => {
    if (phase !== 'dials') return;
    if (!bothOk) { setDialHold(0); return; }
    const iv = setInterval(() => setDialHold(h => {
      if (h>=2){ clearInterval(iv); setPhase('signal'); return 0; }
      return h+1;
    }), 1000);
    return () => clearInterval(iv);
  }, [phase, bothOk]);

  // ── Signal hold ───────────────────────────────────
  // Signal peaks at antenna angle 72°
  const ANT_TARGET = 72;
  const signal = Math.max(0, 100 - Math.abs(antAngle - ANT_TARGET) * 1.8);
  const sigOk  = signal >= 80;

  React.useEffect(() => {
    if (phase !== 'signal') return;
    if (!sigOk) { setSigHold(0); return; }
    const iv = setInterval(() => setSigHold(h => {
      if (h>=4){ clearInterval(iv); setTimeout(onSuccess,600); return 0; }
      return h+1;
    }), 1000);
    return () => clearInterval(iv);
  }, [phase, sigOk]);

  // Interference noise bar
  const noiseStr = (val, target, range) => {
    const proximity = Math.max(0, 1 - Math.abs(val-target)/range);
    return '▓'.repeat(Math.round(proximity*8)) + '░'.repeat(8-Math.round(proximity*8));
  };

  const phaseNum = { map:1, dials:2, signal:3 }[phase];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${C.dim}` }}>
        <div style={vt(20, C.main)}>COMMS LONGA DIST. — FASE {phaseNum}/3</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
          <span style={{ ...vt(17,timer<15?C.red:C.amber) }}>TIMER: {fmt(timer)}</span>
          <div style={{ display:'flex',gap:'6px' }}>
            {['MAPA','DIALS','SINAL'].map((l,i)=>(
              <span key={l} style={mono(9,phaseNum>i+1?C.bright:phaseNum===i+1?C.main:C.ghost)}>
                {phaseNum>i+1?'◆':phaseNum===i+1?'▶':'◇'}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── PHASE 1: STAR MAP ── */}
        {phase === 'map' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 14px', gap:'8px' }}>
            <div style={mono(10,C.dim)}>Arraste o mapa. Documentos de Singh indicam o setor correto.</div>
            {/* Map viewport */}
            <div ref={mapRef}
              style={{ flex:1, overflow:'hidden', border:`1px solid ${C.dim}`, position:'relative', cursor:'grab', background:'#000208' }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
              <svg width="400" height="400" viewBox="0 0 400 400"
                style={{ position:'absolute', left:offset.x, top:offset.y, minWidth:'400px', minHeight:'400px' }}>
                {/* Stars */}
                {STARS.map((s,i)=>(
                  <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.op}/>
                ))}
                {/* Grid lines */}
                {[100,200,300].map(v=>(
                  <React.Fragment key={v}>
                    <line x1={v} y1={0} x2={v} y2={400} stroke={C.dim} strokeWidth="0.5" opacity="0.2"/>
                    <line x1={0} y1={v} x2={400} y2={v} stroke={C.dim} strokeWidth="0.5" opacity="0.2"/>
                  </React.Fragment>
                ))}
                {/* Sectors */}
                {SECTORS.map(sec=>{
                  const sel = selSector === sec.id;
                  const correct = sec.id === TARGET_SECTOR.id;
                  return (
                    <g key={sec.id} onClick={e=>tapSector(e,sec)} style={{ cursor:'pointer' }}>
                      <circle cx={sec.x} cy={sec.y} r={sel?22:16}
                        fill={sel?C.ghost:'transparent'}
                        stroke={sel?(correct?C.bright:C.amber):C.dim} strokeWidth={sel?2:1}
                        style={{ filter:sel&&correct?`drop-shadow(0 0 6px ${C.bright})`:'none' }}
                      />
                      <text x={sec.x} y={sec.y+1} fill={sel?(correct?C.bright:C.amber):C.dim}
                        fontSize="9" textAnchor="middle" dominantBaseline="middle"
                        fontFamily="Share Tech Mono">{sec.id}</text>
                      {sel && (
                        <text x={sec.x} y={sec.y+28} fill={sel&&correct?C.bright:C.amber}
                          fontSize="8" textAnchor="middle" fontFamily="Share Tech Mono">
                          {sec.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              {/* Crosshair overlay */}
              <div style={{ position:'absolute', inset:0, display:'flex',alignItems:'center',justifyContent:'center',
                pointerEvents:'none', opacity:0.15 }}>
                <div style={{ width:'1px', height:'100%', background:C.dim, position:'absolute' }}/>
                <div style={{ width:'100%', height:'1px', background:C.dim, position:'absolute' }}/>
              </div>
            </div>
            {selSector && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={vt(18, selSector===TARGET_SECTOR.id?C.bright:C.amber)}>
                  {SECTORS.find(s=>s.id===selSector)?.label}
                </span>
                <PDTButton variant={selSector===TARGET_SECTOR.id?'bright':'amber'}
                  onClick={()=>{ if(selSector===TARGET_SECTOR.id) setPhase('dials'); }}
                  style={{padding:'8px 14px',fontSize:'16px'}}>
                  {selSector===TARGET_SECTOR.id?'[ CONFIRMAR ]':'[ SETOR INCORRETO ]'}
                </PDTButton>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 2: DUAL DIALS ── */}
        {phase === 'dials' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'12px 14px', gap:'14px', overflowY:'auto', scrollbarWidth:'none' }}>
            <div style={mono(10,C.dim)}>Calibrar frequência E comprimento de onda simultaneamente.</div>
            <AsciiRule />
            {[
              { label:'FREQUÊNCIA', val:freq, min:200, max:1000, step:1, target:FREQ_TARGET, unit:'MHz', ok:freqOk, setter:setFreq },
              { label:'COMPRIMENTO DE ONDA', val:wave, min:5, max:40, step:0.1, target:WAVE_TARGET, unit:'cm', ok:waveOk, setter:setWave },
            ].map(d=>(
              <div key={d.label} style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={vt(18,C.main)}>{d.label}</span>
                  <span style={{ ...vt(20,d.ok?C.bright:C.main), textShadow:d.ok?glow(C.bright):'none' }}>
                    {d.val.toFixed(d.step<1?1:0)} {d.unit} {d.ok?'◆':'◇'}
                  </span>
                </div>
                {/* Noise indicator */}
                <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:'12px',
                  color:d.ok?C.bright:C.dim, letterSpacing:'0.02em',
                  textShadow:d.ok?glow(C.bright):'none' }}>
                  {noiseStr(d.val,d.target,d.label==='FREQUÊNCIA'?200:10)} {d.ok?'SINAL DETECTADO':'INTERFERÊNCIA'}
                </div>
                <input type="range" min={d.min} max={d.max} step={d.step} value={d.val}
                  onChange={e=>{ d.setter(+e.target.value); setDialHold(0); }}
                  style={{ width:'100%', accentColor:d.ok?C.bright:C.main }}
                />
              </div>
            ))}
            {bothOk && (
              <div style={{ textAlign:'center' }}>
                <div style={{ ...vt(18,C.bright), textShadow:glow(C.bright) }}>
                  ◆ CALIBRADO — MANTER {2-dialHold}s
                </div>
                <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'4px' }}>
                  {[0,1].map(i=><div key={i} style={{ width:'12px',height:'12px',borderRadius:'50%',
                    background:i<dialHold?C.bright:C.ghost,boxShadow:i<dialHold?`0 0 4px ${C.bright}`:'none' }}/>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 3: SIGNAL STRENGTH ── */}
        {phase === 'signal' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'12px 14px', gap:'14px' }}>
            <div style={mono(10,C.dim)}>Ajustar ângulo da antena. Manter sinal acima de 80% por 4s.</div>
            <AsciiRule />
            {/* Signal meter */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <span style={vt(18,C.main)}>SINAL:</span>
                <span style={{ ...vt(22,sigOk?C.bright:signal>40?C.amber:C.red),
                  textShadow:sigOk?glow(C.bright):'none' }}>
                  {Math.round(signal)}% {sigOk?'◆':'◇'}
                </span>
              </div>
              <div style={{ height:'28px', background:'#001a08', border:`1px solid ${C.dim}`, position:'relative' }}>
                <div style={{ position:'absolute', left:'80%', width:'20%', height:'100%', background:C.ghost, opacity:0.4 }}/>
                <div style={{ height:'100%', width:`${signal}%`, background:sigOk?C.bright:signal>40?C.amber:C.red,
                  transition:'width 0.15s', opacity:0.8,
                  boxShadow:sigOk?`0 0 8px ${C.bright}`:'none' }}/>
              </div>
            </div>
            {/* Antenna angle */}
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={vt(18,C.main)}>ÂNGULO:</span>
              <span style={vt(18,C.main)}>{antAngle}°</span>
            </div>
            <input type="range" min="0" max="180" value={antAngle}
              onChange={e=>{ setAntAngle(+e.target.value); setSigHold(0); }}
              style={{ width:'100%', accentColor:sigOk?C.bright:C.amber }}
            />
            {sigOk && (
              <div style={{ textAlign:'center' }}>
                <div style={{ ...vt(18,C.bright), textShadow:glow(C.bright) }}>
                  ◆ SINAL BLOQUEADO — {4-sigHold}s
                </div>
                <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'4px' }}>
                  {[0,1,2,3].map(i=><div key={i} style={{ width:'12px',height:'12px',borderRadius:'50%',
                    background:i<sigHold?C.bright:C.ghost,boxShadow:i<sigHold?`0 0 4px ${C.bright}`:'none' }}/>)}
                </div>
                {sigHold>=2&&(
                  <div style={{ ...mono(11,C.amber), marginTop:'10px' }}>
                    ◆ TRANSMISSÃO W-Y RECEBIDA<br/>
                    <span style={{ fontSize:'10px', opacity:0.8 }}>DOC-WY06 desbloqueado na aba DOCS</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { MinigameCommsLR });
