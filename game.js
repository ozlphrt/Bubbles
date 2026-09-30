/**
 * Aerodrop Game Engine
 * Manages level progression, instant background settlement,
 * timers, win/fail logic, and score calculations.
 */

import { LEVEL_DEFINITIONS } from './levels.js';
import { physicsEngine } from './physics.js';
import { soundEngine } from './audio.js';

export const GameState = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  PHASE2_MERGE: 'PHASE2_MERGE',
  WIN: 'WIN',
  FAIL: 'FAIL'
};

export class GameEngine {
  constructor() {
    this.levels = LEVEL_DEFINITIONS;
    this.currentLevelIndex = 0;
    this.levelConfig = this.levels[0];
    this.state = GameState.IDLE;

    this.timer = 0;
    this.maxTimer = 0;
    this.lastTickSecond = -1;

    // Callbacks for UI updates
    this.onStateChange = null;
    this.onTimerUpdate = null;
    this.onSpawnUpdate = null;
    this.onColorProgress = null;
    this.onLevelWin = null;
    this.onLevelFail = null;
  }

  getCurrentLevel() {
    return this.levelConfig;
  }

  startLevel(levelNum = 1, width = window.innerWidth, height = window.innerHeight) {
    const idx = Math.max(0, Math.min(this.levels.length - 1, levelNum - 1));
    this.currentLevelIndex = idx;
    this.levelConfig = this.levels[idx];

    // Reset physics
    physicsEngine.clear();
    physicsEngine.setActiveColors(this.levelConfig.colors);
    physicsEngine.config.autoRain = false;

    this.timer = this.levelConfig.timerSeconds || 0;
    this.maxTimer = this.levelConfig.timerSeconds || 0;
    this.lastTickSecond = -1;

    // Mute sound during instantaneous background settlement simulation
    const wasAudioEnabled = soundEngine.enabled;
    soundEngine.enabled = false;

    const activeColors = this.levelConfig.colors;

    // Multi-pass fill and settle until the foam reaches the top ceiling edge (100% screen full)
    const avgRadius = 22;
    const rowHeight = avgRadius * 1.55;
    const colWidth = avgRadius * 1.90;
    const numCols = Math.max(4, Math.floor(width / colWidth));

    let spawnIndex = 0;

    // Pass 1: Spawn tall dense initial block
    const initialRows = Math.ceil((height * 1.4) / rowHeight);
    for (let r = 0; r < initialRows; r++) {
      const isOdd = (r % 2 === 1);
      const rowCols = isOdd ? Math.max(3, numCols - 1) : numCols;
      const offsetX = isOdd ? (width / numCols) * 0.5 : 0;
      const y = height - avgRadius - 4 - (r * rowHeight);

      for (let c = 0; c < rowCols; c++) {
        const x = offsetX + (c + 0.5) * (width / numCols);
        const radius = 18 + Math.random() * 8; // 18px to 26px radius
        const colorId = activeColors[spawnIndex % activeColors.length];
        physicsEngine.spawnBubble(x, y, radius, 0, 0, colorId);
        spawnIndex++;
      }
    }

    // Relax Pass 1
    for (let step = 0; step < 160; step++) {
      physicsEngine.update(width, height);
    }

    // Top-off passes: Keep adding rows at top until highest bubble is at y <= 25px
    for (let pass = 0; pass < 6; pass++) {
      let highestY = height;
      for (let b of physicsEngine.bubbles) {
        const topY = b.y - b.radius;
        if (topY < highestY) highestY = topY;
      }

      if (highestY <= 25) break; // 100% full to the ceiling!

      const rowsNeeded = Math.max(2, Math.ceil((highestY - 10) / rowHeight));
      for (let r = 0; r < rowsNeeded; r++) {
        const isOdd = (r % 2 === 1);
        const rowCols = isOdd ? Math.max(3, numCols - 1) : numCols;
        const offsetX = isOdd ? (width / numCols) * 0.5 : 0;
        const y = highestY - (r + 0.5) * rowHeight;

        for (let c = 0; c < rowCols; c++) {
          const x = offsetX + (c + 0.5) * (width / numCols);
          const radius = 18 + Math.random() * 8;
          const colorId = activeColors[spawnIndex % activeColors.length];
          physicsEngine.spawnBubble(x, y, radius, 0, 0.1, colorId);
          spawnIndex++;
        }
      }

      for (let step = 0; step < 100; step++) {
        physicsEngine.update(width, height);
      }
    }

    // Clean up any stray bubble that ended up completely outside top
    physicsEngine.bubbles = physicsEngine.bubbles.filter(b => b.y + b.radius >= 0);

    // Calm all residual velocities for a static resting foam field
    for (let b of physicsEngine.bubbles) {
      b.vx = 0;
      b.vy = 0;
      b.contactPressure = 0;
    }

    // Restore sound
    soundEngine.enabled = wasAudioEnabled;

    // Immediately present the fully settled screen to player
    this.state = GameState.COUNTDOWN;
    this.notifyStateChange();

    if (this.onSpawnUpdate) {
      this.onSpawnUpdate(1.0, physicsEngine.bubbles.length);
    }
    if (this.onTimerUpdate) {
      this.onTimerUpdate(this.timer, this.maxTimer);
    }
  }

  notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.state, this.levelConfig);
    }
  }

  dismissObjective() {
    if (this.state === GameState.COUNTDOWN) {
      this.state = GameState.PHASE2_MERGE;
      physicsEngine.config.autoRain = false;
      this.notifyStateChange();
    }
  }

  update(dt, width, height) {
    if (this.state !== GameState.PHASE2_MERGE) {
      return;
    }

    // Timer Countdown
    if (this.maxTimer > 0) {
      this.timer -= dt;
      if (this.timer < 0) this.timer = 0;

      if (this.onTimerUpdate) {
        this.onTimerUpdate(this.timer, this.maxTimer);
      }

      const currentSec = Math.floor(this.timer);
      if (this.timer <= 10.5 && this.timer > 0 && currentSec !== this.lastTickSecond) {
        this.lastTickSecond = currentSec;
        soundEngine.playTick();
      }

      if (this.timer <= 0) {
        this.triggerFail();
        return;
      }
    }

    // Track Color Progress & Check Win Condition
    const colorProgress = this.evaluateColorProgress();
    if (this.onColorProgress) {
      this.onColorProgress(colorProgress);
    }

    const allTargetsMet = colorProgress.every(item => item.achieved);
    if (allTargetsMet) {
      this.triggerWin();
    }
  }

  evaluateColorProgress() {
    const activeColors = this.levelConfig.colors;
    const targetDiameter = this.levelConfig.targetDiameter;

    const maxDiameterByColor = {};
    for (let c of activeColors) {
      maxDiameterByColor[c] = 0;
    }

    for (let b of physicsEngine.bubbles) {
      if (b.colorId && maxDiameterByColor.hasOwnProperty(b.colorId)) {
        const diam = Math.round(b.radius * 2);
        if (diam > maxDiameterByColor[b.colorId]) {
          maxDiameterByColor[b.colorId] = diam;
        }
      }
    }

    return activeColors.map(colorId => {
      const current = maxDiameterByColor[colorId] || 0;
      return {
        colorId,
        target: targetDiameter,
        current,
        progress: Math.min(1.0, current / targetDiameter),
        achieved: current >= targetDiameter
      };
    });
  }

  triggerWin() {
    if (this.state === GameState.WIN || this.state === GameState.FAIL) return;

    this.state = GameState.WIN;
    physicsEngine.config.autoRain = false;
    soundEngine.playWin();

    const scoreData = this.calculateScore();
    this.notifyStateChange();

    if (this.onLevelWin) {
      this.onLevelWin(scoreData);
    }
  }

  triggerFail() {
    if (this.state === GameState.WIN || this.state === GameState.FAIL) return;

    this.state = GameState.FAIL;
    physicsEngine.config.autoRain = false;
    soundEngine.playFail();

    const colorProgress = this.evaluateColorProgress();
    this.notifyStateChange();

    if (this.onLevelFail) {
      this.onLevelFail({
        level: this.levelConfig.level,
        colorProgress
      });
    }
  }

  calculateScore() {
    const progress = this.evaluateColorProgress();

    let baseScore = 0;
    progress.forEach(p => {
      baseScore += Math.round(p.current * 10);
    });

    let timeBonus = 0;
    let timeRatio = 1.0;
    if (this.maxTimer > 0) {
      timeBonus = Math.round(this.timer * 10);
      timeRatio = this.timer / this.maxTimer;
    } else {
      timeBonus = 400;
    }

    const popped = physicsEngine.burstCount || 0;
    const efficiencyRatio = Math.max(0, 1 - popped / Math.max(1, physicsEngine.bubbles.length));
    const efficiencyBonus = Math.round(efficiencyRatio * 400);

    const totalScore = baseScore + timeBonus + efficiencyBonus;

    let stars = 1;
    if (this.maxTimer > 0) {
      if (timeRatio >= 0.60) stars = 3;
      else if (timeRatio >= 0.20) stars = 2;
      else stars = 1;
    } else {
      if (popped === 0) stars = 3;
      else if (popped <= 3) stars = 2;
      else stars = 1;
    }

    return {
      level: this.levelConfig.level,
      levelName: this.levelConfig.name,
      baseScore,
      timeBonus,
      efficiencyBonus,
      totalScore,
      stars,
      timeRemaining: Math.round(this.timer),
      poppedCount: popped
    };
  }

  restartCurrentLevel(width = window.innerWidth, height = window.innerHeight) {
    this.startLevel(this.levelConfig.level, width, height);
  }

  nextLevel(width = window.innerWidth, height = window.innerHeight) {
    if (this.currentLevelIndex + 1 < this.levels.length) {
      this.startLevel(this.currentLevelIndex + 2, width, height);
    } else {
      this.startLevel(1, width, height);
    }
  }
}

export const gameEngine = new GameEngine();
