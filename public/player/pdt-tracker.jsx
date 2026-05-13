// pdt-tracker.jsx — Motion Tracker screen (Radar canvas + 3 sub-states)

const getDirectionLabel = (angle) => {
  // 0 is Up/North, clockwise
  if (angle === undefined) return '---';
  const a = (angle + 360) % 360;
  if (a >= 337.5 || a < 22.5)  return 'NORTE';
  if (a >= 22.5  && a < 67.5)  return 'NORDESTE';
  if (a >= 67.5  && a < 112.5) return 'LESTE';
  if (a >= 112.5 && a < 157.5) return 'SUDESTE';
  if (a >= 157.5 && a < 202.5) return 'SUL';
  if (a >= 202.5 && a < 247.5) return 'SUDOESTE';
  if (a >= 247.5 && a < 292.5) return 'OESTE';
  if (a >= 292.5 && a < 337.5) return 'NOROESTE';
  return '---';
};

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

      // Concentric rings (factors for 1m, 5m, 10m, 15m)
      const ringFactors = [1/15, 5/15, 10/15, 1.0];
      ringFactors.forEach((f, i) => {
        ctx.globalAlpha = i === 3 ? 0.7 : 0.25;
        ctx.strokeStyle = '#006629';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Cross-hairs
      ctx.globalAlpha = 0.12;
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
          // Angle mapping: Server 0 deg = Up (canvas -90 deg or -PI/2)
          const bAngle = blip.angle !== undefined ? (blip.angle - 90) * (Math.PI / 180) : 0;
          // Distance mapping: Server 0.0-1.0 maps directly to R
          const bDist = blip.distance !== undefined ? blip.distance * R : R * 0.5;
          
          const tx = cx + Math.cos(bAngle) * bDist;
          const ty = cy + Math.sin(bAngle) * bDist;
          const pulse = 10 + (Math.sin(Date.now() / 280) * 0.5 + 0.5) * 9;
          
          ctx.save();
          ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
          ctx.shadowColor = '#ff2a2a';
          ctx.shadowBlur  = 14;
          ctx.fillStyle   = '#ff2a2a';
          ctx.globalAlpha = 0.9;
          ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill();
          
          ctx.globalAlpha = 0.45;
          ctx.strokeStyle = '#ff2a2a';
          ctx.lineWidth = 1.5;
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

      stateRef.current.angle = (angle + 0.015) % (Math.PI * 2);
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [threatActive]);

  return (
    <canvas ref={canvasRef} width={260} height={260}
      style={{ display: 'block', margin: '0 auto', borderRadius: '50%' }} />
  );
};

// ── TrackerScreen ─────────────────────────────────────────────────────────────

const TrackerScreen = ({ trackerState, blips, currentSector, goToSys }) => {
  const online   = trackerState !== 'offline';
  const threat   = trackerState === 'threat';
  
  // Find closest blip for text display
  const closestBlip = Array.isArray(blips) && blips.length > 0 
    ? blips.reduce((prev, curr) => (prev.distance < curr.distance) ? prev : curr) 
    : null;

  // ── Offline sub-state ────────────────────────────────────
  if (!online) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px 6px' }}>
        <span style={vt(20, C.main)}>TRACKER — {currentSector || 'A3'}</span>
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
        <span style={vt(20, C.main)}>TRACKER — {currentSector || 'A3'}</span>
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
        {threat && closestBlip ? (
          <>
            <div style={mono(11, C.amber, { letterSpacing: '0.05em' })}>ÚLTIMA DETECÇÃO: recente</div>
            <div style={{ ...vt(22, C.red), textShadow: glow(C.red) }}>
              DIREÇÃO: {getDirectionLabel(closestBlip.angle)} — {Math.max(1, Math.round(closestBlip.distance * 15))}m
            </div>
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
