// pdt-tab-structural.jsx — Integridade Estrutural (Engenheiro Chefe / Android)

const pdtSend = (obj) => { if (window.__pdtSend) window.__pdtSend(obj); };

const STRESS_COLOR = (s) => {
  if (s === 'IMINENTE FALHA') return C.red;
  if (s === 'CRÍTICO')        return C.red;
  if (s === 'ELEVADO')        return C.amber;
  return C.bright;
};

const StructuralTab = ({ level, data, character }) => {
  const [purgeActive, setPurgeActive] = React.useState(false);
  const sectors   = data?.sectors || [];
  const curTemp   = data?.currentSectorTemp;
  const machinery = data?.machinery || [];

  React.useEffect(() => {
    if (!purgeActive) return;
    const t = setTimeout(() => setPurgeActive(false), 180000); // 3 min
    return () => clearTimeout(t);
  }, [purgeActive]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px 6px', flexShrink: 0 }}>
        <div style={vt(20, C.main)}>INTEGRIDADE ESTRUTURAL</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={mono(10, C.dim)}>LEITURA: {level >= 2 ? <span style={{ color: C.bright }}>COMPLETA</span> : 'PARCIAL'}</span>
          <span style={mono(10, C.dim)}>NÍV. {level}</span>
        </div>
      </div>
      <HRule />

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'none' }}>

        {/* Android sensor — always active */}
        <div style={{ border: `1px solid ${C.dim}`, padding: '8px 10px' }}>
          <div style={mono(10, C.dim)}>SENSOR ANDROID — SETOR ATUAL</div>
          <div style={vt(20, C.main)}>
            TEMPERATURA IND: {curTemp != null ? `${curTemp.toFixed(1)}°C` : '---'}
          </div>
        </div>

        {level < 2 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['PRESSÃO CASCO', 'VIBRAÇÃO', 'ESTRESSE STRUCT'].map(label => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${C.ghost}` }}>
                  <span style={mono(10, C.dim)}>{label}</span>
                  <span style={vt(16, C.ghost)}>---</span>
                </div>
              ))}
            </div>
            <div style={{ ...mono(11, C.dim), textAlign: 'center', lineHeight: 1.7 }}>
              CONECTE COM C1 — ENGENHARIA<br />para leitura completa.
            </div>
          </>
        )}

        {/* Level 2: per-sector readings */}
        {level >= 2 && sectors.map(sec => {
          const sc = STRESS_COLOR(sec.stress);
          return (
            <div key={sec.id} style={{
              border: `1px solid ${sec.riskRoute ? C.red : C.dim}`,
              padding: '8px 10px',
              background: sec.riskRoute ? '#1a0000' : 'transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={vt(16, sec.riskRoute ? C.red : C.main)}>{sec.id} — {sec.label}</span>
                {sec.riskRoute && <span style={mono(9, C.red)}>⚠ RISCO</span>}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={mono(10, C.dim)}>P {sec.pressure != null ? `${sec.pressure.toFixed(3)} atm` : '---'}</span>
                <span style={mono(10, C.dim)}>VIB {sec.vibration || '---'}</span>
                <span style={mono(10, C.dim)}>T {sec.temp != null ? `${sec.temp.toFixed(1)}°C` : '---'}</span>
              </div>
              <div style={{ ...vt(16, sc), textShadow: sec.stress === 'IMINENTE FALHA' ? glow(C.red) : 'none', marginTop: '4px' }}>
                {sec.stress || '---'}
              </div>
            </div>
          );
        })}

        {/* Level 3: machinery overrides */}
        {level >= 3 && (
          <>
            <AsciiRule />
            <div style={mono(10, C.dim)}>CONTROLE INDUSTRIAL:</div>
            {machinery.map(m => (
              <button key={m.id}
                onClick={() => pdtSend({ type: 'STRUCTURAL_MACHINERY_OVERRIDE', machineryId: m.id })}
                disabled={!m.available}
                style={{ ...vt(14, m.available ? C.main : C.ghost), background: 'transparent', border: `1px solid ${m.available ? C.dim : C.ghost}`, padding: '8px', cursor: m.available ? 'pointer' : 'default', textAlign: 'left', opacity: m.available ? 1 : 0.4 }}>
                {m.label} {!m.available ? '[INDISPONÍVEL]' : ''}
              </button>
            ))}
            {/* Thermal purge */}
            <button
              onClick={() => { pdtSend({ type: 'STRUCTURAL_THERMAL_PURGE' }); setPurgeActive(true); }}
              disabled={purgeActive}
              style={{ ...vt(14, purgeActive ? C.dim : C.amber), background: 'transparent', border: `1px solid ${purgeActive ? C.dim : C.amber}`, padding: '8px', cursor: purgeActive ? 'default' : 'pointer', textAlign: 'center' }}>
              {purgeActive ? 'PURGA ATIVA (3min)' : '[ PURGA TÉRMICA +15°C / 3min ]'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { StructuralTab });
