// pdt-tracker.jsx — Motion Tracker screen (Radar canvas + 3 sub-states)

const RadarCanvas = ({ threatActive, blips }) => {
  const canvasRef = React.useRef(null);
  const rafRef    = React.useRef(null);
  const stateRef  = React.useRef({ angle: 0 });
  const blipsRef  = React.useRef(blips);

  React.useEffect(() => {
    blipsRef.current = blips;
  }, [blips]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const S = 260, cx = S / 2, cy = S / 2, R = S / 2 - 6;

    const draw = () => {
      const { angle } = stateRef.current;
      ctx.clearRect(0, 0, S, S);

      // ── Clip to circle ──────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R + 1, 0, Math.PI * 2);
      ctx.clip();

      // Background
      ctx.fillStyle = '#000a04';
      ctx.fillRect(0, 0, S, S);

      // Concentric rings
      [0.25, 0.5, 0.75, 1.0].forEach((f, i) => {
        ctx.globalAlpha = i === 3 ? 0.7 : 0.3;
        ctx.strokeStyle = '#006629';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Cross-hairs
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#006629';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
      ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // ── Sweep trail (filled sector with alpha gradient) ──
      const TRAIL_ARC   = Math.PI * 0.75;
      const TRAIL_STEPS = 48;
      for (let i = 0; i < TRAIL_STEPS; i++) {
        const t  = i / TRAIL_STEPS;
        const a0 = angle - TRAIL_ARC + t * TRAIL_ARC;
        const a1 = angle - TRAIL_ARC + ((i + 1) / TRAIL_STEPS) * TRAIL_ARC;
        ctx.globalAlpha = t * t * 0.22;
        ctx.fillStyle = '#00cc52';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Sweep line ──────────────────────────────────────
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore(); // end clip

      // ── Threat blips (from props) ────────────────────────
      const currentBlips = Array.isArray(blipsRef.current) ? blipsRef.current : [];
      if (currentBlips.length > 0) {
        currentBlips.forEach(blip => {
          // Calculate blip position based on distance and angle
          // Assuming blip has { distance, angle } where angle is in degrees
          // Or just use random pulse for now if structure is unknown, but we should map it.
          // Fallback to random if structure doesn't match
          const bAngle = blip.angle !== undefined ? (blip.angle * Math.PI) / 180 : -0.52;
          const bDist = blip.distance !== undefined ? (blip.distance / 100) * R : R * 0.58;
          
          const tx = cx + Math.cos(bAngle) * bDist;
          const ty = cy + Math.sin(bAngle) * bDist;
          const pulse = 10 + (Math.sin(Date.now() / 280) * 0.5 + 0.5) * 9;
          
          ctx.save();
          ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
          ctx.shadowColor = '#ff2a2a';
          ctx.shadowBlur  = 14;
          ctx.fillStyle   = '#ff2a2a';
          ctx.globalAlpha = Math.max(0.2, 1 - (bDist / R)); // Fade out further blips a bit, or keep fixed
          ctx.beginPath(); ctx.arc(tx, ty, 5.5, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = '#ff2a2a';
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(tx, ty, pulse, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        });
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;

      // ── Player blip (center) ──────────────────────────────
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur  = 12;
      ctx.fillStyle   = '#00ff66';
      ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur  = 0;

      // ── Outer border ring ─────────────────────────────────
      ctx.strokeStyle = '#00993d';
      ctx.lineWidth   = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

      stateRef.current.angle = (angle + 0.012) % (Math.PI * 2);
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [threatActive]); // Removed blips from dependencies to avoid restarting loop, we use blipsRef instead

  return (
    <canvas ref={canvasRef} width={260} height={260}
      style={{ display: 'block', margin: '0 auto', borderRadius: '50%' }} />
  );
};

// ── TrackerScreen ─────────────────────────────────────────────────────────────

const TrackerScreen = ({ trackerState, blips, currentSector, goToSys }) => {
  const online   = trackerState !== 'offline';
  const threat   = trackerState === 'threat';

  // ── Offline sub-state ────────────────────────────────────
  if (!online) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px 6px' }}>
        <span style={vt(20, C.main)}>TRACKER — {currentSector || 'B1'}</span>
        <span style={vt(18, C.dim)}>
          <StatusDot online={false} /> OFFLINE
        </span>
      </div>
      <HRule />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', gap: '12px' }}>
        <div style={vt(26, C.mid)}>SENSOR INATIVO</div>
        <AsciiRule />
        <div style={mono(12, C.dim, { textAlign: 'center', lineHeight: 1.7 })}>
          Sistema de monitoramento<br />requer restauração
        </div>
        <div style={{ marginTop: '24px' }}>
          <PDTButton variant="amber" onClick={goToSys}>[ IR PARA REPAROS ]</PDTButton>
        </div>
      </div>
    </div>
  );

  // ── Active sub-states (clean / threat) ───────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sub-header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px 6px' }}>
        <span style={vt(20, C.main)}>TRACKER — {currentSector || 'B1'}</span>
        <span style={{ ...vt(18, C.bright), textShadow: glow(C.bright) }}>
          <StatusDot online large /> ATIVA
        </span>
      </div>
      <HRule />

      {/* Radar */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
        <RadarCanvas threatActive={threat} blips={blips} />
      </div>

      <HRule />

      {/* Status read-out */}
      <div style={{ padding: '10px 14px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {threat ? (
          <>
            <div style={mono(11, C.amber, { letterSpacing: '0.05em' })}>ÚLTIMA DETECÇÃO: 00:08 atrás</div>
            <div style={{ ...vt(22, C.red), textShadow: glow(C.red) }}>DIREÇÃO: NORDESTE — 12m</div>
          </>
        ) : (
          <>
            <div style={mono(11, C.dim, { letterSpacing: '0.05em' })}>ÚLTIMA DETECÇÃO: sem registro</div>
            <div style={vt(22, C.main)}>STATUS: SETOR LIMPO</div>
          </>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { RadarCanvas, TrackerScreen });
