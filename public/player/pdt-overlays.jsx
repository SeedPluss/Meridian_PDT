// pdt-overlays.jsx — Alert, M.O.T.H.E.R, Secret Note overlays + Countdown banner

// ── Alert Overlay ─────────────────────────────────────────────────────────────

const AlertOverlay = ({ onDismiss, data }) => (
  <div style={{
    position: 'absolute', inset: 0,
    background: '#0a0000',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
    zIndex: 200,
    animation: 'alertPulse 0.8s ease-in-out infinite',
  }}>
    <div style={{
      width: '100%', maxWidth: '340px',
      border: `1px solid ${C.red}`,
      padding: '24px 20px',
      display: 'flex', flexDirection: 'column', gap: '14px',
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...vt(28, C.red), textShadow: glowS(C.red), letterSpacing: '0.06em' }}>
          ⚠ ALERTA PRIORITÁRIO ⚠
        </div>
      </div>

      <AsciiRule color={C.red} />

      {/* Body */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
        <div style={mono(12, C.amber, { letterSpacing: '0.08em' })}>SENSOR DE PROXIMIDADE</div>
        <div style={mono(12, C.amber, { letterSpacing: '0.05em' })}>{data?.sector ? `SETOR ${data.sector}` : 'SETOR DESCONHECIDO'}</div>
        <div style={{ ...vt(24, C.red), textShadow: glow(C.red), marginTop: '4px' }}>
          {data?.message || 'MOVIMENTO DETECTADO'}
        </div>
      </div>

      <AsciiRule color={C.red} />

      {/* Dismiss */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
        <PDTButton variant="danger" onClick={onDismiss} style={{ width: '180px' }}>
          [ CONFIRMAR ]
        </PDTButton>
      </div>
    </div>
  </div>
);

// ── M.O.T.H.E.R Overlay ──────────────────────────────────────────────────────

const MOTHER_TEXTS = {
  seegson: {
    title:    '⬡ M.O.T.H.E.R',
    subtitle: 'TRANSMISSÃO DIRETA',
    body:     'Detectei movimento incomum no setor adjacente. Recomendo cautela.',
    footer:   'Sistema de bordo Seegson',
    color:    C.cyan,
    wyLine:   null,
  },
  wy: {
    title:    '⬡ M.O.T.H.E.R',
    subtitle: 'TRANSMISSÃO DIRETA',
    body:     'Protocolo especial ativado. Missão secundária em andamento. Continuem a operação conforme instruído.',
    footer:   'Sistema de bordo Seegson',
    color:    C.wyMain,
    wyLine:   'WEYLAND-YUTANI CORP.',
  },
};

const MotherOverlay = ({ onDismiss, variant = 'seegson', text }) => {
  const cfg = MOTHER_TEXTS[variant] || MOTHER_TEXTS.seegson;
  const bodyText = (text && text.trim()) ? text : cfg.body;
  const [displayed, setDisplayed] = React.useState('');
  const [typingDone, setTypingDone] = React.useState(false);

  React.useEffect(() => {
    setDisplayed('');
    setTypingDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(bodyText.slice(0, i));
      if (i >= bodyText.length) {
        clearInterval(iv);
        setTypingDone(true);
      }
    }, 32);
    return () => clearInterval(iv);
  }, [variant, bodyText]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,10,4,0.96)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      zIndex: 200,
    }}>
      <div style={{
        width: '100%', maxWidth: '340px',
        border: `1px solid ${cfg.color}`,
        padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {/* Header */}
        <div>
          <div style={{ ...vt(26, cfg.color), textShadow: glow(cfg.color) }}>{cfg.title}</div>
          <div style={mono(11, cfg.color, { opacity: 0.7, marginTop: '2px', letterSpacing: '0.08em' })}>
            {cfg.subtitle}
          </div>
        </div>

        <AsciiRule color={cfg.color} />

        {/* Typed body */}
        <div style={{ minHeight: '60px' }}>
          <span style={vt(19, cfg.color, { lineHeight: 1.6, whiteSpace: 'pre-wrap' })}>{displayed}</span>
          {!typingDone && <Cursor color={cfg.color} />}
        </div>

        <AsciiRule color={cfg.color} />

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={mono(11, cfg.color, { opacity: 0.6 })}>{cfg.footer}</div>
          {cfg.wyLine && (
            <div style={{ ...vt(16, C.wyMain), letterSpacing: '0.1em', opacity: 0.8 }}>{cfg.wyLine}</div>
          )}
        </div>

        {/* Dismiss */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
          <PDTButton
            onClick={onDismiss}
            disabled={!typingDone}
            style={{ border: `1px solid ${cfg.color}`, color: cfg.color, width: '200px', fontSize: '18px' }}
          >
            [ LI E ENTENDI ]
          </PDTButton>
        </div>
      </div>
    </div>
  );
};

// ── Secret Note Overlay ───────────────────────────────────────────────────────

const SecretNoteOverlay = ({ onDismiss, text }) => {
  const noteText = (text && text.trim()) ? text : '[mensagem privada]';
  return (
  <div style={{
    position: 'absolute', inset: 0,
    background: 'rgba(0,10,4,0.97)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
    zIndex: 200,
  }}>
    <div style={{
      width: '100%', maxWidth: '340px',
      border: `1px solid ${C.main}`,
      padding: '20px',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      {/* Label */}
      <div>
        <div style={mono(11, C.dim, { letterSpacing: '0.06em' })}>
          [NOTA PRIVADA — SÓ VOCÊ VÊ]
        </div>
      </div>

      <AsciiRule />

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={vt(19, C.main, { lineHeight: 1.65, whiteSpace: 'pre-wrap' })}>
          {noteText}
        </div>
      </div>

      <AsciiRule />

      {/* Dismiss */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <PDTButton variant="normal" onClick={onDismiss} style={{ width: '180px' }}>
          [ ENTENDIDO ]
        </PDTButton>
      </div>
    </div>
  </div>
  );
};

// ── Locked Tab ────────────────────────────────────────────────────────────────

const LockedScreen = ({ tabName }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <div style={{ padding: '8px 14px 6px', flexShrink: 0, borderBottom: `1px solid ${C.dim}` }}>
      <div style={vt(22, C.dim)}>ACESSO SUSPENSO</div>
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <StatusDot online={false} large />
        <span style={vt(20, C.dim)}>{tabName.toUpperCase()} — INDISPONÍVEL</span>
      </div>
      <AsciiRule />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ ...vt(18, C.cyan), marginBottom: '4px' }}>M.O.T.H.E.R</div>
        <div style={vt(18, C.dim)}>Acesso a arquivos suspenso</div>
        <div style={vt(18, C.dim)}>conforme protocolo ativo.</div>
      </div>
    </div>
  </div>
);

// ── Countdown Banner ──────────────────────────────────────────────────────────

const CountdownBanner = ({ time }) => {
  const mins = Math.floor(time / 60);
  const secs = time % 60;
  const fmt  = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div style={{
      background: '#1a0000',
      borderBottom: `1px solid ${C.red}`,
      padding: '6px 14px',
      display: 'flex', alignItems: 'center', gap: '10px',
      flexShrink: 0,
      animation: 'countdownPulse 0.9s ease-in-out infinite',
      minHeight: '36px',
    }}>
      <span style={{ ...vt(22, C.red), textShadow: glow(C.red) }}>⚠ AUTODESTRUIÇÃO: {fmt}</span>
    </div>
  );
};

Object.assign(window, { AlertOverlay, MotherOverlay, SecretNoteOverlay, LockedScreen, CountdownBanner });
