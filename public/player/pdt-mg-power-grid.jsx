// pdt-mg-power-grid.jsx — Minigame: Power Grid (circuit routing, SVG node grid)

// Node layout: 6 nodes for Treinado difficulty
// S1, S2 = power sources; D1-D4 = destinations
// Each edge has a capacity. Valid connections route power without overloading.
const NODES = [
  { id:'S1', x:60,  y:80,  label:'S1', type:'source', power:100 },
  { id:'S2', x:300, y:80,  label:'S2', type:'source', power:100 },
  { id:'A',  x:100, y:200, label:'A',  type:'node',   power:0   },
  { id:'B',  x:180, y:260, label:'B',  type:'node',   power:0   },
  { id:'C',  x:260, y:200, label:'C',  type:'node',   power:0   },
  { id:'D1', x:60,  y:320, label:'D1', type:'dest',   need:40   },
  { id:'D2', x:180, y:360, label:'D2', type:'dest',   need:60   },
  { id:'D3', x:300, y:320, label:'D3', type:'dest',   need:35   },
  { id:'D4', x:180, y:160, label:'D4', type:'dest',   need:50   },
];

// Valid edges with capacity
const EDGES = [
  { from:'S1', to:'A',  cap:80 }, { from:'S1', to:'D4', cap:60 },
  { from:'S2', to:'C',  cap:80 }, { from:'S2', to:'D4', cap:60 },
  { from:'A',  to:'B',  cap:60 }, { from:'A',  to:'D1', cap:50 },
  { from:'B',  to:'C',  cap:60 }, { from:'B',  to:'D2', cap:70 },
  { from:'C',  to:'D3', cap:50 }, { from:'C',  to:'D2', cap:70 },
];

// One valid solution: S1→A→D1, S1→A→B→D2, S2→C→D3, S1/S2→D4
const SOLUTION = new Set(['S1-A','A-D1','A-B','B-D2','S2-C','C-D3','S1-D4']);

const edgeKey = (a,b) => [a,b].sort().join('-');
const nodeById = id => NODES.find(n=>n.id===id);

const MinigamePowerGrid = ({ onSuccess, onFailure, difficultyLevel = 1 }) => {
  const [active,  setActive]  = React.useState(() => {
    // Difficulty 3 (Expert) starts with some edges pre-connected
    if (difficultyLevel === 3) return new Set(['S1-A', 'S2-C', 'S1-D4']);
    return new Set();
  }); 
  const [selNode, setSelNode]  = React.useState(null);
  const [timer,   setTimer]   = React.useState(75);
  const [checked, setChecked] = React.useState(false);
  const [result,  setResult]  = React.useState(null); // 'ok'|'overload'|'disconnected'

  React.useEffect(() => {
    const iv = setInterval(() => setTimer(t => { if(t<=1){onFailure();return 0;}return t-1;}), 1000);
    return () => clearInterval(iv);
  }, []);

  const fmt = s => `00:${String(s).padStart(2,'0')}`;

  const isEdgeValid = (fromId, toId) =>
    EDGES.some(e => (e.from===fromId&&e.to===toId)||(e.from===toId&&e.to===fromId));

  const tapNode = (id) => {
    if (!selNode) { setSelNode(id); return; }
    if (selNode === id) { setSelNode(null); return; }
    const key = edgeKey(selNode, id);
    if (!isEdgeValid(selNode, id)) { setSelNode(null); return; }
    const next = new Set(active);
    if (next.has(key)) next.delete(key); else next.add(key);
    setActive(next);
    setSelNode(null);
    setResult(null);
    setChecked(false);
  };

  // Calculate load per edge based on active connections (simplified: divide source power by active paths)
  const getEdgeLoad = (key) => {
    const [a,b] = key.split('-');
    const edge = EDGES.find(e=>(e.from===a&&e.to===b)||(e.from===b&&e.to===a));
    if (!edge) return 0;
    // Simplified load: 50 per active edge
    return active.has(key) ? 50 : 0;
  };

  const getEdgeCap = (key) => {
    const [a,b] = key.split('-');
    const edge = EDGES.find(e=>(e.from===a&&e.to===b)||(e.from===b&&e.to===a));
    return edge?.cap || 0;
  };

  const isOverloaded = (key) => getEdgeLoad(key) > getEdgeCap(key);

  const checkSolution = () => {
    setChecked(true);
    // Check all destinations are connected
    const destNodes = NODES.filter(n=>n.type==='dest');
    let allConnected = true;
    destNodes.forEach(d => {
      const connected = [...active].some(key => key.includes(d.id));
      if (!connected) allConnected = false;
    });
    // Check no overload
    const overload = [...active].some(key => isOverloaded(key));

    if (overload) { setResult('overload'); return; }
    if (!allConnected) { setResult('disconnected'); return; }
    setResult('ok');
    setTimeout(onSuccess, 800);
  };

  const getNodeColor = (n) => {
    if (selNode === n.id) return C.bright;
    if (n.type === 'source') return C.bright;
    if (n.type === 'dest') {
      const conn = [...active].some(k=>k.includes(n.id));
      return conn ? C.bright : C.amber;
    }
    return C.main;
  };

  const SVG_W = 360, SVG_H = 420;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${C.dim}` }}>
        <div style={vt(20, C.main)}>POWER GRID — ROTEAMENTO</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
          <span style={{ ...vt(17, timer<15?C.red:C.amber) }}>TIMER: {fmt(timer)}</span>
          <span style={mono(10,C.dim)}>S1/S2 → D1 D2 D3 D4</span>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 14px', overflow:'hidden', gap:'8px' }}>
        <div style={mono(10,C.dim)}>
          Toque dois nós para conectar/desconectar. Conecte todas as cargas (D) sem sobrecarregar.
        </div>

        {/* SVG grid */}
        <div style={{ flex:1, display:'flex', justifyContent:'center', overflow:'hidden' }}>
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ maxWidth:'100%', maxHeight:'100%' }}>

            {/* Edges */}
            {EDGES.map(edge => {
              const key  = edgeKey(edge.from, edge.to);
              const on   = active.has(key);
              const over = on && isOverloaded(key);
              const na   = nodeById(edge.from), nb = nodeById(edge.to);
              return (
                <line key={key}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={on ? (over?C.red:C.bright) : C.ghost}
                  strokeWidth={on?3:1.5}
                  strokeDasharray={on?'none':'4,4'}
                  style={{ 
                    filter: (on && !over) ? `drop-shadow(0 0 4px ${C.bright})` : 
                           (difficultyLevel >= 2 && SOLUTION.has(key)) ? `drop-shadow(0 0 8px ${C.main})` : 'none', 
                    cursor:'pointer',
                    opacity: (difficultyLevel >= 2 && !on && SOLUTION.has(key)) ? 0.6 : 1
                  }}
                  onClick={() => {
                    // Allow clicking edge to toggle
                    const next = new Set(active);
                    if (next.has(key)) next.delete(key); else next.add(key);
                    setActive(next); setResult(null); setChecked(false);
                  }}
                />
              );
            })}

            {/* Edge load labels */}
            {[...active].map(key => {
              const [a,b] = key.split('-');
              const na = nodeById(a), nb = nodeById(b);
              if (!na||!nb) return null;
              const mx = (na.x+nb.x)/2, my = (na.y+nb.y)/2;
              const cap = getEdgeCap(key);
              const over = isOverloaded(key);
              return (
                <text key={key+'-label'} x={mx} y={my-6}
                  fill={over?C.red:C.amber}
                  fontSize="10" textAnchor="middle"
                  fontFamily="Share Tech Mono">
                  {difficultyLevel > 0 ? `50/${cap}` : '??'}
                </text>
              );
            })}

            {/* Nodes */}
            {NODES.map(n => {
              const col = getNodeColor(n);
              const sel = selNode === n.id;
              return (
                <g key={n.id} onClick={()=>tapNode(n.id)} style={{ cursor:'pointer' }}>
                  <circle cx={n.x} cy={n.y} r={sel?22:18}
                    fill={sel?C.ghost:n.type==='source'?'#001a08':'#000a04'}
                    stroke={col} strokeWidth={sel?3:2}
                    style={{ filter: n.type==='source'||sel?`drop-shadow(0 0 6px ${col})`:'none' }}
                  />
                  <text x={n.x} y={n.y+1} fill={col} fontSize="12"
                    textAnchor="middle" dominantBaseline="middle"
                    fontFamily="VT323" fontWeight="bold">
                    {n.label}
                  </text>
                  {n.type==='dest' && (
                    <text x={n.x} y={n.y+30} fill={C.dim} fontSize="9"
                      textAnchor="middle" fontFamily="Share Tech Mono">
                      {difficultyLevel > 0 ? `${n.need}kW` : '??kW'}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
          {[
            { c:C.bright, l:'FONTE' }, { c:C.amber, l:'CARGA DESCONECTADA' },
            { c:C.bright, l:'CONECTADO' }, { c:C.red, l:'SOBRECARGA' },
          ].map(({c,l})=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:c }}/>
              <span style={mono(9,C.dim)}>{l}</span>
            </div>
          ))}
        </div>

        {result === 'overload'     && <div style={mono(10,C.red)}>⚠ SOBRECARGA DETECTADA — REROUTE</div>}
        {result === 'disconnected' && <div style={mono(10,C.amber)}>⚠ CARGAS DESCONECTADAS</div>}

        <div style={{ display:'flex', gap:'8px' }}>
          <PDTButton variant="dim" onClick={()=>{setActive(new Set());setResult(null);setSelNode(null);}} style={{flex:1,fontSize:'16px',padding:'8px'}}>
            LIMPAR
          </PDTButton>
          <PDTButton variant="bright" onClick={checkSolution} style={{flex:2,fontSize:'16px',padding:'8px'}}>
            [ VERIFICAR ]
          </PDTButton>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { MinigamePowerGrid });
