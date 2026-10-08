/**
 * Bubble Sim - Level Configurations
 * 10 Progressive levels with expanding color palette, increasing target diameters,
 * timer constraints, and drop budgets.
 */

export const LEVEL_DEFINITIONS = [
  {
    level: 1,
    name: "First Steps",
    description: "Merge 4 matching colors to Ø172px before the clock expires. Careful not to exceed Ø200px or they pop!",
    colors: ['white', 'green', 'red', 'orange'],
    dropBudget: 20,
    targetDiameter: 172,
    timerSeconds: 240,
    avgRadius: 22,
    sizeTiers: { small: 0.95, medium: 0.05, large: 0.00 }
  },
  {
    level: 2,
    name: "Fluid Flow",
    description: "Master 4-color routing to merge dense clusters up to Ø176px.",
    colors: ['white', 'green', 'red', 'orange'],
    dropBudget: 22,
    targetDiameter: 176,
    timerSeconds: 230,
    avgRadius: 24,
    sizeTiers: { small: 0.70, medium: 0.30, large: 0.00 }
  },
  {
    level: 3,
    name: "Cluster Dynamics",
    description: "Merge 4 colors to Ø180px. Maintain open pathways through the foam.",
    colors: ['white', 'green', 'red', 'orange'],
    dropBudget: 24,
    targetDiameter: 180,
    timerSeconds: 220,
    avgRadius: 27,
    sizeTiers: { small: 0.45, medium: 0.38, large: 0.17 }
  },
  {
    level: 4,
    name: "Tension Boundary",
    description: "High-yield merges reaching Ø184px across 4 colors before expanding the palette.",
    colors: ['white', 'green', 'red', 'orange'],
    dropBudget: 25,
    targetDiameter: 184,
    timerSeconds: 210,
    avgRadius: 28,
    sizeTiers: { small: 0.40, medium: 0.40, large: 0.20 }
  },
  {
    level: 5,
    name: "Violet Harmony",
    description: "5th color unlocked (Purple)! Increased variety requires strategic navigation to Ø176px.",
    colors: ['white', 'green', 'red', 'orange', 'purple'],
    dropBudget: 26,
    targetDiameter: 176,
    timerSeconds: 200,
    avgRadius: 29,
    sizeTiers: { small: 0.36, medium: 0.42, large: 0.22 }
  },
  {
    level: 6,
    name: "Chromatic Cascade",
    description: "5 colors to Ø182px. Clear obstacles quickly to merge distant bubbles.",
    colors: ['white', 'green', 'red', 'orange', 'purple'],
    dropBudget: 28,
    targetDiameter: 182,
    timerSeconds: 195,
    avgRadius: 30,
    sizeTiers: { small: 0.34, medium: 0.43, large: 0.23 }
  },
  {
    level: 7,
    name: "Surface Tension Peak",
    description: "5 colors to Ø186px - entering dangerous territory near the 200px pop limit!",
    colors: ['white', 'green', 'red', 'orange', 'purple'],
    dropBudget: 30,
    targetDiameter: 186,
    timerSeconds: 190,
    avgRadius: 31,
    sizeTiers: { small: 0.30, medium: 0.45, large: 0.25 }
  },
  {
    level: 8,
    name: "Prism Realm",
    description: "6th color unlocked (Cyan)! Full color spectrum active to Ø178px across the board.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 30,
    targetDiameter: 178,
    timerSeconds: 185,
    avgRadius: 31,
    sizeTiers: { small: 0.30, medium: 0.45, large: 0.25 }
  },
  {
    level: 9,
    name: "Critical Mass",
    description: "Target Ø186px across all 6 colors. Precision and spatial awareness required.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 32,
    targetDiameter: 186,
    timerSeconds: 180,
    avgRadius: 32,
    sizeTiers: { small: 0.28, medium: 0.45, large: 0.27 }
  },
  {
    level: 10,
    name: "Master of Coalescence",
    description: "Final Challenge: 6 colors simultaneously at Ø192px. Pure mastery.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 35,
    targetDiameter: 192,
    timerSeconds: 180,
    avgRadius: 33,
    sizeTiers: { small: 0.25, medium: 0.45, large: 0.30 }
  }
];

function toRoman(n) {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  return roman[n - 1] || `${n}`;
}

/**
 * Returns level config for any level index >= 1.
 * Levels 1-10 use curated LEVEL_DEFINITIONS;
 * Levels 11+ dynamically scale into endless procedural mastery tiers.
 */
export function getLevelConfig(levelNum = 1) {
  const num = Math.max(1, Math.floor(levelNum));
  if (num <= LEVEL_DEFINITIONS.length) {
    return LEVEL_DEFINITIONS[num - 1];
  }

  // Procedural Endless Progression for Level 11+
  const endlessIndex = num - LEVEL_DEFINITIONS.length; // 1, 2, 3...
  const cycle = (endlessIndex - 1) % 5;
  const cycleCount = Math.floor((endlessIndex - 1) / 5) + 1;

  const TITLES = [
    "Quantum Foam",
    "Apex Fusion",
    "Singularity Core",
    "Hyper-Tension",
    "Infinite Horizon"
  ];

  // Target diameter scales between 188 and 196px (under the 200px burst ceiling)
  const targetDiameters = [188, 190, 192, 194, 196];
  const targetDiameter = targetDiameters[cycle];

  // Timer remains engaging (140s - 180s)
  const timerSeconds = Math.max(140, 185 - cycleCount * 5 - cycle * 3);

  const allColors = ['white', 'green', 'red', 'orange', 'purple', 'cyan'];
  let colors;
  if (cycle === 0 && cycleCount % 2 === 1) {
    colors = ['white', 'green', 'red', 'purple', 'cyan'];
  } else if (cycle === 2 && cycleCount % 2 === 0) {
    colors = ['green', 'red', 'orange', 'purple', 'cyan'];
  } else {
    colors = allColors;
  }

  return {
    level: num,
    name: `${TITLES[cycle]} ${toRoman(cycleCount)}`,
    description: `Endless Mastery Tier: Coalesce ${colors.length} gem colors to Ø${targetDiameter}px under intense surface tension.`,
    colors,
    dropBudget: Math.min(42, 32 + cycle * 2 + cycleCount),
    targetDiameter,
    timerSeconds,
    avgRadius: Math.min(34, 31 + Math.floor(cycle * 0.7)),
    sizeTiers: {
      small: Math.max(0.18, 0.28 - cycle * 0.02),
      medium: 0.44,
      large: Math.min(0.38, 0.28 + cycle * 0.02)
    }
  };
}
