// pdt-app.jsx — Main App: login flow, android mode, full routing

// ── Header ────────────────────────────────────────────────────────────────────

const PDTHeader = ({ character, sectorName, wsStatus }) => (
  <div style={{
    flexShrink:0, borderBottom:`1px solid ${C.dim}`,
    padding:'5px 14px', display:'flex', flexDirection:'column',
    justifyContent:'center', minHeight:'50px', background:C.black,
    position:'relative'
  }}>
    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
      <span style={{ ...vt(18,C.bright), textShadow:glow(C.bright) }}>
        PDT-{character?.pdtId || '?'}
      </span>
      <span style={vt(16,C.dim)}>◆</span>
      <span style={vt(18,C.main)}>SETOR: {sectorName || 'A1 — DESCONHECIDO'}</span>
    </div>
    <div style={mono(11,C.mid,{letterSpacing:'0.04em'})}>
      {character ? `${character.nome.toUpperCase()} // ${character.cargo.toUpperCase()}` : 'AGUARDANDO LOGIN'}
    </div>
    
    {/* Network indicator */}
    <div style={{ position:'absolute', top:'12px', right:'14px', display:'flex', alignItems:'center', gap:'4px' }}>
       <span style={mono(9, wsStatus==='open' ? C.main : C.red)}>
         {wsStatus==='open' ? 'LINK' : 'FAIL'}
       </span>
       <div style={{ 
         width:'6px', height:'6px', borderRadius:'50%', 
         background: wsStatus==='open' ? C.bright : C.red,
         boxShadow: wsStatus==='open' ? glow(C.bright) : glow(C.red)
       }} />
    </div>
  </div>
);

// ── Bottom Nav ────────────────────────────────────────────────────────────────

const TABS = [
  { id:'tracker', label:'TRACKER', icon:'◎' },
  { id:'comms',   label:'COMMS',   icon:'⌨' },
  { id:'docs',    label:'DOCS',    icon:'▤' },
  { id:'sys',     label:'SYS',     icon:'⚙' },
];

const BottomNav = ({ activeTab, onTabChange, blockedTabs = {}, badges = {} }) => (
  <div style={{ flexShrink:0, borderTop:`1px solid ${C.dim}`, display:'flex', minHeight:'58px', background:C.black }}>
    {TABS.map(tab => {
      const active = activeTab === tab.id;
      const locked = !!blockedTabs[tab.id];
      return (
        <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
          flex:1, background:'transparent', border:'none',
          borderTop:`2px solid ${active?C.bright:'transparent'}`,
          cursor:'pointer', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          gap:'3px', padding:'6px 0', position:'relative', minHeight:'58px',
        }}>
          <span style={{ ...vt(22,active?C.bright:locked?C.dim:C.dim), textShadow:active?glow(C.bright):'none' }}>
            {tab.icon}
          </span>
          <span style={mono(9,active?C.bright:locked?C.dim:C.dim,{letterSpacing:'0.04em'})}>{tab.label}</span>
          {badges[tab.id] > 0 && (
            <div style={{ position:'absolute', top:'6px', right:'calc(50% - 14px)',
              width:'8px', height:'8px', borderRadius:'50%',
              background:C.red, boxShadow:`0 0 4px ${C.red}` }} />
          )}
        </button>
      );
    })}
  </div>
);

let ws;

// ── Main App ──────────────────────────────────────────────────────────────────

const App = () => {
  // Auth
  const [loggedIn,      setLoggedIn]      = React.useState(false);
  const [character,     setCharacter]     = React.useState(null);
  const [authError,     setAuthError]     = React.useState(null);
  const [authCharacter, setAuthCharacter] = React.useState(null);
  const isAndroid = character?.isAndroid || false;

  // Navigation
  const [activeTab,    setActiveTab]    = React.useState('tracker');
  const [blockedTabs,  setBlockedTabs]  = React.useState({});

  // Location
  const [currentSector, setCurrentSector] = React.useState('A1');
  const [sectorName,    setSectorName]    = React.useState('A1 — DESCONHECIDO');

  // Per-tab sub-states
  const [trackerState, setTrackerState] = React.useState('offline'); // Inicialmente quebrado (requisito)
  const [blips,        setBlips]        = React.useState([]);
  const [commsState,   setCommsState]   = React.useState('active');
  const [commsHistory, setCommsHistory] = React.useState([]);
  const [commsUnread,  setCommsUnread]  = React.useState(0);
  const [commsUnlocked,setCommsUnlocked]= React.useState(false);
  const [docsState,    setDocsState]    = React.useState('list');
  const [selectedDoc,  setSelectedDoc]  = React.useState(null);
  const [sysState,     setSysState]     = React.useState('list');
  const [wsStatus,     setWsStatus]     = React.useState('connecting'); // connecting, open, closed
  const [activeBriefingSystem, setActiveBriefingSystem] = React.useState(null);

  // Overlays
  const [showAlert,      setShowAlert]      = React.useState(false);
  const [alertData,      setAlertData]      = React.useState(null);
  const [showMother,     setShowMother]     = React.useState(false);
  const [motherVariant,  setMotherVariant]  = React.useState('seegson');
  const [showSecretNote, setShowSecretNote] = React.useState(false);
  const [secretNoteText, setSecretNoteText] = React.useState(null);

  // Countdown
  const [showCountdown,  setShowCountdown]  = React.useState(false);
  const [countdownTime,  setCountdownTime]  = React.useState(0);

  // Systems and Documents State
  const [shipSystems,   setShipSystems]   = React.useState({
    reactor: { online: false },
    power_grid: { online: false },
    life_support: { online: false },
    motion_tracker: { online: false },
    comms_local: { online: false },
    comms_long: { online: false },
    lighting_a: { online: false },
    lighting_b: { online: false },
    lighting_c: { online: false },
    door_control: { online: false },
    lifepods: { online: false }
  });
  const [docList,       setDocList]       = React.useState([]);
  const [downloadError, setDownloadError] = React.useState(null);

  // ── Global Effects ────────────────────────────────────────────────────────
  React.useEffect(() => {
    const handleGlobalClick = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        if (window.AudioEngine) window.AudioEngine.playKeystroke();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // ── WebSocket ────────────────────────────────────────────────────────────
  const handleSocketMessage = (data) => {
    switch (data.type) {
      case 'LOGIN_OK':
        setCharacter(data.character);
        setLoggedIn(true);
        setActiveTab('tracker');
        localStorage.setItem('meridian_char', JSON.stringify(data.character));
        break;

      case 'SESSION_RESUMED':
        setCharacter(data.character);
        setLoggedIn(true);
        console.log('[PDT] Session resumed for', data.character.nome);
        break;

      case 'LOGIN_FAIL':
      case 'LOGIN_ERR':
        if (window.AudioEngine) window.AudioEngine.playError();
        setAuthError(data.msg || data.message);
        localStorage.removeItem('meridian_char');
        break;

      case 'FULL_STATE':
        if (data.state.systems)  setShipSystems(data.state.systems);
        if (data.state.tracker)  { 
          setBlips(data.state.tracker); 
          if (data.state.sensorOnline === false) setTrackerState('offline');
          else setTrackerState(data.state.tracker.length > 0 ? 'threat' : 'clean'); 
        }
        if (data.state.docs)     setDocList(data.state.docs);
        break;

      case 'TRACKER_UPDATE':
        setBlips(data.blips || []);
        const trackerSys = shipSystems['motion_tracker'];
        if (data.sensorOnline === false || !trackerSys?.online) {
          setTrackerState('offline');
        } else {
          const blips = data.blips || [];
          setTrackerState(blips.length > 0 ? 'threat' : 'clean');
          if (blips.length > 0 && window.AudioEngine) {
            window.AudioEngine.playBlip(blips[0].distance || 0.5, true);
          }
        }
        break;

      case 'SHIP_SYSTEMS_UPDATE':
        setShipSystems(data.payload || data.systems || {});
        break;

      case 'SYSTEM_ONLINE':
        setShipSystems(prev => ({
          ...prev,
          [data.systemId]: { ...(prev[data.systemId] || {}), online: true, repairing: false, status: 'online' }
        }));
        break;

      case 'SYSTEM_DETECTED':
        setShipSystems(prev => ({
          ...prev,
          [data.systemId]: { ...(prev[data.systemId] || {}), detected: true, panelUnlocked: false }
        }));
        if (window.AudioEngine) window.AudioEngine.playUnlock();
        if (navigator.vibrate) navigator.vibrate([100]);
        break;

      case 'PANEL_UNLOCKED':
        setShipSystems(prev => ({
          ...prev,
          [data.systemId]: { ...(prev[data.systemId] || {}), locked: false, panelUnlocked: true }
        }));
        if (window.AudioEngine) window.AudioEngine.playUnlock();
        if (navigator.vibrate) navigator.vibrate([100]);
        break;

      case 'SYSTEM_BRIEFING':
        setActiveBriefingSystem(data.system || null);
        break;

      case 'DOC_LIST':
        setDocList(data.docs || []);
        break;

      case 'DOCUMENT_UNLOCKED':
        setDocList(prev => [...prev, data.doc]);
        if (activeTab !== 'docs') setCommsHistory(prev => [...prev, {
          time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
          sender:'SYSTEM', text:`Novo documento desbloqueado: ${data.doc.id}`, type:'system'
        }]);
        if (window.AudioEngine) window.AudioEngine.playUnlock();
        if (navigator.vibrate) navigator.vibrate([100]);
        break;

      case 'DOC_DOWNLOAD_OK':
        setDocList(prev => prev.find(d => d.id === data.doc.id) ? prev : [...prev, data.doc]);
        setSelectedDoc(data.doc);
        setDocsState('reading');
        break;

      case 'DOC_ACCESS_DENIED':
      case 'DOC_DOWNLOAD_ERR':
        setDownloadError({ type: data.errType || 'no_access', level: data.errLevel, message: data.message });
        break;

      case 'ALERT':
        setAlertData(data);
        setShowAlert(true);
        if (window.AudioEngine) window.AudioEngine.playAlert();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        break;

      case 'MOTHER_MSG':
      case 'MOTHER_MESSAGE':
        setMotherVariant(data.voice === 'W-Y' ? 'wy' : 'seegson');
        setShowMother(true);
        if (window.AudioEngine) window.AudioEngine.playMother(data.voice === 'W-Y' ? 'wy' : 'seegson');
        if (navigator.vibrate) navigator.vibrate([100]);
        break;

      case 'SECRET_NOTE':
        setSecretNoteText(data.text || null);
        setShowSecretNote(true);
        break;

      case 'COUNTDOWN_START':
        setCountdownTime(data.duration || data.seconds || 14*60+23);
        setShowCountdown(true);
        break;

      case 'COUNTDOWN_STOP':
        setShowCountdown(false);
        setCountdownTime(0);
        break;

      case 'TAB_BLOCKED':
        setBlockedTabs(prev => ({ ...prev, [data.tab]: !!data.blocked }));
        break;

      case 'SECTOR_UPDATE':
        setCurrentSector(data.sector || 'A1');
        setSectorName(data.sectorName || data.sector || 'A1');
        break;

      case 'COMMS_MESSAGE':
        setCommsHistory(prev => [...prev, data.message]);
        if (activeTab !== 'comms') setCommsUnread(prev => prev + 1);
        if (window.AudioEngine) window.AudioEngine.playKeystroke();
        break;

      case 'COMMS_FREQUENCY_OK':
        setCommsUnlocked(true);
        if (window.AudioEngine) window.AudioEngine.playUnlock();
        break;

      case 'SILENT_VIBRATE':
      case 'VIBRATE_SILENT':
        if (navigator.vibrate) navigator.vibrate([100]);
        break;

      default: break;
    }
  };

  React.useEffect(() => {
    let socket = null;
    let reconnectTimer = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}`);

      socket.onopen = () => {
        console.log('[PDT] Connected');
        setWsStatus('open');
        const saved = localStorage.getItem('meridian_char');
        if (saved) {
          const char = JSON.parse(saved);
          socket.send(JSON.stringify({ type: 'RESUME_SESSION', characterId: char.id }));
        }
      };

      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        handleSocketMessage(data);
      };

      socket.onclose = () => {
        console.log('[PDT] Disconnected. Retrying...');
        setWsStatus('closed');
        reconnectTimer = setTimeout(connect, 3000);
      };

      setWs(socket);
    };

    connect();
    return () => {
      if (socket) socket.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // ── Countdown ticker ─────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!showCountdown) return;
    const iv = setInterval(() => setCountdownTime(t => {
      if (t <= 1) { clearInterval(iv); setShowCountdown(false); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [showCountdown]);

  // ── Mode A: full-screen, hide nav/header ──────────────────────────────────
  const modeA =
    (activeTab === 'docs' && docsState === 'reading') ||
    (activeTab === 'sys'  && ['briefing','minigame','success','failure'].includes(sysState));

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLoginConfirm = (char) => {
    setCharacter(char);
    setLoggedIn(true);
    setActiveTab('tracker');
  };

  const handleAuthRequest = (user, pass) => {
    setAuthError(null);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'LOGIN', username: user, password: pass }));
    }
  };

  const handleTabChange = (tab) => {
    if (blockedTabs[tab]) return; 
    setActiveTab(tab);
    if (tab === 'sys')   setSysState('list');
    if (tab === 'docs' && docsState === 'reading') setDocsState('list');
    if (tab === 'comms') setCommsUnread(0);
  };

  const handleDocDownload = (docId) => {
    setDownloadError(null);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'REQUEST_DOC', docId }));
    }
  };

  const handleRepairCommand = (systemId, result) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'MINIGAME_RESULT', systemId, success: result === 'success' }));
    }
    // Optimistic local update
    if (result === 'success') {
      setShipSystems(prev => ({
        ...prev,
        [systemId]: { ...(prev[systemId] || {}), online: true, repairing: false }
      }));
    }
  };

  const handleSendComms = (text, channel) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'CHAT_SEND', text, channel }));
    }
    // Optimistic local echo
    setCommsHistory(prev => [...prev, {
      time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
      sender: 'VOCÊ', text, type: 'self'
    }]);
  };

  const handleFrequencySubmit = (freq) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'COMMS_FREQUENCY', frequency: freq }));
    }
    // Demo: auto-unlock locally if no server validates
    setCommsUnlocked(true);
  };

  const goToSys = () => { setActiveTab('sys'); setSysState('list'); };

  // ── Content router ────────────────────────────────────────────────────────
  const renderContent = () => {
    if (!loggedIn) return (
      <LoginScreen
        onAuthRequest={handleAuthRequest}
        onLoginConfirm={handleLoginConfirm}
        authError={authError}
        authCharacter={authCharacter}
      />
    );
    if (blockedTabs[activeTab]) return <LockedScreen tabName={activeTab} />;
    switch (activeTab) {
      case 'tracker': return (
        <TrackerScreen
          trackerState={trackerState}
          blips={blips}
          currentSector={currentSector}
          goToSys={goToSys}
        />
      );
      case 'comms': return (
        <CommsScreen
          commsState={commsState}
          isAndroid={isAndroid}
          history={commsHistory}
          unread={commsUnread}
          unlocked={commsUnlocked}
          onSendMessage={handleSendComms}
          onFrequencySubmit={handleFrequencySubmit}
          onRead={() => setCommsUnread(0)}
        />
      );
      case 'docs': return (
        <DocsScreen
          docsState={docsState}
          setDocsState={setDocsState}
          selectedDoc={selectedDoc}
          setSelectedDoc={setSelectedDoc}
          isAndroid={isAndroid}
          unlockedDocs={docList}
          onDownloadRequest={handleDocDownload}
          downloadError={downloadError}
        />
      );
      case 'sys': return (
        <SysScreen
          sysState={sysState}
          setSysState={setSysState}
          character={character}
          isAndroid={isAndroid}
          shipSystems={shipSystems}
          onRepairCommand={handleRepairCommand}
          activeBriefingSystem={activeBriefingSystem}
        />
      );
      default: return null;
    }
  };

  return (
    <div className={`pdt-container ${modeA ? 'mode-a' : 'mode-b'}`} style={{
      width:'390px', height:'844px', background:C.black,
      display:'flex', flexDirection:'column',
      position:'relative', overflow:'hidden',
      fontFamily:"'VT323', monospace",
    }}>
      {/* Header */}
      {loggedIn && !modeA && <PDTHeader character={character} sectorName={sectorName} wsStatus={wsStatus} />}

      {/* Countdown banner — below header, above content */}
      {loggedIn && showCountdown && <CountdownBanner time={countdownTime} />}

      {/* Content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
        {renderContent()}
      </div>

      {/* Bottom nav */}
      {loggedIn && !modeA && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          blockedTabs={blockedTabs}
          badges={{ comms: commsUnread }}
        />
      )}

      {/* Overlays */}
      {showAlert      && <AlertOverlay      data={alertData}          onDismiss={() => setShowAlert(false)} />}
      {showMother     && <MotherOverlay     variant={motherVariant}   onDismiss={() => setShowMother(false)} />}
      {showSecretNote && <SecretNoteOverlay text={secretNoteText}     onDismiss={() => setShowSecretNote(false)} />}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
