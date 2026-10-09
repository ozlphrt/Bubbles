/**
 * Aerodrop Canvas Visual Renderer
 * Renders high-fidelity thin-film iridescent bubbles, dynamic Rayleigh wave distortions,
 * specular reflections, theme shaders, and particle shockwaves.
 */

import { BUBBLE_COLORS, getColorById } from './palette.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = 'soap'; // 'soap', 'neon', 'biolum', 'lava', 'mercury'
    this.bgParticles = [];
    this.time = 0;

    // Dynamically initialize all 50 gemstone/mineral materials from palette
    this.baseColors = {};
    for (let c of BUBBLE_COLORS) {
      this.baseColors[c.id] = c.hex;
      if (c.alias) this.baseColors[c.alias] = c.hex;
    }

    this.defaultBaseColors = { ...this.baseColors };

    this.colorAdjustments = {
      all: { saturation: 1.0, hueShift: 0, exposure: 1.0 }
    };
    for (let c of BUBBLE_COLORS) {
      this.colorAdjustments[c.id] = { saturation: 1.0, hueShift: 0, exposure: 1.0 };
      if (c.alias) this.colorAdjustments[c.alias] = { saturation: 1.0, hueShift: 0, exposure: 1.0 };
    }

    this.defaultColorAdjustments = JSON.parse(JSON.stringify(this.colorAdjustments));
    this.floatingTexts = [];

    // Animated in-game locked guidance state
    this.lockedHintActive = false;
    this.lockedHintAlpha = 0;
    this.lockedHintPos = null;
    this.targetHintPos = null;
    this.lastGapSearchTime = 0;

    this.initBackgroundStars();
  }

  addFloatingText(text, x, y, color = '#34d399') {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -2.2,
      life: 1.0,
      color
    });
  }

  getBaseColor(colorKey) {
    if (this.baseColors && this.baseColors[colorKey]) {
      return this.baseColors[colorKey];
    }
    const c = getColorById(colorKey);
    return c ? c.hex : '#38bdf8';
  }

  setBaseColor(colorKey, hex) {
    if (this.baseColors && this.baseColors[colorKey]) {
      this.baseColors[colorKey] = hex;
    }
  }

  getColorAdjustment(colorKey) {
    return (this.colorAdjustments && this.colorAdjustments[colorKey]) || { saturation: 1.0, hueShift: 0, exposure: 1.0 };
  }

  setColorAdjustment(colorKey, adjustments) {
    if (!this.colorAdjustments[colorKey]) {
      this.colorAdjustments[colorKey] = { saturation: 1.0, hueShift: 0, exposure: 1.0 };
    }
    this.colorAdjustments[colorKey] = { ...this.colorAdjustments[colorKey], ...adjustments };
  }

  resetColorAdjustment(colorKey) {
    if (colorKey === 'all') {
      this.colorAdjustments = JSON.parse(JSON.stringify(this.defaultColorAdjustments));
      this.baseColors = { ...this.defaultBaseColors };
    } else {
      if (this.defaultColorAdjustments[colorKey]) {
        this.colorAdjustments[colorKey] = { ...this.defaultColorAdjustments[colorKey] };
      }
      if (this.defaultBaseColors[colorKey]) {
        this.baseColors[colorKey] = this.defaultBaseColors[colorKey];
      }
    }
  }

  setAdjustments(adjustments) {
    this.setColorAdjustment('all', adjustments);
  }

  adjustColor(hex, colorKey = 'all', forceNeutral = false) {
    if (!this.colorAdjustments) return hex;
    const master = this.colorAdjustments.all || { saturation: 1.0, hueShift: 0, exposure: 1.0 };
    const spec = this.colorAdjustments[colorKey] || { saturation: 1.0, hueShift: 0, exposure: 1.0 };

    const totalSaturation = master.saturation * spec.saturation;
    const totalHueShift = master.hueShift + spec.hueShift;
    const totalExposure = master.exposure * spec.exposure;

    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    // Pure neutral grayscale - saturation and hue shifts never bleed color into white bubbles
    if (forceNeutral || colorKey === 'white' || Math.abs(max - min) < 0.03) {
      l = Math.max(0, Math.min(1, l * totalExposure));
      return `hsl(0, 0%, ${Math.round(l * 100)}%)`;
    }

    if (totalSaturation === 1.0 && totalHueShift === 0 && totalExposure === 1.0) return hex;

    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;

    h = (h + totalHueShift + 3600) % 360;
    s = Math.max(0, Math.min(1, s * totalSaturation));
    l = Math.max(0, Math.min(1, l * totalExposure));

    return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  setTheme(themeName) {
    this.theme = themeName;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  initBackgroundStars() {
    this.bgParticles = [];
    for (let i = 0; i < 40; i++) {
      this.bgParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: 0.8 + Math.random() * 2.0,
        speed: 0.1 + Math.random() * 0.3,
        alpha: 0.1 + Math.random() * 0.4
      });
    }
  }

  render(physics, mouseState, targetDiameter = 0) {
    const ctx = this.ctx;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cornerR = 40;
    this.time += 0.015;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Clip the canvas view to rounded bottom corners
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height - cornerR);
    ctx.arcTo(width, height, width - cornerR, height, cornerR);
    ctx.lineTo(cornerR, height);
    ctx.arcTo(0, height, 0, height - cornerR, cornerR);
    ctx.closePath();
    ctx.clip();

    this.renderBackground(ctx, width, height);
    this.renderGrid(ctx, width, height);
    this.renderAmbientParticles(ctx, width, height);
    // Render all bubbles with Plateau foam partition boundary geometry
    for (let i = 0; i < physics.bubbles.length; i++) {
      this.renderBubble(ctx, physics.bubbles[i], physics.bubbles, height, width, targetDiameter);
    }

    // Render popping spark particles and droplet bursts over bubbles
    this.renderDroplets(ctx, physics.droplets);

    // Render floating max size label badge for each color with goal highlight
    this.renderMaxLabels(ctx, physics.bubbles, targetDiameter);

    // Render floating bonus time & combo texts
    this.renderFloatingTexts(ctx);

    this.renderMouseFX(ctx, mouseState);
    this.renderLockedHint(ctx, physics, width, height);

    // Sleek dual-layer glass bottom border accent along rounded corners
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, height - cornerR);
    ctx.arcTo(0, height, cornerR, height, cornerR);
    ctx.lineTo(width - cornerR, height);
    ctx.arcTo(width, height, width, height - cornerR, cornerR);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.35)';
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height - cornerR);
    ctx.arcTo(0, height, cornerR, height, cornerR);
    ctx.lineTo(width - cornerR, height);
    ctx.arcTo(width, height, width, height - cornerR, cornerR);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  renderFloatingTexts(ctx) {
    if (this.floatingTexts.length === 0) return;
    ctx.save();
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= 0.052;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.life * 1.3));
      const scale = 1.0 + (1.0 - ft.life) * 0.16;
      ctx.translate(ft.x, ft.y);
      ctx.scale(scale, scale);

      ctx.font = '800 20px Outfit, Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Luminous glow shadow
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;

      ctx.fillStyle = '#ffffff';
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    }
    ctx.restore();
  }

  renderGrid(ctx, width, height) {
    ctx.save();
    const minorSize = 16;
    const majorSize = 80;

    // Ultra-fine micro grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.065)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    for (let x = 0; x <= width; x += minorSize) {
      ctx.moveTo(Math.floor(x) + 0.5, 0);
      ctx.lineTo(Math.floor(x) + 0.5, height);
    }
    for (let y = 0; y <= height; y += minorSize) {
      ctx.moveTo(0, Math.floor(y) + 0.5);
      ctx.lineTo(width, Math.floor(y) + 0.5);
    }
    ctx.stroke();

    // Major grid reference lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += majorSize) {
      ctx.moveTo(Math.floor(x) + 0.5, 0);
      ctx.lineTo(Math.floor(x) + 0.5, height);
    }
    for (let y = 0; y <= height; y += majorSize) {
      ctx.moveTo(0, Math.floor(y) + 0.5);
      ctx.lineTo(width, Math.floor(y) + 0.5);
    }
    ctx.stroke();

    ctx.restore();
  }

  renderBackground(ctx, width, height) {
    let grad;
    switch (this.theme) {
      case 'neon':
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#090814');
        grad.addColorStop(0.5, '#0c0a1f');
        grad.addColorStop(1, '#05040a');
        break;
      case 'biolum':
        grad = ctx.createRadialGradient(width * 0.5, height * 0.8, 100, width * 0.5, height * 0.5, height);
        grad.addColorStop(0, '#031c26');
        grad.addColorStop(0.6, '#020e14');
        grad.addColorStop(1, '#010609');
        break;
      case 'lava':
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#1a0505');
        grad.addColorStop(0.7, '#120202');
        grad.addColorStop(1, '#240400');
        break;
      case 'mercury':
        grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#101419');
        grad.addColorStop(1, '#07090b');
        break;
      case 'soap':
      default:
        grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#0a0d18');
        grad.addColorStop(0.5, '#0d1322');
        grad.addColorStop(1, '#080a12');
        break;
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const bottomGlow = ctx.createLinearGradient(0, height - 80, 0, height);
    bottomGlow.addColorStop(0, 'rgba(56, 189, 248, 0)');
    bottomGlow.addColorStop(1, 'rgba(56, 189, 248, 0.08)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, height - 80, width, 80);
  }

  renderAmbientParticles(ctx, width, height) {
    ctx.save();
    for (let p of this.bgParticles) {
      p.y -= p.speed;
      if (p.y < 0) {
        p.y = height;
        p.x = Math.random() * width;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 220, 255, ${p.alpha * (0.6 + Math.sin(this.time + p.x) * 0.4)})`;
      ctx.fill();
    }
    ctx.restore();
  }

  renderDroplets(ctx, droplets) {
    if (!droplets || droplets.length === 0) return;
    ctx.save();
    for (let d of droplets) {
      const alpha = Math.max(0, Math.min(1, d.life));
      if (alpha <= 0) continue;

      if (d.type === 'spark') {
        // 1. High-speed radiant spark streak with velocity-aligned trail
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = d.color;
        ctx.lineWidth = Math.max(1.2, (d.size || 2.0) * alpha);
        ctx.lineCap = 'round';
        ctx.shadowColor = d.glowColor || d.color;
        ctx.shadowBlur = 10 * alpha;

        const vx = d.vx || 0;
        const vy = d.vy || 0;
        const streakLen = Math.max(4, Math.sqrt(vx * vx + vy * vy) * 2.2);
        const angle = Math.atan2(vy, vx);

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - Math.cos(angle) * streakLen, d.y - Math.sin(angle) * streakLen);
        ctx.stroke();

        // Hot white sparkling tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(d.x, d.y, Math.max(0.7, (d.size || 2.0) * 0.45 * alpha), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else if (d.type === 'star') {
        // 2. Rotating 4-point sparkle star glitter
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation || 0);
        const twinkle = 0.75 + 0.35 * Math.sin(d.twinklePhase || 0);
        const starSize = Math.max(1.8, (d.size || 2.5) * alpha * twinkle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = d.color || '#ffffff';
        ctx.shadowColor = d.glowColor || '#ffffff';
        ctx.shadowBlur = 12 * alpha;

        ctx.beginPath();
        ctx.moveTo(0, -starSize);
        ctx.quadraticCurveTo(0, 0, starSize, 0);
        ctx.quadraticCurveTo(0, 0, 0, starSize);
        ctx.quadraticCurveTo(0, 0, -starSize, 0);
        ctx.quadraticCurveTo(0, 0, 0, -starSize);
        ctx.fill();

        // Bright white center sparkle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, starSize * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else if (d.type === 'fizz') {
        // 3. Floating fizz micro-bubble with specular dot
        ctx.save();
        ctx.globalAlpha = alpha;
        const fizzRadius = Math.max(1.0, (d.size || 1.8) * (0.85 + 0.15 * Math.sin(d.twinklePhase || 0)));
        ctx.beginPath();
        ctx.arc(d.x, d.y, fizzRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
        ctx.fill();
        ctx.strokeStyle = d.glowColor || 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 0.8;
        ctx.shadowColor = d.glowColor || '#ffffff';
        ctx.shadowBlur = 6 * alpha;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(d.x - fizzRadius * 0.35, d.y - fizzRadius * 0.35, fizzRadius * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else {
        // 4. Vibrant glowing droplet sphere
        ctx.save();
        ctx.globalAlpha = alpha;
        const dropRadius = Math.max(1.2, (d.size || 2.2) * Math.sqrt(alpha));
        ctx.beginPath();
        ctx.arc(d.x, d.y, dropRadius, 0, Math.PI * 2);
        ctx.fillStyle = d.color || 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = d.glowColor || d.color || '#ffffff';
        ctx.shadowBlur = 10 * alpha;
        ctx.fill();

        // Specular 3D highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(d.x - dropRadius * 0.3, d.y - dropRadius * 0.3, dropRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  /**
   * Renders single bubble with Plateau contact flattening and interstitial gap-closing deformation
   */
  renderBubble(ctx, b, allBubbles, height, width, targetDiameter = 0) {
    ctx.save();
    ctx.translate(b.x, b.y);

    const radius = Math.max(3, b.radius * (b.scalePulse || 1.0));
    const currentDiameter = Math.round(Math.max(b.radius, radius) * 2);
    const isGoalReached = targetDiameter > 0 && currentDiameter >= targetDiameter;

    // 1. Collect interacting contacting neighbors
    const interactingNeighbors = [];
    const len = allBubbles.length;
    for (let j = 0; j < len; j++) {
      const nb = allBubbles[j];
      if (nb === b) continue;
      const dx = nb.x - b.x;
      const dy = nb.y - b.y;
      const distSq = dx * dx + dy * dy;
      const sumR = radius + nb.radius;
      // Only form contact facets when bubbles are actually in contact / pressing together
      if (distSq < sumR * sumR && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const angle = Math.atan2(dy, dx);
        // Exact radical plane chord distance (sum of d1 + d2 exactly equals center distance, zero gap)
        const chordDist = (distSq + radius * radius - nb.radius * nb.radius) / (2 * dist);
        interactingNeighbors.push({
          angle,
          dist,
          chordDist: Math.max(radius * 0.20, chordDist),
          overlap: sumR - dist
        });
      }
    }

    // 2. Container wall & floor boundaries (including rounded bottom corners)
    const boundaries = [];
    const cornerR = 40;
    if (b.y > height - cornerR - 10) {
      if (b.x < cornerR + 10) {
        const cx = cornerR;
        const cy = height - cornerR;
        const angle = Math.atan2(b.y - cy, b.x - cx);
        const dist = Math.hypot(b.x - cx, b.y - cy);
        const chordDist = Math.max(2, cornerR - dist);
        boundaries.push({ angle, chordDist, overlap: Math.max(0, radius - chordDist) });
      } else if (b.x > width - cornerR - 10) {
        const cx = width - cornerR;
        const cy = height - cornerR;
        const angle = Math.atan2(b.y - cy, b.x - cx);
        const dist = Math.hypot(b.x - cx, b.y - cy);
        const chordDist = Math.max(2, cornerR - dist);
        boundaries.push({ angle, chordDist, overlap: Math.max(0, radius - chordDist) });
      }
    }

    if (b.x - radius < 12) {
      boundaries.push({ angle: Math.PI, chordDist: Math.max(2, b.x), overlap: Math.max(0, radius - b.x) });
    }
    if (width - b.x - radius < 12) {
      boundaries.push({ angle: 0, chordDist: Math.max(2, width - b.x), overlap: Math.max(0, radius - (width - b.x)) });
    }
    if (height - b.y - radius < 12) {
      boundaries.push({ angle: Math.PI / 2, chordDist: Math.max(2, height - b.y), overlap: Math.max(0, radius - (height - b.y)) });
    }

    // 3. Compute clean non-overlapping deformed contour points (strictly zero overlap)
    const numPoints = 64;
    const rawRadii = new Float32Array(numPoints);

    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      let r = radius;

      // Exact chord clipping against neighboring bubbles - strictly zero overlap
      for (let n of interactingNeighbors) {
        const cosDiff = Math.cos(theta - n.angle);
        if (cosDiff > 0.001) {
          const rChord = n.chordDist / cosDiff;
          if (rChord < r) {
            r = rChord;
          }
        }
      }

      // Exact chord clipping against floor / walls - strictly zero boundary overshoot
      for (let bd of boundaries) {
        const cosDiff = Math.cos(theta - bd.angle);
        if (cosDiff > 0.001) {
          const rChord = bd.chordDist / cosDiff;
          if (rChord < r) {
            r = rChord;
          }
        }
      }

      rawRadii[i] = r;
    }

    // Smooth transition corners without sagging the contact chord inward (eliminates artificial gaps)
    const smoothedRadii = new Float32Array(numPoints);
    for (let i = 0; i < numPoints; i++) {
      const prev = rawRadii[(i - 1 + numPoints) % numPoints];
      const curr = rawRadii[i];
      const next = rawRadii[(i + 1) % numPoints];
      const smoothed = prev * 0.22 + curr * 0.56 + next * 0.22;
      smoothedRadii[i] = Math.max(rawRadii[i], smoothed);
    }

    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      const r = smoothedRadii[i];
      points.push({
        x: Math.cos(theta) * r,
        y: Math.sin(theta) * r
      });
    }

    let minR = radius;
    for (let i = 0; i < numPoints; i++) {
      if (smoothedRadii[i] < minR) minR = smoothedRadii[i];
    }
    b.minRadius = minR;
    b.contourPoints = points;

    // 4. Define and draw bubble contour
    const traceContour = () => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length; i++) {
        const p0 = points[i];
        const p1 = points[(i + 1) % points.length];
        const midX = (p0.x + p1.x) * 0.5;
        const midY = (p0.y + p1.y) * 0.5;
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      }
      ctx.closePath();
    };

    traceContour();

    // 5. Faceted Brilliant Gemstone Shading
    // If goal reached: deliberately lowlight bubble (subdued opacity so unfinished bubbles take center focus)
    if (isGoalReached) {
      ctx.globalAlpha = (b.opacity !== undefined ? Math.max(0, b.opacity) : 1.0) * 0.46;
    } else if (b.opacity !== undefined && b.opacity < 1.0) {
      ctx.globalAlpha = Math.max(0, b.opacity);
    }
    this.applyThemeStyle(ctx, b, radius, traceContour);

    // If goal reached: apply subtle frosted lowlight wash and subdued rim
    if (isGoalReached) {
      this.renderLowlightOverlay(ctx, b, radius, traceContour);
    }

    // 6. Fusion Energy Flash Glow Overlay on Merge
    if (b.flashLife && b.flashLife > 0.02) {
      ctx.save();
      traceContour();
      ctx.clip();
      const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      flashGrad.addColorStop(0, `rgba(255, 255, 255, ${b.flashLife * 0.45})`);
      flashGrad.addColorStop(0.55, `rgba(255, 255, 255, ${b.flashLife * 0.20})`);
      flashGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = flashGrad;
      ctx.fill();
      ctx.restore();
    }

    // 7. Specular Diamond Starburst Highlights & Scintillation Glints
    // Subdue specular glints on completed bubbles so they don't sparkle or distract the player
    if (isGoalReached) {
      ctx.save();
      ctx.globalAlpha = (b.opacity !== undefined ? b.opacity : 1.0) * 0.18;
      this.renderHighlights(ctx, radius, b, smoothedRadii, numPoints, traceContour);
      ctx.restore();
    } else {
      this.renderHighlights(ctx, radius, b, smoothedRadii, numPoints, traceContour);
    }

    ctx.restore();
  }

  /**
   * Applies subtle lowlighting to a completed goal-met bubble
   * (Subdues saturation, softens contrast, and provides a calm frosted satisfaction aesthetic)
   */
  renderLowlightOverlay(ctx, b, radius, traceContour) {
    ctx.save();
    traceContour();
    ctx.clip();

    // 1. Soft dark glass recessing wash
    ctx.fillStyle = 'rgba(6, 9, 18, 0.38)';
    ctx.fill();

    // 2. Subtle frosted crystalline vignette
    const frostGrad = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius * 0.98);
    frostGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    frostGrad.addColorStop(0.70, 'rgba(148, 163, 184, 0.06)');
    frostGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.40)');
    ctx.fillStyle = frostGrad;
    ctx.fill();

    ctx.restore();

    // 3. Subtle, calm perimeter rim (soft subdued slate/white, no loud neon)
    ctx.save();
    traceContour();
    ctx.lineWidth = Math.max(1.0, radius * 0.02);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.stroke();
    ctx.restore();
  }

  getGemColorInfo(colorKey, b = null) {
    const colorObj = getColorById(colorKey);
    const isWhite = (colorObj && colorObj.isWhite) || (b && b.isWhite) || colorKey === 'white' || colorKey === 'diamond' || colorKey === 'moonstone' || colorKey === 'opal';
    const baseHex = this.getBaseColor(colorKey);
    const master = (this.colorAdjustments && this.colorAdjustments.all) || { saturation: 1.0, hueShift: 0, exposure: 1.0 };
    const spec = (this.colorAdjustments && this.colorAdjustments[colorKey]) || { saturation: 1.0, hueShift: 0, exposure: 1.0 };

    let c = baseHex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const bVal = parseInt(c.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, bVal), min = Math.min(r, g, bVal);
    let h = 0, s = 0, l = (max + min) / 2;
    const d = max - min;
    if (d > 0.001) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - bVal) / d + (g < bVal ? 6 : 0)); break;
        case g: h = ((bVal - r) / d + 2); break;
        case bVal: h = ((r - g) / d + 4); break;
      }
      h *= 60;
    }

    const totalSat = isWhite ? 0.08 : Math.max(0, Math.min(1, s * master.saturation * spec.saturation));
    const totalHue = isWhite ? 212 : ((h + master.hueShift + spec.hueShift + 3600) % 360);
    const totalExp = Math.max(0.2, Math.min(2.0, l * master.exposure * spec.exposure));

    // Per-color material optical properties from palette definition:
    const def = colorObj || { shininess: 0.85, reflectivity: 0.80, smoothness: 0.80 };
    const shininess = (b && b.shininess !== undefined) ? b.shininess : (def.shininess || 0.85);
    const reflectivity = (b && b.reflectivity !== undefined) ? b.reflectivity : (def.reflectivity || 0.80);
    const smoothness = (b && b.smoothness !== undefined) ? b.smoothness : (def.smoothness || 0.80);

    return { isWhite, h: totalHue, s: totalSat, l: totalExp, shininess, reflectivity, smoothness };
  }

  getFacetColor(gem, factor, alpha = 1.0) {
    if (gem.isWhite) {
      const lightness = Math.round((0.20 + factor * 0.78) * 100);
      const saturation = Math.round((0.16 - factor * 0.12) * 100);
      return `hsla(214, ${saturation}%, ${lightness}%, ${alpha})`;
    } else {
      let lightness, saturation;
      if (factor > 0.5) {
        const t = (factor - 0.5) * 2;
        lightness = Math.round((gem.l * 0.88 + t * 0.46) * 100);
        saturation = Math.round(Math.min(1, gem.s * (1.0 - t * 0.32)) * 100);
      } else {
        const t = factor * 2;
        lightness = Math.round((0.10 + t * (gem.l * 0.88 - 0.10)) * 100);
        saturation = Math.round(Math.min(1, gem.s * (0.85 + t * 0.25)) * 100);
      }
      return `hsla(${Math.round(gem.h)}, ${saturation}%, ${Math.min(98, Math.max(5, lightness))}%, ${alpha})`;
    }
  }

  applyThemeStyle(ctx, b, radius, traceContour) {
    const isWhite = b.isWhite || b.colorId === 'white' || (b.colorIndex === 0 && b.hue === 0);
    const colorKey = isWhite ? 'white' : (b.colorId || 'red');
    const gem = this.getGemColorInfo(colorKey, b);

    // Clip all internal glass refraction and caustics strictly within the bubble contour
    ctx.save();
    ctx.clip();

    // 1. Translucent Optical Glass Body (Airy, see-through chromatic glass)
    const bodyGrad = ctx.createRadialGradient(-radius * 0.22, -radius * 0.22, radius * 0.05, 0, 0, radius * 1.05);
    const centerAlpha = gem.smoothness > 0.85 ? 0.30 : 0.36;
    const midAlpha = gem.smoothness > 0.85 ? 0.20 : 0.26;

    if (gem.isWhite) {
      bodyGrad.addColorStop(0, `rgba(255, 255, 255, ${centerAlpha})`);
      bodyGrad.addColorStop(0.35, `rgba(240, 249, 255, ${midAlpha})`);
      bodyGrad.addColorStop(0.70, 'rgba(203, 213, 225, 0.28)');
      bodyGrad.addColorStop(1.0, 'rgba(100, 116, 139, 0.48)');
    } else {
      bodyGrad.addColorStop(0, `hsla(${gem.h}, 95%, ${Math.min(88, Math.round(gem.l * 85))}%, ${centerAlpha})`);
      bodyGrad.addColorStop(0.35, `hsla(${gem.h}, 92%, ${Math.min(76, Math.round(gem.l * 70))}%, ${midAlpha})`);
      bodyGrad.addColorStop(0.70, `hsla(${gem.h}, 92%, ${Math.round(gem.l * 54)}%, 0.36)`);
      bodyGrad.addColorStop(1.0, `hsla(${gem.h}, 95%, 32%, 0.58)`);
    }
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // 2. Internal Refractive Caustic Pool (Luminous colored focal heart)
    const cx = radius * 0.26;
    const cy = radius * 0.26;
    const cr = radius * 0.62;
    const causticGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    const causticPeak = Math.min(0.62, 0.35 + 0.30 * gem.reflectivity);

    if (gem.isWhite) {
      causticGrad.addColorStop(0, `rgba(255, 255, 255, ${causticPeak.toFixed(2)})`);
      causticGrad.addColorStop(0.45, `rgba(224, 242, 254, ${(causticPeak * 0.45).toFixed(2)})`);
      causticGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
    } else {
      causticGrad.addColorStop(0, `hsla(${gem.h}, 100%, ${Math.min(94, Math.round(gem.l * 125))}%, ${causticPeak.toFixed(2)})`);
      causticGrad.addColorStop(0.45, `hsla(${gem.h}, 100%, ${Math.round(gem.l * 90)}%, ${(causticPeak * 0.45).toFixed(2)})`);
      causticGrad.addColorStop(1.0, `hsla(${gem.h}, 95%, 45%, 0)`);
    }
    ctx.fillStyle = causticGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Ends clipping

    // 3. Polished Glass Rim (Fresnel Rim - wraps bubble in radiant thin glass edge)
    if (typeof traceContour === 'function') {
      ctx.save();
      traceContour();
      ctx.lineWidth = Math.max(1.1, radius * (0.032 + 0.010 * gem.reflectivity));
      const rimGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
      const topRimAlpha = Math.min(0.88, 0.55 + 0.30 * gem.reflectivity).toFixed(2);
      const midRimAlpha = (0.35 + 0.25 * gem.reflectivity).toFixed(2);

      if (gem.isWhite) {
        rimGrad.addColorStop(0, `rgba(255, 255, 255, ${topRimAlpha})`);
        rimGrad.addColorStop(0.35, `rgba(224, 242, 254, ${midRimAlpha})`);
        rimGrad.addColorStop(0.70, 'rgba(186, 230, 253, 0.25)');
        rimGrad.addColorStop(1.0, 'rgba(71, 85, 105, 0.45)');
      } else {
        rimGrad.addColorStop(0, `rgba(255, 255, 255, ${topRimAlpha})`);
        rimGrad.addColorStop(0.30, `hsla(${gem.h}, 100%, 82%, ${midRimAlpha})`);
        rimGrad.addColorStop(0.70, `hsla(${gem.h}, 90%, 50%, 0.28)`);
        rimGrad.addColorStop(1.0, `hsla(${gem.h}, 95%, 30%, 0.48)`);
      }
      ctx.strokeStyle = rimGrad;
      ctx.stroke();
      ctx.restore();
    }
  }

  renderHighlights(ctx, radius, b, smoothedRadii = null, numPoints = 0, traceContour = null) {
    if (radius < 4) return;

    // Strictly clip all reflections within the actual bubble surface boundary
    ctx.save();
    if (typeof traceContour === 'function') {
      traceContour();
      ctx.clip();
    }

    const isWhite = b.isWhite || b.colorId === 'white' || (b.colorIndex === 0 && b.hue === 0);
    const colorKey = isWhite ? 'white' : (b.colorId || 'red');
    const gem = this.getGemColorInfo(colorKey, b);

    // Helper to evaluate local surface radius along any angular direction
    const getRadiusAtAngle = (angle) => {
      if (!smoothedRadii || !numPoints) return radius;
      const twoPi = Math.PI * 2;
      let a = angle % twoPi;
      if (a < 0) a += twoPi;
      const idx = (a / twoPi) * numPoints;
      const i0 = Math.floor(idx) % numPoints;
      const i1 = (i0 + 1) % numPoints;
      const frac = idx - Math.floor(idx);
      return smoothedRadii[i0] * (1 - frac) + smoothedRadii[i1] * frac;
    };

    // 1. Primary Curved Glass Gloss Crescent
    // Smoothness controls tightness/polish of the reflection arc
    // Shininess controls peak gloss luminance
    const primaryAngle = Math.atan2(-0.34, -0.30);
    const localRPrimary = Math.min(radius, getRadiusAtAngle(primaryAngle));
    const scalePrimary = Math.min(1.0, Math.max(0.15, localRPrimary / radius));
    const effPrimaryR = radius * scalePrimary;

    ctx.save();
    ctx.translate(-effPrimaryR * 0.30, -effPrimaryR * 0.34);
    ctx.rotate(-Math.PI / 4);

    const glossRx = Math.max(1.8, effPrimaryR * (0.33 + (1 - gem.smoothness) * 0.16));
    const glossRy = Math.max(0.8, effPrimaryR * (0.11 + (1 - gem.smoothness) * 0.08));

    const glossGrad = ctx.createLinearGradient(-glossRx, -glossRy, glossRx, glossRy);
    const peakGloss = Math.min(0.98, 0.60 + 0.38 * gem.shininess).toFixed(2);
    const midGloss = (0.40 + 0.35 * gem.shininess).toFixed(2);

    glossGrad.addColorStop(0, `rgba(255, 255, 255, ${peakGloss})`);
    glossGrad.addColorStop(0.45, `rgba(255, 255, 255, ${midGloss})`);
    glossGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = glossGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, glossRx, glossRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Pinpoint Sparkling Glass Dot
    const dotAngle = Math.atan2(-0.44, -0.44);
    const localRDot = Math.min(radius, getRadiusAtAngle(dotAngle));
    const scaleDot = Math.min(1.0, Math.max(0.15, localRDot / radius));
    const effDotR = radius * scaleDot;

    ctx.save();
    const sx = -effDotR * 0.44;
    const sy = -effDotR * 0.44;
    const dotR = Math.max(0.8, effDotR * (0.052 + (1 - gem.smoothness) * 0.030));

    ctx.beginPath();
    ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.65 + 0.35 * gem.shininess).toFixed(2)})`;
    ctx.shadowColor = gem.isWhite ? '#93c5fd' : '#ffffff';
    ctx.shadowBlur = Math.max(2, effDotR * 0.12 * gem.shininess);
    ctx.fill();
    ctx.restore();

    // 3. Secondary Glass Surface Glint (Present on high-shininess/high-polish gems)
    if (radius > 14 && gem.shininess > 0.80) {
      const glintAngle = Math.atan2(-0.56, -0.12);
      const localRGlint = Math.min(radius, getRadiusAtAngle(glintAngle));
      const scaleGlint = Math.min(1.0, Math.max(0.15, localRGlint / radius));
      const effGlintR = radius * scaleGlint;

      ctx.save();
      const s2x = -effGlintR * 0.12;
      const s2y = -effGlintR * 0.56;
      ctx.beginPath();
      ctx.arc(s2x, s2y, Math.max(0.6, effGlintR * 0.038 * gem.shininess), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.50 + 0.30 * gem.shininess).toFixed(2)})`;
      ctx.fill();
      ctx.restore();
    }

    // 4. Opposing Rim Internal Caustic Bounce (Modulated by reflectivity)
    if (radius > 10) {
      const oppAngle = Math.PI / 4;
      const localROpp = Math.min(radius, getRadiusAtAngle(oppAngle));
      const scaleOpp = Math.min(1.0, Math.max(0.15, localROpp / radius));
      const effOppR = radius * scaleOpp;

      ctx.save();
      const ox = Math.cos(oppAngle) * (effOppR * 0.76);
      const oy = Math.sin(oppAngle) * (effOppR * 0.76);
      const or = effOppR * (0.22 + 0.08 * gem.reflectivity);

      const bounceAlpha = (0.25 + 0.30 * gem.reflectivity).toFixed(2);
      const rimBounce = ctx.createRadialGradient(ox, oy, 0, ox, oy, or);
      rimBounce.addColorStop(0, gem.isWhite ? `rgba(255, 255, 255, ${bounceAlpha})` : `hsla(${gem.h}, 95%, 80%, ${bounceAlpha})`);
      rimBounce.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = rimBounce;
      ctx.beginPath();
      ctx.arc(ox, oy, or, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // Ends traceContour clipping
  }

  /**
   * Renders an isolated preview bubble with the exact same material shader,
   * thin-film Fresnel rim, Rayleigh interference, and specular glints as gameplay.
   */
  renderStandaloneBubble(ctx, x, y, radius, colorId) {
    ctx.save();
    ctx.translate(x, y);

    const b = {
      colorId,
      isWhite: colorId === 'white',
      scalePulse: 1.0
    };

    const traceContour = () => {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.closePath();
    };

    traceContour();

    // Identical faceted cut-gemstone shader
    this.applyThemeStyle(ctx, b, radius, traceContour);

    // Identical diamond sparkle flares, caustics & prismatic dispersion
    this.renderHighlights(ctx, radius, b, null, 0, traceContour);

    ctx.restore();
  }

  /**
   * Calculates the absolute maximum font size for a bubble's diameter label
   * so that the number fills the bubble as big as possible without any pixel or stroke
   * crossing or touching outside the bubble's boundary.
   */
  calculateMaxFontSize(ctx, text, b, isGoalReached = false) {
    const radius = b.radius || 20;
    const effR = b.minRadius ? Math.min(radius, b.minRadius) : radius;
    if (effR < 8) return 10;

    // 1. Measure text dimensions at reference 100px font
    ctx.font = `${isGoalReached ? '600' : '800'} 100px Outfit, Inter, system-ui, sans-serif`;
    const m = ctx.measureText(text);
    const w100 = m.width || 180;
    const maxHalfW = (m.actualBoundingBoxLeft !== undefined && m.actualBoundingBoxRight !== undefined && m.actualBoundingBoxLeft > 0)
      ? Math.max(m.actualBoundingBoxLeft, m.actualBoundingBoxRight)
      : (w100 / 2);
    const maxHalfH = (m.actualBoundingBoxAscent !== undefined && m.actualBoundingBoxDescent !== undefined && m.actualBoundingBoxAscent > 0)
      ? Math.max(m.actualBoundingBoxAscent, m.actualBoundingBoxDescent)
      : 36;

    // Stroke outline allowance per font px (stroke width is ~0.12 * fontSize, outer expansion is ~0.06)
    const strokeAllowance = isGoalReached ? 0.03 : 0.07;
    const halfUnitW = (maxHalfW / 100) + strokeAllowance;
    const halfUnitH = (maxHalfH / 100) + strokeAllowance;

    // Safety margin to guarantee zero boundary contact
    const margin = isGoalReached ? 0.90 : 0.94;

    const numPoints = (b.contourPoints && b.contourPoints.length >= 16) ? b.contourPoints.length : 0;
    let minAllowedFont = 999;

    if (numPoints > 0) {
      for (let i = 0; i < numPoints; i++) {
        const pt = b.contourPoints[i];
        const r_i = Math.hypot(pt.x, pt.y) * margin;
        const angle = (i / numPoints) * Math.PI * 2;
        const cosA = Math.abs(Math.cos(angle));
        const sinA = Math.abs(Math.sin(angle));

        // Exact distance from center to bounding box boundary along ray at this angle
        const distPerPx = Math.min(
          cosA > 1e-4 ? halfUnitW / cosA : 1e9,
          sinA > 1e-4 ? halfUnitH / sinA : 1e9
        );

        if (distPerPx > 0) {
          const maxF_i = r_i / distPerPx;
          if (maxF_i < minAllowedFont) {
            minAllowedFont = maxF_i;
          }
        }
      }
    } else {
      const cornerDist = Math.hypot(halfUnitW, halfUnitH);
      minAllowedFont = (effR * margin) / cornerDist;
    }

    const maxFont = Math.floor(minAllowedFont);
    return Math.max(12, Math.min(140, maxFont));
  }

  /**
   * Identifies the largest bubble for each color and renders a sleek size label
   */
  renderMaxLabels(ctx, bubbles, targetDiameter = 0) {
    if (!bubbles || bubbles.length === 0) return;

    const maxByColor = {};

    for (let b of bubbles) {
      if (!b || b.radius < 14) continue;

      let key = b.colorId;
      if (!key) {
        const isWhite = b.isWhite || (b.colorIndex === 0 && b.hue === 0);
        if (isWhite) key = 'white';
        else {
          const hue = b.hue !== undefined ? b.hue : 0;
          if (hue >= 240 && hue <= 300) key = 'purple';
          else if (hue >= 170 && hue <= 230) key = 'cyan';
          else if (hue >= 100 && hue <= 169) key = 'green';
          else if (hue >= 15 && hue <= 80) key = 'orange';
          else key = 'red';
        }
      }

      if (!maxByColor[key] || b.radius > maxByColor[key].radius) {
        maxByColor[key] = b;
      }
    }

    const EMISSIONS = {
      white:  { glow: '#38bdf8', glowRgb: '56, 189, 248', stroke: 'rgba(3, 7, 18, 0.92)', core: '#ffffff' },
      cyan:   { glow: '#0ea5e9', glowRgb: '14, 165, 233', stroke: 'rgba(2, 6, 23, 0.90)',  core: '#ffffff' },
      green:  { glow: '#10b981', glowRgb: '16, 185, 129', stroke: 'rgba(2, 20, 12, 0.90)', core: '#ffffff' },
      red:    { glow: '#f43f5e', glowRgb: '244, 63, 94',  stroke: 'rgba(24, 2, 8, 0.90)',  core: '#ffffff' },
      orange: { glow: '#f59e0b', glowRgb: '245, 158, 11', stroke: 'rgba(26, 14, 2, 0.90)', core: '#ffffff' },
      purple: { glow: '#a855f7', glowRgb: '168, 85, 247', stroke: 'rgba(20, 4, 32, 0.90)', core: '#ffffff' }
    };

    ctx.save();
    for (let key of Object.keys(maxByColor)) {
      const b = maxByColor[key];
      if (!b || b.radius < 14) continue;

      const diameter = Math.round(b.radius * 2);
      const isGoalReached = targetDiameter > 0 && diameter >= targetDiameter;
      const text = isGoalReached ? `${diameter} ✓` : `${diameter}`;
      let em = EMISSIONS[key];
      if (!em) {
        const cObj = getColorById(key);
        const hex = cObj ? cObj.hex : this.getBaseColor(key);
        let h = hex.replace('#', '');
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        const r = parseInt(h.substring(0, 2), 16) || 56;
        const g = parseInt(h.substring(2, 4), 16) || 189;
        const bVal = parseInt(h.substring(4, 6), 16) || 248;
        em = {
          glow: hex,
          glowRgb: `${r}, ${g}, ${bVal}`,
          stroke: 'rgba(3, 7, 18, 0.92)',
          core: '#ffffff'
        };
      }

      ctx.save();
      ctx.translate(b.x, b.y);

      // Strictly clip readout to the bubble's actual boundary so text never bleeds outside
      if (b.contourPoints && b.contourPoints.length > 0) {
        ctx.beginPath();
        const pts = b.contourPoints;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 0; i < pts.length; i++) {
          const p0 = pts[i];
          const p1 = pts[(i + 1) % pts.length];
          const midX = (p0.x + p1.x) * 0.5;
          const midY = (p0.y + p1.y) * 0.5;
          ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
        }
        ctx.closePath();
        ctx.clip();
      }

      // Maximize font size dynamically to fill the bubble as much as possible without crossing any boundary
      const fontSize = this.calculateMaxFontSize(ctx, text, b, isGoalReached);
      ctx.font = `${isGoalReached ? '600' : '800'} ${fontSize}px Outfit, Inter, system-ui, sans-serif`;
      const textWidth = ctx.measureText(text).width;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isGoalReached) {
        // Lowlighted subtle text: muted translucent slate/white, no loud neon glow
        ctx.save();
        ctx.fillStyle = 'rgba(203, 213, 225, 0.55)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1;
        ctx.fillText(text, 0, 0);
        ctx.restore();
      } else {
        // Active goal bubble: high-contrast vibrant glow and crisp white-hot core
        // 1. Soft radial vignette & light emission aura behind number
        const auraRadius = Math.max(textWidth * 0.70, fontSize * 0.85);
        const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, auraRadius);
        auraGrad.addColorStop(0, 'rgba(3, 7, 18, 0.58)');
        auraGrad.addColorStop(0.55, `rgba(${em.glowRgb}, 0.24)`);
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();

        // 2. Outer Light Emission Bloom
        ctx.save();
        ctx.shadowColor = em.glow;
        ctx.shadowBlur = Math.max(12, fontSize * 0.45);
        ctx.lineWidth = Math.max(2, fontSize * 0.06);
        ctx.strokeStyle = `rgba(${em.glowRgb}, 0.75)`;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, 0, 0);
        ctx.restore();

        // 3. Crisp Dark Outline Halo (Detaches text cleanly from glossy reflections)
        ctx.save();
        ctx.strokeStyle = em.stroke;
        ctx.lineWidth = Math.max(3.2, fontSize * 0.12);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = Math.max(4, fontSize * 0.14);
        ctx.shadowOffsetY = Math.max(1, fontSize * 0.04);
        ctx.strokeText(text, 0, 0);
        ctx.restore();

        // 4. White-Hot Luminous Core Fill
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = em.glow;
        ctx.shadowBlur = Math.max(4, fontSize * 0.16);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }

      ctx.restore();
    }
    ctx.restore();
  }

  renderMouseFX(ctx, mouseState) {
    if (!mouseState.active) return;
    const { x, y, mode, isDown } = mouseState;

    ctx.save();
    if (mode === 'spawn') {
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (isDown) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fill();
      }
    } else if (mode === 'force') {
      ctx.beginPath();
      ctx.arc(x, y, 55, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 30, this.time * 3, this.time * 3 + Math.PI * 1.3);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (mode === 'attract') {
      ctx.beginPath();
      ctx.arc(x, y, 70, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 10 + Math.sin(this.time * 6) * 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.fill();
    } else if (mode === 'pop') {
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x - 8, y - 8);
      ctx.lineTo(x + 8, y + 8);
      ctx.moveTo(x + 8, y - 8);
      ctx.lineTo(x - 8, y + 8);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Toggles the animated locked/unblock guidance
   */
  setLockedHint(active) {
    this.lockedHintActive = active;
    if (active && !this.lockedHintPos) {
      this.lastGapSearchTime = 0; // Trigger immediate gap scan
    }
  }

  /**
   * Scans the active board geometry to locate the most spacious open gap between bubbles
   */
  findBestEmptyGap(physics, width, height) {
    if (!physics || !physics.bubbles || physics.bubbles.length === 0) {
      return { x: width * 0.5, y: height * 0.45 };
    }

    let bestX = width * 0.5;
    let bestY = height * 0.45;
    let maxClearance = -Infinity;

    const startX = 60;
    const endX = width - 60;
    const startY = 120;
    const endY = height - 90;

    const stepX = Math.max(30, Math.floor((endX - startX) / 14));
    const stepY = Math.max(30, Math.floor((endY - startY) / 18));

    for (let x = startX; x <= endX; x += stepX) {
      for (let y = startY; y <= endY; y += stepY) {
        let minSurfaceDist = Infinity;
        for (let i = 0; i < physics.bubbles.length; i++) {
          const b = physics.bubbles[i];
          const d = Math.hypot(x - b.x, y - b.y) - b.radius;
          if (d < minSurfaceDist) {
            minSurfaceDist = d;
          }
        }
        if (minSurfaceDist > maxClearance) {
          maxClearance = minSurfaceDist;
          bestX = x;
          bestY = y;
        }
      }
    }

    return { x: bestX, y: bestY };
  }

  /**
   * Renders high-visibility animated guidance when the player is locked or idle:
   * Concentric sonar ripples, breathing dashed gem reticle, bouncing pointer hand, and frosted glass pill.
   */
  renderLockedHint(ctx, physics, width, height) {
    if (this.lockedHintActive) {
      this.lockedHintAlpha = Math.min(1.0, this.lockedHintAlpha + 0.045);
    } else {
      this.lockedHintAlpha = Math.max(0.0, this.lockedHintAlpha - 0.075);
    }

    if (this.lockedHintAlpha <= 0.005) {
      this.lockedHintPos = null;
      return;
    }

    const now = performance.now();
    if (!this.targetHintPos || now - this.lastGapSearchTime > 1200) {
      this.lastGapSearchTime = now;
      this.targetHintPos = this.findBestEmptyGap(physics, width, height);
      if (!this.lockedHintPos) {
        this.lockedHintPos = { ...this.targetHintPos };
      }
    }

    if (!this.lockedHintPos) return;

    // Smoothly glide position if target moves
    this.lockedHintPos.x += (this.targetHintPos.x - this.lockedHintPos.x) * 0.08;
    this.lockedHintPos.y += (this.targetHintPos.y - this.lockedHintPos.y) * 0.08;

    const gx = this.lockedHintPos.x;
    const gy = this.lockedHintPos.y;
    const alpha = this.lockedHintAlpha;

    ctx.save();

    // 1. Soft radial cyan-indigo back-glow aura
    const aura = ctx.createRadialGradient(gx, gy, 0, gx, gy, 70);
    aura.addColorStop(0, `rgba(56, 189, 248, ${0.30 * alpha})`);
    aura.addColorStop(0.55, `rgba(99, 102, 241, ${0.12 * alpha})`);
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(gx, gy, 70, 0, Math.PI * 2);
    ctx.fill();

    // 2. Expanding Sonar Pulse Rings
    for (let rIdx = 0; rIdx < 2; rIdx++) {
      const phase = ((this.time * 1.5 + rIdx * 0.5) % 1.0);
      const ringR = 14 + phase * 46;
      const ringAlpha = Math.max(0, (1.0 - phase) * 0.80 * alpha);
      ctx.beginPath();
      ctx.arc(gx, gy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${ringAlpha})`;
      ctx.lineWidth = Math.max(1.0, 2.5 * (1.0 - phase * 0.5));
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10 * ringAlpha;
      ctx.stroke();
    }

    // 3. Spawning Gem Target Silhouette (breathing dashed ring)
    const targetR = 24 + Math.sin(this.time * 4) * 2.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(gx, gy, targetR, 0, Math.PI * 2);
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -this.time * 16;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * alpha})`;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();

    // 4. Center Glowing Sparkle Symbol
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * alpha})`;
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12 * alpha;
    ctx.fillText('+', gx, gy);
    ctx.restore();

    // 5. Animated Bouncing Hand Pointer
    const tapCycle = (this.time * 3.4) % (Math.PI * 2);
    const tapOffset = Math.max(0, Math.sin(tapCycle)) * 14;
    const handX = gx + 10;
    const handY = gy + 22 + (14 - tapOffset);
    ctx.save();
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 10;
    ctx.globalAlpha = alpha;
    ctx.fillText('👆', handX, handY);
    ctx.restore();

    // 6. Floating Frosted Glass Capsule Badge
    const labelText = 'TAP GAP TO UNLOCK';
    ctx.save();
    ctx.font = '700 11px "JetBrains Mono", monospace';
    const textW = ctx.measureText(labelText).width;
    const pillW = textW + 24;
    const pillH = 22;
    const pillX = gx - pillW / 2;
    const pillY = gy - 44;
    const pillR = pillH / 2;

    // Pill background
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
    } else {
      ctx.rect(pillX, pillY, pillW, pillH);
    }
    ctx.fillStyle = `rgba(11, 17, 32, ${0.90 * alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.65 * alpha})`;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Pill text
    ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * alpha})`;
    ctx.shadowColor = 'transparent';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, gx, pillY + pillH / 2);
    ctx.restore();

    ctx.restore();
  }
}
