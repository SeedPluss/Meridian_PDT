// pdt-tab-biometric.jsx — Monitor Biométrico (Médico)

const stateColor = (s) => {
  if (s === 'CRÍTICO' || s === 'INCONSCIENTE') return C.red;
  if (s === 'INSTÁVEL') return C.amber;
  if (s === 'ESTRESSADO') return C.main;
  return C.bright;
};

const BiometricTab = ({ level, data, character }) => {
  const team = data?.team || [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '8px 14px 6px', flexShrink: 0 }}>
        <div style={vt(20, C.main)}>MONITOR BIOMÉTRICO</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={mono(10, C.dim)}>
            REDE MÉDICA: {level >= 2 ? <span style={{ color: C.bright }}>ATIVA</span> : 'OFFLINE'}
          </span>
          <span style={mono(10, C.dim)}>NÍV. {level}</span>
        </div>
      </div>
      <HRule />

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'none' }}>

        {/* Level 1 offline message */}
        {level < 2 && (
          <div style={{ ...mono(11, C.dim), textAlign: 'center', padding: '12px 0', lineHeight: 1.7 }}>
            REDE MÉDICA: OFFLINE<br />
            Sincronize com B1 — MEDBAY<br />
            para ativar monitoramento completo.
          </div>
        )}

        {/* Team list */}
        {team.length === 0 && (
          <div style={mono(11, C.dim)}>NENHUM MEMBRO DETECTADO</div>
        )}

        {team.map(member => {
          const vitals = member.vitals || {};
          const stCol = stateColor(vitals.state);
          return (
            <div key={member.id} style={{
              border: `1px solid ${member.online ? (vitals.state === 'CRÍTICO' || vitals.state === 'INCONSCIENTE' ? C.red : C.dim) : C.ghost}`,
              padding: '8px 10px',
              background: (vitals.state === 'CRÍTICO' || vitals.state === 'INCONSCIENTE') ? '#1a0000' : 'transparent',
            }}>
              {/* Name + online status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={vt(18, member.online ? C.main : C.dim)}>{member.nome}</span>
                <span style={mono(10, member.online ? C.bright : C.ghost)}>
                  {member.online ? '● ONLINE' : '○ SEM SINAL'}
                </span>
              </div>

              {/* Vitals — level 2+ */}
              {level >= 2 && member.online ? (
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={mono(10, C.dim)}>♥ {vitals.hr != null ? `${vitals.hr} bpm` : '---'}</span>
                    <span style={mono(10, C.dim)}>T {vitals.temp != null ? `${vitals.temp}°C` : '---'}</span>
                    <span style={mono(10, C.dim)}>O₂ {vitals.o2 != null ? `${vitals.o2}%` : '---'}</span>
                  </div>
                  <div style={{ ...vt(16, stCol), textShadow: vitals.state === 'CRÍTICO' ? glow(C.red) : 'none' }}>
                    {vitals.state || '---'}
                    {member.deck ? <span style={mono(9, C.dim)}> — DECK {member.deck}</span> : null}
                  </div>
                  {/* Level 3 extras */}
                  {level >= 3 && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                      {member.anomaly && <span style={mono(9, C.amber)}>⚠ EXPOSIÇÃO ANÔMALA</span>}
                      {member.medkitsUsed > 0 && <span style={mono(9, C.dim)}>MEDKITS: {member.medkitsUsed}</span>}
                    </div>
                  )}
                </div>
              ) : level < 2 ? (
                <div style={mono(10, C.ghost)}>♥ ---</div>
              ) : (
                <div style={mono(10, C.dim)}>SINAL PERDIDO</div>
              )}
            </div>
          );
        })}

        {/* Level 3 alerts */}
        {level >= 3 && data?.alerts?.length > 0 && (
          <>
            <AsciiRule />
            <div style={mono(10, C.amber)}>ALERTAS DE DETERIORAÇÃO:</div>
            {data.alerts.map((a, i) => (
              <div key={i} style={{ ...mono(11, C.red), textShadow: glow(C.red) }}>
                ⚠ {a.nome}: {a.text}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { BiometricTab });
