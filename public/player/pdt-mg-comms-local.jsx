// pdt-mg-comms-local.jsx — Minigame: Comms Local (chips + antenna + frequency)

const CHIP_SLOTS = [
  { id:'A', spec:'2.4GHz / 54Mbps'  },
  { id:'B', spec:'5GHz / 150Mbps'   },
  { id:'C', spec:'2.4GHz / 300Mbps' },
  { id:'D', spec:'900MHz / 11Mbps'  },
];

const CHIP_TRAY = [
  { id:0, spec:'5GHz / 150Mbps',   match:'B' },
  { id:1, spec:'2.4GHz / 54Mbps',  match:'A' },
  { id:2, spec:'2.4GHz / 300Mbps', match:'C' },
  { id:3, spec:'1.8GHz / 72Mbps',  match:null },
  { id:4, spec:'900MHz / 11Mbps',  match:'D' },
  { id:5, spec:'5GHz / 300Mbps',   match:null },
];

const CORRECT_FREQ = parseFloat(window.repairFrequency) || 847.3;

const MinigameCommsLocal = ({ onSuccess, onFailure }) => {
  const [phase,    setPhase]    = React.useState('chips'); // 'chips'|'antenna'|'freq'
  const [selChip,  setSelChip]  = React.useState(null);
  const [placed,   setPlaced]   = React.useState({ A:null, B:null, C:null, D:null });
  const [antAngle, setAntAngle] = React.useState(45);
  const [antHold,  setAntHold]  = React.useState(0);
  const [freq,     setFreq]     = React.useState(500);
  const [freqHold, setFreqHold] = React.useState(0);
  const [timer,    setTimer]    = React.useState(90);

  React.useEffect(() => {
    const iv = setInterval(() => setTimer(t => { if(t<=1){onFailure();return 0;}return t-1;}), 1000);
    return () => clearInterval(iv);
  }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // Antenna signal: peaks at 128°
  const ANT_TARGET = 128;
  const antSignal = Math.max(0, 100 - Math.abs(antAngle - ANT_TARGET) * 2.5);
  const antInZone = antSignal >= 80;

  // Antenna hold
  React.useEffect(() => {
    if (phase !== 'antenna') return;
    if (!antInZone) { setAntHold(0); return; }
    const iv = setInterval(() => setAntHold(h => { if(h>=2){clearInterval(iv);setPhase('freq');return 0;}return h+1; }), 1000);
    return () => clearInterval(iv);
  }, [phase, antInZone]);

  // Frequency hold
  React.useEffect(() => {
    if (phase !== 'freq') return;
    const inZone = Math.abs(freq - CORRECT_FREQ) <= 2;
    if (!inZone) { setFreqHold(0); return; }
    const iv = setInterval(() => setFreqHold(h => {
      if (h >= 2) { clearInterval(iv); setTimeout(onSuccess, 600); return 0; }
      return h + 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [phase, freq]);

  const tapSlot = (slotId) => {
    if (selChip === null) return;
    const chip = CHIP_TRAY[selChip];
    const next = { ...placed, [slotId]: chip };
    setPlaced(next);
    setSelChip(null);
  };

  const allChipsCorrect = CHIP_SLOTS.every(s => placed[s.id]?.match === s.id);
  const allChipsPlaced  = CHIP_SLOTS.every(s => placed[s.id] !== null);

  // Noise visual: random chars when far from freq
  const noise = Math.max(0, 1 - Math.abs(freq - CORRECT_FREQ) / 200);
  const noiseBar = (pct) => {
    const filled = Math.round(pct / 5);
    return '▓'.repeat(filled) + '░'.repeat(20 - filled);
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${C.dim}` }}>
        <div style={vt(20, C.main)}>COMMS LOCAL — FASE {phase==='chips'?'1':phase==='antenna'?'2':'3'}/3</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
          <span style={{ ...vt(17, timer<15?C.red:C.amber) }}>TIMER: {fmt(timer)}</span>
          <div style={{ display:'flex', gap:'6px' }}>
            {['CHIPS','ANTENA','FREQ'].map((l,i) => {
              const cur = phase==='chips'?0:phase==='antenna'?1:2;
              return <span key={l} style={mono(9, i<cur?C.bright:i===cur?C.main:C.ghost)}>{i<cur?'◆':i===cur?'▶':'◇'}</span>;
            })}
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', scrollbarWidth:'none' }}>

        {/* ── PHASE 1: CHIPS ── */}
        {phase === 'chips' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={mono(11,C.dim,{letterSpacing:'0.06em'})}>INSTALAR CHIPS — ESPECIFICAÇÃO CORRETA</div>
            <AsciiRule />
            {/* Slots */}
            {CHIP_SLOTS.map(slot => {
              const p = placed[slot.id];
              const correct = p?.match === slot.id;
              const wrong   = p && !correct;
              return (
                <div key={slot.id} onClick={()=>tapSlot(slot.id)}
                  style={{
                    border:`1px solid ${wrong?C.red:correct?C.bright:selChip!==null?C.amber:C.dim}`,
                    background: correct?C.ghost:wrong?'#1a0000':'transparent',
                    padding:'10px 12px', cursor:selChip!==null?'pointer':'default',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    minHeight:'52px',
                  }}>
                  <div>
                    <div style={mono(10,C.dim,{marginBottom:'2px'})}>SLOT {slot.id}</div>
                    <div style={vt(18,C.dim)}>{slot.spec}</div>
                  </div>
                  {p ? (
                    <div style={{ textAlign:'right' }}>
                      <div style={vt(16, correct?C.bright:C.red)}>{p.spec}</div>
                      <div style={mono(9, correct?C.bright:C.red)}>{correct?'◆ OK':'✗ ERRADO'}</div>
                    </div>
                  ) : (
                    <div style={vt(18,C.ghost)}>── VAZIO ──</div>
                  )}
                </div>
              );
            })}
            {/* Tray */}
            <div style={mono(10,C.dim,{marginTop:'6px'})}>CHIPS DISPONÍVEIS:</div>
            {CHIP_TRAY.map((chip,i) => {
              const used = Object.values(placed).some(p=>p?.id===chip.id);
              return (
                <button key={i} onClick={()=>!used&&setSelChip(selChip===i?null:i)} style={{
                  ...vt(17, selChip===i?C.bright:used?C.ghost:C.main),
                  background: selChip===i?C.ghost:'transparent',
                  border:`1px solid ${selChip===i?C.bright:used?C.ghost:C.dim}`,
                  padding:'8px 12px', cursor:used?'default':'pointer', minHeight:'44px',
                  textAlign:'left', opacity:used?0.35:1,
                }}>{chip.spec}</button>
              );
            })}
            {allChipsCorrect && (
              <PDTButton variant="bright" onClick={()=>setPhase('antenna')} fullWidth>[ CONFIRMAR CHIPS ]</PDTButton>
            )}
            {allChipsPlaced && !allChipsCorrect && (
              <div style={mono(10,C.amber)}>⚠ ALGUNS CHIPS INCORRETOS</div>
            )}
          </div>
        )}

        {/* ── PHASE 2: ANTENNA ── */}
        {phase === 'antenna' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={mono(11,C.dim,{letterSpacing:'0.06em'})}>ALINHAR ANTENA — SINAL ≥80%</div>
            <AsciiRule />
            {/* SVG antenna dial */}
            <div style={{ display:'flex', justifyContent:'center' }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke={C.dim} strokeWidth="1" opacity="0.4"/>
                <circle cx="100" cy="100" r="70" fill="none" stroke={C.dim} strokeWidth="1" opacity="0.3"/>
                {/* Signal point marker */}
                {(() => {
                  const a = (ANT_TARGET - 90) * Math.PI / 180;
                  return <circle cx={100+85*Math.cos(a)} cy={100+85*Math.sin(a)} r="6"
                    fill={C.bright} style={{ filter:`drop-shadow(0 0 4px ${C.bright})` }}/>;
                })()}
                {/* Antenna pointer */}
                {(() => {
                  const a = (antAngle - 90) * Math.PI / 180;
                  return <line x1="100" y1="100"
                    x2={100+82*Math.cos(a)} y2={100+82*Math.sin(a)}
                    stroke={antInZone?C.bright:C.main} strokeWidth="2"
                    style={{ filter: antInZone?`drop-shadow(0 0 4px ${C.bright})`:'none' }}/>;
                })()}
                <circle cx="100" cy="100" r="6" fill={C.main}/>
                <text x="100" y="20" fill={C.dim} fontSize="10" textAnchor="middle" fontFamily="Share Tech Mono">N</text>
                <text x="185" y="105" fill={C.dim} fontSize="10" textAnchor="middle" fontFamily="Share Tech Mono">E</text>
                <text x="100" y="196" fill={C.dim} fontSize="10" textAnchor="middle" fontFamily="Share Tech Mono">S</text>
                <text x="15" y="105" fill={C.dim} fontSize="10" textAnchor="middle" fontFamily="Share Tech Mono">O</text>
              </svg>
            </div>
            <input type="range" min="0" max="360" value={antAngle}
              onChange={e=>{ setAntAngle(+e.target.value); setAntHold(0); }}
              style={{ width:'100%', accentColor:antInZone?C.bright:C.main }}
            />
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={mono(10,C.dim)}>ÂNGULO: {antAngle}°</span>
              <span style={{ ...vt(18, antInZone?C.bright:C.main), textShadow:antInZone?glow(C.bright):'none' }}>
                SINAL: {Math.round(antSignal)}% {antInZone?'◆':'◇'}
              </span>
            </div>
            {antInZone && (
              <div style={{ textAlign:'center', ...vt(18,C.bright), textShadow:glow(C.bright) }}>
                ◆ SINAL BLOQUEADO — MANTER {2-antHold}s
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 3: FREQUENCY ── */}
        {phase === 'freq' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={mono(11,C.dim,{letterSpacing:'0.06em'})}>SINTONIZAR FREQUÊNCIA</div>
            <AsciiRule />
            {/* Noise display */}
            <div style={{
              fontFamily:"'Share Tech Mono', monospace", fontSize:'12px',
              color: noise > 0.9 ? C.bright : noise > 0.5 ? C.main : C.dim,
              background:'#000a04', padding:'12px', border:`1px solid ${C.dim}`,
              overflow:'hidden', height:'60px', lineHeight:1.4,
              textShadow: noise>0.9?glow(C.bright):'none',
            }}>
              {noise > 0.9 ? (
                <div>◆ SINAL LIMPO<br/>MERIDIAN COMMS ACTIVE</div>
              ) : (
                <div style={{ opacity:0.5+noise*0.5 }}>
                  {noiseBar(noise*100)}<br/>
                  {noise > 0.4 ? 'SIGNAL DETECTED...' : '░▓▒█▓░▒ NOISE ▓▒░█▒▓░'}
                </div>
              )}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={mono(10,C.dim)}>FREQ:</span>
              <span style={{ ...vt(22, noise>0.9?C.bright:C.main), textShadow:noise>0.9?glow(C.bright):'none' }}>
                {freq.toFixed(1)} MHz
              </span>
            </div>
            <input type="range" min="400" max="1200" step="0.1" value={freq}
              onChange={e=>{ setFreq(+e.target.value); setFreqHold(0); }}
              style={{ width:'100%', accentColor:noise>0.9?C.bright:C.main }}
            />
            {noise > 0.9 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ ...vt(18,C.bright), textShadow:glow(C.bright) }}>
                  ◆ FREQUÊNCIA TRAVADA — MANTER {2-freqHold}s
                </div>
                <div style={{ ...mono(12,C.amber), marginTop:'8px', letterSpacing:'0.05em' }}>
                  FREQUÊNCIA DEFINIDA: {freq.toFixed(1)} MHz
                </div>
                <div style={mono(10,C.dim,{marginTop:'4px'})}>
                  Guarde este valor. Outros membros precisarão dele.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { MinigameCommsLocal });
