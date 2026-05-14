// pdt-tab-security.jsx — Protocolos de Segurança (Oficial de Segurança)

const pdtSend = (obj) => { if (window.__pdtSend) window.__pdtSend(obj); };

const SecurityTab = ({ level, data, character }) => {
  const [lockdownActive, setLockdownActive]     = React.useState(false);
  const [sirenActive, setSirenActive]           = React.useState(false);
  const [containmentPending, setContainPending] = React.useState(false);

  const caches       = data?.emergencyCaches      || [];
  const doors        = data?.securityDoors        || [];
  const routes       = data?.evacuationRoutes     || [];
  const history      = data?.lockdownHistory      || [];
  const restricted   = data?.restrictedCompartments || [];
  const containMaps  = data?.containmentMaps      || [];

  React.useEffect(() => {
    if (!lockdownActive) return;
    const t = setTimeout(() => setLockdownActive(false), 180000);
    return () => clearTimeout(t);
  }, [lockdownActive]);

  React.useEffect(() => {
    if (!sirenActive) return;
    const t = setTimeout(() => setSirenActive(false), 30000);
    return () => clearTimeout(t);
  }, [sirenActive]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px 6px', flexShrink: 0 }}>
        <div style={vt(20, C.main)}>PROTOCOLOS DE SEGURANÇA</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={mono(10, C.dim)}>NÓ: {level >= 3 && data?.nodeOnline ? <span style={{ color: C.bright }}>ONLINE</span> : 'OFFLINE'}</span>
          <span style={mono(10, C.dim)}>ACESSO NÍV. {level}</span>
        </div>
      </div>
      <HRule />

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'none' }}>

        {/* Always: historical data */}
        {containMaps.length > 0 && (
          <>
            <div style={mono(10, C.dim)}>MAPAS DE CONTENÇÃO (HISTÓRICO):</div>
            {containMaps.map(m => (
              <div key={m.sector} style={{ border: `1px solid ${C.ghost}`, padding: '6px 8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={vt(15, C.dim)}>{m.sector} — {m.label}</span>
                <span style={mono(9, C.ghost)}>{m.status}</span>
              </div>
            ))}
          </>
        )}

        {/* Emergency caches */}
        <div style={mono(10, C.dim)}>CACHES DE EMERGÊNCIA:</div>
        {caches.map(cache => (
          <div key={cache.id} style={{ border: `1px solid ${cache.unlocked ? C.bright : C.dim}`, padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={vt(15, C.main)}>{cache.label}</div>
              <div style={mono(9, C.dim)}>SETOR {cache.sector}</div>
            </div>
            {level >= 2 ? (
              <button
                onClick={() => pdtSend({ type: 'SECURITY_CACHE_UNLOCK', cacheId: cache.id })}
                disabled={cache.unlocked}
                style={{ ...vt(13, cache.unlocked ? C.bright : C.main), background: 'transparent', border: `1px solid ${cache.unlocked ? C.bright : C.dim}`, padding: '4px 8px', cursor: cache.unlocked ? 'default' : 'pointer' }}>
                {cache.unlocked ? '◆ ABERTO' : 'ABRIR'}
              </button>
            ) : (
              <span style={mono(9, C.ghost)}>[LEITURA]</span>
            )}
          </div>
        ))}

        {/* Restricted compartments — read only always */}
        {restricted.length > 0 && (
          <>
            <div style={mono(10, C.dim)}>COMPARTIMENTOS RESTRITOS:</div>
            {restricted.map(r => (
              <div key={r.id} style={mono(11, C.dim)}>DECK {r.deck} — {r.label}</div>
            ))}
          </>
        )}

        {level < 2 && (
          <div style={{ ...mono(11, C.dim), textAlign: 'center', lineHeight: 1.7, padding: '8px 0' }}>
            ATIVE NÓ DE SEGURANÇA EM A1<br />para controle tático.
          </div>
        )}

        {/* Level 2: door authorizations + routes + history */}
        {level >= 2 && (
          <>
            <AsciiRule />
            {doors.length > 0 && (
              <>
                <div style={mono(10, C.dim)}>PORTAS DE SEGURANÇA:</div>
                {doors.map(door => (
                  <div key={door.id} style={{ border: `1px solid ${C.dim}`, padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={vt(15, C.main)}>{door.label}</span>
                    <button
                      onClick={() => pdtSend({ type: 'SECURITY_DOOR_AUTH', doorId: door.id })}
                      style={{ ...vt(13, C.amber), background: 'transparent', border: `1px solid ${C.amber}`, padding: '4px 8px', cursor: 'pointer' }}>
                      AUTORIZAR
                    </button>
                  </div>
                ))}
              </>
            )}

            {routes.length > 0 && (
              <>
                <div style={mono(10, C.dim)}>ROTAS DE EVACUAÇÃO:</div>
                {routes.map(r => (
                  <div key={r.id} style={{ border: `1px solid ${C.dim}`, padding: '6px 8px' }}>
                    <div style={vt(15, C.main)}>{r.label}</div>
                    <div style={mono(9, C.dim)}>{r.sectors.join(' → ')}</div>
                  </div>
                ))}
              </>
            )}

            {history.length > 0 && (
              <>
                <div style={mono(10, C.dim)}>HISTÓRICO DE LOCKDOWNS:</div>
                {history.map((h, i) => (
                  <div key={i} style={mono(10, C.ghost)}>{h.timestamp} — {h.area} ({h.duration})</div>
                ))}
              </>
            )}
          </>
        )}

        {/* Level 3: tactical controls */}
        {level >= 3 && (
          <>
            <AsciiRule />
            <div style={mono(10, C.dim)}>CONTROLE TÁTICO:</div>
            <button
              onClick={() => { pdtSend({ type: 'SECURITY_LOCKDOWN' }); setLockdownActive(true); }}
              disabled={lockdownActive}
              style={{ ...vt(14, lockdownActive ? C.dim : C.red), background: lockdownActive ? 'transparent' : '#1a0000', border: `1px solid ${lockdownActive ? C.dim : C.red}`, padding: '8px', cursor: lockdownActive ? 'default' : 'pointer', textAlign: 'center' }}>
              {lockdownActive ? 'LOCKDOWN ATIVO (3min)' : '[ LOCKDOWN DE SUBSETOR ]'}
            </button>
            <button
              onClick={() => { pdtSend({ type: 'SECURITY_SIREN' }); setSirenActive(true); }}
              disabled={sirenActive}
              style={{ ...vt(14, sirenActive ? C.dim : C.amber), background: 'transparent', border: `1px solid ${sirenActive ? C.dim : C.amber}`, padding: '8px', cursor: sirenActive ? 'default' : 'pointer', textAlign: 'center' }}>
              {sirenActive ? 'SIRENE ATIVA (30s)' : '[ SIRENE LOCALIZADA ]'}
            </button>
            <button
              onClick={() => pdtSend({ type: 'SECURITY_MARK_ROUTE' })}
              style={{ ...vt(14, C.main), background: 'transparent', border: `1px solid ${C.main}`, padding: '8px', cursor: 'pointer', textAlign: 'center' }}>
              [ MARCAR ROTA NOS PDTs ]
            </button>
            <button
              onClick={() => { pdtSend({ type: 'SECURITY_CONTAINMENT_PROTOCOL' }); setContainPending(true); }}
              disabled={containmentPending}
              style={{ ...vt(14, containmentPending ? C.dim : C.red), background: 'transparent', border: `1px solid ${containmentPending ? C.dim : C.red}`, padding: '8px', cursor: containmentPending ? 'default' : 'pointer', textAlign: 'center' }}>
              {containmentPending ? 'AGUARDANDO M.O.T.H.E.R...' : '[ PROTOCOLO DE CONTENÇÃO ]'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { SecurityTab });
