// pdt-mg-reactor.jsx — Minigame: Reactor Stabilization (Genius sequence + 4 simultaneous gauges)

const REACTOR_BTNS = [
  { id:'INJECT', color: C?.bright  || '#00ff66', pos:{top:0,   left:'50%', transform:'translateX(-50%)'} },
  { id:'VENT',   color: C?.cyan    || '#00ddff', pos:{top:'50%', right:0,  transform:'translateY(-50%)'} },
  { id:'COOL',   color: C?.amber   || '#ffaa00', pos:{bottom:0,left:'50%', transform:'translateX(-50%)'} },
  { id:'CYCLE',  color: C?.wyBright|| '#4488ff', pos:{top:'50%', left:0,  transform:'translateY(-50%)'} },
  { id:'FLUSH',  color: C?.mid     || '#00993d', pos:{top:'50%', left:'50%',transform:'translate(-50%,-50%)'} },
];

// Gauge: green zone defined as [min, max] within 0-100 range
const GAUGE_DEFS = [
  { id:'PRESSURE', label:'PRESSÃO',   target:65, zone:[55,75],  color:'#00ff66' },
  { id:'TEMP',     label:'TEMP',      target:42, zone:[36,48],  color:'#ffaa00' },
  { id:'PLASMA',   label:'PLASMA',    target:78, zone:[70,86],  color:'#00ddff' },
  { id:'FLUX',     label:'FLUX',      target:33, zone:[27,39],  color:'#4488ff' },
];

const genSeq = (len) => Array.from({length:len},()=>REACTOR_BTNS[Math.floor(Math.random()*REACTOR_BTNS.length)].id);

const MinigameReactor = ({ onSuccess, onFailure, difficultyLevel = 1 }) => {
  const [phase,      setPhase]      = React.useState('genius');
  const [round,      setRound]      = React.useState(0);           // sequence length = 4 + round
  const [sequence,   setSequence]   = React.useState([]);
  const [showing,    setShowing]    = React.useState(-1);          // index currently lit
  const [playerSeq,  setPlayerSeq]  = React.useState([]);
  const [litBtn,     setLitBtn]     = React.useState(null);
  const [errFlash,   setErrFlash]   = React.useState(false);
  const [attempts,   setAttempts]   = React.useState(0);
  const [gauges,     setGauges]     = React.useState([65,42,78,33]); // starting at target
  const [holdTime,   setHoldTime]   = React.useState(0);
  const [timer,      setTimer]      = React.useState(90);

  React.useEffect(() => {
    const iv = setInterval(() => setTimer(t => { if(t<=1){onFailure();return 0;}return t-1;}), 1000);
    return () => clearInterval(iv);
  }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ── Start / show sequence ─────────────────────────
  const startRound = React.useCallback((r, seq) => {
    setPlayerSeq([]);
    setShowing(-2); // "watch" state
    let idx = 0;
    const showNext = () => {
      if (idx >= seq.length) { setShowing(-1); return; }
      setLitBtn(seq[idx]);
      setShowing(idx);
      setTimeout(() => { setLitBtn(null); idx++; setTimeout(showNext, 300); }, 600);
    };
    setTimeout(showNext, 500);
  }, []);

  React.useEffect(() => {
    if (phase !== 'genius') return;
    const seq = genSeq(4 + round);
    setSequence(seq);
    startRound(round, seq);
  }, [phase, round]);

  const handleBtnPress = (id) => {
    if (showing !== -1) return; // return if still showing sequence
    const next = [...playerSeq, id];
    setLitBtn(id);
    setTimeout(() => setLitBtn(null), 200);

    if (id !== sequence[playerSeq.length]) {
      // error
      const a = attempts + 1;
      setAttempts(a);
      setErrFlash(true);
      setPlayerSeq([]);
      setTimeout(() => { setErrFlash(false); if(a>=3) onFailure(); else startRound(round, sequence); }, 700);
      return;
    }

    setPlayerSeq(next);
    if (next.length >= sequence.length) {
      // round complete
      const maxRounds = difficultyLevel === 3 ? 1 : (difficultyLevel === 2 ? 2 : 3);
      if (round >= maxRounds - 1) { 
        setTimeout(() => { setPhase('gauges'); }, 600);
      } else {
        setTimeout(() => setRound(r => r + 1), 600);
      }
    }
  };

  // ── Gauges hold check ─────────────────────────────
  const allInZone = GAUGE_DEFS.every((g,i) => gauges[i] >= g.zone[0] && gauges[i] <= g.zone[1]);

  React.useEffect(() => {
    if (phase !== 'gauges') return;
    if (!allInZone) { setHoldTime(0); return; }
    const iv = setInterval(() => setHoldTime(h => {
      if (h >= 5) { clearInterval(iv); setTimeout(onSuccess, 600); return 0; }
      return h + 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [phase, allInZone, gauges]);

  // Gauge change: adjacent gauges affected ±5%
  const setGauge = (i, v) => {
    setGauges(prev => {
      const next = [...prev];
      next[i] = Math.round(Math.max(0, Math.min(100, v)));
      const delta = next[i] - prev[i];
      // affect left and right neighbours
      if (i > 0) next[i-1] = Math.round(Math.max(0,Math.min(100, next[i-1] + delta * 0.05)));
      if (i < 3) next[i+1] = Math.round(Math.max(0,Math.min(100, next[i+1] + delta * 0.05)));
      return next;
    });
    setHoldTime(0);
  };

  // SVG gauge arc helper
  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const toRad = a => (a - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`;
  };

  const GaugeWidget = ({ def, value, onChange }) => {
    const inZ   = value >= def.zone[0] && value <= def.zone[1];
    const angle = -135 + (value / 100) * 270;
    const zStart= -135 + (def.zone[0]/100)*270;
    const zEnd  = -135 + (def.zone[1]/100)*270;
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          {/* Track */}
          <path d={describeArc(40,40,30,-135,135)} fill="none" stroke={C.ghost} strokeWidth="6" strokeLinecap="round"/>
          {/* Zone */}
          <path d={describeArc(40,40,30,zStart,zEnd)} fill="none" stroke={def.color} strokeWidth="6" strokeLinecap="round" opacity="0.35"/>
          {/* Value */}
          <path d={describeArc(40,40,30,-135,angle)} fill="none"
            stroke={inZ?def.color:C.amber} strokeWidth="6" strokeLinecap="round"
            style={{ filter: inZ?`drop-shadow(0 0 4px ${def.color})`:'none' }}/>
          {/* Pointer dot */}
          {(() => {
            const rad = (angle - 90) * Math.PI / 180;
            return <circle cx={40+30*Math.cos(rad)} cy={40+30*Math.sin(rad)} r="4"
              fill={inZ?def.color:C.amber} style={{ filter: inZ?`drop-shadow(0 0 4px ${def.color})`:'none' }}/>;
          })()}
          <text x="40" y="46" fill={inZ?def.color:C.amber} fontSize="11" textAnchor="middle"
            fontFamily="Share Tech Mono" style={{ filter:inZ?`drop-shadow(0 0 4px ${def.color})`:'none' }}>
            {value}
          </text>
        </svg>
        <div style={mono(9, inZ?def.color:C.dim, { textAlign:'center', letterSpacing:'0.04em' })}>
          {def.label}<br/>{inZ?'◆':'◇'}
        </div>
        <input type="range" min="0" max="100" value={value}
          onChange={e=>onChange(+e.target.value)}
          style={{ width:'70px', accentColor: inZ?def.color:C.amber }}
        />
      </div>
    );
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${C.dim}` }}>
        <div style={vt(20, C.main)}>REACTOR — {phase==='genius'?`SEQUÊNCIA ${round+1}/3`:'ESTABILIZAÇÃO'}</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
          <span style={{ ...vt(17, timer<15?C.red:C.amber) }}>TIMER: {fmt(timer)}</span>
          <span style={vt(17, C.dim)}>TENTATIVAS: {attempts}/3</span>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'10px 14px', gap:'10px', overflowY:'auto', scrollbarWidth:'none' }}>

        {/* ── PHASE 1: GENIUS ── */}
        {phase === 'genius' && (
          <>
            <div style={mono(10,C.dim,{letterSpacing:'0.05em'})}>
              {showing === -2 ? 'OBSERVE A SEQUÊNCIA...' : showing === -1 ? 'REPRODUZA A SEQUÊNCIA:' : ''}
            </div>
            {/* Progress indicators */}
            <div style={{ display:'flex', gap:'6px', height:'16px', alignItems:'center' }}>
              {sequence.map((id, i) => {
                const isCurrent = i === playerSeq.length;
                const isPast = i < playerSeq.length;
                
                // Difficulty rules for history
                let showHint = false;
                if (difficultyLevel === 0) showHint = false; // Never show
                else if (difficultyLevel === 1) showHint = isPast; // Show all past
                else if (difficultyLevel === 2) showHint = (i === playerSeq.length - 1); // Only last one
                else if (difficultyLevel === 3) showHint = (i >= playerSeq.length - 2 && i < playerSeq.length); // Last two
                
                return (
                  <div key={i} style={{ 
                    flex:1, height:isCurrent?'12px':'8px',
                    background: isPast ? C.bright : (isCurrent ? C.dim : C.ghost),
                    boxShadow: isPast ? `0 0 4px ${C.bright}` : 'none',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    border: isCurrent ? `1px solid ${C.bright}` : 'none',
                    transition: 'all 0.2s'
                  }}>
                    {showHint && <span style={{ fontSize:'9px', color:C.black, fontWeight:'bold' }}>{id[0]}</span>}
                  </div>
                );
              })}
            </div>
            {/* 5-button layout */}
            <div style={{ position:'relative', height:'220px', margin:'0 auto', width:'220px' }}>
              {REACTOR_BTNS.map(btn => {
                const lit   = litBtn === btn.id;
                const err   = errFlash;
                return (
                  <button key={btn.id}
                    onClick={() => handleBtnPress(btn.id)}
                    style={{
                      position:'absolute', ...btn.pos,
                      width:'72px', height:'72px',
                      background: lit?(err?'#3a0000':C.ghost):'transparent',
                      border:`2px solid ${lit?(err?C.red:btn.color):C.dim}`,
                      color: lit?(err?C.red:btn.color):C.dim,
                      fontFamily:"'Share Tech Mono', monospace",
                      fontSize:'10px', letterSpacing:'0.04em',
                      cursor: showing===-1?'pointer':'default',
                      textShadow: lit&&!err?`0 0 8px ${btn.color}`:'none',
                      boxShadow: lit&&!err?`0 0 12px ${btn.color}44`:'none',
                      animation: err&&lit?'shake 0.3s':undefined,
                      transition:'background 0.1s, border-color 0.1s',
                    }}>
                    {btn.id}
                  </button>
                );
              })}
            </div>
            {errFlash && <div style={{ ...vt(18,C.red), textShadow:glow(C.red), textAlign:'center' }}>◇ SEQUÊNCIA INCORRETA</div>}
          </>
        )}

        {/* ── PHASE 2: GAUGES ── */}
        {phase === 'gauges' && (
          <>
            <div style={mono(10,C.dim,{letterSpacing:'0.05em'})}>
              MANTER TODOS OS 4 GAUGES NA ZONA VERDE — {5-holdTime}s
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', justifyItems:'center' }}>
              {GAUGE_DEFS.map((def,i)=>(
                <GaugeWidget key={def.id} def={def} value={gauges[i]} onChange={v=>setGauge(i,v)} />
              ))}
            </div>
            {allInZone && (
              <div style={{ textAlign:'center' }}>
                <div style={{ ...vt(18,C.bright), textShadow:glow(C.bright) }}>
                  ◆ TODOS EM ZONA — MANTER {5-holdTime}s
                </div>
                <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'6px' }}>
                  {[0,1,2,3,4].map(i=>(
                    <div key={i} style={{ width:'12px',height:'12px',borderRadius:'50%',
                      background:i<holdTime?C.bright:C.ghost,boxShadow:i<holdTime?`0 0 4px ${C.bright}`:'none' }}/>
                  ))}
                </div>
              </div>
            )}
            {!allInZone && (
              <div style={mono(10,C.amber,{textAlign:'center'})}>
                {GAUGE_DEFS.filter((_,i)=>gauges[i]<GAUGE_DEFS[i].zone[0]||gauges[i]>GAUGE_DEFS[i].zone[1])
                  .map(g=>g.label).join(', ')} FORA DA ZONA
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { MinigameReactor });
