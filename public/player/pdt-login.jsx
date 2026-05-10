// pdt-login.jsx — Login: credentials → verification → character profile

const LOGIN_CHARS = [
  { u:'kowalski', p:'meridian', nome:'Kowalski, M.', cargo:'Engenheiro Chefe',        nivel:2, skills:['Tecnologia','Percepção'],  stress:40, pdtId:1, isAndroid:false, registro:'Veterano de três missões de mineração. Prefere o silêncio das naves ao barulho das pessoas.' },
  { u:'chen',     p:'meridian', nome:'Chen, L.',     cargo:'Oficial Médico',           nivel:2, skills:['Medicina','Ciência'],      stress:40, pdtId:3, isAndroid:false, registro:'Aceitou o contrato para pagar as dívidas de tratamento do irmão mais novo. Não conta para ninguém.' },
  { u:'rodriguez',p:'meridian', nome:'Rodriguez, C.',cargo:'Técnico de Sistemas',      nivel:2, skills:['Tecnologia','Maquinaria'], stress:40, pdtId:2, isAndroid:false, registro:'Especialista em sistemas Seegson. Conhece cada falha desse equipamento de memória.' },
  { u:'lima',     p:'meridian', nome:'Lima, A.',     cargo:'Piloto',                   nivel:2, skills:['Pilotagem','Percepção'],   stress:40, pdtId:4, isAndroid:false, registro:'Décima missão de campo. Parou de contar os sobreviventes depois da quinta.' },
  { u:'santos',   p:'meridian', nome:'Santos, R.',   cargo:'Especialista em Segurança',nivel:2, skills:['Combate','Percepção'],     stress:40, pdtId:5, isAndroid:false, registro:'Ex-militar. Trabalha para a W-Y por opção, não por necessidade.' },
  { u:'osei',     p:'meridian', nome:'Osei, K.',     cargo:'Geólogo',                  nivel:1, skills:['Ciência','Percepção'],    stress:30, pdtId:6, isAndroid:false, registro:'Primeira missão. Os créditos eram bons. Não sabia o que custariam.' },
  { u:'reeves',   p:'meridian', nome:'Reeves',       cargo:'Técnico de Campo',         nivel:2, skills:['Tecnologia','Maquinaria'],stress:40, pdtId:7, isAndroid:true,  registro:'[A SER PREENCHIDO PELO MESTRE]' },
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

const LoginScreen = ({ onLogin }) => {
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

  const handleLogin = () => {
    const char = LOGIN_CHARS.find(c => c.u === usuario.trim().toLowerCase() && c.p === senha);
    if (!char) { setErrMsg('CREDENCIAIS INVÁLIDAS — TENTE NOVAMENTE'); return; }
    setErrMsg(''); setCharacter(char); setLoadPct(0); setLoadMsgI(0); setPhase('loading');
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

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
        <PDTButton variant="bright" onClick={handleLogin} fullWidth>[ ACESSAR ]</PDTButton>
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
  if (phase === 'loading') return (
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
        <PDTButton variant="bright" fullWidth onClick={() => onLogin(character)}>
          [ INICIAR MISSÃO ]
        </PDTButton>
      </div>
    </div>
  );
};

Object.assign(window, { LoginScreen, LOGIN_CHARS });
