// pdt-mg-lifepods.jsx — Minigame: Lifepods / Doca (3 phases)

const LIFEPOD_CODE = '847231'; // auth code from Kowalski's notes

const MinigameLifepods = ({ onSuccess, onFailure }) => {
  const [phase,    setPhase]    = React.useState('auth');  // 'auth'|'fuel'|'coords'|'done'
  const [codeInput,setCodeInput]= React.useState('');
  const [codeErrs, setCodeErrs] = React.useState(0);
  const [codeErr,  setCodeErr]  = React.useState(false);
  const [fuel,     setFuel]     = React.useState([72, 68, 80]); // 3 pods, %
  const [coordA,   setCoordA]   = React.useState('');
  const [coordB,   setCoordB]   = React.useState('');
  const [coordErr, setCoordErr] = React.useState('');
  const [timer,    setTimer]    = React.useState(90);

  React.useEffect(() => {
    const iv = setInterval(() => setTimer(t => { if (t <= 1) { onFailure(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(iv);
  }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ── Numpad ─────────────────────────────────────────
  const tapKey = (k) => {
    if (k === '⌫') { setCodeInput(c => c.slice(0,-1)); setCodeErr(false); return; }
    if (codeInput.length >= 6) return;
    setCodeInput(c => c + k);
  };

  const submitCode = () => {
    if (codeInput === LIFEPOD_CODE) { setPhase('fuel'); return; }
    const e = codeErrs + 1;
    setCodeErrs(e); setCodeErr(true); setCodeInput('');
    setTimeout(() => setCodeErr(false), 600);
    if (e >= 3) onFailure();
  };

  // ── Fuel sliders ───────────────────────────────────
  const setFuelPod = (i, v) => {
    const val = Math.max(0, Math.min(100, v));
    setFuel(prev => {
      const next = [...prev];
      next[i] = val;
      // drain adjacent pods slightly
      if (i > 0) next[i-1] = Math.max(0, next[i-1] - Math.round((val - prev[i]) * 0.03));
      if (i < 2) next[i+1] = Math.max(0, next[i+1] - Math.round((val - prev[i]) * 0.03));
      return next;
    });
  };

  const allFuelOk = fuel.every(f => f >= 80 && f <= 95);

  // ── Coords ─────────────────────────────────────────
  const validCoords = /^\d{3}\.\d{2}$/.test(coordA) && /^\d{3}\.\d{2}$/.test(coordB);
  const submitCoords = () => {
    if (!validCoords) { setCoordErr('FORMATO INVÁLIDO — USE: XXX.XX'); return; }
    setPhase('done');
    setTimeout(onSuccess, 1200);
  };

  const NUM_KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','OK'];

  const inZone = (f) => f >= 80 && f <= 95;
  const fuelColor = (f) => inZone(f) ? C.bright : f > 95 ? C.amber : C.red;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${C.dim}` }}>
        <div style={vt(20, C.main)}>AUTORIZAR — LIFEPODS / DOCA</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
          <span style={{ ...vt(17, timer < 15 ? C.red : C.amber) }}>TIMER: {fmt(timer)}</span>
          <span style={vt(17, C.dim)}>FASE {phase==='auth'?'1':phase==='fuel'?'2':phase==='coords'?'3':'3'}/3</span>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px', scrollbarWidth:'none' }}>

        {/* ── PHASE 1: AUTH CODE ── */}
        {phase === 'auth' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px', alignItems:'center' }}>
            <div style={mono(11, C.dim, { letterSpacing:'0.07em', alignSelf:'flex-start' })}>
              CÓDIGO DE AUTORIZAÇÃO (6 DÍGITOS)
            </div>
            <div style={mono(10, C.dim, { alignSelf:'flex-start' })}>
              Código nas anotações de Kowalski.
            </div>
            <AsciiRule />
            {/* Code display */}
            <div style={{
              display:'flex', gap:'10px', marginTop:'8px',
              border: `1px solid ${codeErr ? C.red : C.dim}`,
              padding:'12px 20px',
              animation: codeErr ? 'shake 0.3s ease' : 'none',
              background: codeErr ? '#1a0000' : 'transparent',
            }}>
              {Array.from({length:6}).map((_,i) => (
                <span key={i} style={{
                  ...vt(28, codeInput[i] ? C.bright : C.ghost),
                  textShadow: codeInput[i] ? glow(C.bright) : 'none',
                  width:'18px', textAlign:'center',
                }}>
                  {codeInput[i] || '─'}
                </span>
              ))}
            </div>
            {codeErrs > 0 && <div style={mono(10, C.red)}>CÓDIGO INCORRETO — {3-codeErrs} TENTATIVAS RESTANTES</div>}

            {/* Numpad */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', width:'100%', maxWidth:'260px' }}>
              {NUM_KEYS.map(k => (
                <button key={k}
                  onClick={() => k === 'OK' ? submitCode() : tapKey(k)}
                  style={{
                    ...vt(24, k === 'OK' ? C.bright : k === '⌫' ? C.amber : C.main),
                    background: k === 'OK' ? C.ghost : 'transparent',
                    border: `1px solid ${k === 'OK' ? C.bright : k === '⌫' ? C.amber : C.dim}`,
                    padding:'12px', minHeight:'52px', cursor:'pointer',
                    textShadow: k === 'OK' ? glow(C.bright) : 'none',
                  }}>{k}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── PHASE 2: FUEL ── */}
        {phase === 'fuel' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={mono(11, C.dim, { letterSpacing:'0.06em' })}>ABASTECIMENTO — ZONA ALVO: 80%–95%</div>
            <AsciiRule />
            {fuel.map((f, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={vt(20, C.main)}>POD {i+1}</span>
                  <span style={{ ...vt(20, fuelColor(f)), textShadow: inZone(f) ? glow(C.bright) : 'none' }}>
                    {f}% {inZone(f) ? '◆' : '◇'}
                  </span>
                </div>
                {/* Slider with zone indicator */}
                <div style={{ position:'relative' }}>
                  <div style={{ height:'24px', background:'#001a08', border:`1px solid ${C.dim}`, position:'relative' }}>
                    {/* Zone marker */}
                    <div style={{ position:'absolute', left:'80%', width:'15%', height:'100%', background:`${C.ghost}`, opacity:0.5 }} />
                    {/* Fill */}
                    <div style={{ position:'absolute', left:0, height:'100%', width:`${f}%`, background: fuelColor(f), opacity:0.7, transition:'width 0.1s' }} />
                    <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:0, right:0, ...mono(9,C.dim,{textAlign:'center'}) }}>
                      ◁ 80%──────95% ▷
                    </div>
                  </div>
                  <input type="range" min="0" max="100" value={f}
                    onChange={e => setFuelPod(i, +e.target.value)}
                    style={{ width:'100%', marginTop:'4px', accentColor: fuelColor(f) }}
                  />
                </div>
              </div>
            ))}
            {allFuelOk && (
              <PDTButton variant="bright" onClick={() => setPhase('coords')} fullWidth>
                [ CONFIRMAR ABASTECIMENTO ]
              </PDTButton>
            )}
          </div>
        )}

        {/* ── PHASE 3: COORDINATES ── */}
        {phase === 'coords' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={mono(11, C.dim, { letterSpacing:'0.06em' })}>COORDENADAS DE DESTINO</div>
            <div style={mono(10, C.dim)}>Formato: XXX.XX — consultar documentos de Singh ou M.O.T.H.E.R.</div>
            <AsciiRule />
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[['X', coordA, setCoordA], ['Y', coordB, setCoordB]].map(([label, val, setter]) => (
                <div key={label}>
                  <div style={mono(10, C.dim, { marginBottom:'4px' })}>{label}:</div>
                  <input type="text" value={val}
                    onChange={e => { setter(e.target.value); setCoordErr(''); }}
                    placeholder="XXX.XX"
                    style={{ ...inputStyle, fontSize:'24px', letterSpacing:'0.1em', borderColor: C.main }}
                  />
                </div>
              ))}
            </div>
            {coordErr && <div style={mono(11, C.red)}>{coordErr}</div>}
            <PDTButton variant="bright" onClick={submitCoords} fullWidth>[ CONFIRMAR COORDENADAS ]</PDTButton>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ ...vt(26, C.bright), textShadow: glowS(C.bright) }}>◆ DOCA AUTORIZADA</div>
            <div style={vt(18, C.main, { marginTop:'8px' })}>Processando...</div>
            <Cursor />
          </div>
        )}
      </div>
    </div>
  );
};

const inputStyle = {
  background:'transparent', border:'none', borderBottom:`1px solid #006629`,
  color:'#00cc52', fontFamily:"'VT323', monospace", fontSize:'22px',
  outline:'none', width:'100%', padding:'4px 2px', caretColor:'#00ff66',
};

Object.assign(window, { MinigameLifepods });
