/**
 * Aerodrop Physics Engine
 * Implements 2D/quasi-3D bubble fluid dynamics, Rayleigh surface oscillations,
 * thin-film drainage, and surface tension coalescence mechanics.
 */

import { soundEngine } from './audio.js';

export class BurstParticle {
  constructor(x, y, vx, vy, size, color, glowColor, type = 'droplet') {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.glowColor = glowColor || color;
    this.type = type; // 'spark', 'star', 'droplet', 'fizz'
    this.life = 1.0;
    this.maxLife = 1.0;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.3;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.decay = type === 'spark' ? (0.065 + Math.random() * 0.035) : (0.052 + Math.random() * 0.025);
    this.drag = type === 'spark' ? 0.08 : (type === 'fizz' ? 0.04 : 0.055);
    this.gravityScale = type === 'fizz' ? -0.25 : (type === 'star' ? 0.10 : 0.35);
  }

  update(gravity, baseDrag = 0.02) {
    this.prevX = this.x;
    this.prevY = this.y;

    this.vy += gravity * this.gravityScale;
    const totalDrag = Math.min(0.25, baseDrag + this.drag);
    this.vx *= (1 - totalDrag);
    this.vy *= (1 - totalDrag);

    this.x += this.vx;
    this.y += this.vy;

    this.rotation += this.rotSpeed;
    this.twinklePhase += 0.18;
    this.life -= this.decay;

    return this.life > 0;
  }
}

export { BUBBLE_COLORS, getColorById, getColorDisplayName, samplePaletteColors } from './palette.js';
import { BUBBLE_COLORS, getColorById } from './palette.js';

export class Bubble {
  constructor(x, y, radius = 20, vx = 0, vy = 0, colorOption, activeColorList = null) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.targetRadius = radius;

    // Color Resolution (supports ID string, alias, number index, or active color list)
    let c = null;
    if (typeof colorOption === 'string') {
      c = getColorById(colorOption);
    } else if (typeof colorOption === 'number' && BUBBLE_COLORS[colorOption]) {
      c = BUBBLE_COLORS[colorOption];
    } else if (Array.isArray(activeColorList) && activeColorList.length > 0) {
      const chosenId = activeColorList[Math.floor(Math.random() * activeColorList.length)];
      c = getColorById(chosenId);
    }

    if (!c) {
      this.colorIndex = Math.floor(Math.random() * BUBBLE_COLORS.length);
      c = BUBBLE_COLORS[this.colorIndex];
    } else {
      this.colorIndex = BUBBLE_COLORS.indexOf(c);
    }

    this.colorId = c.id;
    this.hue = c.hue;
    this.isWhite = c.isWhite;

    // Distinct Gemstone Material Physics Traits per Color
    this.density = c.density !== undefined ? c.density : (c.massFactor || 1.0);
    this.massFactor = this.density;
    this.gravityScale = c.gravityScale !== undefined ? c.gravityScale : 1.0;
    this.buoyancy = c.buoyancy !== undefined ? c.buoyancy : 0.0;
    this.densityLabel = c.densityLabel || 'Medium';

    this.elasticity = c.elasticity !== undefined ? c.elasticity : 0.72;
    this.friction = c.friction !== undefined ? c.friction : 0.016;
    this.wobbleFreq = c.wobbleFreq !== undefined ? c.wobbleFreq : 0.15;
    this.shininess = c.shininess !== undefined ? c.shininess : 0.85;
    this.reflectivity = c.reflectivity !== undefined ? c.reflectivity : 0.80;
    this.smoothness = c.smoothness !== undefined ? c.smoothness : 0.80;

    // Mass determined by physical volume and gemstone mineral density
    this.mass = Math.max(0.1, Math.pow(radius / 22, 2) * this.density);

    // Rayleigh oscillation harmonics (wobble modes)
    this.wobble = 0.0;
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.wobbleDecay = 0.94;
    this.wobbleAngle = Math.random() * Math.PI * 2;

    // Secondary mode (triangular/octupole distortion)
    this.wobbleMode3 = 0.0;
    this.wobblePhase3 = Math.random() * Math.PI * 2;

    this.filmPhase = Math.random() * 100;
    this.highlightAngle = -Math.PI / 4;
    this.opacity = 1.0;
    this.age = 0;

    // Hydrostatic & Overburden Weight Pressure Mechanics
    this.weightOnTop = 0;
    this.contactPressure = 0;
    this.smoothLoad = 0;

    // Physical Deformation State (Laplace Surface Tension Elasticity)
    this.loadSquish = 0;          // Vertical flattening under stacked weight & floor
    this.targetLoadSquish = 0;    // Target load deformation
    this.contactAngle = 0;        // Angle of active contact/collision
    this.contactSquish = 0;       // Flattening along collision interface
    this.flexibility = 0.2;       // Inversely proportional to Laplace pressure (large = soft, small = stiff)

    // Visual Merge Animation States
    this.scalePulse = 1.0;
    this.flashLife = 0;
  }

  update(config, width, height) {
    this.age += 1;

    // Smooth, snappy elastic recovery from scale pulse and merge flash
    if (this.scalePulse > 1.002) {
      this.scalePulse += (1.0 - this.scalePulse) * 0.32;
    } else {
      this.scalePulse = 1.0;
    }
    if (this.flashLife > 0.01) {
      this.flashLife -= 0.12;
    } else {
      this.flashLife = 0;
    }

    // Laplace surface tension rigidity:
    // Young-Laplace Law: ΔP = 2γ / R.
    // Small bubbles have high internal Laplace pressure -> extremely rigid, spherical, and deformation-resistant.
    // Large bubbles have low Laplace pressure -> compliant, soft, deforming easily under contact and gravity.
    const gamma = Math.max(0.1, config.surfaceTension);
    this.flexibility = Math.min(1.0, Math.max(0.04, Math.pow(Math.max(0, this.radius - 12) / 38, 1.6) / gamma));

    // Fluid forces: Density-scaled Gravity + Buoyancy + Air Current + Drag
    const grav = config.gravity * (this.gravityScale !== undefined ? this.gravityScale : 1.0);
    this.vy += grav - (this.buoyancy || 0.0);
    this.vx += config.wind;

    // Responsive fluid air drag incorporating surface smoothness/friction
    const baseDrag = this.friction !== undefined ? this.friction : config.viscosity;
    const dragForce = Math.min(0.06, baseDrag * (1 + this.radius * 0.015));
    this.vx *= (1 - dragForce);
    this.vy *= (1 - dragForce);

    // Terminal velocity scaled by density (heavier bubbles fall faster, light bubbles float gently)
    const densityVal = this.density || 1.0;
    const maxSpeed = (11.0 + (25 / Math.max(8, this.radius))) * Math.sqrt(Math.max(0.45, densityVal));
    const currentSpeedSq = this.vx * this.vx + this.vy * this.vy;
    if (currentSpeedSq > maxSpeed * maxSpeed) {
      const speed = Math.sqrt(currentSpeedSq);
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Radius smoothing when merging
    if (this.radius !== this.targetRadius) {
      this.radius += (this.targetRadius - this.radius) * 0.25;
      const density = this.density || this.massFactor || 1.0;
      this.mass = Math.max(0.1, Math.pow(this.radius / 22, 2) * density);
    }

    // Steady load squish based on floor proximity and weight on top
    const distToFloor = Math.max(0, height - (this.y + this.radius));
    const floorProximity = Math.max(0, 1 - (distToFloor / (this.radius * 0.8)));
    
    // Soft, compliant bottom floor flattening + overburden load squish
    const totalLoad = (floorProximity * 1.2) + (this.weightOnTop * 0.25);
    this.targetLoadSquish = Math.min(0.35, totalLoad * 0.15 * this.flexibility);
    this.loadSquish += (this.targetLoadSquish - this.loadSquish) * 0.20;

    // Smooth relaxation of contact interface squish
    this.contactSquish *= 0.82;

    // Full physical load stress scaling (0.0 Blue -> Green -> Yellow -> Orange -> 1.0 Red)
    const effectiveLoad = (this.weightOnTop * 0.16) + (this.contactPressure * 0.20) + (floorProximity * 0.35 * Math.min(1.0, this.weightOnTop * 0.35));
    const rawLoad = Math.min(1.0, Math.max(0.0, effectiveLoad));
    this.smoothLoad += (rawLoad - this.smoothLoad) * 0.08;

    // Soft fluid wobble decay (resting bubbles settle completely without jitter)
    const naturalFreq = Math.max(0.08, 0.26 - (this.radius * 0.0012));
    this.wobblePhase += naturalFreq;
    this.wobble *= 0.88;
    if (this.wobble < 0.004) {
      this.wobble = 0;
    }

    // Boundary constraints (Soft, springy boundary cushion)
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      if (this.vx < -0.35) {
        this.exciteWobble(0.25 * this.flexibility, 0);
      }
      this.vx = Math.abs(this.vx) * 0.50;
    } else if (this.x + this.radius > width) {
      this.x = width - this.radius;
      if (this.vx > 0.35) {
        this.exciteWobble(0.25 * this.flexibility, Math.PI);
      }
      this.vx = -Math.abs(this.vx) * 0.50;
    }

    // Top container ceiling boundary
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      if (this.vy < -0.30) {
        this.vy = -this.vy * 0.30;
      } else {
        this.vy = 0;
      }
    }

    // Bottom container boundary (Stable, firm resting contact on floor without micro-jitter)
    if (this.y + this.radius >= height) {
      this.y = height - this.radius;
      
      if (this.vy > 0.50) {
        this.vy = -this.vy * (config.elasticity || 0.7) * 0.30;
      } else {
        this.vy = 0;
      }

      this.vx *= 0.85; // Natural floor friction
      if (Math.abs(this.vx) < 0.04) this.vx = 0;
    }

    // Rounded corners containment (radius = 40px)
    const cornerR = 40;
    // Bottom corners
    if (this.y > height - cornerR) {
      if (this.x < cornerR) {
        const cx = cornerR;
        const cy = height - cornerR;
        const dx = this.x - cx;
        const dy = this.y - cy;
        const dist = Math.hypot(dx, dy);
        const maxAllowed = Math.max(2, cornerR - this.radius);
        if (dist > maxAllowed && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          this.x = cx + nx * maxAllowed;
          this.y = cy + ny * maxAllowed;
          const vDot = this.vx * nx + this.vy * ny;
          if (vDot > 0) {
            this.vx -= (1 + (this.elasticity || 0.72)) * vDot * nx * 0.7;
            this.vy -= (1 + (this.elasticity || 0.72)) * vDot * ny * 0.7;
          }
        }
      } else if (this.x > width - cornerR) {
        const cx = width - cornerR;
        const cy = height - cornerR;
        const dx = this.x - cx;
        const dy = this.y - cy;
        const dist = Math.hypot(dx, dy);
        const maxAllowed = Math.max(2, cornerR - this.radius);
        if (dist > maxAllowed && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          this.x = cx + nx * maxAllowed;
          this.y = cy + ny * maxAllowed;
          const vDot = this.vx * nx + this.vy * ny;
          if (vDot > 0) {
            this.vx -= (1 + (this.elasticity || 0.72)) * vDot * nx * 0.7;
            this.vy -= (1 + (this.elasticity || 0.72)) * vDot * ny * 0.7;
          }
        }
      }
    }
    // Top corners
    if (this.y < cornerR) {
      if (this.x < cornerR) {
        const cx = cornerR;
        const cy = cornerR;
        const dx = this.x - cx;
        const dy = this.y - cy;
        const dist = Math.hypot(dx, dy);
        const maxAllowed = Math.max(2, cornerR - this.radius);
        if (dist > maxAllowed && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          this.x = cx + nx * maxAllowed;
          this.y = cy + ny * maxAllowed;
          const vDot = this.vx * nx + this.vy * ny;
          if (vDot < 0) {
            this.vx -= (1 + (this.elasticity || 0.72)) * vDot * nx * 0.7;
            this.vy -= (1 + (this.elasticity || 0.72)) * vDot * ny * 0.7;
          }
        }
      } else if (this.x > width - cornerR) {
        const cx = width - cornerR;
        const cy = cornerR;
        const dx = this.x - cx;
        const dy = this.y - cy;
        const dist = Math.hypot(dx, dy);
        const maxAllowed = Math.max(2, cornerR - this.radius);
        if (dist > maxAllowed && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          this.x = cx + nx * maxAllowed;
          this.y = cy + ny * maxAllowed;
          const vDot = this.vx * nx + this.vy * ny;
          if (vDot < 0) {
            this.vx -= (1 + (this.elasticity || 0.72)) * vDot * nx * 0.7;
            this.vy -= (1 + (this.elasticity || 0.72)) * vDot * ny * 0.7;
          }
        }
      }
    }
  }

  exciteWobble(amount, angle) {
    const scale = (this.flexibility !== undefined) ? this.flexibility : 1.0;
    const density = this.density || 1.0;
    const wobbleDamping = Math.sqrt(1.0 / Math.max(0.35, density));
    this.wobble = Math.min(0.6, this.wobble + amount * 0.35 * scale * wobbleDamping);
    if (angle !== undefined) {
      this.wobbleAngle = angle;
    }
  }
}

export class PhysicsEngine {
  constructor() {
    this.bubbles = [];
    this.shockwaves = [];
    this.droplets = [];
    this.totalMerges = 0;
    this.burstCount = 0;
    this.lastWeberMetric = 0.35;
    this.activeColors = ['white', 'green', 'red', 'orange'];
    this.shrinkPhaseActive = false;
    this.onMerge = null;

    this.config = {
      surfaceTension: 0.95,   // Ultra-high surface tension barrier (stable foam & resilient bouncing)
      sizeAdvantage: 1.6,     // Laplace suction weight for bigger bubbles
      wobbleIntensity: 1.4,   // Soft shape oscillation intensity
      elasticity: 0.72,       // Soft, compliant, springy fluid bounce
      gravity: 1.5,           // Fast, responsive downward gravity for brisk, natural falling
      viscosity: 0.016,       // Low air drag for crisp movement
      buoyancy: 1,            // Bottom cushion (0, 1, 2)
      wind: 0.0,              // Horizontal current
      autoRain: true,         // Continuous spawn
      autoMerge: true,        // Coalescence enabled with color affinity
      spawnRate: 5,           // Bubbles per second (clear, enjoyable drop rhythm)
      sizeVariance: 20,       // Radius baseline (starts 14-34px)
      popLimit: true,         // Pop when oversized
      maxBubbleRadius: 100    // Max diameter Ø200px (bursts beyond this threshold)
    };

    this.spawnTimer = 0;
  }

  setActiveColors(colors) {
    if (Array.isArray(colors) && colors.length > 0) {
      this.activeColors = [...colors];
    }
  }

  spawnBubble(x, y, radius, vx = 0, vy = 0, colorOption = undefined) {
    const b = new Bubble(x, y, radius, vx, vy, colorOption, this.activeColors);
    this.bubbles.push(b);
    return b;
  }

  spawnColossal(width, height) {
    const giant = this.spawnBubble(width / 2, height * 0.45, 75, 0, 0);
    giant.exciteWobble(1.0, 0);
    if (soundEngine) {
      soundEngine.playMerge(75, 3.0);
    }
  }

  createMergeBurst(b1, b2, newX, newY, newRadius, colorId, hue, isWhite) {
    let baseColor = 'rgba(255, 255, 255, 0.95)';
    let glowColor = 'rgba(255, 255, 255, 0.85)';
    let sparkColor = '#ffffff';

    if (!isWhite) {
      if (colorId === 'green' || (hue >= 100 && hue <= 169)) {
        baseColor = 'rgba(16, 185, 129, 0.90)';
        glowColor = 'rgba(5, 150, 105, 0.85)';
        sparkColor = '#6ee7b7';
      } else if (colorId === 'red' || (hue >= 320 || hue <= 14)) {
        baseColor = 'rgba(225, 29, 72, 0.90)';
        glowColor = 'rgba(190, 18, 60, 0.85)';
        sparkColor = '#fda4af';
      } else if (colorId === 'orange' || (hue >= 15 && hue <= 80)) {
        baseColor = 'rgba(217, 119, 6, 0.90)';
        glowColor = 'rgba(180, 83, 9, 0.85)';
        sparkColor = '#fde68a';
      } else if (colorId === 'purple' || (hue >= 240 && hue <= 300)) {
        baseColor = 'rgba(124, 58, 237, 0.90)';
        glowColor = 'rgba(109, 40, 217, 0.85)';
        sparkColor = '#c4b5fd';
      } else if (colorId === 'cyan' || (hue >= 170 && hue <= 230)) {
        baseColor = 'rgba(2, 132, 199, 0.90)';
        glowColor = 'rgba(3, 105, 161, 0.85)';
        sparkColor = '#7dd3fc';
      }
    }

    let contactAngle = Math.random() * Math.PI * 2;
    if (b1 && b2 && b1.x !== undefined && b2.x !== undefined) {
      contactAngle = Math.atan2(b2.y - b1.y, b2.x - b1.x);
    }

    const totalCount = Math.min(22, Math.max(12, Math.floor(10 + newRadius * 0.18)));

    // 1. Tangential Contact Seam Sparks (shooting outward perpendicular to impact line)
    const seamCount = Math.floor(totalCount * 0.35);
    for (let i = 0; i < seamCount; i++) {
      const side = (i % 2 === 0) ? 1 : -1;
      const angle = contactAngle + (side * Math.PI * 0.5) + (Math.random() - 0.5) * 0.6;
      const spawnOffset = newRadius * (0.65 + Math.random() * 0.35);
      const spawnX = newX + Math.cos(angle) * spawnOffset;
      const spawnY = newY + Math.sin(angle) * spawnOffset;
      const speed = 4.5 + Math.random() * 5.2 + (newRadius * 0.04);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2.4 + Math.random() * 2.6;
      this.droplets.push(new BurstParticle(spawnX, spawnY, vx, vy, size, sparkColor, glowColor, 'spark'));
    }

    // 2. Full 360-degree Radial Perimeter Fireworks
    const radialCount = Math.floor(totalCount * 0.35);
    for (let i = 0; i < radialCount; i++) {
      const angle = (i / radialCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const spawnDist = newRadius * (0.80 + Math.random() * 0.35);
      const spawnX = newX + Math.cos(angle) * spawnDist;
      const spawnY = newY + Math.sin(angle) * spawnDist;
      const speed = 3.5 + Math.random() * 4.8;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2.6 + Math.random() * 3.0;
      const type = (i % 2 === 0) ? 'star' : 'spark';
      this.droplets.push(new BurstParticle(spawnX, spawnY, vx, vy, size, (type === 'star' ? '#ffffff' : sparkColor), glowColor, type));
    }

    // 3. Floating Fizz & Glowing Bubble Droplets
    const orbCount = Math.floor(totalCount * 0.30);
    for (let i = 0; i < orbCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = newRadius * (0.75 + Math.random() * 0.45);
      const spawnX = newX + Math.cos(angle) * spawnDist;
      const spawnY = newY + Math.sin(angle) * spawnDist;
      const speed = 1.2 + Math.random() * 2.8;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 0.6;
      const size = 2.6 + Math.random() * 3.2;
      const type = (i % 2 === 0) ? 'droplet' : 'fizz';
      this.droplets.push(new BurstParticle(spawnX, spawnY, vx, vy, size, baseColor, glowColor, type));
    }
  }

  createSplashDroplets(x, y, count = 10, color = 'rgba(186, 230, 253, 0.85)') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 3.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const rad = 1.6 + Math.random() * 2.4;
      const type = (i % 3 === 0) ? 'star' : ((i % 3 === 1) ? 'spark' : 'droplet');
      this.droplets.push(new BurstParticle(x, y, vx, vy, rad, color, color, type));
    }
  }

  isLabeledBubble(b) {
    if (!b || b.radius < 14) return false;
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

    for (let other of this.bubbles) {
      if (other === b) continue;
      let otherKey = other.colorId;
      if (!otherKey) {
        const isWhite = other.isWhite || (other.colorIndex === 0 && other.hue === 0);
        if (isWhite) otherKey = 'white';
        else {
          const hue = other.hue !== undefined ? other.hue : 0;
          if (hue >= 240 && hue <= 300) otherKey = 'purple';
          else if (hue >= 170 && hue <= 230) otherKey = 'cyan';
          else if (hue >= 100 && hue <= 169) otherKey = 'green';
          else if (hue >= 15 && hue <= 80) otherKey = 'orange';
          else otherKey = 'red';
        }
      }
      if (otherKey === key && other.radius > b.radius) {
        return false;
      }
    }
    return true;
  }

  popBubble(index, manual = false) {
    const b = this.bubbles[index];
    if (!b) return;

    // Labeled bubbles (carrying the diameter score label) cannot be popped by player tapping
    if (manual && this.isLabeledBubble(b)) {
      b.exciteWobble(0.4);
      if (soundEngine) {
        soundEngine.playBounce(0.5, b.radius);
      }
      return;
    }

    this.burstCount++;
    this.createMergeBurst(null, null, b.x, b.y, b.radius, b.colorId, b.hue, b.isWhite);
    
    if (soundEngine) {
      soundEngine.playPop(b.radius);
    }

    const colorId = b.colorId;
    const radius = b.radius;
    const posX = b.x;
    this.bubbles.splice(index, 1);

    // Respawn replacement bubble of the exact same size and color at the top
    const width = typeof window !== 'undefined' ? window.innerWidth : 600;
    const spawnRadius = Math.min(radius, (this.config.maxBubbleRadius || 100) - 2);
    const respawnX = Math.max(spawnRadius + 10, Math.min(width - spawnRadius - 10, posX));
    const respawnY = -spawnRadius - 10;
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = 2.5 + Math.random() * 2.0;

    if (radius > 50) {
      const splitRadius = Math.round(radius / Math.SQRT2);
      this.spawnBubble(Math.max(splitRadius + 8, respawnX - 16), respawnY, splitRadius, -0.4, vy, colorId);
      this.spawnBubble(Math.min(width - splitRadius - 8, respawnX + 16), respawnY, splitRadius, 0.4, vy, colorId);
    } else {
      this.spawnBubble(respawnX, respawnY, spawnRadius, vx, vy, colorId);
    }
  }

  popAll() {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      const dropletColor = b.isWhite ? 'rgba(203, 213, 225, 0.65)' : `hsla(${b.hue || 195}, 65%, 52%, 0.65)`;
      this.createSplashDroplets(b.x, b.y, Math.min(8, Math.floor(b.radius / 3) + 2), dropletColor);
    }
    if (soundEngine && this.bubbles.length > 0) {
      soundEngine.playPop(50);
    }
    this.bubbles = [];
  }

  clear() {
    this.bubbles = [];
    this.droplets = [];
    this.burstCount = 0;
  }

  update(width, height) {
    if (this.config.autoRain) {
      this.spawnTimer += this.config.spawnRate / 60;
      while (this.spawnTimer >= 1.0) {
        this.spawnTimer -= 1.0;
        
        const margin = 35;
        const rBase = Math.max(16, this.config.sizeVariance * 0.75);
        const rVar = Math.pow(Math.random(), 2.2) * (this.config.sizeVariance * 1.1);
        const radius = Math.floor(rBase + rVar);

        // Try candidate positions across the top to find an open, unblocked slot
        let spawned = false;
        const numAttempts = 8;
        for (let attempt = 0; attempt < numAttempts; attempt++) {
          const candidateX = margin + radius + Math.random() * Math.max(10, width - margin * 2 - radius * 2);
          const candidateY = -radius * 0.8;
          const requiredTopClearance = radius * 2.2 + 25; // Space required at the top

          // Check if candidate slot is blocked by any bubble near the top
          let isBlocked = false;
          for (let i = 0; i < this.bubbles.length; i++) {
            const b = this.bubbles[i];
            if (b.y - b.radius < requiredTopClearance) {
              const dx = Math.abs(b.x - candidateX);
              const minClearDist = (radius + b.radius) * 1.08;
              if (dx < minClearDist) {
                isBlocked = true;
                break;
              }
            }
          }

          if (!isBlocked) {
            const vx = (Math.random() - 0.5) * 0.8;
            const vy = 2.4 + Math.random() * 2.2;
            const b = new Bubble(candidateX, candidateY, radius, vx, vy, undefined, this.activeColors);
            this.bubbles.push(b);
            spawned = true;
            if (typeof this.onBubbleSpawned === 'function') {
              this.onBubbleSpawned(b);
            }
            break;
          }
        }

        // If top is genuinely full / no space available, pause spawn loop without accumulating backlog
        if (!spawned) {
          this.spawnTimer = 0;
          if (typeof this.onTopBlocked === 'function') {
            this.onTopBlocked();
          }
          break;
        }
      }
    }

    // Integrate forces, gravity, and velocities
    for (let i = 0; i < this.bubbles.length; i++) {
      this.bubbles[i].update(this.config, width, height);

      if (this.config.popLimit && this.bubbles[i].radius >= this.config.maxBubbleRadius && !this.bubbles[i].mergeState) {
        this.popBubble(i);
        i--;
      }
    }

    // Clean up finished merged bubbles
    this.bubbles = this.bubbles.filter(b => !b.isDead);

    // Multi-pass constraint solver for crisp non-penetration stability
    for (let iter = 0; iter < 4; iter++) {
      this.relaxBubbleOverlaps(width, height);
    }

    // Top-to-bottom cascading overburden weight propagation through foam bed
    this.calculateOverburdenWeight(height);

    this.resolveCoalescence(width, height);

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      if (!this.shockwaves[i].update()) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.droplets.length - 1; i >= 0; i--) {
      if (!this.droplets[i].update(this.config.gravity, this.config.viscosity)) {
        this.droplets.splice(i, 1);
      }
    }
  }

  relaxBubbleOverlaps(width, height) {
    const bubbles = this.bubbles;
    const len = bubbles.length;

    for (let i = 0; i < len; i++) {
      const b1 = bubbles[i];
      if (b1.isDead) continue;

      for (let j = i + 1; j < len; j++) {
        const b2 = bubbles[j];
        if (b2.isDead) continue;

        // Skip collision separation if these two bubbles are actively fusing into each other
        if (b1.mergeState || b2.mergeState) {
          if ((b1.mergeState && b1.mergeState.partner === b2) || (b2.mergeState && b2.mergeState.partner === b1)) {
            continue;
          }
        }

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = b1.radius + b2.radius;

        if (distSq < minDist * minDist) {
          const dist = Math.max(0.001, Math.sqrt(distSq));
          const nx = dist > 0.001 ? dx / dist : (Math.random() - 0.5);
          const ny = dist > 0.001 ? dy / dist : (Math.random() - 0.5);
          const overlap = minDist - dist;

          const totalMass = b1.mass + b2.mass;
          // Clamp mass displacement ratio so massive bubbles cannot unyieldingly crush tiny bubbles into walls
          const rawRatio1 = b2.mass / totalMass;
          const ratio1 = Math.max(0.20, Math.min(0.80, rawRatio1));
          const ratio2 = 1.0 - ratio1;

          // Firm non-penetration position correction (bubbles cannot overlap)
          b1.x -= nx * overlap * ratio1 * 0.90;
          b1.y -= ny * overlap * ratio1 * 0.90;
          b2.x += nx * overlap * ratio2 * 0.90;
          b2.y += ny * overlap * ratio2 * 0.90;

          // Archimedes density buoyancy stratification: lighter bubbles float upward, denser bubbles sink
          const dDiff = (b2.density || 1.0) - (b1.density || 1.0);
          if (Math.abs(dDiff) > 0.25) {
            const verticalAlignment = Math.abs(ny);
            if (verticalAlignment > 0.35 && dDiff * ny < 0) {
              // Heavier bubble is higher up: facilitate natural buoyant fluid swap
              const lift = Math.min(0.38, Math.abs(dDiff) * 0.09 * verticalAlignment);
              const dir = dDiff > 0 ? 1 : -1;
              b1.y -= lift * dir;
              b2.y += lift * dir;
            }
          }
        } else if (distSq < minDist * 1.08 * (minDist * 1.08)) {
          // Capillary Meniscus Cohesion (Cheerios effect): Surface tension draws adjacent bubbles into snug contact
          const dist = Math.max(0.001, Math.sqrt(distSq));
          const nx = dx / dist;
          const ny = dy / dist;
          const gap = dist - minDist;
          const cohesion = 0.28 * (1.0 - gap / (minDist * 0.08));
          b1.x += nx * cohesion * 0.5;
          b1.y += ny * cohesion * 0.5;
          b2.x -= nx * cohesion * 0.5;
          b2.y -= ny * cohesion * 0.5;
        }
      }

      // Hard boundary containment matching floor plane exactly
      if (b1.x - b1.radius < 0) {
        b1.x = b1.radius;
        if (b1.vx < 0) b1.vx = 0;
      } else if (b1.x + b1.radius > width) {
        b1.x = width - b1.radius;
        if (b1.vx > 0) b1.vx = 0;
      }
      
      if (b1.y + b1.radius >= height) {
        b1.y = height - b1.radius;
        if (b1.vy > 0.8) {
          b1.vy = -b1.vy * (b1.elasticity || 0.72) * 0.35;
          b1.exciteWobble(0.20 * b1.flexibility, Math.PI / 2);
        } else {
          b1.vy = 0;
        }
        b1.vx *= Math.max(0.70, 1 - (b1.friction || 0.016) * 8);
        if (Math.abs(b1.vx) < 0.04) b1.vx = 0;
      }

      // Rounded bottom corners containment (radius = 40px)
      const cornerR = 40;
      if (b1.y > height - cornerR) {
        // Bottom-left rounded corner
        if (b1.x < cornerR) {
          const cx = cornerR;
          const cy = height - cornerR;
          const dx = b1.x - cx;
          const dy = b1.y - cy;
          if (dx < 0 && dy > 0) {
            const dist = Math.hypot(dx, dy);
            const maxAllowed = cornerR - b1.radius;
            if (maxAllowed > 0 && dist > maxAllowed) {
              const nx = dx / dist;
              const ny = dy / dist;
              b1.x = cx + nx * maxAllowed;
              b1.y = cy + ny * maxAllowed;
              const vDot = b1.vx * nx + b1.vy * ny;
              if (vDot > 0) {
                b1.vx -= (1 + (b1.elasticity || 0.72)) * vDot * nx * 0.7;
                b1.vy -= (1 + (b1.elasticity || 0.72)) * vDot * ny * 0.7;
              }
            } else if (maxAllowed <= 0) {
              // Bubble is larger than corner radius: keep its center within safe boundaries
              b1.x = Math.max(b1.radius, b1.x);
              b1.y = Math.min(height - b1.radius, b1.y);
            }
          }
        } else if (b1.x > width - cornerR) {
          // Bottom-right rounded corner
          const cx = width - cornerR;
          const cy = height - cornerR;
          const dx = b1.x - cx;
          const dy = b1.y - cy;
          if (dx > 0 && dy > 0) {
            const dist = Math.hypot(dx, dy);
            const maxAllowed = cornerR - b1.radius;
            if (maxAllowed > 0 && dist > maxAllowed) {
              const nx = dx / dist;
              const ny = dy / dist;
              b1.x = cx + nx * maxAllowed;
              b1.y = cy + ny * maxAllowed;
              const vDot = b1.vx * nx + b1.vy * ny;
              if (vDot > 0) {
                b1.vx -= (1 + (b1.elasticity || 0.72)) * vDot * nx * 0.7;
                b1.vy -= (1 + (b1.elasticity || 0.72)) * vDot * ny * 0.7;
              }
            } else if (maxAllowed <= 0) {
              b1.x = Math.min(width - b1.radius, b1.x);
              b1.y = Math.min(height - b1.radius, b1.y);
            }
          }
        }
      }
    }
  }

  calculateOverburdenWeight(height) {
    const bubbles = this.bubbles;
    const len = bubbles.length;
    if (len === 0) return;

    // Reset weight on top
    for (let i = 0; i < len; i++) {
      bubbles[i].weightOnTop = 0;
    }

    // Sort top-to-bottom by Y coordinate for true cascading overburden physics
    const sorted = [...bubbles].sort((a, b) => a.y - b.y);

    for (let i = 0; i < len; i++) {
      const upper = sorted[i];

      for (let j = i + 1; j < len; j++) {
        const lower = sorted[j];
        const dy = lower.y - upper.y;
        
        // Stop checking if beyond maximum possible contact range
        const maxDist = (upper.radius + lower.radius) * 1.15;
        if (dy > maxDist) {
          if (dy > (upper.radius + lower.radius) * 2.0) break;
          continue;
        }

        const dx = lower.x - upper.x;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDist * maxDist && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const ny = dy / dist; // Downward vertical alignment

          if (ny > 0.45 && dy > (upper.radius * 0.15)) {
            // Cascade upper bubble's mass + already accumulated overburden weight
            const transferred = (upper.mass * 0.85 + upper.weightOnTop * 0.75) * ny;
            lower.weightOnTop += transferred;
          }
        }
      }

      // Progressive thin-film drainage near floor under heavy load
      const isNearBottom = upper.y > (height - upper.radius * 2.2);
      if (isNearBottom && upper.weightOnTop > 2.5) {
        upper.contactPressure = Math.min(5.0, upper.contactPressure + (upper.weightOnTop * 0.0008 + 0.0005));
      }
    }
  }

  resolveCoalescence(width, height) {
    const toRemove = new Set();
    const len = this.bubbles.length;

    for (let i = 0; i < len; i++) {
      if (toRemove.has(i)) continue;
      const b1 = this.bubbles[i];

      for (let j = i + 1; j < len; j++) {
        if (toRemove.has(j)) continue;
        const b2 = this.bubbles[j];

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = b1.radius + b2.radius;

        if (distSq < minDist * minDist && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;

          const rvx = b2.vx - b1.vx;
          const rvy = b2.vy - b1.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          const larger = b1.radius >= b2.radius ? b1 : b2;
          const smaller = b1.radius >= b2.radius ? b2 : b1;
          const sizeRatio = larger.radius / smaller.radius;

          // Same-color coalescence strict rule: Different colors never merge
          const isSameColor = (b1.colorId && b2.colorId)
            ? (b1.colorId === b2.colorId)
            : ((b1.colorIndex !== undefined && b2.colorIndex !== undefined)
              ? (b1.colorIndex === b2.colorIndex)
              : (b1.hue === b2.hue));

          // 1. Impact Kinetic Energy (Moderate drop impact triggers merge)
          const impactSpeed = Math.max(0, -velAlongNormal);
          let kineticEnergyFactor = 0;
          if (isSameColor && impactSpeed > 0.40) {
            kineticEnergyFactor = Math.pow(impactSpeed - 0.25, 1.1) * 0.85;
          }

          // 2. Size Domination (Larger bubbles absorb smaller ones of the same color)
          let sizeDomination = 0;
          if (isSameColor && sizeRatio >= 1.3) {
            sizeDomination = Math.pow(sizeRatio - 1.1, 1.1) * (this.config.sizeAdvantage * 0.65);
          }

          // 3. Same-color contact affinity bonus
          const sameColorBonus = isSameColor ? 0.50 : 0.0;

          // 4. Overburden and Heavy Load Stress (Bubbles resting together in the stack merge smoothly)
          const loadStress = ((b1.smoothLoad || 0) + (b2.smoothLoad || 0)) * 0.40 + (b1.weightOnTop + b2.weightOnTop) * 0.08;
          const pressureStress = Math.min(1.2, (b1.contactPressure + b2.contactPressure) * 0.30 + loadStress);

          const mergeScore = kineticEnergyFactor + sizeDomination + sameColorBonus + pressureStress;
          // Balanced surface tension barrier for natural, steady growth
          const barrier = Math.max(0.3, this.config.surfaceTension) * 1.05;

          this.lastWeberMetric = isSameColor ? Math.min(1.0, mergeScore / barrier) : 0;

          // DECISION: Only bubbles of the exact same color can merge
          if (this.config.autoMerge && isSameColor && mergeScore > barrier) {
            const newVol = Math.pow(b1.radius, 3) + Math.pow(b2.radius, 3);
            const newRadius = Math.cbrt(newVol);

            const totalMass = b1.mass + b2.mass;
            const newVx = (b1.vx * b1.mass + b2.vx * b2.mass) / totalMass;
            const newVy = (b1.vy * b1.mass + b2.vy * b2.mass) / totalMass;

            const newX = (b1.x * b1.mass + b2.x * b2.mass) / totalMass;
            const newY = (b1.y * b1.mass + b2.y * b2.mass) / totalMass;

            if (this.config.popLimit && newRadius >= this.config.maxBubbleRadius) {
              this.burstCount++;
              this.createMergeBurst(null, null, newX, newY, newRadius, larger.colorId, larger.hue, larger.isWhite);
              if (soundEngine) {
                soundEngine.playPop(newRadius);
              }

              const colorId = larger.colorId;
              // Split mass into 3 medium droplets (mass conserved: R_split = R / sqrt(3) ~ 58px)
              const splitCount = 3;
              const splitRadius = Math.round(newRadius / Math.sqrt(splitCount));
              for (let s = 0; s < splitCount; s++) {
                const angle = (s / splitCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
                const offset = splitRadius * 0.75;
                const spawnX = Math.max(splitRadius + 8, Math.min(width - splitRadius - 8, newX + Math.cos(angle) * offset));
                const spawnY = Math.max(splitRadius + 8, Math.min(height - splitRadius - 8, newY + Math.sin(angle) * offset));
                const vx = Math.cos(angle) * (1.2 + Math.random() * 1.0);
                const vy = Math.sin(angle) * (1.2 + Math.random() * 1.0) - 0.8;
                this.spawnBubble(spawnX, spawnY, splitRadius, vx, vy, colorId);
              }

              toRemove.add(i);
              toRemove.add(j);
              this.totalMerges++;
              break;
            }

            larger.x = newX;
            larger.y = newY;
            larger.vx = newVx;
            larger.vy = newVy;
            larger.targetRadius = newRadius;
            larger.radius = (larger.radius + newRadius) * 0.5;
            larger.mass = totalMass;
            larger.contactPressure = 0;

            // Visual Merge Pulse, Fusion Flash, and Elastic Wobble
            larger.scalePulse = 1.18;
            larger.flashLife = 0.75;
            larger.exciteWobble(0.28 * larger.flexibility, Math.random() * Math.PI * 2);

            // Gentle ripple push on neighboring bubbles
            const blastRange = newRadius * 1.4 + 50;
            for (let k = 0; k < len; k++) {
              if (k === i || k === j) continue;
              const nb = this.bubbles[k];
              const kdx = nb.x - newX;
              const kdy = nb.y - newY;
              const kDistSq = kdx * kdx + kdy * kdy;
              const maxRange = newRadius + nb.radius + 50;
              if (kDistSq < maxRange * maxRange && kDistSq > 0.001) {
                const kDist = Math.sqrt(kDistSq);
                const unx = kdx / kDist;
                const uny = kdy / kDist;
                const distRatio = Math.max(0, 1 - kDist / maxRange);
                const pushStrength = Math.pow(distRatio, 1.2) * (1.2 + (newRadius / 45) * 0.9);

                // Soft outward impulse scaled by mass
                const massFactor = 1.0 / Math.sqrt(Math.max(0.25, nb.mass));
                nb.vx += unx * pushStrength * 0.65 * massFactor;
                nb.vy += uny * pushStrength * 0.65 * massFactor;

                // Subtle physical displacement
                nb.x += unx * pushStrength * 0.6;
                nb.y += uny * pushStrength * 0.6;

                // Elastic recoil shake pulse on neighbor
                nb.scalePulse = Math.max(nb.scalePulse || 1.0, 1.0 + distRatio * 0.14);
              }
            }

            // Trigger rich multi-layered merging particle burst
            this.createMergeBurst(b1, b2, newX, newY, newRadius, larger.colorId, larger.hue, larger.isWhite);

            if (soundEngine) {
              soundEngine.playMerge(newRadius, sizeRatio);
            }

            if (this.onMerge) {
              this.onMerge(newX, newY, newRadius, sizeRatio, larger.colorId);
            }

            this.totalMerges++;
            toRemove.add(b1 === larger ? j : i);
            break;
          } else {
            // === CALM BOUNCE & PLATEAU FOAM STABILITY ===
            const overlap = Math.max(0, minDist - dist);

            if (velAlongNormal < -0.1) {
              const combinedElasticity = ((b1.elasticity || this.config.elasticity) + (b2.elasticity || this.config.elasticity)) * 0.5;
              const impulse = -(1 + combinedElasticity) * velAlongNormal / (1 / b1.mass + 1 / b2.mass);
              
              b1.vx -= (impulse / b1.mass) * nx;
              b1.vy -= (impulse / b1.mass) * ny;
              b2.vx += (impulse / b2.mass) * nx;
              b2.vy += (impulse / b2.mass) * ny;

              // Dynamic contact interface squish & Laplace deformation
              const bounceAngle = Math.atan2(ny, nx);
              b1.contactAngle = bounceAngle;
              b1.contactSquish = Math.min(0.25, (overlap / b1.radius) * 0.3 * b1.flexibility);
              b2.contactAngle = bounceAngle + Math.PI;
              b2.contactSquish = Math.min(0.25, (overlap / b2.radius) * 0.3 * b2.flexibility);

              if (velAlongNormal < -0.45) {
                const squish1 = Math.min(0.4, Math.abs(velAlongNormal) * 0.15 * (b1.elasticity || 0.72)) * b1.flexibility;
                const squish2 = Math.min(0.4, Math.abs(velAlongNormal) * 0.15 * (b2.elasticity || 0.72)) * b2.flexibility;
                b1.exciteWobble(squish1, bounceAngle);
                b2.exciteWobble(squish2, bounceAngle + Math.PI);
              }

              if (soundEngine && Math.abs(velAlongNormal) > 0.4) {
                soundEngine.playBounce(Math.min(1.0, Math.abs(velAlongNormal) / 3.0), smaller.radius);
              }
            } else {
              // Gentle resting contact damping modulated by surface friction
              const frictionDamping = 1 - Math.min(0.12, ((b1.friction || 0.016) + (b2.friction || 0.016)) * 2);
              b1.vx *= frictionDamping;
              b1.vy *= frictionDamping;
              b2.vx *= frictionDamping;
              b2.vy *= frictionDamping;
            }
          }
        }
      }
    }

    // Pressure relaxation for bubbles that are not heavily stacked
    for (let b of this.bubbles) {
      if (b.weightOnTop < 2.5) {
        b.contactPressure *= 0.90;
      }
    }

    if (toRemove.size > 0) {
      this.bubbles = this.bubbles.filter((_, idx) => !toRemove.has(idx));
    }
  }

  applyForceField(mx, my, radius, strength, mode = 'force') {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      const dx = b.x - mx;
      const dy = b.y - my;
      const distSq = dx * dx + dy * dy;
      const maxDist = radius + b.radius;

      if (distSq <= maxDist * maxDist) {
        if (mode === 'pop') {
          this.popBubble(i, true);
          continue;
        }

        const dist = Math.max(0.001, Math.sqrt(distSq));
        const nx = dx / dist;
        const ny = dy / dist;
        const factor = (1 - dist / maxDist);

        if (mode === 'attract') {
          const force = strength * factor * 1.5;
          b.vx -= nx * force;
          b.vy -= ny * force;
          b.exciteWobble(0.2);
        } else if (mode === 'force') {
          const force = strength * factor;
          b.vx += (nx * 0.7 - ny * 0.8) * force;
          b.vy += (ny * 0.7 + nx * 0.8) * force;
          b.exciteWobble(0.35);
        }
      }
    }
  }
}

export const physicsEngine = new PhysicsEngine();
if (typeof window !== 'undefined') {
  window.physicsEngine = physicsEngine;
}
