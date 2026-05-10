// pdt-app.jsx — Main App: login flow, android mode, full routing, tweaks

// ── Header ────────────────────────────────────────────────────────────────────

const PDTHeader = ({ character }) => (
  <div style={{
    flexShrink:0, borderBottom:`1px solid ${C.dim}`,
    padding:'5px 14px', display:'flex', flexDirection:'column',
    justifyContent:'center', minHeight:'50px', background:C.black,
  }}>
    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
      <span style={{ ...vt(18,C.bright), textShadow:glow(C.bright) }}>
        PDT-{character?.pdtId || '?'}
      </span>
      <span style={vt(16,C.dim)}>◆</span>
      <span style={vt(18,C.main)}>SETOR: B1 — MEDBAY</span>
    </div>
    <div style={mono(11,C.mid,{letterSpacing:'0.04em'})}>
      {character ? `${character.nome.toUpperCase()} // ${character.cargo.toUpperCase()}` : 'AGUARDANDO LOGIN'}
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

const BottomNav = ({ activeTab, onTabChange, lockedTab, badges = {} }) => (
  <div style={{ flexShrink:0, borderTop:`1px solid ${C.dim}`, display:'flex', minHeight:'58px', background:C.black }}>
    {TABS.map(tab => {
      const active = activeTab === tab.id;
      const locked = lockedTab === tab.id;
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
          <span style={mono(9,active?C.bright:C.dim,{letterSpacing:'0.04em'})}>{tab.label}</span>
          {badges[tab.id] && (
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
  const [loggedIn,   setLoggedIn]   = React.useState(false);
  const [character,  setCharacter]  = React.useState(null);
  const [authError,  setAuthError]  = React.useState(null);
  const [authCharacter, setAuthCharacter] = React.useState(null);
  const isAndroid = character?.isAndroid || false;

  // Navigation
  const [activeTab,   setActiveTab]   = React.useState('tracker');

  // Per-tab sub-states
  const [trackerState, setTrackerState] = React.useState('clean');
  const [commsState,   setCommsState]   = React.useState('active');
  const [docsState,    setDocsState]    = React.useState('list');
  const [selectedDoc,  setSelectedDoc]  = React.useState(null);
  const [sysState,     setSysState]     = React.useState('list');

  // Overlays
  const [showAlert,      setShowAlert]      = React.useState(false);
  const [showMother,     setShowMother]     = React.useState(false);
  const [motherVariant,  setMotherVariant]  = React.useState('seegson');
  const [showSecretNote, setShowSecretNote] = React.useState(false);

  // Countdown
  const [showCountdown,  setShowCountdown]  = React.useState(false);
  const [countdownTime,  setCountdownTime]  = React.useState(0);

  // Tab lock
  const [lockedTab, setLockedTab] = React.useState('');

  // Systems and Documents State
  const [shipSystems, setShipSystems] = React.useState({});
  const [docList, setDocList] = React.useState([]);
  const [blips, setBlips] = React.useState([]);
  const [downloadError, setDownloadError] = React.useState(null);

  React.useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${protocol}://${location.host}`);
    
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'LOGIN_OK') {
        setAuthCharacter(data.character);
      } else if (data.type === 'LOGIN_ERR') {
        setAuthError(data.msg);
      } else if (data.type === 'TRACKER_UPDATE') {
        setBlips(data.blips);
        setTrackerState(data.blips.length > 0 ? 'threat' : 'clean');
      } else if (data.type === 'SHIP_SYSTEMS_UPDATE' || data.type === 'FULL_STATE') {
        let sysData = data.type === 'FULL_STATE' ? data.state.systems : data.payload;
        setShipSystems(sysData);
      } else if (data.type === 'DOC_LIST') {
        setDocList(data.docs);
      } else if (data.type === 'DOC_DOWNLOAD_OK') {
        setSelectedDoc(data.doc);
        setDocsState('reading');
      } else if (data.type === 'DOC_DOWNLOAD_ERR') {
        setDownloadError({ type: data.errType || 'not_found', level: data.errLevel });
      } else if (data.type === 'SYSTEM_BRIEFING') {
        // Needs to inject system to sysState briefing
      } else if (data.type === 'MOTHER_MSG') {
        setMotherVariant(data.voice === 'W-Y' ? 'wy' : 'seegson');
        setShowMother(true);
      } else if (data.type === 'COUNTDOWN_START') {
        setCountdownTime(data.duration || 14*60+23);
        setShowCountdown(true);
      } else if (data.type === 'VIBRATE_SILENT') {
        if (navigator.vibrate) navigator.vibrate(200);
      }
    };
    
    return () => ws.close();
  }, []);

  // Countdown ticker
  React.useEffect(() => {
    if (!showCountdown) return;
    const iv = setInterval(() => setCountdownTime(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(iv);
  }, [showCountdown]);

  // Mode A: full-screen, no nav/header
  const modeA =
    (activeTab === 'docs' && docsState === 'reading') ||
    (activeTab === 'sys'  && ['briefing','minigame','success','failure'].includes(sysState));

  const handleAuthRequest = (user, pass) => { 
    setAuthError(null);
    if(ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'LOGIN', username: user, password: pass }));
    }
  };

  const handleLoginConfirm = (char) => {
    setCharacter(char);
    setLoggedIn(true);
    setActiveTab('tracker');
  };

  const goToSys     = () => { setActiveTab('sys'); setSysState('list'); };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'sys') setSysState('list');
    if (tab === 'docs' && docsState === 'reading') setDocsState('list');
  };

  const handleDocDownload = (docId) => {
    setDownloadError(null);
    if(ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'REQUEST_DOC', docId }));
    }
  };

  const handleRepairCommand = (systemId, result) => {
    if(ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'MINIGAME_RESULT', systemId, result }));
    }
  };

  const renderContent = () => {
    if (!loggedIn) return <LoginScreen onAuthRequest={handleAuthRequest} onLoginConfirm={handleLoginConfirm} authError={authError} authCharacter={authCharacter} />;
    if (lockedTab && activeTab === lockedTab) return <LockedScreen tabName={activeTab} />;
    switch (activeTab) {
      case 'tracker': return <TrackerScreen trackerState={trackerState} goToSys={goToSys} />;
      case 'comms':   return <CommsScreen commsState={commsState} isAndroid={isAndroid} />;
      case 'docs':    return (
        <DocsScreen docsState={docsState} setDocsState={setDocsState}
          selectedDoc={selectedDoc} setSelectedDoc={setSelectedDoc} isAndroid={isAndroid} unlockedDocs={docList} onDownloadRequest={handleDocDownload} downloadError={downloadError} />
      );
      case 'sys':     return <SysScreen sysState={sysState} setSysState={setSysState} isAndroid={isAndroid} shipSystems={shipSystems} onRepairCommand={handleRepairCommand} />;
      default: return null;
    }
  };

  return (
    <div style={{
      width:'390px', height:'844px', background:C.black,
      display:'flex', flexDirection:'column',
      position:'relative', overflow:'hidden',
      fontFamily:"'VT323', monospace",
    }}>
      {/* Header — only when logged in and not Mode A */}
      {loggedIn && !modeA && <PDTHeader character={character} />}

      {/* Content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
        {renderContent()}
      </div>

      {/* Bottom nav */}
      {loggedIn && !modeA && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange}
          lockedTab={lockedTab} badges={{ comms: loggedIn }} />
      )}

      {/* Overlays */}
      {showAlert      && <AlertOverlay      onDismiss={() => setShowAlert(false)} />}
      {showMother     && <MotherOverlay     onDismiss={() => setShowMother(false)} variant={motherVariant} />}
      {showSecretNote && <SecretNoteOverlay onDismiss={() => setShowSecretNote(false)} />}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
