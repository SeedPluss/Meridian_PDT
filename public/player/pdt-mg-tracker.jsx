// pdt-mg-tracker.jsx — Minigame: Motion Tracker boot sequence

const BOOT_LINES = [
  { text: 'INITIALIZING SENSOR ARRAY...', delay: 500 },
  { text: 'HUMIDITY SENSOR: ◆ OK',        delay: 300 },
  { text: 'ULTRASONIC SENSOR: ◆ OK',      delay: 300 },
  { text: 'INFRARED SENSOR: ◆ OK',        delay: 300 },
  { text: 'LOADING MOTION DETECTION v3.2...', delay: 1000 },
  { text: 'CALIBRATING BASELINE...',      delay: 1500 },
  { text: 'ESTABLISHING SECTOR COVERAGE...', delay: 800 },
  { text: 'MOTION TRACKER: ◆ ONLINE',     delay: 500 },
];

const MinigameMotionTracker = ({ onSuccess, onFailure }) => {
  const [phase,    setPhase]    = React.useState('sensors'); // 'sensors'|'boot'
  const [sensors,  setSensors]  = React.useState({ humidity: false, ultrasonic: false, infrared: false });
  const [calProg,  setCalProg]  = React.useState({ humidity: 0, ultrasonic: 0, infrared: 0 });
  const [bootLines,setBootLines]= React.useState([]);
  const [booting,  setBooting]  = React.useState(false);
  const [timer,    setTimer]    = React.useState(60);
  const finishedRef = React.useRef(false);

  // countdown
  React.useEffect(() => {
    const iv = setInterval(() => setTimer(t => { 
      if (t <= 1) { 
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFailure(); 
        }
        return 0; 
      } 
      return t - 1; 
    }), 1000);
    return () => clearInterval(iv);
  }, []);

  const allSensorsOn = sensors.humidity && sensors.ultrasonic && sensors.infrared;
  const fmt = s => `00:${String(s).padStart(2,'0')}`;

  const toggleSensor = (key) => {
    if (sensors[key] || finishedRef.current) return; // can't turn off
    // calibration animation
    setCalProg(p => ({ ...p, [key]: 0 }));
    let pct = 0;
    const iv = setInterval(() => {
      pct = Math.min(100, pct + 6 + Math.random() * 8);
      setCalProg(p => ({ ...p, [key]: Math.round(pct) }));
      if (pct >= 100) {
        clearInterval(iv);
        setSensors(s => ({ ...s, [key]: true }));
      }
    }, 80);
  };

  const startBoot = () => {
    if (finishedRef.current) return;
    setBooting(true);
    setPhase('boot');
    setBootLines([]);
    let acc = 0;
    BOOT_LINES.forEach((line, i) => {
      acc += line.delay;
      setTimeout(() => {
        setBootLines(prev => [...prev, line.text]);
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => {
            if (!finishedRef.current) {
              finishedRef.current = true;
              onSuccess();
            }
          }, 800);
        }
      }, acc);
    });
  };

  const SENSOR_DEFS = [
    { key: 'humidity',   label: 'UMIDADE' },
    { key: 'ultrasonic', label: 'ULTRASSÔNICO' },
    { key: 'infrared',   label: 'INFRAVERMELHO' },
  ];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${C.dim}` }}>
        <div style={vt(20, C.main)}>REBOOT — MOTION TRACKER</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
          <span style={{ ...vt(17, timer < 10 ? C.red : C.amber), textShadow: timer < 10 ? glow(C.red) : 'none' }}>
            TIMER: {fmt(timer)}
          </span>
          <span style={vt(17, C.dim)}>FASE: {phase === 'sensors' ? '1/2' : '2/2'}</span>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px 14px', scrollbarWidth:'none' }}>
        {/* ── PHASE 1: SENSORS ── */}
        {phase === 'sensors' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={mono(11, C.dim, { letterSpacing:'0.07em' })}>ATIVAR SENSORES:</div>
            <AsciiRule />

            {SENSOR_DEFS.map(({ key, label }) => {
              const on  = sensors[key];
              const pct = calProg[key] || 0;
              const calibrating = !on && pct > 0 && pct < 100;
              return (
                <div key={key}
                  onClick={() => !on && !calibrating && toggleSensor(key)}
                  style={{
                    border: `2px solid ${on ? C.bright : calibrating ? C.amber : C.dim}`,
                    background: on ? C.ghost : 'transparent',
                    padding: '14px 16px',
                    cursor: on ? 'default' : 'pointer',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    minHeight: '64px',
                    transition: 'border-color 0.2s',
                  }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ ...vt(22, on ? C.bright : C.mid), textShadow: on ? glow(C.bright) : 'none' }}>
                      {label}
                    </span>
                    <span style={{ ...vt(18, on ? C.bright : calibrating ? C.amber : C.dim) }}>
                      {on ? '◆ ATIVO' : calibrating ? '⚙ CAL.' : '◇ INATIVO'}
                    </span>
                  </div>
                  {calibrating && (
                    <div style={{ height:'4px', background: C.ghost, position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', top:0, left:0, height:'100%', width:`${pct}%`, background: C.amber, transition:'width 0.1s' }} />
                    </div>
                  )}
                </div>
              );
            })}

            {allSensorsOn && (
              <div style={{ marginTop:'12px' }}>
                <PDTButton variant="bright" onClick={startBoot} fullWidth>[ INICIAR BOOT SEQUENCE ]</PDTButton>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 2: BOOT TERMINAL ── */}
        {phase === 'boot' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
            <div style={mono(11, C.dim, { marginBottom:'10px', letterSpacing:'0.07em' })}>
              SEEGSON BOOT SEQUENCE v3.2
            </div>
            {bootLines.map((line, i) => (
              <div key={i} style={{
                ...vt(18, line.includes('◆') ? C.bright : C.main),
                textShadow: line.includes('◆') ? glow(C.bright) : 'none',
                padding: '3px 0',
                animation: 'fadeIn 0.3s ease',
              }}>
                {'>'} {line}
              </div>
            ))}
            {booting && bootLines.length < BOOT_LINES.length && <Cursor />}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { MinigameMotionTracker });
