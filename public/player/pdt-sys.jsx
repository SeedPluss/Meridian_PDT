// pdt-sys.jsx — Systems screen: full 9 systems, panel unlock, minigame routing, android diagnostic

const ALL_SYSTEMS = [
  { id:'reactor',     label:'REACTOR',          sector:'C1',     mg:'MinigameReactor',      online:false, locked:false, repairing:false, skill:'Tecnologia', diff:'ALTA',   switches:6, timer:90  },
  { id:'power_grid',  label:'POWER GRID',        sector:'C1',     mg:'MinigamePowerGrid',    online:false, locked:true,  repairing:false, skill:'Tecnologia', diff:'ALTA',   switches:5, timer:75  },
  { id:'lifepods',    label:'LIFEPODS / DOCA',   sector:'C3',     mg:'MinigameLifepods',     online:false, locked:true,  repairing:false, skill:'Pilotagem',  diff:'NORMAL', switches:4, timer:90  },
  { id:'door_ctrl',   label:'DOOR CONTROL',      sector:'C3',     mg:'MinigameDoorControl',  online:false, locked:false, repairing:false, skill:'Tecnologia', diff:'NORMAL', switches:4, timer:90  },
  { id:'comms_lr',    label:'COMMS LONGA DIST.', sector:'A1',     mg:'MinigameCommsLR',      online:false, locked:false, repairing:true,  skill:'Percepção',  diff:'ALTA',   switches:5, timer:90  },
  { id:'comms_local', label:'COMMS LOCAL',        sector:'A2',     mg:'MinigameCommsLocal',   online:true,  locked:false, repairing:false, skill:'Tecnologia', diff:'NORMAL', switches:4, timer:90  },
  { id:'life_support',label:'LIFE SUPPORT',       sector:'B1',     mg:'MinigameLifeSupport',  online:true,  locked:false, repairing:false, skill:'Ciência',    diff:'ALTA',   switches:6, timer:120 },
  { id:'lighting',    label:'LIGHTING',           sector:'MBC',    mg:'MinigameLighting',     online:false, locked:false, repairing:false, skill:'Maquinaria', diff:'NORMAL', switches:3, timer:90  },
  { id:'tracker',     label:'MOTION TRACKER',     sector:'B-CORR', mg:'MinigameMotionTracker',online:false, locked:false, repairing:false, skill:'Tecnologia', diff:'NORMAL', switches:3, timer:60  },
];

const SECTOR_ORDER = ['C1','C3','A1','A2','B1','MBC','B-CORR'];

// Group by sector
const bySector = SECTOR_ORDER.map(s => ({
  sector: s,
  systems: ALL_SYSTEMS.filter(sys => sys.sector === s),
}));

// ── Narrative revelations ──────────────────────────────────────────────────────

const REVELATIONS = {
  power_grid: '⚠ ANOMALIA DETECTADA\nSETOR C2 — PORÃO DE CARGA\nBIOMASS CONDUTIVA: NÃO CATALOGADA',
  life_support: '⚠ ANOMALIA SETOR C2\nBIOMASS DESCONHECIDA — TEMP +4.2°C\nRECOMENDAÇÃO: NÃO INVESTIGAR SOZINHO',
  comms_local: '◆ FREQUÊNCIA DEFINIDA: 847.3 MHz\nGuarde este valor. Outros membros\nprecisarão para acessar o canal.',
  comms_lr: '◆ TRANSMISSÃO W-Y RECEBIDA\nDOC-WY06 desbloqueado em DOCS.',
  reactor: '◆ REATOR ESTÁVEL — 87% CAPACIDADE\nEstimativa de operação: 72h',
};

// ── Android diagnostic data ────────────────────────────────────────────────────

const ANDROID_DIAG = {
  reactor:      { temp:'3.2°C', integrity:34, time:'4-6 min', warning:true  },
  power_grid:   { temp:'4.8°C', integrity:41, time:'3-4 min', warning:true  },
  lifepods:     { temp:'2.1°C', integrity:67, time:'2-3 min', warning:false },
  door_ctrl:    { temp:'3.0°C', integrity:52, time:'2-3 min', warning:false },
  comms_lr:     { temp:'2.4°C', integrity:28, time:'5-7 min', warning:true  },
  comms_local:  { temp:'2.7°C', integrity:61, time:'2-3 min', warning:false },
  life_support: { temp:'2.9°C', integrity:45, time:'4-5 min', warning:true  },
  lighting:     { temp:'1.8°C', integrity:73, time:'3-4 min', warning:false },
  tracker:      { temp:'2.2°C', integrity:58, time:'1-2 min', warning:false },
};

// ── SysList ────────────────────────────────────────────────────────────────────

const SysList = ({ onRepair, onUnlock, isAndroid, shipSystems }) => {
  const mergedSystems = ALL_SYSTEMS.map(sys => {
    if (shipSystems && shipSystems[sys.id]) {
      return { ...sys, ...shipSystems[sys.id] };
    }
    return sys;
  });

  const bySectorDynamic = SECTOR_ORDER.map(s => ({
    sector: s,
    systems: mergedSystems.filter(sys => sys.sector === s),
  }));

  return (
  <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
    <div style={{ padding:'8px 14px 6px', flexShrink:0 }}>
      <div style={vt(22, C.main)}>SISTEMAS — TODOS OS SETORES</div>
    </div>
    <HRule />
    {isAndroid && (
      <div style={{ padding:'8px 14px', borderBottom:`1px solid ${C.ghost}`, background:`${C.ghost}` }}>
        <div style={mono(10, C.cyan, { letterSpacing:'0.04em' })}>◈ MODO ANDROID — DIAGNÓSTICO AVANÇADO ATIVO</div>
      </div>
    )}
    <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none' }}>
      {bySectorDynamic.map(({ sector, systems }) => (
        <React.Fragment key={sector}>
          <SectorLabel color={C.dim}>{sector}</SectorLabel>
          {systems.map(sys => (
            <div key={sys.id} style={{
              padding:'12px 14px', borderBottom:`1px solid ${C.ghost}`,
              display:'flex', flexDirection:'column', gap:'6px',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'6px' }}>
                <span style={{ ...vt(18, sys.online?C.main:sys.repairing?C.amber:sys.locked?C.dim:C.dim),
                  flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {sys.label}
                </span>
                <span style={{ ...vt(16, sys.online?C.bright:sys.repairing?C.amber:C.dim),
                  textShadow:sys.online?glow(C.bright):'none', whiteSpace:'nowrap', flexShrink:0 }}>
                  {sys.online ? <><StatusDot online large /> ONLINE</>
                   : sys.repairing ? '⚙ EM REPARO'
                   : <><StatusDot online={false} /> OFFLINE</>}
                </span>
              </div>
              {sys.locked && !sys.online && !sys.repairing && (
                <div style={mono(10, C.dim, { letterSpacing:'0.04em' })}>⚿ Painel não acessado</div>
              )}
              {!sys.online && !sys.repairing && !sys.locked && (
                <PDTButton variant="amber" onClick={() => onRepair(sys)}
                  style={{ padding:'8px 16px', fontSize:'17px', whiteSpace:'nowrap', alignSelf:'flex-start' }}>
                  [ INICIAR REPARO ]
                </PDTButton>
              )}
            </div>
          ))}
        </React.Fragment>
      ))}
      {/* Android: team location */}
      {isAndroid && (
        <div style={{ padding:'12px 14px', borderTop:`1px solid ${C.dim}`, marginTop:'8px' }}>
          <div style={{ ...vt(18, C.cyan), marginBottom:'8px' }}>◈ LOCALIZAÇÃO DA EQUIPE</div>
          {[
            { name:'KOWALSKI', sector:'C1', time:'11:04' },
            { name:'CHEN',     sector:'B1', time:'11:07' },
            { name:'RODRIGUEZ',sector:'C3', time:'11:02' },
            { name:'LIMA',     sector:'A2', time:'11:09' },
            { name:'SANTOS',   sector:'B2', time:'11:05' },
            { name:'OSEI',     sector:'A1', time:'11:08' },
          ].map(p=>(
            <div key={p.name} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0',
              borderBottom:`1px solid ${C.ghost}` }}>
              <span style={vt(17,C.cyan)}>{p.name}</span>
              <span style={mono(10,C.dim)}>{p.sector} — {p.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
  );
};

// ── SysBriefing ────────────────────────────────────────────────────────────────

const SysBriefing = ({ system, onStart, onCancel, isAndroid }) => {
  const diag = ANDROID_DIAG[system.id];
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${C.dim}` }}>
        <div style={vt(22, C.main)}>INICIANDO REPARO</div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'16px 14px', scrollbarWidth:'none' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          <div style={mono(10,C.dim,{letterSpacing:'0.06em'})}>SISTEMA:</div>
          <div style={{ ...vt(22,C.bright), textShadow:glow(C.bright) }}>
            {system.label} — {system.sector}
          </div>
          <AsciiRule />
          {[
            ['SKILL',        system.skill],
            ['DIFICULDADE',  system.diff],
            ['FASES',        String(system.switches)],
            ['TIMER',        `${system.timer} segundos`],
          ].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={mono(10,C.dim,{letterSpacing:'0.06em'})}>{k}:</span>
              <span style={vt(19,C.main)}>{v}</span>
            </div>
          ))}

          {/* Android diagnostic */}
          {isAndroid && diag && (
            <>
              <AsciiRule />
              <div style={{ border:`1px solid ${C.cyan}`, padding:'10px 12px',
                background:`${C.ghost}`, display:'flex', flexDirection:'column', gap:'6px' }}>
                <div style={mono(10,C.cyan,{letterSpacing:'0.06em'})}>◈ DIAGNÓSTICO ANDROID</div>
                {[
                  ['TEMP. SETOR',      `${diag.temp}`],
                  ['INTEGRIDADE',      `${diag.integrity}%`],
                  ['TEMPO ESTIMADO',   diag.time],
                ].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={mono(10,C.dim)}>{k}:</span>
                    <span style={vt(17,C.cyan)}>{v}</span>
                  </div>
                ))}
                {diag.warning && (
                  <div style={{ ...mono(10,C.amber), marginTop:'4px' }}>
                    ⚠ RISCO DE FALHA — SISTEMA CRÍTICO
                  </div>
                )}
              </div>
            </>
          )}
          <AsciiRule />
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'8px' }}>
            <PDTButton variant="bright" onClick={onStart} fullWidth>[ INICIAR REPARO ]</PDTButton>
            <PDTButton variant="ghost"  onClick={onCancel} fullWidth>[ CANCELAR ]</PDTButton>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── SysResult ──────────────────────────────────────────────────────────────────

const SysResult = ({ success, system, duration, attempts, onBack }) => (
  <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
    <div style={{ padding:'8px 14px 6px', flexShrink:0, borderBottom:`1px solid ${success?C.bright:C.red}` }}>
      <div style={{ ...vt(24,success?C.bright:C.red), textShadow:success?glow(C.bright):glow(C.red) }}>
        {success?'REPARO CONCLUÍDO':'REPARO FALHOU'}
      </div>
    </div>
    <div style={{ flex:1, overflowY:'auto', padding:'20px 14px', scrollbarWidth:'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
        <StatusDot online={success} large />
        <span style={vt(19,success?C.main:C.dim)}>{system?.label}: {success?'ONLINE':'OFFLINE'}</span>
      </div>
      <AsciiRule />
      {success ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', margin:'12px 0' }}>
          {duration && <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={mono(10,C.dim)}>DURAÇÃO:</span>
            <span style={vt(18,C.main)}>{duration}</span>
          </div>}
          {attempts && <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={mono(10,C.dim)}>TENTATIVAS:</span>
            <span style={vt(18,C.main)}>{attempts}/3</span>
          </div>}
          {REVELATIONS[system?.id] && (
            <div style={{ marginTop:'12px', border:`1px solid ${C.dim}`, padding:'10px',
              background:C.ghost }}>
              <pre style={{ ...vt(16,C.amber), whiteSpace:'pre-wrap', lineHeight:1.55 }}>
                {REVELATIONS[system.id]}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', margin:'12px 0' }}>
          <div style={vt(17,C.mid)}>Tentativas esgotadas.</div>
          <div style={vt(17,C.dim)}>Sistema permanece offline.</div>
          <div style={{ marginTop:'8px', ...vt(16,C.mid) }}>O barulho pode ter chamado atenção.</div>
          <div style={{ marginTop:'10px', ...vt(22,C.red), textShadow:glow(C.red) }}>+1 STRESS</div>
        </div>
      )}
      <AsciiRule />
      <div style={{ marginTop:'16px' }}>
        <PDTButton variant={success?'bright':'normal'} onClick={onBack} fullWidth>[ VOLTAR ]</PDTButton>
      </div>
    </div>
  </div>
);

// ── SysScreen orchestrator ─────────────────────────────────────────────────────

const SysScreen = ({ sysState, setSysState, isAndroid, shipSystems, onRepairCommand }) => {
  const [selectedSys,  setSelectedSys]  = React.useState(null);
  const [repairResult, setRepairResult] = React.useState(null);
  const startTimeRef = React.useRef(null);

  const handleRepair  = (sys) => { setSelectedSys(sys); setSysState('briefing'); };
  const handleStart   = () => { startTimeRef.current = Date.now(); setSysState('minigame'); };
  const handleCancel  = () => setSysState('list');

  const handleSuccess = () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const m = Math.floor(elapsed/60), s = elapsed%60;
    setRepairResult({ success:true, duration:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`, attempts:'1' });
    if (onRepairCommand) onRepairCommand(selectedSys.id, 'success');
    setSysState('success');
  };

  const handleFailure = () => {
    setRepairResult({ success:false });
    if (onRepairCommand) onRepairCommand(selectedSys.id, 'failure');
    setSysState('failure');
  };

  if (sysState === 'briefing') {
    return <SysBriefing system={selectedSys||ALL_SYSTEMS[0]} onStart={handleStart} onCancel={handleCancel} isAndroid={isAndroid} />;
  }

  if (sysState === 'minigame') {
    const MG = selectedSys?.mg ? window[selectedSys.mg] : null;
    if (!MG) return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', padding:'20px' }}>
        <div style={vt(20, C.amber)}>MINIGAME CARREGANDO...</div>
        <PDTButton variant="dim" onClick={handleCancel}>[ VOLTAR ]</PDTButton>
      </div>
    );
    return <MG onSuccess={handleSuccess} onFailure={handleFailure} isAndroid={isAndroid} />;
  }

  if (sysState === 'success') {
    return <SysResult success system={selectedSys} duration={repairResult?.duration} attempts={repairResult?.attempts} onBack={()=>setSysState('list')} />;
  }

  if (sysState === 'failure') {
    return <SysResult success={false} system={selectedSys} onBack={()=>setSysState('list')} />;
  }

  return <SysList onRepair={handleRepair} isAndroid={isAndroid} shipSystems={shipSystems} />;
};

Object.assign(window, { SysScreen });
