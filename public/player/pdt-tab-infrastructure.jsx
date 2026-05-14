// pdt-tab-infrastructure.jsx — Controle de Infraestrutura (Técnico de Sistemas)

const pdtSend = (obj) => { if (window.__pdtSend) window.__pdtSend(obj); };

const DOOR_STATUS_COLOR = {
  ABERTA:    '#44ff88',
  FECHADA:   '#006629',
  TRAVADA:   '#ffaa00',
  DANIFICADA:'#ff2a2a',
};

const InfrastructureTab = ({ level, data, character }) => {
  const [emergencyDeck, setEmergencyDeck] = React.useState(null);
  const deckNames = ['A', 'B', 'C'];
  const decks = data?.decks || {};

  React.useEffect(() => {
    if (!emergencyDeck) return;
    const t = setTimeout(() => setEmergencyDeck(null), 60000);
    return () => clearTimeout(t);
  }, [emergencyDeck]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px 6px', flexShrink: 0 }}>
        <div style={vt(20, C.main)}>CONTROLE DE INFRAESTRUTURA</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={mono(10, C.dim)}>
            DECKS ATIVOS: {deckNames.filter(d => decks[d]?.repaired).join(', ') || 'NENHUM'}
          </span>
          <span style={mono(10, C.dim)}>NÍV. {level}</span>
        </div>
      </div>
      <HRule />

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '12px', scrollbarWidth: 'none' }}>

        {level < 2 && (
          <div style={{ ...mono(11, C.dim), textAlign: 'center', lineHeight: 1.7, padding: '12px 0' }}>
            Repare sistemas de iluminação<br />ou portas em qualquer deck para<br />ativar controle remoto.
          </div>
        )}

        {/* Level 3 cascade alerts */}
        {level >= 3 && data?.cascadeAlerts?.length > 0 && (
          <>
            {data.cascadeAlerts.map((a, i) => (
              <div key={i} style={{ ...mono(10, C.amber), border: `1px solid ${C.amber}`, padding: '6px 8px' }}>
                ⚠ {a.system}: {a.text}
              </div>
            ))}
            <AsciiRule />
          </>
        )}

        {deckNames.map(deckId => {
          const deck = decks[deckId] || { repaired: false, doors: [], sectors: [] };
          return (
            <div key={deckId}>
              <div style={{ ...mono(10, deck.repaired ? C.main : C.dim), marginBottom: '6px' }}>
                DECK {deckId}: {deck.repaired ? <span style={{ color: C.bright }}>CONTROLE ATIVO</span> : '[SEM ACESSO]'}
              </div>
              {deck.repaired && level >= 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                  {/* Doors */}
                  {deck.doors?.map(door => (
                    <div key={door.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${C.dim}`, padding: '6px 8px' }}>
                      <div>
                        <div style={mono(10, C.dim)}>{door.label}</div>
                        <div style={{ ...mono(11, DOOR_STATUS_COLOR[door.status] || C.main) }}>{door.status || '---'}</div>
                      </div>
                      {door.status !== 'DANIFICADA' && (
                        <button onClick={() => pdtSend({ type: 'INFRA_DOOR_TOGGLE', doorId: door.id })}
                          style={{ ...vt(14, C.main), background: 'transparent', border: `1px solid ${C.dim}`, padding: '4px 8px', cursor: 'pointer' }}>
                          TOGGLE
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Lighting */}
                  {deck.sectors?.map(sec => (
                    <div key={sec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${C.dim}`, padding: '6px 8px' }}>
                      <div>
                        <div style={mono(10, C.dim)}>{sec.label}</div>
                        <div style={mono(11, sec.lighting ? C.bright : C.ghost)}>{sec.lighting ? 'ACESA' : 'APAGADA'}</div>
                      </div>
                      <button onClick={() => pdtSend({ type: 'INFRA_LIGHT_TOGGLE', sectorId: sec.id })}
                        style={{ ...vt(14, C.main), background: 'transparent', border: `1px solid ${C.dim}`, padding: '4px 8px', cursor: 'pointer' }}>
                        LUZ
                      </button>
                    </div>
                  ))}
                  {/* Emergency mode */}
                  <button
                    onClick={() => { pdtSend({ type: 'INFRA_EMERGENCY', deck: deckId }); setEmergencyDeck(deckId); }}
                    disabled={emergencyDeck === deckId}
                    style={{ ...vt(14, emergencyDeck === deckId ? C.dim : C.red), background: 'transparent', border: `1px solid ${emergencyDeck === deckId ? C.dim : C.red}`, padding: '8px', cursor: 'pointer', textAlign: 'center' }}>
                    {emergencyDeck === deckId ? 'EMERGÊNCIA ATIVA (60s)' : '[ MODO EMERGÊNCIA ]'}
                  </button>
                  {/* Level 3: power boost per sector */}
                  {level >= 3 && deck.sectors?.map(sec => (
                    <button key={`boost-${sec.id}`}
                      onClick={() => pdtSend({ type: 'INFRA_POWER_BOOST', sectorId: sec.id })}
                      style={{ ...vt(13, C.amber), background: 'transparent', border: `1px solid ${C.amber}`, padding: '6px 8px', cursor: 'pointer', textAlign: 'left' }}>
                      ⚡ BOOST {sec.label} +30% / 2min
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, { InfrastructureTab });
