// pdt-mg-door-control.jsx — Minigame: Door Control (hacker aesthetic, 4 phases)

const ADMIN_USERNAME = 'SYSADMIN';
const CORRECT_PASSWORD = 'REEVES47'; // hint in Reeves' doc
const OVERRIDE_CMDS = ['AUTHORIZE', 'BYPASS', 'OVERRIDE', 'EXECUTE'];

const DOOR_STATUS = [
  { sector:'A1', name:'AIRLOCK PRINCIPAL', status:'DESBLOQUEADA' },
  { sector:'A2', name:'CORREDOR NORTE',    status:'DESBLOQUEADA' },
  { sector:'B1', name:'MEDBAY',            status:'DESBLOQUEADA' },
  { sector:'B2', name:'QUARTOS',           status:'DESBLOQUEADA' },
  { sector:'C1', name:'ENGENHARIA',        status:'BLOQUEADA'    },
  { sector:'C2', name:'PORÃO DE CARGA',   status:'BLOQUEADA'    },
  { sector:'C3', name:'DOCA DE PODS',     status:'DANIFICADA'   },
];

const NOISE_CHARS = 'h7$kLmNqR2&fG#Tp9wXrEsYv8!cUjB4@zAo0dIH%nWC6Qe5Vb1MKs';
const rand = (n) => Math.floor(Math.random() * n);

const MinigameDoorControl = ({ onSuccess, onFailure }) => {
  const [phase,     setPhase]     = React.useState('cascade'); // 'cascade'|'password'|'override'|'doors'
  const [noiseText, setNoiseText] = React.useState('');
  const [showUser,  setShowUser]  = React.useState(false);
  const [catches,   setCatches]   = React.useState(0);
  const [password,  setPassword]  = React.useState('');
  const [pwErr,     setPwErr]     = React.useState(0);
  const [pwWrong,   setPwWrong]   = React.useState(false);
  const [cmdSeq,    setCmdSeq]    = React.useState([]); // override sequence shown
  const [cmdInput,  setCmdInput]  = React.useState([]); // player input
  const [cmdErr,    setCmdErr]    = React.useState(false);
  const [timer,     setTimer]     = React.useState(90);

  React.useEffect(() => {
    const iv = setInterval(() => setTimer(t => { if(t<=1){onFailure();return 0;}return t-1;}), 1000);
    return () => clearInterval(iv);
  }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ── PHASE 1: cascade noise with USERNAME flashing ──
  React.useEffect(() => {
    if (phase !== 'cascade') return;
    let appearances = 0;
    const genNoise = () => Array.from({length:180},()=>NOISE_CHARS[rand(NOISE_CHARS.length)]).join('');

    // Noise ticker
    const noiseIv = setInterval(() => setNoiseText(genNoise()), 60);

    // Username flashes at intervals
    const flashUser = () => {
      setShowUser(true);
      setTimeout(() => setShowUser(false), 800);
      appearances++;
    };

    const t1 = setTimeout(flashUser, 1500);
    const t2 = setTimeout(flashUser, 4200);
    const t3 = setTimeout(flashUser, 7800);

    return () => { clearInterval(noiseIv); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [phase]);

  const catchUser = () => {
    if (!showUser || phase !== 'cascade') return;
    const next = catches + 1;
    setCatches(next);
    if (next >= 1) {
      setTimeout(() => { setPhase('password'); }, 400);
    }
  };

  // ── PHASE 3: override sequence display ────────────
  React.useEffect(() => {
    if (phase !== 'override') return;
    // Show sequence
    setCmdSeq([]);
    setCmdInput([]);
    let seq = [...OVERRIDE_CMDS];
    seq.forEach((cmd, i) => {
      setTimeout(() => setCmdSeq(prev => [...prev, cmd]), i * 600 + 300);
    });
  }, [phase]);

  const handleCmd = (cmd) => {
    const next = [...cmdInput, cmd];
    if (cmd !== OVERRIDE_CMDS[cmdInput.length]) {
      setCmdErr(true);
      setTimeout(() => { setCmdErr(false); setCmdInput([]); }, 500);
      return;
    }
    setCmdInput(next);
    if (next.length >= OVERRIDE_CMDS.length) setTimeout(() => setPhase('doors'), 600);
  };

  const submitPassword = () => {
    if (password.toUpperCase() === CORRECT_PASSWORD) { setPhase('override'); return; }
    const e = pwErr + 1; setPwErr(e); setPwWrong(true);
    setPassword('');
    setTimeout(() => setPwWrong(false), 500);
    if (e >= 3) onFailure();
  };

  const phaseNum = { cascade:1, password:2, override:3, doors:4 }[phase];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${C.dim}` }}>
        <div style={vt(20, C.main)}>DOOR CONTROL — FASE {phaseNum}/4</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
          <span style={{ ...vt(17, timer<15?C.red:C.amber) }}>TIMER: {fmt(timer)}</span>
          <div style={{ display:'flex', gap:'6px' }}>
            {['ID','PASS','OVER','PORTAS'].map((l,i)=>(
              <span key={l} style={mono(9, phaseNum>i+1?C.bright:phaseNum===i+1?C.main:C.ghost)}>
                {phaseNum>i+1?'◆':phaseNum===i+1?'▶':'◇'}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', padding:'12px 14px' }}>

        {/* ── PHASE 1: CASCADE ── */}
        {phase === 'cascade' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', flex:1 }}>
            <div style={mono(11,C.dim,{letterSpacing:'0.06em'})}>
              ENCONTRAR USUÁRIO ADMIN NO RUÍDO
            </div>
            <div style={mono(10,C.dim)}>Toque em SYSADMIN quando aparecer.</div>
            <AsciiRule />
            {/* Noise display */}
            <div
              onClick={catchUser}
              style={{
                flex:1, position:'relative',
                fontFamily:"'Share Tech Mono', monospace", fontSize:'11px',
                color: C.dim, background:'#000a04',
                border:`1px solid ${C.dim}`, padding:'8px',
                overflow:'hidden', cursor:'pointer',
                lineHeight:1.5, letterSpacing:'0.02em',
                wordBreak:'break-all',
                userSelect:'none',
              }}>
              {showUser ? (
                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                  ...vt(28, C.bright), textShadow:glowS(C.bright),
                  background:'#000a04', padding:'4px 16px', border:`1px solid ${C.bright}`,
                  zIndex:10, whiteSpace:'nowrap',
                }}>
                  {ADMIN_USERNAME}
                </div>
              ) : null}
              <span style={{ opacity: showUser?0.15:1 }}>{noiseText}</span>
            </div>
            {catches > 0 && (
              <div style={{ ...vt(18,C.bright), textShadow:glow(C.bright), textAlign:'center' }}>
                ◆ USUÁRIO CAPTURADO
              </div>
            )}
            {catches === 0 && (
              <div style={mono(10,C.dim,{textAlign:'center',opacity:0.7})}>
                O nome aparece brevemente. Fique atento.
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 2: PASSWORD ── */}
        {phase === 'password' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={mono(11,C.dim,{letterSpacing:'0.06em'})}>INSERIR SENHA DO ADMIN</div>
            <div style={mono(10,C.dim)}>Senha nos documentos de Reeves.</div>
            <AsciiRule />
            <div style={{
              display:'flex', alignItems:'center', gap:'8px',
              border:`1px solid ${pwWrong?C.red:C.dim}`,
              padding:'12px', background: pwWrong?'#1a0000':'transparent',
              animation: pwWrong?'shake 0.3s':undefined,
            }}>
              <span style={vt(20,C.dim)}>{'>'}</span>
              <input
                type="text" value={password}
                onChange={e=>{ setPassword(e.target.value.toUpperCase()); setPwWrong(false); }}
                onKeyDown={e=>e.key==='Enter'&&submitPassword()}
                style={{ background:'transparent', border:'none', color:C.main,
                  fontFamily:"'VT323', monospace", fontSize:'22px', outline:'none',
                  flex:1, caretColor:C.bright, letterSpacing:'0.08em' }}
                autoCapitalize="characters"
              />
            </div>
            {pwErr>0&&<div style={mono(10,C.red)}>SENHA INCORRETA — {3-pwErr} TENTATIVAS RESTANTES</div>}
            <PDTButton variant="bright" onClick={submitPassword} fullWidth>[ VERIFICAR ]</PDTButton>
            {pwErr>0&&(
              <div style={mono(10,C.amber,{marginTop:'4px'})}>
                DICA: caracteres corretos destacados após cada erro
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 3: OVERRIDE ── */}
        {phase === 'override' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={mono(11,C.dim,{letterSpacing:'0.06em'})}>CONFIRMAR SEQUÊNCIA DE OVERRIDE</div>
            <AsciiRule />
            {/* Sequence shown */}
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', minHeight:'32px' }}>
              {cmdSeq.map((cmd,i)=>(
                <span key={i} style={{
                  ...vt(18, cmdInput.length>i?C.dim:C.amber),
                  textDecoration: cmdInput.length>i?'line-through':'none',
                  opacity: cmdInput.length>i?0.4:1,
                }}>{cmd}</span>
              ))}
            </div>
            <div style={mono(10,C.dim,{marginTop:'2px'})}>
              PRÓXIMO: <span style={{color:C.bright, fontFamily:"'VT323', monospace", fontSize:'18px'}}>
                {cmdInput.length < OVERRIDE_CMDS.length ? OVERRIDE_CMDS[cmdInput.length] : '—'}
              </span>
            </div>
            <AsciiRule />
            {/* Buttons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {OVERRIDE_CMDS.map(cmd=>(
                <button key={cmd}
                  onClick={()=>handleCmd(cmd)}
                  style={{
                    ...vt(20, cmdErr?C.red:cmdInput.includes(cmd)?C.dim:C.bright),
                    background: cmdInput.includes(cmd)?'transparent':C.ghost,
                    border:`1px solid ${cmdErr?C.red:cmdInput.includes(cmd)?C.ghost:C.bright}`,
                    padding:'14px', cursor:'pointer', minHeight:'56px',
                    textShadow: !cmdInput.includes(cmd)&&!cmdErr?glow(C.bright):'none',
                    animation: cmdErr?'shake 0.3s':undefined,
                    opacity: cmdInput.includes(cmd)?0.35:1,
                  }}>{cmd}</button>
              ))}
            </div>
            {cmdInput.length>0&&(
              <div style={mono(10,C.dim)}>
                EXECUTADO: {cmdInput.join(' → ')}
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 4: DOOR STATUS ── */}
        {phase === 'doors' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0', flex:1, overflowY:'auto', scrollbarWidth:'none' }}>
            <div style={mono(11,C.dim,{letterSpacing:'0.06em', marginBottom:'8px'})}>DIAGNÓSTICO — STATUS DAS PORTAS</div>
            <AsciiRule />
            <div style={{ display:'flex', flexDirection:'column', gap:'0', marginTop:'6px' }}>
              {DOOR_STATUS.map(d=>(
                <div key={d.sector} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'10px 0', borderBottom:`1px solid ${C.ghost}`, minHeight:'44px',
                }}>
                  <div>
                    <span style={mono(10,C.dim,{marginRight:'6px'})}>{d.sector}</span>
                    <span style={vt(18,C.main)}>{d.name}</span>
                  </div>
                  <span style={{
                    ...vt(16, d.status==='DESBLOQUEADA'?C.bright:d.status==='BLOQUEADA'?C.dim:C.red),
                    whiteSpace:'nowrap',
                  }}>{d.status}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:'16px' }}>
              <PDTButton variant="bright" onClick={onSuccess} fullWidth>[ CONCLUIR ]</PDTButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { MinigameDoorControl });
