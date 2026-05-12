// master-app.jsx — Meridian Master Control Panel (6 tabs)

const MC = {
  bright:'#00ff66', main:'#00cc52', mid:'#00993d', dim:'#006629',
  ghost:'#003315',  black:'#000a04', wy:'#2266dd', wyB:'#4488ff',
  amber:'#ffaa00',  red:'#ff2a2a',  cyan:'#00ddff',
};

const glow = c => `0 0 8px ${c}`;
const vt   = (sz,col,ex={}) => ({ fontFamily:"'VT323',monospace", fontSize:`${sz}px`, color:col, lineHeight:1.35, ...ex });
const mo   = (sz,col,ex={}) => ({ fontFamily:"'Share Tech Mono',monospace", fontSize:`${sz}px`, color:col, lineHeight:1.5, ...ex });

const HR = ({col=MC.dim,my=6}) => <div style={{height:'1px',background:col,opacity:.5,margin:`${my}px 0`,flexShrink:0}}/>;
const Btn = ({children,onClick,col=MC.main,bg='transparent',sz=16,style:sx={}}) => (
  <button onClick={onClick} style={{
    ...vt(sz,col), background:bg, border:`1px solid ${col}`,
    padding:'5px 10px', cursor:'pointer', whiteSpace:'nowrap',
    minHeight:'32px', ...sx,
  }}>{children}</button>
);
const Tag = ({children,col}) => (
  <span style={{ ...mo(9,col||MC.dim), border:`1px solid ${col||MC.dim}`, padding:'1px 5px' }}>{children}</span>
);

// ── PLAYERS DATA ──────────────────────────────────────────────────────────────

const initPlayers = [
  { id:1, name:'KOWALSKI',  role:'ENG. CHEFE',     sector:'C1', stress:6,  maxS:40, android:false },
  { id:2, name:'CHEN',      role:'MÉDICO',          sector:'B1', stress:4,  maxS:40, android:false },
  { id:3, name:'RODRIGUEZ', role:'TEC. SISTEMAS',   sector:'C3', stress:8,  maxS:40, android:false },
  { id:4, name:'LIMA',      role:'PILOTO',          sector:'A2', stress:2,  maxS:40, android:false },
  { id:5, name:'SANTOS',    role:'SEGURANÇA',       sector:'B2', stress:10, maxS:40, android:false },
  { id:6, name:'OSEI',      role:'GEÓLOGO',         sector:'A1', stress:14, maxS:30, android:false },
  { id:7, name:'REEVES',    role:'TEC. CAMPO',      sector:'A2', stress:3,  maxS:40, android:true  },
];

const SHIP_SECTORS = ['A1','A2','A3','MAB','B1','B2','B3','MBC','C1','C2','C3'];
const SECTOR_GRID  = [
  ['A1','A2','A3'], ['MAB',null,null],
  ['B1','B2','B3'], ['MBC',null,null],
  ['C1','C2','C3'],
];

// ── TAB: JOGADORES ────────────────────────────────────────────────────────────

const TabJogadores = ({ players, onCommand }) => {
  const adj = (id, delta) => {
    if (onCommand) onCommand({ type: 'MASTER_ADJ_STRESS', targetPlayerId: id, delta });
  };
  const move = (id, sec) => {
    if (onCommand) onCommand({ type: 'MASTER_MOVE_PLAYER', targetPlayerId: id, sector: sec });
  };
  return (
    <div style={{flex:1,overflowY:'auto',scrollbarWidth:'thin'}}>
      <table style={{width:'100%', borderCollapse:'collapse', ...mo(12,MC.main)}}>
        <thead>
          <tr style={{borderBottom:`1px solid ${MC.dim}`}}>
            {['PERSONAGEM','SETOR','STRESS','AÇÕES'].map(h=>(
              <th key={h} style={{...mo(10,MC.dim,{letterSpacing:'.06em'}), textAlign:'left', padding:'6px 10px'}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map(p=>(
            <tr key={p.id} style={{borderBottom:`1px solid ${MC.ghost}`}}>
              <td style={{padding:'8px 10px'}}>
                <div style={vt(18,p.android?MC.cyan:MC.bright)}>{p.name}</div>
                <div style={mo(10,MC.dim)}>{p.role} {p.android&&<Tag col={MC.cyan}>ANDROID</Tag>}</div>
              </td>
              <td style={{padding:'8px 10px'}}>
                <select value={p.sector} onChange={e=>move(p.id,e.target.value)}
                  style={{...mo(11,MC.main), padding:'3px 6px', minWidth:'60px'}}>
                  {SHIP_SECTORS.filter(s=>!s.startsWith('M')||s==='MBC'||s==='MAB').map(s=>(
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td style={{padding:'8px 10px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <div style={{width:'100px', height:'10px', background:MC.ghost, position:'relative'}}>
                    <div style={{position:'absolute', left:0, height:'100%',
                      width:`${(p.stress/(p.stress_max||40))*100}%`,
                      background: p.stress/(p.stress_max||40)>0.7?MC.red:p.stress/(p.stress_max||40)>0.4?MC.amber:MC.main,
                    }}/>
                  </div>
                  <span style={vt(15,MC.dim)}>{p.stress}/{p.stress_max||40}</span>
                </div>
              </td>
              <td style={{padding:'8px 10px'}}>
                <div style={{display:'flex', gap:'6px'}}>
                  <Btn col={MC.amber} sz={15} onClick={()=>adj(p.id,1)}>+1</Btn>
                  <Btn col={MC.amber} sz={15} onClick={()=>adj(p.id,2)}>+2</Btn>
                  <Btn col={MC.dim}   sz={15} onClick={()=>adj(p.id,-1)}>-1</Btn>
                  <Btn col={MC.cyan}  sz={15}>VER PDT</Btn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── TAB: TRACKER ─────────────────────────────────────────────────────────────

const TabTracker = ({ players, organism, scavengers, onCommand, setOrganism }) => {
  const playerSectors = players.reduce((acc,p)=>({...acc,[p.sector]:[...(acc[p.sector]||[]), p.name[0]]}),{});

  const triggerHunt = (playerId) => {
    if (onCommand) onCommand({ type: 'MASTER_XENO_HUNT', targetPlayerId: playerId });
  };

  const moveOrganism = (sec) => {
    if (onCommand) onCommand({ type: 'MASTER_MOVE_ORGANISM', sector: sec });
  };

  return (
    <div style={{flex:1, display:'flex', gap:'0', overflow:'hidden'}}>
      {/* Left: ship map */}
      <div style={{flex:'0 0 55%', padding:'12px', borderRight:`1px solid ${MC.dim}`, overflowY:'auto', scrollbarWidth:'thin'}}>
        <div style={mo(10,MC.dim,{letterSpacing:'.06em', marginBottom:'10px'})}>MAPA DA NAVE — SETOR DO ORGANISMO: {organism.sector}</div>
        <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
          {SECTOR_GRID.map((row,ri)=>(
            <div key={ri} style={{display:'flex', gap:'4px'}}>
              {row.map((sec,ci)=>{
                if (!sec) return <div key={ci} style={{flex:1}}/>;
                const isMez = sec.startsWith('M');
                const hasOrg = organism.sector === sec;
                const pHere  = playerSectors[sec] || [];
                const sHere  = scavengers.filter(s=>s.alive&&s.sector===sec);
                return (
                  <div key={sec}
                    onClick={()=>!isMez&&moveOrganism(sec)}
                    style={{
                      flex: isMez?3:1, border:`1px solid ${hasOrg?MC.red:MC.dim}`,
                      background: hasOrg?'#1a0000':MC.ghost,
                      padding:'6px 8px', cursor:isMez?'default':'pointer',
                      minHeight:'52px', position:'relative',
                      boxShadow: hasOrg?`inset 0 0 12px ${MC.red}22`:'none',
                    }}>
                    <div style={vt(16, hasOrg?MC.red:MC.main)}>{sec}</div>
                    {hasOrg && <div style={{...vt(18,MC.red), textShadow:glow(MC.red), position:'absolute',top:'4px',right:'6px'}}>◆</div>}
                    {pHere.length>0 && (
                      <div style={{display:'flex', gap:'3px', flexWrap:'wrap', marginTop:'2px'}}>
                        {pHere.map((n,i)=><span key={i} style={{...mo(8,MC.bright), border:`1px solid ${MC.dim}`, padding:'1px 3px'}}>{n}</span>)}
                      </div>
                    )}
                    {sHere.length>0 && (
                      <div style={mo(8,MC.amber,{marginTop:'2px'})}>S×{sHere.length}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={mo(9,MC.dim,{marginTop:'8px'})}>Toque num setor para mover o organismo manualmente.</div>
      </div>

      {/* Right: controls */}
      <div style={{flex:1, padding:'12px', display:'flex', flexDirection:'column', gap:'10px', overflowY:'auto', scrollbarWidth:'thin'}}>
        {/* Organism status */}
        <div>
          <div style={mo(10,MC.dim,{letterSpacing:'.06em', marginBottom:'6px'})}>ORGANISMO</div>
          {[
            ['MODO',     organism.mode, organism.mode==='HUNT'?MC.red:MC.main],
            ['SETOR',    organism.sector, MC.main],
            ['MOVENDO',  organism.moving?'SIM':'NÃO', organism.moving?MC.amber:MC.dim],
          ].map(([k,v,c])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:`1px solid ${MC.ghost}`}}>
              <span style={mo(10,MC.dim)}>{k}:</span>
              <span style={{...vt(17,c),textShadow:c===MC.red?glow(MC.red):'none'}}>{v}</span>
            </div>
          ))}
          {organism.target && <div style={mo(10,MC.amber,{marginTop:'4px'})}>ALVO: {organism.target}</div>}
        </div>

        <HR />

        {/* Hunt buttons */}
        <div>
          <div style={mo(10,MC.dim,{letterSpacing:'.06em', marginBottom:'6px'})}>ENCONTRO MANUAL:</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
            {players.map(p=>(
              <Btn key={p.id} col={MC.red} sz={14} onClick={()=>triggerHunt(p.id)}>{p.name}</Btn>
            ))}
          </div>
        </div>

        <HR />

        {/* Scavengers */}
        <div>
          <div style={mo(10,MC.dim,{letterSpacing:'.06em', marginBottom:'6px'})}>SAQUEADORES:</div>
          {scavengers.map(s=>(
            <div key={s.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'4px 0', borderBottom:`1px solid ${MC.ghost}`, opacity:s.alive?1:.35}}>
              <div>
                <span style={vt(16, s.alive?MC.main:MC.dim)}>{s.name}</span>
                <span style={mo(10,MC.dim,{marginLeft:'8px'})}>{s.sector}</span>
              </div>
              <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                <span style={vt(14, s.alive?MC.bright:MC.dim)}>{s.alive?'◆':'◇'}</span>
                {s.alive && <Btn col={MC.red} sz={12} onClick={()=>onCommand({ type: 'MASTER_KILL_SCAVENGER', scavengerId: s.id })}>MATAR</Btn>}
              </div>
            </div>
          ))}
        </div>

        <HR />

        {/* Territory */}
        <div>
          <div style={mo(10,MC.dim,{letterSpacing:'.06em', marginBottom:'6px'})}>TERRITÓRIO DE PATRULHA:</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:'5px'}}>
            {['C1','C2','C3','MBC','B3'].map(s=>(
              <span key={s} style={{...mo(10,organism.territory.includes(s)?MC.bright:MC.dim),
                border:`1px solid ${organism.territory.includes(s)?MC.bright:MC.ghost}`,
                padding:'3px 7px', cursor:'pointer'}}
                onClick={()=>setOrganism(o=>({...o,territory:o.territory.includes(s)?o.territory.filter(x=>x!==s):[...o.territory,s]}))}
              >{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TAB: DOCS ─────────────────────────────────────────────────────────────────

const MASTER_DOCS = [
  { id:'MT-0934', title:'Log de manutenção', sector:'B1', level:1 },
  { id:'CG-C3-7', title:'Manifesto de carga', sector:'C3', level:1 },
  { id:'PARK-01', title:'Diário pessoal — Park', sector:'B2', level:1 },
  { id:'DOC-WY06', title:'Transmissão W-Y', sector:'COMMS', level:2 },
  { id:'REEVES-47', title:'Anotações técnicas', sector:'A2', level:2 },
];

const BATCH_EVENTS = [
  { label:'LOCKDOWN ATIVA',          docs:['DOC-WY06'], players:'todos' },
  { label:'CONTÊINER W-Y → TODOS',   docs:['CG-C3-7'],  players:'todos' },
  { label:'SAQUEADORES CHEGAM',       docs:['PARK-01'],  players:'todos' },
  { label:'ORGANISMO CONFIRMADO',     docs:['MT-0934'],  players:'todos' },
];

const TabDocs = ({ players, unlockedDocs, onCommand }) => {
  const unlock = (docId, playerId) => {
    if (onCommand) onCommand({ type: 'MASTER_UNLOCK_DOC', documentId: docId, targetPlayerId: playerId });
  };

  const unlockAll = (docId) => {
    if (onCommand) onCommand({ type: 'MASTER_UNLOCK_DOC', documentId: docId, targetPlayerId: 'TODOS' });
  };

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
      {/* Batch events */}
      <div style={{padding:'8px 12px', borderBottom:`1px solid ${MC.dim}`, flexShrink:0}}>
        <div style={mo(10,MC.dim,{letterSpacing:'.06em', marginBottom:'6px'})}>EVENTOS EM LOTE:</div>
        <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
          {BATCH_EVENTS.map(ev=>(
            <Btn key={ev.label} col={MC.amber} sz={13} onClick={()=>ev.docs.forEach(d=>unlockAll(d))}>
              [ {ev.label} ]
            </Btn>
          ))}
        </div>
      </div>
      {/* Doc table */}
      <div style={{flex:1, overflowY:'auto', scrollbarWidth:'thin'}}>
        <table style={{width:'100%', borderCollapse:'collapse', ...mo(12,MC.main)}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${MC.dim}`}}>
              <th style={{...mo(10,MC.dim,{letterSpacing:'.06em'}), textAlign:'left', padding:'6px 10px', minWidth:'160px'}}>DOCUMENTO</th>
              <th style={{...mo(10,MC.dim,{letterSpacing:'.06em'}), textAlign:'left', padding:'6px 10px'}}>SETOR</th>
              <th style={{...mo(10,MC.dim,{letterSpacing:'.06em'}), textAlign:'left', padding:'6px 10px'}}>ID</th>
              <th style={{...mo(10,MC.dim,{letterSpacing:'.06em'}), textAlign:'left', padding:'6px 10px'}}>LIBERAR PARA</th>
            </tr>
          </thead>
          <tbody>
            {MASTER_DOCS.map(doc=>(
              <tr key={doc.id} style={{borderBottom:`1px solid ${MC.ghost}`}}>
                <td style={{padding:'8px 10px'}}>
                  <div style={vt(16,MC.main)}>{doc.title}</div>
                  <div style={mo(9,MC.dim)}>Nível: {doc.level}</div>
                </td>
                <td style={{padding:'8px 10px'}}><Tag col={MC.dim}>{doc.sector}</Tag></td>
                <td style={{padding:'8px 10px'}}><span style={mo(10,MC.mid)}>{doc.id}</span></td>
                <td style={{padding:'8px 10px'}}>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'5px'}}>
                    {players.map(p=>{
                      const done = unlockedDocs.includes(doc.id);
                      return (
                        <Btn key={p.id} col={done?MC.bright:MC.main} sz={13}
                          onClick={()=>!done&&unlock(doc.id,p.id)}
                          style={{opacity:done?.7:1}}>
                          {p.name[0]}{p.name.slice(1,3).toLowerCase()} {done?'◆':'◇'}
                        </Btn>
                      );
                    })}
                    <Btn col={MC.amber} sz={13} onClick={()=>unlockAll(doc.id)}>TODOS</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── TAB: MSG ──────────────────────────────────────────────────────────────────

const TabMsg = ({ players, onCommand, chatHistory = [] }) => {
  const [dest,    setDest]    = React.useState('todos');
  const [voice,   setVoice]   = React.useState('seegson');
  const [text,    setText]    = React.useState('');
  const [noteText,setNoteText]= React.useState('');
  const [noteDest,setNoteDest]= React.useState(players[0]?.id || 1);
  const [sent,    setSent]    = React.useState([]);

  const send = (type) => {
    if (!text.trim() && type!=='note') return;
    if (!noteText.trim() && type==='note') return;
    
    if (type === 'mother') {
      onCommand({ type: 'MASTER_SEND_MOTHER', targetPlayerId: dest, voice, text });
    } else {
      onCommand({ type: 'MASTER_SEND_SECRET', targetPlayerId: noteDest, text: noteText });
    }

    setSent(s=>[...s, { type, dest: type==='note'?noteDest:dest, voice, text: type==='note'?noteText:text, time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }]);
    if (type==='note') setNoteText(''); else setText('');
  };

  const inputStyle = { width:'100%', border:`1px solid ${MC.dim}`, padding:'6px 8px',
    color:MC.main, resize:'vertical', minHeight:'64px', fontSize:'13px' };

  return (
    <div style={{flex:1, display:'flex', gap:'0', overflow:'hidden'}}>
      {/* Left: compose */}
      <div style={{flex:'0 0 50%', padding:'12px', borderRight:`1px solid ${MC.dim}`, display:'flex', flexDirection:'column', gap:'10px', overflowY:'auto', scrollbarWidth:'thin'}}>
        {/* M.O.T.H.E.R */}
        <div>
          <div style={mo(10,MC.cyan,{letterSpacing:'.06em', marginBottom:'8px'})}>⬡ M.O.T.H.E.R — TRANSMISSÃO DIRETA</div>
          <div style={{display:'flex', gap:'6px', marginBottom:'6px'}}>
            <div style={{flex:1}}>
              <div style={mo(9,MC.dim,{marginBottom:'3px'})}>DESTINATÁRIO:</div>
              <select value={dest} onChange={e=>setDest(e.target.value)} style={{width:'100%', padding:'4px 6px', fontSize:'12px'}}>
                <option value="todos">TODOS</option>
                {players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{flex:1}}>
              <div style={mo(9,MC.dim,{marginBottom:'3px'})}>VOZ:</div>
              <select value={voice} onChange={e=>setVoice(e.target.value)} style={{width:'100%', padding:'4px 6px', fontSize:'12px'}}>
                <option value="seegson">SEEGSON</option>
                <option value="wy">W-Y</option>
              </select>
            </div>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Mensagem da M.O.T.H.E.R..." style={inputStyle} />
          <Btn col={MC.cyan} sz={15} onClick={()=>send('mother')} style={{marginTop:'6px', width:'100%'}}>[ ENVIAR M.O.T.H.E.R ]</Btn>
        </div>

        <HR />

        {/* Secret note */}
        <div>
          <div style={mo(10,MC.dim,{letterSpacing:'.06em', marginBottom:'8px'})}>◈ NOTA SECRETA</div>
          <div style={{marginBottom:'6px'}}>
            <div style={mo(9,MC.dim,{marginBottom:'3px'})}>DESTINATÁRIO:</div>
            <select value={noteDest} onChange={e=>setNoteDest(+e.target.value)} style={{width:'100%', padding:'4px 6px', fontSize:'12px'}}>
              {players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Nota privada (só o jogador vê)..." style={{...inputStyle, borderColor:MC.dim, color:MC.main}} />
          <Btn col={MC.main} sz={15} onClick={()=>send('note')} style={{marginTop:'6px', width:'100%'}}>[ ENVIAR NOTA SECRETA ]</Btn>
        </div>
      </div>

      {/* Middle: Chat Log */}
      <div style={{flex:1, padding:'12px', overflowY:'auto', scrollbarWidth:'thin', borderLeft:`1px solid ${MC.ghost}`, borderRight:`1px solid ${MC.ghost}`}}>
        <div style={mo(10,MC.dim,{letterSpacing:'.06em', marginBottom:'8px'})}>HISTÓRICO DO COMMS:</div>
        {chatHistory.length===0 && <div style={mo(11,MC.ghost)}>Nenhuma mensagem captada.</div>}
        {chatHistory.map((m,i)=>(
          <div key={i} style={{padding:'4px 0', borderBottom:`1px solid ${MC.ghost}44`}}>
            <span style={mo(10,MC.dim)}>[{m.time}] </span>
            <span style={vt(16, m.channel==='W-Y'?MC.wy:MC.bright)}>{m.sender}: </span>
            <span style={vt(16, m.channel==='W-Y'?MC.wy:MC.main)}>{m.text}</span>
          </div>
        ))}
      </div>

      {/* Right: sent log */}
      <div style={{flex:1, padding:'12px', overflowY:'auto', scrollbarWidth:'thin'}}>
        <div style={mo(10,MC.dim,{letterSpacing:'.06em', marginBottom:'8px'})}>MENSAGENS ENVIADAS:</div>
        {sent.length===0 && <div style={mo(11,MC.ghost)}>Nenhuma mensagem enviada ainda.</div>}
        {[...sent].reverse().map((m,i)=>(
          <div key={i} style={{borderBottom:`1px solid ${MC.ghost}`, padding:'6px 0', marginBottom:'4px'}}>
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <Tag col={m.type==='mother'?MC.cyan:MC.dim}>{m.type==='mother'?'MOTHER':'NOTA'}</Tag>
              <span style={mo(10,MC.dim)}>{m.time}</span>
              <span style={mo(10,MC.mid)}>{typeof m.dest==='number'?players.find(p=>p.id===m.dest)?.name:'TODOS'}</span>
            </div>
            <div style={{...vt(15,m.type==='mother'?(m.voice==='wy'?MC.wy:MC.cyan):MC.main), marginTop:'4px', lineHeight:1.5}}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── TAB: ALERTAS ──────────────────────────────────────────────────────────────

const TabAlertas = ({ players, onCommand }) => {
  const [alertMsg,  setAlertMsg]  = React.useState('');
  const [alertSec,  setAlertSec]  = React.useState('B1');
  const [cdText,    setCdText]    = React.useState('AUTODESTRUIÇÃO');
  const [cdMins,    setCdMins]    = React.useState(15);
  const [cdRunning, setCdRunning] = React.useState(false);

  const startAlert = (global) => {
    onCommand({
      type: 'MASTER_SEND_MOTHER',
      targetPlayerId: global ? 'TODOS' : alertSec,
      voice: 'seegson',
      text: `ALERTA: ${alertMsg}`
    });
    // Also vibrate
    onCommand({ type: 'MASTER_VIBRATE', targetPlayerId: global ? 'TODOS' : alertSec });
  };

  const toggleCD = () => {
    if (!cdRunning) {
      onCommand({ type: 'MASTER_COUNTDOWN', text: cdText, duration: cdMins * 60, targetPlayerId: 'TODOS' });
    }
    setCdRunning(!cdRunning);
  };

  const runTool = (tool, target) => {
    if (tool === 'VIBRAÇÃO SILENCIOSA') {
      onCommand({ type: 'MASTER_VIBRATE', targetPlayerId: target });
    }
    // other tools can be added here
  };

  return (
    <div style={{flex:1, overflowY:'auto', scrollbarWidth:'thin', padding:'12px', display:'flex', flexDirection:'column', gap:'14px'}}>

      {/* Quick alert */}
      <div>
        <div style={mo(10,MC.red,{letterSpacing:'.06em', marginBottom:'8px'})}>⚠ ALERTA RÁPIDO</div>
        <div style={{display:'flex', gap:'8px', marginBottom:'6px', flexWrap:'wrap'}}>
          <div>
            <div style={mo(9,MC.dim,{marginBottom:'3px'})}>SETOR:</div>
            <select value={alertSec} onChange={e=>setAlertSec(e.target.value)} style={{padding:'4px 6px', fontSize:'12px'}}>
              {['A1','A2','A3','B1','B2','B3','C1','C2','C3','TODOS'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <input type="text" value={alertMsg} onChange={e=>setAlertMsg(e.target.value)}
          placeholder="Mensagem do alerta..."
          style={{width:'100%', padding:'6px 8px', marginBottom:'8px', fontSize:'13px', border:`1px solid ${MC.red}`, color:MC.red}} />
        <div style={{display:'flex', gap:'8px'}}>
          <Btn col={MC.red} sz={15} style={{flex:1}} onClick={()=>startAlert(false)}>[ DISPARAR SETOR {alertSec} ]</Btn>
          <Btn col={MC.red} sz={15} style={{flex:1}} onClick={()=>startAlert(true)}>[ DISPARAR GLOBAL ]</Btn>
        </div>
      </div>

      <HR col={MC.dim} />

      {/* Countdown */}
      <div>
        <div style={mo(10,MC.amber,{letterSpacing:'.06em', marginBottom:'8px'})}>⏱ COUNTDOWN</div>
        <div style={{display:'flex', gap:'8px', marginBottom:'6px', alignItems:'flex-end'}}>
          <div style={{flex:2}}>
            <div style={mo(9,MC.dim,{marginBottom:'3px'})}>TEXTO:</div>
            <input value={cdText} onChange={e=>setCdText(e.target.value)} style={{width:'100%', padding:'4px 6px', fontSize:'13px'}}/>
          </div>
          <div>
            <div style={mo(9,MC.dim,{marginBottom:'3px'})}>MINUTOS:</div>
            <input type="number" value={cdMins} onChange={e=>setCdMins(+e.target.value)} min={1} max={99}
              style={{width:'60px', padding:'4px 6px', fontSize:'13px'}}/>
          </div>
        </div>
        <Btn col={cdRunning?MC.dim:MC.amber} sz={15} onClick={toggleCD} style={{width:'100%'}}>
          {cdRunning?'[ PARAR COUNTDOWN ]':'[ INICIAR COUNTDOWN ]'}
        </Btn>
      </div>

      <HR col={MC.dim} />

      {/* PDT Tools */}
      <div>
        <div style={mo(10,MC.dim,{letterSpacing:'.06em', marginBottom:'10px'})}>FERRAMENTAS DE PDT</div>
        {[
          { label:'VIBRAÇÃO SILENCIOSA', desc:'Enviar alerta sem texto' },
          { label:'BLOQUEAR ABA',        desc:'Suspender acesso a uma aba' },
          { label:'REVELAR POSIÇÃO',     desc:'Mostrar localização de jogador' },
          { label:'CORROMPER DOCUMENTO', desc:'Alterar texto de um documento' },
        ].map(tool=>(
          <div key={tool.label} style={{display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'8px 0', borderBottom:`1px solid ${MC.ghost}`}}>
            <div>
              <div style={vt(16,MC.main)}>{tool.label}</div>
              <div style={mo(9,MC.dim)}>{tool.desc}</div>
            </div>
            <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
              <select id={`tool-target-${tool.label}`} style={{padding:'3px 5px', fontSize:'11px', minWidth:'80px'}}>
                <option value="TODOS">TODOS</option>
                {players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Btn col={MC.amber} sz={13} onClick={() => {
                const target = document.getElementById(`tool-target-${tool.label}`).value;
                runTool(tool.label, target);
              }}>EXECUTAR</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── TAB: SISTEMAS ─────────────────────────────────────────────────────────────


const MASTER_SYSTEMS = [
  { id:'reactor',     label:'REACTOR',          sector:'C1'  },
  { id:'power_grid',  label:'POWER GRID',        sector:'C1'  },
  { id:'lifepods',    label:'LIFEPODS / DOCA',   sector:'C3'  },
  { id:'door_ctrl',   label:'DOOR CONTROL',      sector:'C3'  },
  { id:'comms_lr',    label:'COMMS LONGA DIST.', sector:'A1'  },
  { id:'comms_local', label:'COMMS LOCAL',        sector:'A2'  },
  { id:'life_support',label:'LIFE SUPPORT',       sector:'B1'  },
  { id:'lighting',    label:'LIGHTING',           sector:'MBC' },
  { id:'motion_tracker', label:'MOTION TRACKER',     sector:'B_corridors' },
];

const TabSistemas = ({ players, unlockedSystems, onCommand }) => {
  const unlock = (sysId, playerId) => {
    // Find the system object to get its sector
    const sys = MASTER_SYSTEMS.find(s => s.id === sysId);
    if (!sys) return;
    if (onCommand) onCommand({ type: 'MASTER_UNLOCK_SYS', sector: sys.sector, systemId: sysId, targetPlayerId: playerId });
  };

  return (
    <div style={{flex:1, overflowY:'auto', scrollbarWidth:'thin'}}>
      <table style={{width:'100%', borderCollapse:'collapse', ...mo(12,MC.main)}}>
        <thead>
          <tr style={{borderBottom:`1px solid ${MC.dim}`, position:'sticky', top:0, background:MC.black}}>
            <th style={{...mo(10,MC.dim,{letterSpacing:'.06em'}), textAlign:'left', padding:'6px 10px', minWidth:'140px'}}>SISTEMA</th>
            <th style={{...mo(10,MC.dim,{letterSpacing:'.06em'}), textAlign:'left', padding:'6px 10px', width:'60px'}}>SETOR</th>
            <th style={{...mo(10,MC.dim,{letterSpacing:'.06em'}), textAlign:'left', padding:'6px 10px'}}>LIBERAR PAINEL PARA</th>
          </tr>
        </thead>
        <tbody>
          {MASTER_SYSTEMS.map(sys=>(
            <tr key={sys.id} style={{borderBottom:`1px solid ${MC.ghost}`}}>
              <td style={{padding:'8px 10px'}}><div style={vt(16,MC.main)}>{sys.label}</div></td>
              <td style={{padding:'8px 10px'}}><Tag col={MC.dim}>{sys.sector}</Tag></td>
              <td style={{padding:'8px 10px'}}>
                <div style={{display:'flex', flexWrap:'wrap', gap:'5px'}}>
                  {players.map(p=>{
                    const done = unlockedSystems[sys.sector]?.[sys.id];
                    return (
                      <Btn key={p.id} col={done?MC.bright:MC.dim} sz={13}
                        onClick={()=>!done&&unlock(sys.id,p.id)}
                        style={{opacity:done?.8:1}}>
                        {p.name.slice(0,3)} {done?'◆':'◇'}
                      </Btn>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── MASTER APP ────────────────────────────────────────────────────────────────

const MasterApp = () => {
  const [tab,       setTab]       = React.useState('jogadores');
  const [players,   setPlayers]   = React.useState([]);
  const [organism,  setOrganism]  = React.useState({
    sector:'C2', mode:'PATRULHA', moving:false, target:null, territory:['C1','C2','C3','MBC'],
  });
  const [scavengers,setScavengers]= React.useState([]);
  const [unlockedSystems, setUnlockedSystems] = React.useState({});
  const [unlockedDocs, setUnlockedDocs]       = React.useState([]);
  const [chatHistory,  setChatHistory]        = React.useState([]);
  const [debugLog,     setDebugLog]           = React.useState([]);
  const [time, setTime]                       = React.useState('');
  const [ws, setWs]                           = React.useState(null);

  const forceSync = () => {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'MASTER_REQUEST_SYNC' }));
    }
  };

  React.useEffect(() => {
    let socket = null;
    let reconnectTimer = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}`);
      
      socket.onopen = () => {
        console.log('[MASTER] Connected');
        setDebugLog(prev => [`[${new Date().toLocaleTimeString()}] [SISTEMA] Conectado. Enviando MASTER_AUTH...`, ...prev]);
        socket.send(JSON.stringify({ type: 'MASTER_AUTH', key: 'alienfofinho123' }));
      };

      socket.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        setDebugLog(prev => [JSON.stringify(msg).slice(0, 100) + '...', ...prev].slice(0, 10));

        if (msg.type === 'FULL_STATE') {
          const s = msg.state;
          if (s.players) {
            const pArray = Object.keys(s.players).map(idStr => ({
              id: s.players[idStr].id || idStr,
              ...s.players[idStr]
            }));
            setPlayers(pArray);
          }
          if (s.organism) {
            setOrganism({
              sector: s.organism.currentSector,
              mode: s.organism.mode.toUpperCase(),
              moving: s.organism.isMoving,
              target: s.organism.huntTarget,
              territory: s.organism.territory
            });
          }
          if (s.scavengers) {
            setScavengers(s.scavengers.map(sc => ({
              id: sc.id, name: sc.name, sector: sc.currentSector, alive: sc.alive
            })));
          }
          if (s.unlockedSystems) setUnlockedSystems(s.unlockedSystems);
          if (s.unlockedDocs)    setUnlockedDocs(s.unlockedDocs);
        }
        
        if (msg.type === 'MASTER_TRACKER_UPDATE') {
          setOrganism({
            sector: msg.organism.currentSector,
            mode: msg.organism.mode.toUpperCase(),
            moving: msg.organism.isMoving,
            target: msg.organism.huntTarget,
            territory: msg.organism.territory
          });
          setScavengers(msg.scavengers.map(sc => ({
            id: sc.id, name: sc.name, sector: sc.currentSector, alive: sc.alive
          })));
        }

        if (msg.type === 'COMMS_MESSAGE') {
          setChatHistory(prev => [...prev, msg.message]);
        }
      };

      socket.onclose = () => {
        console.log('[MASTER] Disconnected. Retrying...');
        reconnectTimer = setTimeout(connect, 3000);
      };

      setWs(socket);
    };

    connect();
    const iv = setInterval(()=>setTime(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})),1000);
    
    return () => {
      clearInterval(iv);
      if (socket) socket.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  const sendCmd = (msg) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  const TABS = [
    {id:'jogadores', label:'JOGADORES'},
    {id:'tracker',   label:'TRACKER'},
    {id:'docs',      label:'DOCS'},
    {id:'msg',       label:'MSG'},
    {id:'alertas',   label:'ALERTAS'},
    {id:'sistemas',  label:'SISTEMAS'},
    {id:'sistema',   label:'SISTEMA'},
  ];

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh', background:MC.black, color:MC.main}}>
      {/* Top bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'6px 16px', borderBottom:`1px solid ${MC.dim}`,
        flexShrink:0, minHeight:'40px', background:MC.black,
      }}>
        <div>
          <span style={{...vt(20,MC.bright), textShadow:glow(MC.bright)}}>MERIDIAN MASTER CONTROL</span>
          <span style={{...mo(10,MC.dim), marginLeft:'16px'}}>ᗢᗴᗴGᔕON ᔕYᔕTᗴMᔕ v4.1</span>
        </div>
        <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
          <span style={mo(12,MC.main)}>{time}</span>
          <span style={{...mo(10,MC.bright), border:`1px solid ${MC.bright}`, padding:'2px 8px',
            textShadow:glow(MC.bright)}}>SESSÃO ATIVA</span>
          <a href="pdt.html" target="_blank" style={{...mo(10,MC.mid), textDecoration:'none',
            border:`1px solid ${MC.dim}`, padding:'2px 8px'}}>↗ PDT</a>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display:'flex', borderBottom:`1px solid ${MC.dim}`, flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            ...vt(16, tab===t.id?MC.bright:MC.dim),
            background:'transparent', border:'none',
            borderBottom:`2px solid ${tab===t.id?MC.bright:'transparent'}`,
            padding:'8px 20px', cursor:'pointer', minHeight:'38px',
            textShadow:tab===t.id?glow(MC.bright):'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        {tab==='jogadores' && <TabJogadores players={players} onCommand={sendCmd} />}
        {tab==='tracker'   && <TabTracker   players={players} organism={organism} scavengers={scavengers} onCommand={sendCmd} setOrganism={setOrganism} />}
        {tab==='docs'      && <TabDocs      players={players} unlockedDocs={unlockedDocs} onCommand={sendCmd} />}
        {tab==='msg'       && <TabMsg       players={players} chatHistory={chatHistory} onCommand={sendCmd} />}
        {tab==='alertas'   && <TabAlertas   players={players} onCommand={sendCmd} />}
        {tab==='sistemas'  && <TabSistemas  players={players} unlockedSystems={unlockedSystems} onCommand={sendCmd} />}
        {tab === 'sistema' && (
          <div style={{padding:'20px', color:MC.main, fontFamily:'monospace', fontSize:'12px', overflowY:'auto', flex:1}}>
            <div style={{color:MC.cyan, marginBottom:'10px', fontSize:'14px'}}>LOG DE COMUNICAÇÃO (Últimos 10 pacotes):</div>
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              {debugLog.map((l,i) => (
                <div key={i} style={{padding:'8px', background:'#001a08', borderLeft:`2px solid ${MC.dim}`, wordBreak:'break-all'}}>
                  <span style={{color:MC.dim}}>[{i}]</span> {l}
                </div>
              ))}
              {debugLog.length === 0 && <div style={{color:MC.dim}}>Aguardando primeiro pacote... Clique em 'FORÇAR SINCRONISMO' no rodapé.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<MasterApp />);
