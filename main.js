/**
 * Aerodrop Simulation Application Controller
 * Handles user interactions, level progression, clean HUD updates,
 * and the main physics/renderer animation loop.
 */

import './style.css';
import { soundEngine } from './audio.js';
import { physicsEngine, BUBBLE_COLORS } from './physics.js';
import { Renderer } from './renderer.js';
import { gameEngine, GameState } from './game.js';
import { GameStorage } from './storage.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('simCanvas');
  const renderer = new Renderer(canvas);
  const physics = physicsEngine;
  const audio = soundEngine;
  audio.init();

  // DOM Elements - Minimal Top Stats
  const topLevelVal = document.getElementById('topLevelVal');
  const topLeftObjective = document.getElementById('topLeftObjective');
  const topTimerGroup = document.getElementById('topTimerGroup');
  const topTimerVal = document.getElementById('topTimerVal');

  // DOM Elements - Clean Modals
  const modalObjective = document.getElementById('modalObjective');
  const objLevelBadge = document.getElementById('objLevelBadge');
  const objGoalText = document.getElementById('objGoalText');
  const objColorsGrid = document.getElementById('objColorsGrid');
  const btnStartLevel = document.getElementById('btnStartLevel');

  const modalWin = document.getElementById('modalWin');
  const winStarRating = document.getElementById('winStarRating');
  const scoreTotal = document.getElementById('scoreTotal');
  const btnNextLevel = document.getElementById('btnNextLevel');
  const btnReplayWin = document.getElementById('btnReplayWin');

  const modalFail = document.getElementById('modalFail');
  const failResultsGrid = document.getElementById('failResultsGrid');
  const btnTryAgain = document.getElementById('btnTryAgain');
  const btnSelectLevelFail = document.getElementById('btnSelectLevelFail');

  // In-Game Guidance Toast System
  const ingameHintPill = document.getElementById('ingameHintPill');
  let hintTimeout = null;
  let lastActivityTime = performance.now();

  function showInGameHint(durationMs = 6000) {
    if (!ingameHintPill) return;
    ingameHintPill.classList.add('visible');
    if (hintTimeout) clearTimeout(hintTimeout);
    if (durationMs > 0) {
      hintTimeout = setTimeout(() => {
        ingameHintPill.classList.remove('visible');
      }, durationMs);
    }
  }

  function hideInGameHint() {
    if (!ingameHintPill) return;
    ingameHintPill.classList.remove('visible');
    if (hintTimeout) clearTimeout(hintTimeout);
  }

  // DOM Elements - Navigation & Drawer
  const btnAudioToggle = document.getElementById('btnAudioToggle');
  const audioOnIcon = document.querySelector('.audio-on-icon');
  const audioOffIcon = document.querySelector('.audio-off-icon');
  const btnRestartLevel = document.getElementById('btnRestartLevel');
  const btnToggleControls = document.getElementById('btnToggleControls');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const sideDrawer = document.getElementById('sideDrawer');
  const levelJumpGrid = document.getElementById('levelJumpGrid');

  // Drawer Tools & Sliders
  const toolPills = document.querySelectorAll('.tool-pill');
  let currentTool = 'spawn';
  const statBubbleCount = document.getElementById('statBubbleCount');
  const statMergeCount = document.getElementById('statMergeCount');
  const statMaxRadius = document.getElementById('statMaxRadius');
  const statFPS = document.getElementById('statFPS');

  const sliderSurfaceTension = document.getElementById('sliderSurfaceTension');
  const valSurfaceTension = document.getElementById('valSurfaceTension');
  const sliderElasticity = document.getElementById('sliderElasticity');
  const valElasticity = document.getElementById('valElasticity');
  const sliderGravity = document.getElementById('sliderGravity');
  const valGravity = document.getElementById('valGravity');
  const presetCards = document.querySelectorAll('.preset-card');

  // Mouse State
  const mouseState = {
    x: 0,
    y: 0,
    isDown: false,
    active: false,
    mode: 'spawn',
    spawnCooldown: 0
  };

  let isPaused = false;
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTimer = 0;

  // Window Resize
  function onResize() {
    renderer.resize();
  }
  window.addEventListener('resize', onResize);
  onResize();

  const topLevelSelect = document.getElementById('topLevelSelect');
  const btnResetProgress = document.getElementById('btnResetProgress');

  function renderLevelSelectors(activeLevel) {
    const progress = GameStorage.loadProgress();
    const maxLevelToShow = Math.max(10, progress.highestLevel, activeLevel);

    // Top Right Level Selector Pulldown
    if (topLevelSelect) {
      topLevelSelect.innerHTML = '';
      for (let i = 1; i <= maxLevelToShow; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        const isComp = GameStorage.isLevelCompleted(i);
        opt.textContent = `Level ${i}${isComp ? ' ✓' : ''}`;
        topLevelSelect.appendChild(opt);
      }
      topLevelSelect.value = String(activeLevel);
    }

    // Drawer Level Jump Grid
    if (levelJumpGrid) {
      levelJumpGrid.innerHTML = '';
      for (let i = 1; i <= maxLevelToShow; i++) {
        const btn = document.createElement('button');
        const isCurrent = (i === activeLevel);
        const isComp = GameStorage.isLevelCompleted(i);
        const stats = GameStorage.getLevelStats(i);

        let cls = 'level-jump-btn';
        if (isCurrent) cls += ' current';
        if (isComp) cls += ' completed';
        btn.className = cls;

        let starsHtml = '';
        if (stats && stats.stars) {
          starsHtml = `<span class="lvl-stars">${'★'.repeat(stats.stars)}</span>`;
        }

        btn.innerHTML = `<span class="lvl-num">L${i}</span>${starsHtml}`;
        btn.title = `Level ${i}${isComp ? ` (Completed${stats ? ` - ${stats.score} pts` : ''})` : ''}`;

        btn.addEventListener('click', () => {
          audio.ensureAudio();
          gameEngine.startLevel(i, window.innerWidth, window.innerHeight);
          sideDrawer.classList.remove('open');
        });
        levelJumpGrid.appendChild(btn);
      }
    }

    // Update Progress Summary Label in Drawer
    const progressSummaryLabel = document.getElementById('progressSummaryLabel');
    if (progressSummaryLabel) {
      const completedCount = Object.keys(progress.completedLevels || {}).length;
      progressSummaryLabel.textContent = `UNLOCKED: L${progress.highestLevel} (${completedCount} CLEARED)`;
    }
  }

  function updateLevelJumpActive(levelNum) {
    renderLevelSelectors(levelNum);
  }

  if (topLevelSelect) {
    topLevelSelect.addEventListener('change', (e) => {
      audio.ensureAudio();
      const selectedLevel = parseInt(e.target.value, 10);
      gameEngine.startLevel(selectedLevel, window.innerWidth, window.innerHeight);
    });
  }

  if (btnResetProgress) {
    btnResetProgress.addEventListener('click', () => {
      if (confirm('Reset your saved progress back to Level 1?')) {
        GameStorage.resetProgress();
        gameEngine.startLevel(1, window.innerWidth, window.innerHeight);
        renderLevelSelectors(1);
      }
    });
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getColorName(cid) {
    const c = BUBBLE_COLORS.find(item => item.id === cid || item.alias === cid);
    return c ? c.name : cid;
  }

  function renderObjectivePreviewCanvas(colors) {
    const canvas = document.getElementById('modalColorsCanvas');
    if (!canvas || !Array.isArray(colors) || colors.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const count = colors.length;
    const bubbleRadius = 13.5;
    const spacing = 34;
    const totalW = count * spacing;
    const w = Math.max(totalW + 12, 140);
    const h = 34;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const startX = (w - (count - 1) * spacing) * 0.5;
    const centerY = h * 0.5;

    colors.forEach((colorId, idx) => {
      const cx = startX + idx * spacing;
      renderer.renderStandaloneBubble(ctx, cx, centerY, bubbleRadius, colorId);
    });

    canvas.title = colors.map(getColorName).join(', ');
  }

  // Game Engine State Callbacks
  gameEngine.onStateChange = (state, levelConfig) => {
    updateLevelJumpActive(levelConfig.level);

    if (topLevelVal) {
      topLevelVal.textContent = levelConfig.level;
    }

    if (topLeftObjective) {
      topLeftObjective.textContent = levelConfig.targetDiameter;
    }

    if (topTimerVal && topTimerGroup) {
      if (levelConfig.timerSeconds) {
        topTimerVal.textContent = formatTime(levelConfig.timerSeconds);
        topTimerGroup.classList.remove('urgent-amber', 'urgent-red');
      } else {
        topTimerVal.textContent = '∞';
        topTimerGroup.classList.remove('urgent-amber', 'urgent-red');
      }
    }

    if (state === GameState.PREFILL || state === GameState.COUNTDOWN) {
      modalWin.classList.add('hidden');
      modalFail.classList.add('hidden');
      modalObjective.classList.remove('hidden');

      if (objLevelBadge) objLevelBadge.textContent = `LEVEL ${levelConfig.level}`;
      if (objGoalText) objGoalText.textContent = `Grow to ${levelConfig.targetDiameter}px`;

      renderObjectivePreviewCanvas(levelConfig.colors);
    } else if (state === GameState.PHASE2_MERGE) {
      modalObjective.classList.add('hidden');
      modalWin.classList.add('hidden');
      modalFail.classList.add('hidden');
      lastActivityTime = performance.now();
      showInGameHint(6500);
    }
  };

  gameEngine.onTimerUpdate = (timer, maxTimer) => {
    if (!topTimerVal || !topTimerGroup) return;

    if (maxTimer <= 0) {
      topTimerVal.textContent = '∞';
      topTimerGroup.classList.remove('urgent-amber', 'urgent-red');
    } else {
      topTimerVal.textContent = formatTime(timer);
      if (timer <= 15) {
        topTimerGroup.classList.add('urgent-red');
        topTimerGroup.classList.remove('urgent-amber');
      } else if (timer <= 30) {
        topTimerGroup.classList.add('urgent-amber');
        topTimerGroup.classList.remove('urgent-red');
      } else {
        topTimerGroup.classList.remove('urgent-amber', 'urgent-red');
      }
    }

    // If player hasn't merged or spawned in 14s, gently suggest tapping empty gaps to unlock
    if (gameEngine.state === GameState.PHASE2_MERGE) {
      if (performance.now() - lastActivityTime > 14000) {
        showInGameHint(5000);
      }
    }
  };

  gameEngine.onBonusTime = (seconds, x, y) => {
    if (topTimerGroup) {
      topTimerGroup.classList.remove('bonus-flash');
      void topTimerGroup.offsetWidth;
      topTimerGroup.classList.add('bonus-flash');
      setTimeout(() => {
        topTimerGroup.classList.remove('bonus-flash');
      }, 550);
    }
  };

  let lastBonusTimeMs = 0;
  physics.onMerge = (x, y, newRadius, sizeRatio, colorId) => {
    lastActivityTime = performance.now();
    if (gameEngine.state === GameState.PHASE2_MERGE) {
      const now = performance.now();
      if (now - lastBonusTimeMs < 3000) return;

      if (newRadius >= 68) {
        // Colossal merge milestone: +2s bonus
        if (gameEngine.addBonusTime(2, x, y)) {
          lastBonusTimeMs = now;
          renderer.addFloatingText('+2s', x, y, '#34d399');
          audio.playBonusTime(true);
        }
      } else if (newRadius >= 52) {
        // Significant merge milestone: +1s bonus
        if (gameEngine.addBonusTime(1, x, y)) {
          lastBonusTimeMs = now;
          renderer.addFloatingText('+1s', x, y, '#38bdf8');
          audio.playBonusTime(false);
        }
      }
    }
  };

  gameEngine.onSpawnUpdate = (fillRatio, total) => {};
  gameEngine.onColorProgress = (progressList) => {};

  gameEngine.onLevelWin = (scoreData) => {
    hideInGameHint();
    modalObjective.classList.add('hidden');
    modalFail.classList.add('hidden');
    modalWin.classList.remove('hidden');

    if (scoreTotal) scoreTotal.textContent = scoreData.totalScore.toLocaleString();

    if (winStarRating) {
      const starGlyphs = winStarRating.querySelectorAll('.star-glyph');
      starGlyphs.forEach((s, idx) => {
        s.classList.toggle('filled', idx < scoreData.stars);
      });
    }

    renderLevelSelectors(scoreData.level);
  };

  gameEngine.onLevelFail = (failData) => {
    hideInGameHint();
    modalObjective.classList.add('hidden');
    modalWin.classList.add('hidden');
    modalFail.classList.remove('hidden');

    // Overall Completion Percentage
    const totalColors = failData.colorProgress.length;
    const avgProgress = failData.colorProgress.reduce((sum, item) => sum + item.progress, 0) / Math.max(1, totalColors);
    const overallPct = Math.round(avgProgress * 100);

    const failTotalPct = document.getElementById('failTotalPct');
    const failTotalFill = document.getElementById('failTotalFill');
    if (failTotalPct) failTotalPct.textContent = `${overallPct}%`;
    if (failTotalFill) {
      failTotalFill.style.width = '0%';
      setTimeout(() => {
        failTotalFill.style.width = `${overallPct}%`;
      }, 60);
    }

    if (failResultsGrid) {
      failResultsGrid.innerHTML = '';
      const dpr = window.devicePixelRatio || 1;

      failData.colorProgress.forEach(item => {
        const card = document.createElement('div');
        card.className = `fail-color-card ${item.achieved ? 'pass' : 'fail'}`;

        const canvas = document.createElement('canvas');
        canvas.className = 'fail-bubble-canvas';
        canvas.width = 28 * dpr;
        canvas.height = 28 * dpr;
        canvas.style.width = '28px';
        canvas.style.height = '28px';
        const cCtx = canvas.getContext('2d');
        cCtx.scale(dpr, dpr);
        renderer.renderStandaloneBubble(cCtx, 14, 14, 11.5, item.colorId);

        const cObj = BUBBLE_COLORS.find(c => c.id === item.colorId || c.alias === item.colorId);
        const densityLabel = (cObj && cObj.densityLabel) ? cObj.densityLabel : 'Medium';
        const gemName = getColorName(item.colorId);
        const pct = Math.round(item.progress * 100);

        const info = document.createElement('div');
        info.className = 'fail-card-info';
        info.innerHTML = `
          <div class="fail-card-top">
            <div class="fail-gem-name">
              <span>${gemName}</span>
              <span class="fail-density-tag">${densityLabel}</span>
            </div>
            <div class="fail-stat-ratio">
              <span><strong>${item.current}px</strong> / ${item.target}px</span>
              <span>${item.achieved ? '✓' : `(${pct}%)`}</span>
            </div>
          </div>
          <div class="fail-mini-track">
            <div class="fail-mini-fill" style="width: ${Math.min(100, pct)}%;"></div>
          </div>
        `;

        card.appendChild(canvas);
        card.appendChild(info);
        failResultsGrid.appendChild(card);
      });
    }
  };

  // Button Listeners
  if (btnStartLevel) {
    btnStartLevel.addEventListener('click', () => {
      audio.ensureAudio();
      gameEngine.dismissObjective();
    });
  }

  if (btnRestartLevel) {
    btnRestartLevel.addEventListener('click', () => {
      audio.ensureAudio();
      gameEngine.restartCurrentLevel(window.innerWidth, window.innerHeight);
    });
  }

  if (btnTryAgain) {
    btnTryAgain.addEventListener('click', () => {
      audio.ensureAudio();
      gameEngine.restartCurrentLevel(window.innerWidth, window.innerHeight);
    });
  }

  if (btnSelectLevelFail) {
    btnSelectLevelFail.addEventListener('click', () => {
      audio.ensureAudio();
      modalFail.classList.add('hidden');
      if (sideDrawer) sideDrawer.classList.add('open');
    });
  }

  if (btnReplayWin) {
    btnReplayWin.addEventListener('click', () => {
      audio.ensureAudio();
      gameEngine.restartCurrentLevel(window.innerWidth, window.innerHeight);
    });
  }

  if (btnNextLevel) {
    btnNextLevel.addEventListener('click', () => {
      audio.ensureAudio();
      gameEngine.nextLevel(window.innerWidth, window.innerHeight);
    });
  }

  // Preset Themes
  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      presetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      renderer.setTheme(card.getAttribute('data-theme'));
    });
  });

  // Tool Selection
  toolPills.forEach(btn => {
    btn.addEventListener('click', () => {
      toolPills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.getAttribute('data-mode');
      mouseState.mode = currentTool;
    });
  });

  // Drawer Toggle
  if (btnToggleControls) {
    btnToggleControls.addEventListener('click', () => {
      sideDrawer.classList.toggle('open');
    });
  }
  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', () => {
      sideDrawer.classList.remove('open');
    });
  }

  // Audio Toggle
  if (btnAudioToggle) {
    btnAudioToggle.addEventListener('click', () => {
      const isEnabled = audio.toggle();
      if (audioOnIcon && audioOffIcon) {
        audioOnIcon.classList.toggle('hidden', !isEnabled);
        audioOffIcon.classList.toggle('hidden', isEnabled);
      }
    });
  }

  // Sliders
  if (sliderSurfaceTension) {
    sliderSurfaceTension.addEventListener('input', (e) => {
      physics.config.surfaceTension = parseFloat(e.target.value);
      if (valSurfaceTension) valSurfaceTension.textContent = e.target.value;
    });
  }
  if (sliderElasticity) {
    sliderElasticity.addEventListener('input', (e) => {
      physics.config.elasticity = parseFloat(e.target.value);
      if (valElasticity) valElasticity.textContent = e.target.value;
    });
  }
  if (sliderGravity) {
    sliderGravity.addEventListener('input', (e) => {
      physics.config.gravity = parseFloat(e.target.value);
      if (valGravity) valGravity.textContent = e.target.value;
    });
  }

  // Settings Drawer Color Tuner Controls
  const btnToggleColorControls = document.getElementById('btnToggleColorControls');
  const drawerTunerControls = document.getElementById('drawerTunerControls');
  const btnResetVisuals = document.getElementById('btnResetVisuals');
  const btnCopyColors = document.getElementById('btnCopyColors');
  const tunerColorTabs = document.querySelectorAll('.tuner-tab');
  const tunerBaseColorRow = document.getElementById('tunerBaseColorRow');
  const pickerBaseColor = document.getElementById('pickerBaseColor');
  const valBaseColor = document.getElementById('valBaseColor');
  const sliderSaturation = document.getElementById('sliderSaturation');
  const valSaturation = document.getElementById('valSaturation');
  const sliderHue = document.getElementById('sliderHue');
  const valHue = document.getElementById('valHue');
  const sliderExposure = document.getElementById('sliderExposure');
  const valExposure = document.getElementById('valExposure');

  let activeTunerColor = 'all';

  function copyToClipboard(text, triggerEl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }

    if (triggerEl) {
      const origText = triggerEl.textContent;
      triggerEl.textContent = '✓ Copied!';
      triggerEl.classList.add('copied');
      setTimeout(() => {
        triggerEl.textContent = origText;
        triggerEl.classList.remove('copied');
      }, 1500);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(ta);
  }

  function syncTunerSlidersFromColor(colorKey) {
    const adj = renderer.getColorAdjustment(colorKey);
    const sat = Math.round(adj.saturation * 100);
    const hue = Math.round(adj.hueShift);
    const exp = Math.round(adj.exposure * 100);

    if (tunerBaseColorRow) {
      if (colorKey === 'all') {
        tunerBaseColorRow.style.display = 'none';
      } else {
        tunerBaseColorRow.style.display = 'flex';
        const baseHex = renderer.getBaseColor(colorKey);
        if (pickerBaseColor) pickerBaseColor.value = baseHex;
        if (valBaseColor) valBaseColor.textContent = baseHex;
      }
    }

    if (sliderSaturation) {
      sliderSaturation.value = sat;
      if (valSaturation) valSaturation.textContent = `${sat}%`;
    }
    if (sliderHue) {
      sliderHue.value = hue;
      if (valHue) valHue.textContent = `${hue > 0 ? '+' : ''}${hue}°`;
    }
    if (sliderExposure) {
      sliderExposure.value = exp;
      if (valExposure) valExposure.textContent = `${exp}%`;
    }

    const valDensity = document.getElementById('valDensity');
    if (valDensity) {
      const c = BUBBLE_COLORS.find(item => item.id === colorKey || item.alias === colorKey);
      if (c) {
        valDensity.textContent = `${c.density.toFixed(2)}x • ${c.densityLabel}`;
      } else {
        valDensity.textContent = '0.28x (Diamond) → 2.80x (Hematite)';
      }
    }
  }

  tunerColorTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tunerColorTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTunerColor = tab.getAttribute('data-color') || 'all';
      syncTunerSlidersFromColor(activeTunerColor);
    });
  });

  if (pickerBaseColor) {
    pickerBaseColor.addEventListener('input', (e) => {
      const hex = e.target.value;
      if (valBaseColor) valBaseColor.textContent = hex;
      if (activeTunerColor !== 'all') {
        renderer.setBaseColor(activeTunerColor, hex);
        const dot = document.querySelector(`.tuner-tab[data-color="${activeTunerColor}"] .tab-dot`);
        if (dot) dot.style.background = hex;
      }
    });
  }

  if (valBaseColor) {
    valBaseColor.addEventListener('click', () => {
      const hex = valBaseColor.textContent;
      if (hex) {
        copyToClipboard(hex, valBaseColor);
      }
    });
  }

  if (btnCopyColors) {
    btnCopyColors.addEventListener('click', () => {
      let dataToCopy = '';
      if (activeTunerColor === 'all') {
        const payload = {
          baseColors: renderer.baseColors,
          colorAdjustments: renderer.colorAdjustments
        };
        dataToCopy = JSON.stringify(payload, null, 2);
      } else {
        const hex = renderer.getBaseColor(activeTunerColor);
        const adj = renderer.getColorAdjustment(activeTunerColor);
        const payload = {
          color: activeTunerColor,
          baseHex: hex,
          saturation: adj.saturation,
          hueShift: adj.hueShift,
          exposure: adj.exposure
        };
        dataToCopy = JSON.stringify(payload, null, 2);
      }
      copyToClipboard(dataToCopy, btnCopyColors);
    });
  }

  if (sliderSaturation) {
    sliderSaturation.addEventListener('input', (e) => {
      const satVal = parseInt(e.target.value, 10);
      if (valSaturation) valSaturation.textContent = `${satVal}%`;
      renderer.setColorAdjustment(activeTunerColor, { saturation: satVal / 100 });
    });
  }

  if (sliderHue) {
    sliderHue.addEventListener('input', (e) => {
      const hueVal = parseInt(e.target.value, 10);
      if (valHue) valHue.textContent = `${hueVal > 0 ? '+' : ''}${hueVal}°`;
      renderer.setColorAdjustment(activeTunerColor, { hueShift: hueVal });
    });
  }

  if (sliderExposure) {
    sliderExposure.addEventListener('input', (e) => {
      const expVal = parseInt(e.target.value, 10);
      if (valExposure) valExposure.textContent = `${expVal}%`;
      renderer.setColorAdjustment(activeTunerColor, { exposure: expVal / 100 });
    });
  }

  if (btnResetVisuals) {
    btnResetVisuals.addEventListener('click', () => {
      renderer.resetColorAdjustment(activeTunerColor);
      syncTunerSlidersFromColor(activeTunerColor);
      tunerColorTabs.forEach(tab => {
        const c = tab.getAttribute('data-color');
        const dot = tab.querySelector('.tab-dot');
        if (dot && c && c !== 'all') {
          dot.style.background = '';
        }
      });
    });
  }

  syncTunerSlidersFromColor(activeTunerColor);

  if (btnToggleColorControls && drawerTunerControls) {
    btnToggleColorControls.addEventListener('click', () => {
      const isHidden = drawerTunerControls.classList.toggle('hidden');
      btnToggleColorControls.setAttribute('aria-expanded', !isHidden);
      const icon = btnToggleColorControls.querySelector('.toggle-icon');
      if (icon) icon.textContent = isHidden ? '▸' : '▾';
    });
  }

  // Canvas Mouse / Touch events
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function findBubbleAt(x, y) {
    for (let i = physics.bubbles.length - 1; i >= 0; i--) {
      const b = physics.bubbles[i];
      const dx = b.x - x;
      const dy = b.y - y;
      const hitRadius = b.radius * 1.15;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return i;
      }
    }
    return -1;
  }

  canvas.addEventListener('pointerdown', (e) => {
    audio.ensureAudio();
    const coords = getCanvasCoords(e);
    mouseState.x = coords.x;
    mouseState.y = coords.y;
    mouseState.isDown = true;
    mouseState.active = true;

    if (e.button === 2) {
      physics.applyForceField(coords.x, coords.y, 50, 1, 'pop');
      return;
    }

    if (currentTool === 'pop') {
      physics.applyForceField(coords.x, coords.y, 55, 1, 'pop');
    } else if (currentTool === 'spawn') {
      const hitIndex = findBubbleAt(coords.x, coords.y);
      if (hitIndex !== -1) {
        const hitBubble = physics.bubbles[hitIndex];
        if (physics.isLabeledBubble(hitBubble)) {
          // Labeled bubbles cannot be popped by tapping — trigger elastic wobble & bounce feedback
          hitBubble.exciteWobble(0.45);
          audio.playBounce(0.6, hitBubble.radius);
        } else {
          physics.popBubble(hitIndex, true);
        }
      } else {
        lastActivityTime = performance.now();
        const radius = 26 + Math.random() * 18;
        const b = physics.spawnBubble(coords.x, coords.y, radius, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5);
        if (b) {
          b.scalePulse = 1.15;
          renderer.addFloatingText('+Gem', coords.x, coords.y - 12, '#38bdf8');
          audio.playPop(1.4, radius);
        }
        hideInGameHint();
      }
    }
  });

  window.addEventListener('pointermove', (e) => {
    const coords = getCanvasCoords(e);
    mouseState.x = coords.x;
    mouseState.y = coords.y;
    mouseState.active = true;

    if (mouseState.isDown) {
      if (currentTool === 'pop') {
        physics.applyForceField(coords.x, coords.y, 55, 1, 'pop');
      } else if (currentTool === 'spawn') {
        mouseState.spawnCooldown++;
        if (mouseState.spawnCooldown >= 7) {
          mouseState.spawnCooldown = 0;
          const hitIndex = findBubbleAt(coords.x, coords.y);
          if (hitIndex === -1) {
            const radius = 24 + Math.random() * 16;
            const b = physics.spawnBubble(coords.x, coords.y, radius, (Math.random() - 0.5) * 2, -0.5 - Math.random() * 1.5);
            if (b) b.scalePulse = 1.12;
          }
        }
      }
    }

    if (currentTool === 'force') {
      physics.applyForceField(coords.x, coords.y, 75, 0.6, 'force');
    }
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    physics.applyForceField(coords.x, coords.y, 55, 1, 'pop');
  });

  window.addEventListener('pointerup', () => {
    mouseState.isDown = false;
  });

  canvas.addEventListener('pointerleave', () => {
    mouseState.active = false;
    mouseState.isDown = false;
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    audio.ensureAudio();

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (!modalObjective.classList.contains('hidden')) {
        gameEngine.dismissObjective();
        return;
      }
      if (!modalWin.classList.contains('hidden')) {
        gameEngine.nextLevel(window.innerWidth, window.innerHeight);
        return;
      }
      if (!modalFail.classList.contains('hidden')) {
        gameEngine.restartCurrentLevel(window.innerWidth, window.innerHeight);
        return;
      }
      isPaused = !isPaused;
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'r':
        gameEngine.restartCurrentLevel(window.innerWidth, window.innerHeight);
        break;
      case 'm':
        audio.toggle();
        break;
      case 's':
        document.querySelector('.tool-pill[data-mode="spawn"]')?.click();
        break;
      case 'f':
        document.querySelector('.tool-pill[data-mode="force"]')?.click();
        break;
      case 'a':
        document.querySelector('.tool-pill[data-mode="attract"]')?.click();
        break;
      case 'x':
      case 'b':
        document.querySelector('.tool-pill[data-mode="pop"]')?.click();
        break;
    }
  });

  // Launch from Most Current Level (saved locally in localStorage)
  const savedProgress = GameStorage.loadProgress();
  const initialLevel = savedProgress.currentLevel || 1;
  gameEngine.startLevel(initialLevel, window.innerWidth, window.innerHeight);

  // Animation Loop
  function loop(currentTime) {
    const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      if (statFPS) statFPS.textContent = Math.round(frameCount / fpsTimer);
      frameCount = 0;
      fpsTimer = 0;
    }

    if (!isPaused) {
      if (mouseState.active && mouseState.isDown && currentTool === 'attract') {
        physics.applyForceField(mouseState.x, mouseState.y, 180, 1.2, 'attract');
      }

      gameEngine.update(dt, window.innerWidth, window.innerHeight);
      physics.update(window.innerWidth, window.innerHeight);
    }

    const targetDiameter = gameEngine.getCurrentLevel() ? gameEngine.getCurrentLevel().targetDiameter : 0;
    renderer.render(physics, mouseState, targetDiameter);

    // Drawer Live Stats
    if (statBubbleCount) statBubbleCount.textContent = physics.bubbles.length;
    if (statMergeCount) statMergeCount.textContent = physics.totalMerges;
    let maxR = 0;
    for (let b of physics.bubbles) {
      if (b.radius > maxR) maxR = b.radius;
    }
    if (statMaxRadius) statMaxRadius.textContent = `${Math.round(maxR * 2)}px`;

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
