// pdt-tab-analysis.jsx — Análise de Amostras (Técnico de Manutenção)

const AnalysisTab = ({ level, data, character }) => {
  const traces       = data?.traces || [];
  const crossMatches = data?.crossSectorMatches || [];
  const labRecords   = data?.labRecords || [];
  const protocols    = data?.protocolsRecovered || [];

  const contaminationColor = (c) => {
    if (c >= 0.7) return C.red;
    if (c >= 0.4) return C.amber;
    return C.main;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px 6px', flexShrink: 0 }}>
        <div style={vt(20, C.main)}>ANÁLISE DE AMOSTRAS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={mono(10, C.dim)}>SENSORES: {level >= 2 ? <span style={{ color: C.bright }}>SYNC</span> : 'LOCAIS'}</span>
          <span style={mono(10, C.dim)}>NÍV. {level}</span>
        </div>
      </div>
      <HRule />

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'none' }}>

        {/* Current sector reading — always active */}
        <div style={{ border: `1px solid ${C.dim}`, padding: '8px 10px' }}>
          <div style={mono(10, C.dim)}>SETOR {data?.currentSector || '?'} — LEITURA ATUAL</div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
            <span style={mono(11, C.main)}>T: {data?.currentTemp != null ? `${data.currentTemp.toFixed(1)}°C` : '---'}</span>
            <span style={mono(11, data?.airComposition !== 'NOMINAL' ? C.amber : C.main)}>
              AR: {data?.airComposition || '---'}
            </span>
          </div>
        </div>

        {level < 2 && (
          <>
            <div style={{ border: `1px solid ${C.ghost}`, padding: '8px 10px' }}>
              <div style={mono(10, C.dim)}>TRAÇOS DETECTADOS</div>
              <div style={mono(11, C.ghost)}>--- SEM CLASSIFICAÇÃO ---</div>
            </div>
            <div style={{ ...mono(11, C.dim), textAlign: 'center', lineHeight: 1.7, padding: '8px 0' }}>
              SINCRONIZE COM B1 — MEDBAY<br />para análise completa.
            </div>
          </>
        )}

        {/* Level 2: traces */}
        {level >= 2 && traces.length > 0 && (
          <>
            <div style={mono(10, C.dim)}>TRAÇOS DETECTADOS:</div>
            {traces.map((t, i) => {
              const cc = contaminationColor(t.contamination);
              return (
                <div key={i} style={{ border: `1px solid ${t.anomalousHeat ? C.red : C.dim}`, padding: '8px 10px', background: t.anomalousHeat ? '#1a0000' : 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={vt(15, C.main)}>SETOR {t.sector}</span>
                    <span style={mono(9, C.amber)}>{t.type}</span>
                  </div>
                  <div style={mono(10, C.dim, { marginTop: '4px' })}>{t.description}</div>
                  {t.contamination > 0 && (
                    <div style={mono(10, cc)}>CONTAM: {Math.round(t.contamination * 100)}%</div>
                  )}
                  {t.anomalousHeat && (
                    <div style={{ ...mono(10, C.red), textShadow: glow(C.red) }}>⚠ CALOR ANÔMALO DETECTADO</div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Level 2: cross-sector matches */}
        {level >= 2 && crossMatches.length > 0 && (
          <>
            <AsciiRule />
            <div style={mono(10, C.amber)}>CORRESPONDÊNCIAS ENTRE SETORES:</div>
            {crossMatches.map((m, i) => (
              <div key={i} style={{ border: `1px solid ${C.amber}`, padding: '6px 8px' }}>
                <div style={mono(11, C.main)}>{m.sector1} ↔ {m.sector2}</div>
                <div style={mono(10, C.dim)}>{m.material}</div>
              </div>
            ))}
          </>
        )}

        {/* Level 3: lab records */}
        {level >= 3 && labRecords.length > 0 && (
          <>
            <AsciiRule />
            <div style={mono(10, C.dim)}>REGISTROS DO LABORATÓRIO:</div>
            {labRecords.map((r, i) => (
              <div key={i} style={{ border: `1px solid ${C.dim}`, padding: '8px', background: '#000a04' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={mono(9, C.ghost)}>{r.source}</span>
                  <span style={mono(9, C.amber)}>{r.classification}</span>
                </div>
                <div style={mono(11, C.main, { marginTop: '4px' })}>{r.text}</div>
              </div>
            ))}
          </>
        )}

        {/* Level 3: recovered protocols */}
        {level >= 3 && protocols.length > 0 && (
          <>
            <div style={mono(10, C.dim)}>PROTOCOLOS RECUPERADOS:</div>
            {protocols.map((p, i) => (
              <div key={i} style={{ border: `1px solid ${C.dim}`, padding: '8px' }}>
                <div style={vt(15, C.main)}>{p.title}</div>
                <div style={mono(10, C.dim, { marginTop: '4px' })}>{p.summary}</div>
              </div>
            ))}
          </>
        )}

        {level >= 3 && labRecords.length === 0 && protocols.length === 0 && (
          <div style={mono(10, C.dim)}>REGISTROS DO LABORATÓRIO: AGUARDANDO ACESSO</div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { AnalysisTab });
