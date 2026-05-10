// pdt-mg-lighting.jsx — Minigame: Lighting (3 decks × cable + fuse + voltage)

const DECKS = [
  { id:'A', label:'DECK A', pairs:4, fuse: 15, voltTarget:220 },
  { id:'B', label:'DECK B', pairs:5, fuse: 20, voltTarget:230 },
  { id:'C', label:'DECK C — DANIFICADO', pairs:6, fuse: 25, voltTarget:220 },
];

const FUSE_OPTIONS = [10, 15, 20, 25, 30];

const MinigameLighting = ({ onSuccess, onFailure }) => {
  const [deckIdx,  setDeckIdx]  = React.useState(0);
  const [phase,    setPhase]    = React.useState('cables'); // 'cables'|'fuse'|'voltage'
  const [selected, setSelected] = React.useState(null);    // selected cable endpoint
  const [connected,setConnected]= React.useState({});      // { 'A0': 'B0', ... }
  const [fuse,     setFuse]     = React.useState(null);
  const [voltage,  setVoltage]  = React.useState(180);
  const [voltHold, setVoltHold] = React.useState(0);
  const [timer,    setTimer]    = React.useState(90);
  const [completed,setCompleted]= React.useState([]);       // finished deck IDs

  const deck = DECKS[deckIdx];
  const fmt  = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  React.useEffect(() => {
    const iv = setInterval(() => setTimer(t => { if(t<=1){onFailure();return 0;} return t-1;}), 1000);
    return () => clearInterval(iv);
  }, []);

  // Voltage hold timer
  React.useEffect(() => {
    if (phase !== 'voltage') return;
    const inZone = Math.abs(voltage - deck.voltTarget) <= 10;
    if (!inZone) { setVoltHold(0); return; }
    const iv = setInterval(() => {
      setVoltHold(h => {
        if (h >= 3) {
          clearInterval(iv);
          advanceDeck();
          return 0;
        }
        return h + 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, voltage, deck]);

  const advanceDeck = () => {
    const newCompleted = [...completed, deck.id];
    setCompleted(newCompleted);
    if (deckIdx < DECKS.length - 1) {
      setDeckIdx(deckIdx + 1);
      setPhase('cables');
      setSelected(null);
      setConnected({});
      setFuse(null);
      setVoltage(180);
    } else {
      setTimeout(onSuccess, 600);
    }
  };

  // ── Cable phase ────────────────────────────────────
  const pairCount = deck.pairs;
  // Left terminals: A0..An  Right terminals: B0..Bn (shuffled target)
  // Correct: Ax → Bx
  const handleTap = (side, idx) => {
    const key = `${side}${idx}`;
    if (selected === null) { setSelected(key); return; }
    if (selected === key)  { setSelected(null); return; }
    const selSide = selected[0];
    if (selSide === side)  { setSelected(key); return; }
    // connect
    const fromKey = selSide === 'A' ? selected : key;
    const toKey   = selSide === 'A' ? key : selected;
    setConnected(c => ({ ...c, [fromKey]: toKey }));
    setSelected(null);
  };

  const allCablesConnected = Object.keys(connected).length >= pairCount;
  const allCorrect = Object.entries(connected).every(([a,b]) => a.slice(1) === b.slice(1));

  // Shuffled right-side indices for visual variety
  const rightOrder = React.useMemo(() => {
    const arr = Array.from({length: pairCount}, (_,i)=>i);
    // deterministic shuffle based on deckIdx
    for (let i=arr.length-1;i>0;i--){const j=(i*7+deckIdx*3)%arr.length;[arr[i],arr[j]]=[arr[j],arr[i]];}
    return arr;
  }, [deckIdx, pairCount]);

  const getConnectedRight = (leftIdx) => {
    const v = connected[`A${leftIdx}`];
    return v ? parseInt(v.slice(1)) : null;
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${C.dim}` }}>
        <div style={vt(20, C.main)}>LIGHTING — {deck.label}</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
          <span style={{ ...vt(17, timer<15?C.red:C.amber) }}>TIMER: {fmt(timer)}</span>
          <div style={{ display:'flex', gap:'8px' }}>
            {DECKS.map(d => (
              <span key={d.id} style={mono(10, completed.includes(d.id) ? C.bright : d.id===deck.id ? C.main : C.ghost)}>
                {d.id}{completed.includes(d.id)?'◆':'◇'}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', scrollbarWidth:'none' }}>

        {/* ── CABLES ── */}
        {phase === 'cables' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={mono(11, C.dim, { letterSpacing:'0.06em' })}>CONECTAR TERMINAIS — PAR A → B</div>
            <AsciiRule />
            <div style={{ display:'flex', gap:'0', justifyContent:'space-between', marginTop:'4px' }}>
              {/* Left column */}
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', width:'44%' }}>
                {Array.from({length:pairCount},(_,i)=>(
                  <button key={i} onClick={()=>handleTap('A',i)} style={{
                    ...vt(20, selected===`A${i}` ? C.bright : getConnectedRight(i)!==null ? C.mid : C.main),
                    background: selected===`A${i}` ? C.ghost : 'transparent',
                    border:`1px solid ${selected===`A${i}` ? C.bright : getConnectedRight(i)!==null ? C.mid : C.dim}`,
                    padding:'10px 12px', cursor:'pointer', minHeight:'48px', textAlign:'left',
                    textShadow: selected===`A${i}` ? glow(C.bright) : 'none',
                    whiteSpace:'nowrap',
                  }}>
                    A{i+1} {getConnectedRight(i)!==null ? '──→' : '──○'}
                  </button>
                ))}
              </div>
              {/* Right column */}
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', width:'44%' }}>
                {rightOrder.map((ri,i)=>{
                  const isTarget = Object.values(connected).includes(`B${ri}`);
                  return (
                    <button key={ri} onClick={()=>handleTap('B',ri)} style={{
                      ...vt(20, selected===`B${ri}` ? C.bright : isTarget ? C.mid : C.main),
                      background: selected===`B${ri}` ? C.ghost : 'transparent',
                      border:`1px solid ${selected===`B${ri}` ? C.bright : isTarget ? C.mid : C.dim}`,
                      padding:'10px 12px', cursor:'pointer', minHeight:'48px', textAlign:'right',
                      whiteSpace:'nowrap',
                    }}>
                      {isTarget ? '←──' : '○──'} B{ri+1}
                    </button>
                  );
                })}
              </div>
            </div>
            {allCablesConnected && (
              <PDTButton variant={allCorrect ? 'bright' : 'amber'}
                onClick={() => allCorrect ? setPhase('fuse') : setConnected({})}
                fullWidth style={{ marginTop:'8px' }}>
                {allCorrect ? '[ CONFIRMAR CONEXÕES ]' : '[ REFAZER — CABO ERRADO ]'}
              </PDTButton>
            )}
          </div>
        )}

        {/* ── FUSE ── */}
        {phase === 'fuse' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={mono(11, C.dim, { letterSpacing:'0.06em' })}>SELECIONAR FUSÍVEL CORRETO</div>
            <div style={mono(10, C.dim)}>Manual de Kowalski indica amperagem necessária.</div>
            <AsciiRule />
            <div style={{ ...vt(20, C.main), marginTop:'4px' }}>SLOT: {deck.fuse}A NECESSÁRIO</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'8px' }}>
              {FUSE_OPTIONS.map(f => (
                <button key={f} onClick={() => {
                  setFuse(f);
                  if (f === deck.fuse) setTimeout(() => setPhase('voltage'), 400);
                  else { setTimeout(() => setFuse(null), 500); }
                }} style={{
                  ...vt(22, fuse===f ? (f===deck.fuse?C.bright:C.red) : C.main),
                  background: fuse===f ? (f===deck.fuse?C.ghost:'#1a0000') : 'transparent',
                  border:`1px solid ${fuse===f ? (f===deck.fuse?C.bright:C.red) : C.dim}`,
                  padding:'12px 16px', cursor:'pointer', minHeight:'52px',
                  textShadow: fuse===f&&f===deck.fuse ? glow(C.bright) : 'none',
                  animation: fuse===f&&f!==deck.fuse ? 'shake 0.3s ease' : 'none',
                }}>
                  {f}A {fuse===f ? (f===deck.fuse?'◆ CORRETO':'◇ INCORRETO') : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── VOLTAGE ── */}
        {phase === 'voltage' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={mono(11, C.dim, { letterSpacing:'0.06em' })}>AJUSTAR VOLTAGEM — {deck.voltTarget}V ±10V</div>
            <AsciiRule />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'4px' }}>
              <span style={vt(20, C.dim)}>VOLTAGEM:</span>
              <span style={{ ...vt(26, Math.abs(voltage-deck.voltTarget)<=10 ? C.bright : C.amber),
                textShadow: Math.abs(voltage-deck.voltTarget)<=10 ? glow(C.bright) : 'none' }}>
                {voltage}V
              </span>
            </div>
            {/* Zone bar */}
            <div style={{ position:'relative', height:'32px', background:'#001a08', border:`1px solid ${C.dim}` }}>
              <div style={{
                position:'absolute', left:`${(deck.voltTarget-10)/3}%`, width:`${20/3}%`,
                height:'100%', background:`${C.ghost}`, borderLeft:`1px solid ${C.dim}`, borderRight:`1px solid ${C.dim}`,
              }}/>
              <div style={{
                position:'absolute', top:'50%', transform:'translate(-50%,-50%)',
                left:`${(voltage/300)*100}%`,
                width:'4px', height:'100%', background: Math.abs(voltage-deck.voltTarget)<=10 ? C.bright : C.amber,
                boxShadow: `0 0 6px currentColor`,
              }}/>
            </div>
            <input type="range" min="150" max="300" value={voltage}
              onChange={e=>{ setVoltage(+e.target.value); setVoltHold(0); }}
              style={{ width:'100%', accentColor: Math.abs(voltage-deck.voltTarget)<=10 ? C.bright : C.amber }}
            />
            {Math.abs(voltage-deck.voltTarget)<=10 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ ...vt(20, C.bright), textShadow:glow(C.bright) }}>◆ ZONA ALVO — MANTER {3-voltHold}s</div>
                <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginTop:'6px' }}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{ width:'16px', height:'16px', borderRadius:'50%',
                      background: i<voltHold ? C.bright : C.ghost,
                      boxShadow: i<voltHold ? `0 0 6px ${C.bright}` : 'none' }} />
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

Object.assign(window, { MinigameLighting });
