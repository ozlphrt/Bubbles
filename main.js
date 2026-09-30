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

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('simCanvas');
  const renderer = new Renderer(canvas);
  const physics = physicsEngine;
  const audio = soundEngine;
  audio.init();

  // DOM Elements - Minimal Top Stats
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

  // Top Right Level Selector Pulldown
  if (topLevelSelect) {
    topLevelSelect.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Level ${i}`;
      topLevelSelect.appendChild(opt);
    }
    topLevelSelect.addEventListener('change', (e) => {
      audio.ensureAudio();
      const selectedLevel = parseInt(e.target.value, 10);
      gameEngine.startLevel(selectedLevel, window.innerWidth, window.innerHeight);
    });
  }

  // Drawer Level Jump Grid
  if (levelJumpGrid) {
    levelJumpGrid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const btn = document.createElement('button');
      btn.className = `level-jump-btn ${i === 1 ? 'current' : ''}`;
      btn.textContent = `L${i}`;
      btn.addEventListener('click', () => {
        audio.ensureAudio();
        gameEngine.startLevel(i, window.innerWidth, window.innerHeight);
        sideDrawer.classList.remove('open');
      });
      levelJumpGrid.appendChild(btn);
    }
  }

  function updateLevelJumpActive(levelNum) {
    if (topLevelSelect) {
      topLevelSelect.value = String(levelNum);
    }
    if (levelJumpGrid) {
      const buttons = levelJumpGrid.querySelectorAll('.level-jump-btn');
      buttons.forEach((btn, idx) => {
        btn.classList.toggle('current', idx + 1 === levelNum);
      });
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getColorName(cid) {
    const c = BUBBLE_COLORS.find(item => item.id === cid);
    return c ? c.name : cid;
  }

  // Game Engine State Callbacks
  gameEngine.onStateChange = (state, levelConfig) => {
    updateLevelJumpActive(levelConfig.level);

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
      if (objGoalText) objGoalText.textContent = `Grow Each Color to ${levelConfig.targetDiameter}px`;

      if (objColorsGrid) {
        objColorsGrid.innerHTML = '';
        levelConfig.colors.forEach(cid => {
          const div = document.createElement('div');
          div.className = `modal-sphere sphere-${cid}`;
          div.title = getColorName(cid);
          objColorsGrid.appendChild(div);
        });
      }
    } else if (state === GameState.PHASE2_MERGE) {
      modalObjective.classList.add('hidden');
      modalWin.classList.add('hidden');
      modalFail.classList.add('hidden');
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
  };
  gameEngine.onSpawnUpdate = (fillRatio, total) => {};
  gameEngine.onColorProgress = (progressList) => {};

  gameEngine.onLevelWin = (scoreData) => {
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
  };

  gameEngine.onLevelFail = (failData) => {
    modalObjective.classList.add('hidden');
    modalWin.classList.add('hidden');
    modalFail.classList.remove('hidden');

    if (failResultsGrid) {
      failResultsGrid.innerHTML = '';
      failData.colorProgress.forEach(item => {
        const row = document.createElement('div');
        row.className = `fail-row ${item.achieved ? 'pass' : 'fail'}`;
        row.innerHTML = `
          <span>${getColorName(item.colorId)}</span>
          <span><strong>${item.current}px</strong> / ${item.target}px ${item.achieved ? '✓' : '✗'}</span>
        `;
        failResultsGrid.appendChild(row);
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

  // Floating Live Visual Tuner Controls
  const visualTunerCard = document.getElementById('visualTunerCard');
  const btnToggleTuner = document.getElementById('btnToggleTuner');
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

  if (btnToggleTuner && visualTunerCard) {
    btnToggleTuner.addEventListener('click', () => {
      const isMin = visualTunerCard.classList.toggle('minimized');
      btnToggleTuner.textContent = isMin ? '▴' : '▾';
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
        const radius = 16 + Math.random() * 16;
        physics.spawnBubble(coords.x, coords.y, radius, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5);
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
            const radius = 16 + Math.random() * 16;
            physics.spawnBubble(coords.x, coords.y, radius, (Math.random() - 0.5) * 2, -0.5 - Math.random() * 1.5);
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

  // Launch Level 1 Game Flow
  gameEngine.startLevel(1, window.innerWidth, window.innerHeight);

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

    renderer.render(physics, mouseState);

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
