// pdt-comms.jsx — Communications screen + frequency lock system

const msgColor     = t => ({ system:C.amber, mother:C.cyan, self:C.bright, crew:C.main }[t] || C.main);
const msgNameColor = t => ({ system:C.amber, mother:C.cyan, self:C.bright, crew:C.mid  }[t] || C.mid);

// ── Frequency unlock screen ────────────────────────────────────────────────────

const FrequencyUnlock = ({ onUnlock }) => {
  const [input, setInput]   = React.useState('');
  const [err,   setErr]     = React.useState(false);
  const [shake, setShake]   = React.useState(false);

  const submit = () => {
    const val = parseFloat(input);
    if (isNaN(val) || val < 100 || val > 1500) {
      setErr(true); setShake(true);
      setInput('');
      setTimeout(() => setShake(false), 500);
      return;
    }
    onUnlock(val.toFixed(1));
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', gap:'16px' }}>
      <div style={vt(22, C.amber)}>CANAL REQUER FREQUÊNCIA</div>
      <AsciiRule />
      <div style={mono(11, C.dim, { textAlign:'center', lineHeight:1.7 })}>
        A frequência foi definida durante<br />
        o reparo do Comms Local.<br />
        Peça ao técnico que fez o reparo.
      </div>
      <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'8px',
        animation: shake ? 'shake 0.3s ease' : 'none' }}>
        <div style={mono(10, C.dim, { letterSpacing:'0.06em' })}>FREQUÊNCIA (MHz):</div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px',
          border:`1px solid ${err?C.red:C.dim}`, padding:'10px 12px',
          background: err ? '#1a0000' : 'transparent' }}>
          <span style={vt(20,C.dim)}>▸</span>
          <input
            type="number" value={input} step="0.1" min="100" max="1500"
            onChange={e => { setInput(e.target.value); setErr(false); }}
            onKeyDown={e => e.key==='Enter' && submit()}
            placeholder="XXX.X"
            style={{ flex:1, background:'transparent', border:'none', outline:'none',
              color:C.main, fontFamily:"'VT323', monospace", fontSize:'24px',
              caretColor:C.bright, letterSpacing:'0.08em' }}
          />
          <span style={mono(10,C.dim)}>MHz</span>
        </div>
        {err && <div style={mono(10,C.red)}>FREQUÊNCIA INVÁLIDA</div>}
      </div>
      <PDTButton variant="bright" onClick={submit} fullWidth>[ SINTONIZAR ]</PDTButton>
    </div>
  );
};

// ── W-Y private channel ────────────────────────────────────────────────────────

const WYChannel = ({ wyHistory = [], onSendWY, wsOnline = true }) => {
  const [inputText, setInputText] = React.useState('');
  const msgEndRef = React.useRef(null);

  React.useEffect(() => {
    if (msgEndRef.current) msgEndRef.current.scrollTop = msgEndRef.current.scrollHeight;
  }, [wyHistory]);

  const handleSend = () => {
    if (!inputText.trim() || !wsOnline) return;
    if (onSendWY) onSendWY(inputText.trim());
    setInputText('');
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'8px 14px 6px', flexShrink:0 }}>
        <div style={{ ...vt(20,C.wyMain), textShadow:glow(C.wyMain) }}>CANAL W-Y — PRIVADO</div>
        <div style={mono(10, C.wyMain, { opacity:0.6 })}>WEYLAND-YUTANI CORP. — CLASSIFICADO</div>
      </div>
      <HRule color={C.wyMain} />
      <div ref={msgEndRef} style={{ flex:1, overflowY:'auto', padding:'6px 0', scrollbarWidth:'none' }}>
        {wyHistory.length === 0 && (
          <div style={mono(10, C.dim, { textAlign:'center', marginTop:'20px', opacity:0.5 })}>
            Canal seguro. Aguardando transmissão W-Y...
          </div>
        )}
        {wyHistory.map((msg,i)=>(
          <div key={i} style={{ padding:'4px 14px', paddingLeft:msg.type==='self'?'26px':'14px',
            borderLeft:msg.type==='self'?`2px solid ${C.wyMain}`:'none',
            marginLeft:msg.type==='self'?'12px':'0' }}>
            <span style={mono(10,C.dim)}>[{msg.time}] </span>
            <span style={vt(18, msg.type==='wy'?C.wyBright:C.bright)}>
              {msg.sender}:&nbsp;
            </span>
            <span style={vt(18, msg.type==='wy'?C.wyMain:C.main, {whiteSpace:'pre-wrap'})}>{msg.text}</span>
          </div>
        ))}
      </div>
      <HRule color={C.wyMain} />
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px' }}>
        <span style={vt(22,C.wyMain)}>{'>'}</span>
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={wsOnline ? 'MENSAGEM W-Y...' : 'OFFLINE...'}
          disabled={!wsOnline}
          style={{ flex:1, background:'transparent', border:'none', outline:'none',
            color:C.wyMain, fontFamily:"'VT323', monospace", fontSize:'18px',
            caretColor:C.wyBright, opacity: wsOnline ? 1 : 0.4 }}
        />
        <button onClick={handleSend} disabled={!wsOnline} style={{ ...vt(16,C.wyMain), background:'transparent', border:`1px solid ${C.wyMain}`,
          padding:'8px 14px', cursor: wsOnline ? 'pointer' : 'not-allowed', minHeight:'44px',
          opacity: wsOnline ? 1 : 0.4 }}>ENVIAR</button>
      </div>
    </div>
  );
};

// ── CommsScreen ────────────────────────────────────────────────────────────────

const CommsScreen = ({ commsState, isAndroid, history = [], wyHistory = [], unread = 0, unlocked = false, wsOnline = true, onSendMessage, onSendWY, onFrequencySubmit, onRead }) => {
  const [channel,    setChannel]    = React.useState('GERAL');
  const [inputText,  setInputText]  = React.useState('');
  const msgEndRef = React.useRef(null);

  React.useEffect(() => {
    if (msgEndRef.current) msgEndRef.current.scrollTop = msgEndRef.current.scrollHeight;
    if (onRead && unread > 0) onRead();
  }, [channel, history, unread, onRead]);

  const CHANNELS = isAndroid ? ['GERAL', 'W-Y'] : ['GERAL'];

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (onSendMessage) onSendMessage(inputText.trim(), channel);
    setInputText('');
  };

  // ── W-Y channel (android only) ────────────────────
  if (channel === 'W-Y' && isAndroid) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px 6px', flexShrink:0 }}>
        <span style={vt(20,C.main)}>COMMS</span>
        <div style={{ display:'flex', gap:'6px' }}>
          {CHANNELS.map(ch=>(
            <span key={ch} onClick={()=>setChannel(ch)} style={{
              ...mono(11, channel===ch ? (ch==='W-Y'?C.wyBright:C.bright) : C.dim),
              border:`1px solid ${channel===ch?(ch==='W-Y'?C.wyMain:C.dim):C.ghost}`,
              padding:'3px 8px', cursor:'pointer',
              textShadow:channel===ch&&ch==='W-Y'?glow(C.wyMain):'none',
            }}>{ch} ▾</span>
          ))}
        </div>
      </div>
      <HRule color={C.wyMain} />
      <WYChannel wyHistory={wyHistory} onSendWY={onSendWY} wsOnline={wsOnline} />
    </div>
  );

  // ── Frequency locked ──────────────────────────────
  if (!unlocked) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px 6px', flexShrink:0 }}>
        <span style={vt(20,C.main)}>COMMS</span>
        <div style={{ display:'flex', gap:'6px' }}>
          {CHANNELS.map(ch=>(
            <span key={ch} onClick={()=>setChannel(ch)} style={{
              ...mono(11, channel===ch?C.bright:C.dim),
              border:`1px solid ${channel===ch?C.dim:C.ghost}`,
              padding:'3px 8px', cursor:'pointer',
            }}>{ch} ▾</span>
          ))}
        </div>
      </div>
      <HRule />
      <FrequencyUnlock onUnlock={(f) => { if(onFrequencySubmit) onFrequencySubmit(f); }} />
    </div>
  );

  // ── Active channel (GERAL) ────────────────────────
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px 6px', flexShrink:0 }}>
        <span style={vt(20,C.main)}>COMMS</span>
        <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
          <span style={mono(9,C.dim,{opacity:0.6})}>SINTONIZADO</span>
          <span onClick={()=>setChannel('GERAL')} style={{
            ...mono(11, channel==='GERAL'?C.bright:C.dim),
            border:`1px solid ${channel==='GERAL'?C.dim:C.ghost}`,
            padding:'3px 8px', cursor:'pointer',
          }}>GERAL ▾</span>
          {isAndroid && (
            <span onClick={()=>setChannel('W-Y')} style={{
              ...mono(11,channel==='W-Y'?C.wyBright:C.wyMain),
              border:`1px solid ${C.wyMain}`, padding:'3px 8px', cursor:'pointer',
              opacity:0.8,
            }}>W-Y ▾</span>
          )}
        </div>
      </div>
      <HRule />

      {/* Messages */}
      <div ref={msgEndRef} style={{ flex:1, overflowY:'auto', padding:'6px 0', scrollbarWidth:'none' }}>
        {history.length === 0 && (
           <div style={mono(10,C.dim,{textAlign:'center', marginTop:'20px'})}>Nenhuma mensagem no histórico.</div>
        )}
        {history.map((msg,i)=>(
          <div key={i} style={{ padding:'4px 14px', paddingLeft:msg.type==='self'?'26px':'14px',
            borderLeft:msg.type==='self'?`2px solid ${C.dim}`:'none',
            marginLeft:msg.type==='self'?'12px':'0' }}>
            <span style={mono(10,C.dim)}>[{msg.time}] </span>
            <span style={{ ...vt(18,msgNameColor(msg.type)), textShadow:msg.type==='self'?glow(C.bright):'none' }}>
              {msg.sender}:&nbsp;
            </span>
            <span style={{ ...vt(18,msgColor(msg.type)), whiteSpace:'pre-wrap' }}>{msg.text}</span>
          </div>
        ))}
      </div>

      <HRule />
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px', flexShrink:0 }}>
        <span style={vt(22,C.main)}>{'>'}</span>
        <div style={{ flex:1, display:'flex', alignItems:'center', minHeight:'32px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={wsOnline ? "MENSAGEM..." : "OFFLINE..."}
            disabled={!wsOnline}
            style={{ width:'100%', background:'transparent', border:'none', outline:'none', color:C.main, fontFamily:"'VT323', monospace", fontSize:'18px', caretColor:C.bright, opacity: wsOnline ? 1 : 0.4 }}
          />
        </div>
        <button onClick={handleSend} disabled={!wsOnline} style={{ ...vt(16,C.main), background:'transparent', border:`1px solid ${C.main}`,
          padding:'8px 14px', cursor: wsOnline ? 'pointer' : 'not-allowed', minHeight:'44px', opacity: wsOnline ? 1 : 0.4 }}>ENVIAR</button>
      </div>
    </div>
  );
};

Object.assign(window, { CommsScreen });
