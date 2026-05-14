// pdt-login.jsx — Login: credentials → verification → character profile

const LOGIN_CHARS = [
  { pdtId:1, nome:'ENG. CHEFE',      u:'mkb', p:'01' },
  { pdtId:2, nome:'TEC. SISTEMAS',   u:'tec', p:'02' },
  { pdtId:3, nome:'MÉDICO',          u:'med', p:'03' },
  { pdtId:4, nome:'OF. SEGURANÇA',   u:'seg', p:'04' },
  { pdtId:5, nome:'TEC. MANUTENÇÃO', u:'man', p:'05' },
  { pdtId:6, nome:'OP. COMMS',       u:'com', p:'06' },
  { pdtId:7, nome:'ESP. CARGA',      u:'car', p:'07' },
];

const LOAD_MSGS = [
  'VERIFICANDO CREDENCIAIS...',
  'CONSULTANDO REGISTRO W-Y...',
  'CARREGANDO PERFIL DE CAMPO...',
  'ACESSO CONFIRMADO',
];

const inputStyle = {
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${typeof C !== 'undefined' ? C.dim : '#006629'}`,
  color: '#00cc52',
  fontFamily: "'VT323', monospace",
  fontSize: '22px',
  outline: 'none',
  width: '100%',
  padding: '4px 0',
  caretColor: '#00ff66',
};

const LoginScreen = ({ onAuthRequest, onLoginConfirm, authError, authCharacter }) => {
  const [phase,    setPhase]    = React.useState('creds'); // 'creds'|'loading'|'profile'
  const [usuario,  setUsuario]  = React.useState('');
  const [senha,    setSenha]    = React.useState('');
  const [errMsg,   setErrMsg]   = React.useState('');
  const [character,setCharacter]= React.useState(null);
  const [loadPct,  setLoadPct]  = React.useState(0);
  const [loadMsgI, setLoadMsgI] = React.useState(0);

  // ── Loading animation ──────────────────────────────
  React.useEffect(() => {
    if (phase !== 'loading') return;
    let pct = 0;
    const iv = setInterval(() => {
      pct = Math.min(100, pct + 8 + Math.random() * 12);
      setLoadPct(Math.round(pct));
      setLoadMsgI(Math.min(LOAD_MSGS.length - 1, Math.floor(pct / 28)));
      if (pct >= 100) { clearInterval(iv); setTimeout(() => setPhase('profile'), 500); }
    }, 180);
    return () => clearInterval(iv);
  }, [phase]);

  React.useEffect(() => {
    if (authError && (phase === 'waiting' || phase === 'loading')) {
      setErrMsg(authError);
      setPhase('creds');
    }
  }, [authError, phase]);

  React.useEffect(() => {
    if (authCharacter && phase === 'waiting') {
      setCharacter(authCharacter);
      setLoadPct(0); setLoadMsgI(0); setPhase('loading');
    }
  }, [authCharacter, phase]);

  const handleLogin = () => {
    setErrMsg('');
    setPhase('waiting');
    onAuthRequest(usuario.trim().toLowerCase(), senha);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && phase !== 'waiting') handleLogin(); };

  // ── Prog bar text ──────────────────────────────────
  const bar = (pct) => {
    const filled = Math.round(pct / 5);
    const empty  = 20 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + `  ${pct}%`;
  };

  // ─────────────────────────────────────────────────────
  // PHASE: CREDENTIALS
  // ─────────────────────────────────────────────────────
  if (phase === 'creds') return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px', gap:'0' }}>
      {/* W-Y header */}
      <div style={{ textAlign:'center', marginBottom:'28px' }}>
        <div style={{ ...vt(13, C.wyMain), letterSpacing:'0.15em', opacity:0.9 }}>WEYLAND-YUTANI CORPORATION</div>
        <div style={{ ...vt(20, C.wyMain), textShadow:`0 0 8px ${C.wyMain}`, marginTop:'2px' }}>SISTEMA DE ACESSO DE CAMPO</div>
        <div style={{ ...mono(10, C.wyMain), opacity:0.5, marginTop:'4px', letterSpacing:'0.06em' }}>MERIDIAN FIELD UNIT — PDT ACCESS v4.1</div>
      </div>

      <AsciiRule color={C.dim} />

      {/* Form */}
      <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'18px', marginTop:'24px' }}>
        <div>
          <div style={mono(10, C.dim, { marginBottom:'4px', letterSpacing:'0.08em' })}>USUÁRIO</div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={vt(20, C.dim)}>▸</span>
            <input
              type="text" value={usuario}
              onChange={e => setUsuario(e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              autoComplete="off" autoCapitalize="none"
            />
          </div>
        </div>
        <div>
          <div style={mono(10, C.dim, { marginBottom:'4px', letterSpacing:'0.08em' })}>SENHA</div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={vt(20, C.dim)}>▸</span>
            <input
              type="password" value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {errMsg && (
        <div style={{ ...mono(11, C.red), marginTop:'14px', textAlign:'center', letterSpacing:'0.04em' }}>
          {errMsg}
        </div>
      )}

      <div style={{ marginTop:'28px', width:'100%' }}>
        <PDTButton variant="bright" onClick={handleLogin} fullWidth disabled={phase === 'waiting'}>
          {phase === 'waiting' ? '[ AUTENTICANDO... ]' : '[ ACESSAR ]'}
        </PDTButton>
      </div>

      {/* Demo hint */}
      <div style={{ ...mono(9, C.ghost), marginTop:'20px', textAlign:'center', opacity:0.8 }}>
        demo: qualquer usuário acima / senha: meridian
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  // PHASE: LOADING
  // ─────────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'waiting') return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px', gap:'16px' }}>
      <div style={{ ...vt(22, C.bright), textShadow: glow(C.bright) }}>
        {LOAD_MSGS[loadMsgI]}
      </div>
      <AsciiRule />
      <div style={{ ...vt(18, C.main), fontFamily:"'Share Tech Mono', monospace", fontSize:'14px', letterSpacing:'0.02em' }}>
        {bar(loadPct)}
      </div>
      <div style={mono(10, C.dim, { opacity:0.6 })}>SEEGSON FILE SYSTEM v4.2</div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  // PHASE: PROFILE
  // ─────────────────────────────────────────────────────
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ flex:1, overflowY:'auto', padding:'20px 16px', scrollbarWidth:'none' }}>
        <div style={{ ...vt(24, C.bright), textShadow:glow(C.bright), marginBottom:'4px' }}>ACESSO CONFIRMADO</div>
        <AsciiRule />

        <div style={{ marginTop:'16px', display:'flex', flexDirection:'column', gap:'4px' }}>
          <div style={vt(26, C.bright, { textShadow: glowS(C.bright) })}>{character.nome}</div>
          <div style={vt(20, C.main)}>{character.cargo} — NÍVEL {character.nivel}</div>
          <div style={mono(11, C.dim, { letterSpacing:'0.04em' })}>CONTRATO: RESTAURAÇÃO MERIDIAN</div>
        </div>

        <AsciiRule />

        <div style={{ margin:'14px 0' }}>
          <div style={mono(10, C.dim, { marginBottom:'6px', letterSpacing:'0.08em' })}>REGISTRO PESSOAL:</div>
          <div style={{ ...vt(19, C.mid), lineHeight:1.6, fontStyle:'italic' }}>
            "{character.registro}"
          </div>
        </div>

        <AsciiRule />

        <div style={{ marginTop:'14px', display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={mono(10, C.dim, { letterSpacing:'0.06em' })}>SKILLS:</span>
            <span style={vt(18, C.main)}>{character.skills.join(' / ')}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={mono(10, C.dim, { letterSpacing:'0.06em' })}>STRESS MÁX:</span>
            <span style={vt(18, C.main)}>{character.stress}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={mono(10, C.dim, { letterSpacing:'0.06em' })}>PDT-ID:</span>
            <span style={vt(18, C.main)}>PDT-{character.pdtId}</span>
          </div>
        </div>
      </div>

      <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.dim}`, flexShrink:0 }}>
        <PDTButton variant="bright" fullWidth onClick={() => onLoginConfirm(character)}>
          [ INICIAR MISSÃO ]
        </PDTButton>
      </div>
    </div>
  );
};

Object.assign(window, { LoginScreen, LOGIN_CHARS });
