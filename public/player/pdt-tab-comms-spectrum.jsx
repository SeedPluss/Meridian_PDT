// pdt-tab-comms-spectrum.jsx — Espectro de Sinal (Operador de Comms)

const pdtSend = (obj) => { if (window.__pdtSend) window.__pdtSend(obj); };

const noiseBar = (pct) => {
  const filled = Math.round(pct / 5);
  return '▓'.repeat(filled) + '░'.repeat(20 - filled);
};

const CommsSpectrumTab = ({ level, data, character }) => {
  const [beaconActive, setBeaconActive] = React.useState(false);
  const noise      = data?.noise ?? 0.8;
  const terminals  = data?.terminals || [];
  const jamming    = data?.jammingSectors || [];
  const fragments  = data?.fragments || [];
  const newDevice  = data?.newDevice;

  React.useEffect(() => {
    if (!beaconActive) return;
    const t = setTimeout(() => setBeaconActive(false), 30000);
    return () => clearTimeout(t);
  }, [beaconActive]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px 6px', flexShrink: 0 }}>
        <div style={vt(20, C.main)}>ESPECTRO DE SINAL</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={mono(10, C.dim)}>ALCANCE: {level >= 2 ? <span style={{ color: C.bright }}>NAVE COMPLETA</span> : 'SETOR ATUAL'}</span>
          <span style={mono(10, C.dim)}>NÍV. {level}</span>
        </div>
      </div>
      <HRule />

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'none' }}>

        {/* Noise bar — always visible */}
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: C.dim, background: '#000a04', padding: '10px', border: `1px solid ${C.dim}` }}>
          <div style={{ marginBottom: '4px', color: C.dim }}>VARREDURA LOCAL: ATIVA</div>
          <div style={{ color: noise > 0.7 ? C.red : noise > 0.4 ? C.amber : C.main }}>
            {noiseBar(noise * 100)}
          </div>
          <div style={{ marginTop: '4px', color: C.dim }}>
            RUÍDO: {Math.round(noise * 100)}%
          </div>
        </div>

        {level < 2 && (
          <>
            {['TERMINAIS DETECTADOS', 'DISPOSITIVOS ATIVOS', 'TRANSMISSÕES'].map(label => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.ghost}`, padding: '4px 0' }}>
                <span style={mono(10, C.dim)}>{label}</span>
                <span style={vt(16, C.ghost)}>---</span>
              </div>
            ))}
            <div style={{ ...mono(11, C.dim), textAlign: 'center', lineHeight: 1.7, padding: '8px 0' }}>
              RESTAURE A2 — SALA DE COMMS<br />para ampliar alcance.
            </div>
          </>
        )}

        {/* New device alert */}
        {level >= 2 && newDevice && (
          <div style={{ ...mono(11, C.amber), border: `1px solid ${C.amber}`, padding: '8px', textShadow: glow(C.amber) }}>
            ◆ NOVO DISPOSITIVO: {newDevice.label} — SETOR {newDevice.sector}
          </div>
        )}

        {/* Jamming alerts */}
        {level >= 2 && jamming.length > 0 && (
          <div style={{ ...mono(10, C.red), border: `1px solid ${C.red}`, padding: '8px' }}>
            ⚠ INTERFERÊNCIA: {jamming.join(', ')}
          </div>
        )}

        {/* Terminal list */}
        {level >= 2 && (
          <>
            <div style={mono(10, C.dim)}>TERMINAIS DETECTADOS: {terminals.length}</div>
            {terminals.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${C.dim}`, padding: '6px 8px' }}>
                <div>
                  <div style={vt(15, t.active ? C.main : C.ghost)}>{t.label}</div>
                  <div style={mono(9, C.dim)}>SETOR {t.sector} — {t.active ? 'ATIVO' : `INATIVO ${t.lastSeen}`}</div>
                </div>
                <span style={{ ...mono(9, t.active ? C.bright : C.ghost) }}>{t.active ? '●' : '○'}</span>
              </div>
            ))}
          </>
        )}

        {/* Level 3 */}
        {level >= 3 && (
          <>
            <AsciiRule />
            {/* Beacon */}
            <button
              onClick={() => { pdtSend({ type: 'COMMS_BEACON_EMIT' }); setBeaconActive(true); }}
              disabled={beaconActive}
              style={{ ...vt(14, beaconActive ? C.dim : C.main), background: 'transparent', border: `1px solid ${beaconActive ? C.dim : C.main}`, padding: '8px', cursor: beaconActive ? 'default' : 'pointer' }}>
              {beaconActive ? 'BEACON ATIVO (30s)' : '[ EMITIR BEACON DIRECIONAL ]'}
            </button>
            {/* Fragments */}
            {fragments.length > 0 && (
              <>
                <div style={mono(10, C.dim)}>TRÁFEGO INTERCEPTADO:</div>
                {fragments.map((f, i) => (
                  <div key={i} style={{ border: `1px solid ${C.dim}`, padding: '8px', background: '#000a04' }}>
                    <div style={mono(9, C.ghost)}>{f.source}</div>
                    <div style={mono(11, C.main)}>{f.text}</div>
                  </div>
                ))}
              </>
            )}
            {/* Triangulations */}
            {data?.triangulations?.length > 0 && (
              <>
                <div style={mono(10, C.dim)}>TRIANGULAÇÕES:</div>
                {data.triangulations.map((tr, i) => (
                  <div key={i} style={mono(11, C.main)}>
                    {tr.id} → SETOR APROX: {tr.approxSector}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { CommsSpectrumTab });
