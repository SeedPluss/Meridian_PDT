// pdt-shared.jsx — Shared constants, colors, and utility components

const C = {
  bright:   '#00ff66',
  main:     '#00cc52',
  mid:      '#00993d',
  dim:      '#006629',
  ghost:    '#003315',
  black:    '#000a04',
  wyBright: '#4488ff',
  wyMain:   '#2266dd',
  amber:    '#ffaa00',
  red:      '#ff2a2a',
  cyan:     '#00ddff',
};

const glow  = (c) => `0 0 8px ${c}`;
const glowS = (c) => `0 0 8px ${c}, 0 0 22px ${c}55`;

// ── Shared style helpers ──────────────────────────────────────────────────────

const vt = (size = 18, color = C.main, extra = {}) => ({
  fontFamily: "'VT323', monospace",
  fontSize: `${size}px`,
  color,
  lineHeight: 1.35,
  ...extra,
});

const mono = (size = 12, color = C.dim, extra = {}) => ({
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: `${size}px`,
  color,
  lineHeight: 1.5,
  ...extra,
});

// ── Primitive components ──────────────────────────────────────────────────────

const StatusDot = ({ online, large = false }) => (
  <span style={{
    color:      online ? C.bright : C.dim,
    textShadow: online ? glow(C.bright) : 'none',
    fontSize:   large ? '18px' : '14px',
  }}>
    {online ? '◆' : '◇'}
  </span>
);

const HRule = ({ color = C.dim, my = 0 }) => (
  <div style={{ height: '1px', background: color, opacity: 0.5, margin: `${my}px 0`, flexShrink: 0 }} />
);

const Cursor = ({ color = C.bright }) => (
  <span style={{ color, animation: 'blink 0.65s steps(1) infinite', display: 'inline-block' }}>█</span>
);

const SectorLabel = ({ children, color = C.dim }) => (
  <div style={mono(11, color, { padding: '6px 14px 3px', opacity: 0.75, letterSpacing: '0.08em', textTransform: 'uppercase' })}>
    ── {children}
  </div>
);

// ── PDT Button ────────────────────────────────────────────────────────────────

const PDTButton = ({ children, onClick, variant = 'normal', fullWidth = false, style: sx = {}, disabled = false }) => {
  const map = {
    normal: { bc: C.main,   color: C.main   },
    bright: { bc: C.bright, color: C.bright, ts: glow(C.bright) },
    danger: { bc: C.red,    color: C.red,    ts: glow(C.red) },
    amber:  { bc: C.amber,  color: C.amber  },
    dim:    { bc: C.dim,    color: C.dim    },
    ghost:  { bc: C.mid,    color: C.mid,   op: 0.65 },
  };
  const v = map[variant] || map.normal;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...vt(20, v.color),
        textShadow: v.ts || 'none',
        background:  'transparent',
        border:      `1px solid ${v.bc}`,
        cursor:      disabled ? 'not-allowed' : 'pointer',
        padding:     '10px 22px',
        minHeight:   '48px',
        width:       fullWidth ? '100%' : 'auto',
        letterSpacing: '0.04em',
        whiteSpace:  'nowrap',
        opacity:     v.op || 1,
        display:     'block',
        textAlign:   'center',
        ...sx,
      }}
    >
      {children}
    </button>
  );
};

// ── ASCII horizontal rule ─────────────────────────────────────────────────────

const AsciiRule = ({ color = C.dim }) => (
  <div style={vt(16, color, { padding: '2px 14px', opacity: 0.55, overflow: 'hidden', whiteSpace: 'nowrap', flexShrink: 0 })}>
    {'─'.repeat(40)}
  </div>
);

// Export to window so other Babel files can use these
Object.assign(window, { C, glow, glowS, vt, mono, StatusDot, HRule, Cursor, SectorLabel, PDTButton, AsciiRule });
