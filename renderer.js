/**
 * Aerodrop Canvas Visual Renderer
 * Renders high-fidelity thin-film iridescent bubbles, dynamic Rayleigh wave distortions,
 * specular reflections, theme shaders, and particle shockwaves.
 */

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = 'soap'; // 'soap', 'neon', 'biolum', 'lava', 'mercury'
    this.bgParticles = [];
    this.time = 0;

    this.baseColors = {
      white: '#ffffff',
      green: '#22c55e',
      red: '#f43f5e',
      orange: '#f97316',
      purple: '#a855f7',
      cyan: '#06b6d4'
    };

    this.defaultBaseColors = { ...this.baseColors };

    this.colorAdjustments = {
      all:    { saturation: 1.0, hueShift: 0, exposure: 1.0 },
      white:  { saturation: 1.0, hueShift: 0, exposure: 1.0 },
      green:  { saturation: 1.0, hueShift: 0, exposure: 1.0 },
      red:    { saturation: 1.0, hueShift: 0, exposure: 1.0 },
      orange: { saturation: 1.0, hueShift: 0, exposure: 1.0 },
      purple: { saturation: 1.0, hueShift: 0, exposure: 0.75 },
      cyan:   { saturation: 1.0, hueShift: 0, exposure: 1.0 }
    };

    this.defaultColorAdjustments = JSON.parse(JSON.stringify(this.colorAdjustments));

    this.initBackgroundStars();
  }

  getBaseColor(colorKey) {
    return (this.baseColors && this.baseColors[colorKey]) || '#38bdf8';
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

  render(physics, mouseState) {
    const ctx = this.ctx;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.time += 0.015;

    this.renderBackground(ctx, width, height);
    this.renderGrid(ctx, width, height);
    this.renderAmbientParticles(ctx, width, height);
    this.renderDroplets(ctx, physics.droplets);

    // Render all bubbles with Plateau foam partition boundary geometry
    for (let i = 0; i < physics.bubbles.length; i++) {
      this.renderBubble(ctx, physics.bubbles[i], physics.bubbles, height, width);
    }

    // Render floating max size label badge for each color
    this.renderMaxLabels(ctx, physics.bubbles);

    this.renderMouseFX(ctx, mouseState);
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
      ctx.beginPath();
      ctx.arc(d.x, d.y, Math.max(1.2, d.radius), 0, Math.PI * 2);
      ctx.fillStyle = d.color || `rgba(255, 255, 255, ${d.life * 0.8})`;
      ctx.globalAlpha = Math.max(0, d.life);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Renders single bubble with Plateau contact flattening and interstitial gap-closing deformation
   */
  renderBubble(ctx, b, allBubbles, height, width) {
    ctx.save();
    ctx.translate(b.x, b.y);

    const radius = Math.max(3, b.radius * (b.scalePulse || 1.0));

    // 1. Collect interacting contacting neighbors
    const interactingNeighbors = [];
    const len = allBubbles.length;
    for (let j = 0; j < len; j++) {
      const nb = allBubbles[j];
      if (nb === b) continue;
      const dx = nb.x - b.x;
      const dy = nb.y - b.y;
      const distSq = dx * dx + dy * dy;
      const touchDist = (radius + nb.radius) * 1.08;
      if (distSq < touchDist * touchDist && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const angle = Math.atan2(dy, dx);
        // Distance to the flat contact chord from center of b
        const chordDist = (distSq + radius * radius - nb.radius * nb.radius) / (2 * dist);
        const overlap = Math.max(0, (radius + nb.radius) - dist);
        interactingNeighbors.push({
          angle,
          dist,
          chordDist: Math.max(radius * 0.15, chordDist - overlap * 0.18),
          overlap
        });
      }
    }

    // 2. Container wall & floor boundaries
    const boundaries = [];
    if (b.x - radius < 12) {
      boundaries.push({ angle: Math.PI, chordDist: Math.max(2, b.x), overlap: Math.max(0, radius - b.x) });
    }
    if (width - b.x - radius < 12) {
      boundaries.push({ angle: 0, chordDist: Math.max(2, width - b.x), overlap: Math.max(0, radius - (width - b.x)) });
    }
    if (height - b.y - radius < 12) {
      boundaries.push({ angle: Math.PI / 2, chordDist: Math.max(2, height - b.y), overlap: Math.max(0, radius - (height - b.y)) });
    }

    // 3. Compute clean deformed contour points (exact contact chord flattening with smooth corner filleting)
    const numPoints = 64;
    const rawRadii = new Float32Array(numPoints);

    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      let r = radius;

      // Exact chord clipping against neighboring bubbles
      for (let n of interactingNeighbors) {
        const cosDiff = Math.cos(theta - n.angle);
        if (cosDiff > 0.001) {
          const rChord = n.chordDist / cosDiff;
          if (rChord < r) {
            r = rChord;
          }
        }
      }

      // Exact chord clipping against floor / walls
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

    // 2-pass smoothing to naturally fillet contact corners without any notched ears
    const smoothedRadii = new Float32Array(numPoints);
    smoothedRadii.set(rawRadii);

    for (let pass = 0; pass < 2; pass++) {
      const prevArray = new Float32Array(smoothedRadii);
      for (let i = 0; i < numPoints; i++) {
        const prev = prevArray[(i - 1 + numPoints) % numPoints];
        const curr = prevArray[i];
        const next = prevArray[(i + 1) % numPoints];
        smoothedRadii[i] = prev * 0.25 + curr * 0.50 + next * 0.25;
      }
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

    // 4. Draw smooth continuous spline contour
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

    // 5. 3D Volumetric Plastic Shading (No border outlines or clamped halo)
    if (b.opacity !== undefined && b.opacity < 1.0) {
      ctx.globalAlpha = Math.max(0, b.opacity);
    }
    this.applyThemeStyle(ctx, b, radius);

    // 6. Fusion Energy Flash Glow Overlay on Merge
    if (b.flashLife && b.flashLife > 0.02) {
      const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      flashGrad.addColorStop(0, `rgba(255, 255, 255, ${b.flashLife * 0.45})`);
      flashGrad.addColorStop(0.55, `rgba(255, 255, 255, ${b.flashLife * 0.20})`);
      flashGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = flashGrad;
      ctx.fill();
    }

    // 7. Specular Plastic Highlights
    this.renderHighlights(ctx, radius, b);

    ctx.restore();
  }

  generateGradientStops(baseHex, colorKey) {
    if (colorKey === 'white' && (baseHex.toLowerCase() === '#ffffff' || baseHex.toLowerCase() === '#fff')) {
      return [
        this.adjustColor('#ffffff', 'white', true),
        this.adjustColor('#f5f5f5', 'white', true),
        this.adjustColor('#d4d4d4', 'white', true),
        this.adjustColor('#737373', 'white', true)
      ];
    }

    let c = baseHex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    const d = max - min;
    if (d > 0.001) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
        case g: h = ((b - r) / d + 2); break;
        case b: h = ((r - g) / d + 4); break;
      }
      h *= 60;
    }

    const hslToHex = (hDeg, sVal, lVal) => {
      hDeg = (hDeg % 360 + 360) % 360;
      sVal = Math.max(0, Math.min(1, sVal));
      lVal = Math.max(0, Math.min(1, lVal));
      const cVal = (1 - Math.abs(2 * lVal - 1)) * sVal;
      const xVal = cVal * (1 - Math.abs(((hDeg / 60) % 2) - 1));
      const mVal = lVal - cVal / 2;
      let rP = 0, gP = 0, bP = 0;
      if (hDeg < 60) { rP = cVal; gP = xVal; }
      else if (hDeg < 120) { rP = xVal; gP = cVal; }
      else if (hDeg < 180) { gP = cVal; bP = xVal; }
      else if (hDeg < 240) { gP = xVal; bP = cVal; }
      else if (hDeg < 300) { rP = xVal; bP = cVal; }
      else { rP = cVal; bP = xVal; }
      const toHex = (n) => Math.round((n + mVal) * 255).toString(16).padStart(2, '0');
      return `#${toHex(rP)}${toHex(gP)}${toHex(bP)}`;
    };

    const isNeutral = (colorKey === 'white') || (s < 0.04);
    const stop0 = hslToHex(h, s * 0.40, l + (1 - l) * 0.78);
    const stop1 = hslToHex(h, s * 0.85, l + (1 - l) * 0.35);
    const stop2 = baseHex;
    const stop3 = hslToHex(h, Math.min(1, s * 1.15), l * 0.52);

    return [
      this.adjustColor(stop0, colorKey, isNeutral),
      this.adjustColor(stop1, colorKey, isNeutral),
      this.adjustColor(stop2, colorKey, isNeutral),
      this.adjustColor(stop3, colorKey, isNeutral)
    ];
  }

  applyThemeStyle(ctx, b, radius) {
    const isWhite = b.isWhite || b.colorId === 'white' || (b.colorIndex === 0 && b.hue === 0);
    const colorKey = isWhite ? 'white' : (b.colorId || 'red');
    const baseHex = this.getBaseColor(colorKey);

    // Dynamic real-time adjusted 3D volumetric sphere shading
    const bodyGrad = ctx.createRadialGradient(-radius * 0.30, -radius * 0.30, radius * 0.04, 0, 0, radius * 1.25);
    const stops = this.generateGradientStops(baseHex, colorKey);

    bodyGrad.addColorStop(0, stops[0]);
    bodyGrad.addColorStop(0.25, stops[1]);
    bodyGrad.addColorStop(0.60, stops[2]);
    bodyGrad.addColorStop(1.0, stops[3]);

    ctx.fillStyle = bodyGrad;
    ctx.fill();
  }

  renderHighlights(ctx, radius, b) {
    if (radius < 4) return;

    const isWhite = b.isWhite || b.colorId === 'white' || (b.colorIndex === 0 && b.hue === 0);
    const colorKey = isWhite ? 'white' : (b.colorId || 'red');
    const master = (this.colorAdjustments && this.colorAdjustments.all) || { exposure: 1.0 };
    const spec = (this.colorAdjustments && this.colorAdjustments[colorKey]) || { exposure: 1.0 };
    const exp = master.exposure * spec.exposure;

    const hx = -radius * 0.35;
    const hy = -radius * 0.35;
    const hr = Math.max(1.8, radius * 0.20);

    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-Math.PI / 4);

    const hlGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hr);
    hlGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.9, 0.55 * exp)})`);
    hlGrad.addColorStop(0.38, `rgba(255, 255, 255, ${Math.min(0.5, 0.18 * exp)})`);
    hlGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.ellipse(0, 0, hr * 1.20, hr * 0.75, 0, 0, Math.PI * 2);
    ctx.fillStyle = hlGrad;
    ctx.fill();
    ctx.restore();

    // Subtle secondary glint
    if (radius > 8) {
      ctx.beginPath();
      ctx.arc(-radius * 0.18, -radius * 0.48, Math.max(1.0, radius * 0.05), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.8, 0.35 * exp)})`;
      ctx.fill();
    }
  }

  /**
   * Identifies the largest bubble for each color and renders a sleek size label
   */
  renderMaxLabels(ctx, bubbles) {
    if (!bubbles || bubbles.length === 0) return;

    const maxByColor = {};

    for (let b of bubbles) {
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

    ctx.save();
    for (let key of Object.keys(maxByColor)) {
      const b = maxByColor[key];
      if (!b || b.radius < 14) continue;

      const diameter = Math.round(b.radius * 2);
      const text = `${diameter}`;

      ctx.save();
      ctx.translate(b.x, b.y);

      // Scale font size as big as the bubble allows (fills ~70-75% of the sphere)
      let fontSize = Math.floor(b.radius * 0.95);
      ctx.font = `800 ${fontSize}px Outfit, Inter, system-ui, sans-serif`;
      let textWidth = ctx.measureText(text).width;
      const maxAllowedWidth = b.radius * 1.38;
      if (textWidth > maxAllowedWidth) {
        fontSize = Math.floor(fontSize * (maxAllowedWidth / textWidth));
        ctx.font = `800 ${fontSize}px Outfit, Inter, system-ui, sans-serif`;
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const isWhite = b.isWhite || b.colorId === 'white' || (b.colorIndex === 0 && b.hue === 0);

      // Clean contrast with drop shadow
      ctx.shadowColor = isWhite ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = Math.max(2, fontSize * 0.12);
      ctx.shadowOffsetY = Math.max(1, fontSize * 0.05);

      ctx.fillStyle = isWhite ? '#1e293b' : '#ffffff';
      ctx.fillText(text, 0, 0);

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

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
}
