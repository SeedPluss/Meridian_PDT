// pdt-tab-cargo.jsx — Manifesto de Carga (Especialista em Carga)

const pdtSend = (obj) => { if (window.__pdtSend) window.__pdtSend(obj); };

const CargoTab = ({ level, data, character }) => {
  const containers = data?.containers || [];
  const anomalies  = data?.anomalies  || [];
  const equipment  = data?.equipment  || [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px 6px', flexShrink: 0 }}>
        <div style={vt(20, C.main)}>MANIFESTO DE CARGA</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={mono(10, C.dim)}>
            SYNC: {data?.lastSync || '---'} — {level >= 2 ? <span style={{ color: C.bright }}>COMPLETO</span> : 'PARCIAL'}
          </span>
          <span style={mono(10, C.dim)}>NÍV. {level}</span>
        </div>
      </div>
      <HRule />

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'none' }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={mono(11, C.dim)}>TOTAL: {data?.totalContainers ?? '---'}</span>
          <span style={mono(11, C.dim)}>VERIF: {data?.verifiedContainers ?? '---'}</span>
          <span style={mono(11, data?.anomalies?.length ? C.amber : C.dim)}>
            ANOM: {anomalies.length}
          </span>
        </div>

        {level < 2 && (
          <div style={{ ...mono(11, C.dim), textAlign: 'center', lineHeight: 1.7, padding: '8px 0' }}>
            ACESSE C2 — PORÃO DE CARGA<br />para manifesto completo.
          </div>
        )}

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <>
            <div style={mono(10, C.amber)}>ANOMALIAS DETECTADAS:</div>
            {anomalies.map(a => (
              <div key={a.id} style={{ border: `1px solid ${C.amber}`, padding: '6px 8px' }}>
                <div style={vt(15, C.amber)}>{a.id}</div>
                {level >= 2 && a.note && <div style={mono(10, C.main)}>{a.note}</div>}
                {level < 2 && <div style={mono(10, C.ghost)}>[AGUARDANDO SYNC]</div>}
              </div>
            ))}
            <AsciiRule />
          </>
        )}

        {/* Container list */}
        {containers.map(c => {
          const weightMismatch = level >= 2 && c.actualWeight != null && c.actualWeight !== c.declaredWeight;
          const isWY           = weightMismatch && c.anomaly;
          return (
            <div key={c.id} style={{
              border: `1px solid ${isWY ? C.red : weightMismatch ? C.amber : C.dim}`,
              padding: '6px 8px',
              background: isWY ? '#1a0000' : 'transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={vt(15, isWY ? C.red : C.main)}>{c.id}</span>
                <span style={mono(9, C.dim)}>{c.position}</span>
              </div>
              <div style={mono(10, C.dim)}>{c.label}</div>
              {level >= 2 && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <span style={mono(9, weightMismatch ? C.amber : C.dim)}>
                    PESO: {c.declaredWeight}kg {c.actualWeight != null && c.actualWeight !== c.declaredWeight ? `(REAL: ${c.actualWeight}kg)` : ''}
                  </span>
                  {c.sealBroken && <span style={mono(9, C.red)}>LACRE QUEBRADO</span>}
                </div>
              )}
              {/* Level 3: movement log + block as barrier */}
              {level >= 3 && c.movementLog?.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {c.movementLog.map((m, i) => (
                    <div key={i} style={mono(9, C.ghost)}>{m.timestamp}: {m.from} → {m.to}</div>
                  ))}
                </div>
              )}
              {level >= 3 && (
                <button
                  onClick={() => pdtSend({ type: 'CARGO_BLOCK_ACCESS', containerId: c.id })}
                  style={{ ...vt(12, C.amber), background: 'transparent', border: `1px solid ${C.amber}`, padding: '3px 8px', cursor: 'pointer', marginTop: '4px' }}>
                  USAR COMO BARREIRA
                </button>
              )}
            </div>
          );
        })}

        {/* Level 3: equipment */}
        {level >= 3 && equipment.length > 0 && (
          <>
            <AsciiRule />
            <div style={mono(10, C.dim)}>MAQUINÁRIO:</div>
            {equipment.map(eq => (
              <button key={eq.id}
                onClick={() => pdtSend({ type: 'CARGO_EQUIPMENT_OPERATE', equipmentId: eq.id })}
                disabled={!eq.available}
                style={{ ...vt(13, eq.available ? C.main : C.ghost), background: 'transparent', border: `1px solid ${eq.available ? C.dim : C.ghost}`, padding: '7px 8px', cursor: eq.available ? 'pointer' : 'default', textAlign: 'left', opacity: eq.available ? 1 : 0.4 }}>
                {eq.label} [{eq.type.toUpperCase()}] {!eq.available ? '— INDISPONÍVEL' : ''}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { CargoTab });
