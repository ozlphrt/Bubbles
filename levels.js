/**
 * Bubble Sim - Level Configurations
 * Progressive levels with expanding color and material choices sampled from
 * the 50-color gemstone and mineral palette with distinct densities and elasticities.
 */

import { BUBBLE_COLORS, getColorById } from './palette.js';

export const LEVEL_DEFINITIONS = [
  {
    level: 1,
    name: "First Steps",
    description: "Merge 4 classic gemstones (Pearl, Emerald, Ruby, Amber) to Ø172px before the clock expires.",
    colors: ['white', 'green', 'red', 'orange'],
    dropBudget: 20,
    targetDiameter: 172,
    timerSeconds: 240,
    avgRadius: 22,
    sizeTiers: { small: 0.95, medium: 0.05, large: 0.00 }
  },
  {
    level: 2,
    name: "Oceanic Drift",
    description: "Navigate buoyant ocean crystals (Aquamarine, Larimar, Sapphire, Pearl) up to Ø176px.",
    colors: ['aquamarine', 'larimar', 'cyan', 'white'],
    dropBudget: 22,
    targetDiameter: 176,
    timerSeconds: 230,
    avgRadius: 24,
    sizeTiers: { small: 0.70, medium: 0.30, large: 0.00 }
  },
  {
    level: 3,
    name: "Thermal Strata",
    description: "Balance springy Citrine and Topaz against dense Garnet and volcanic Obsidian to Ø180px.",
    colors: ['citrine', 'topaz', 'garnet', 'obsidian'],
    dropBudget: 24,
    targetDiameter: 180,
    timerSeconds: 220,
    avgRadius: 27,
    sizeTiers: { small: 0.45, medium: 0.38, large: 0.17 }
  },
  {
    level: 4,
    name: "Verdant Canopy",
    description: "High-yield merges across jadeite and beryl minerals (Peridot, Jade, Malachite, Tsavorite) to Ø184px.",
    colors: ['peridot', 'jade', 'malachite', 'tsavorite'],
    dropBudget: 25,
    targetDiameter: 184,
    timerSeconds: 210,
    avgRadius: 28,
    sizeTiers: { small: 0.40, medium: 0.40, large: 0.20 }
  },
  {
    level: 5,
    name: "Twilight Aurora",
    description: "5th material unlocked! Harmonize Moonstone, Rose Quartz, Amethyst, Tanzanite, and Kunzite to Ø176px.",
    colors: ['moonstone', 'rose_quartz', 'purple', 'tanzanite', 'kunzite'],
    dropBudget: 26,
    targetDiameter: 176,
    timerSeconds: 200,
    avgRadius: 29,
    sizeTiers: { small: 0.36, medium: 0.42, large: 0.22 }
  },
  {
    level: 6,
    name: "Solar Forge",
    description: "Harness high-energy materials (Sunstone, Carnelian, Spinel, Pyrite, Amber) to Ø182px.",
    colors: ['sunstone', 'carnelian', 'spinel', 'pyrite', 'orange'],
    dropBudget: 28,
    targetDiameter: 182,
    timerSeconds: 195,
    avgRadius: 30,
    sizeTiers: { small: 0.34, medium: 0.43, large: 0.23 }
  },
  {
    level: 7,
    name: "Deep Earth Geode",
    description: "5 heavy metamorphic crystals (Alexandrite, Fluorite, Charoite, Tourmaline, Hematite) to Ø186px.",
    colors: ['alexandrite', 'fluorite', 'charoite', 'tourmaline', 'hematite'],
    dropBudget: 30,
    targetDiameter: 186,
    timerSeconds: 190,
    avgRadius: 31,
    sizeTiers: { small: 0.30, medium: 0.45, large: 0.25 }
  },
  {
    level: 8,
    name: "Prismatic Crown",
    description: "6 royal spectrum gemstones (Diamond, Sapphire, Emerald, Ruby, Topaz, Amethyst) to Ø178px.",
    colors: ['diamond', 'cyan', 'green', 'red', 'topaz', 'purple'],
    dropBudget: 30,
    targetDiameter: 178,
    timerSeconds: 185,
    avgRadius: 31,
    sizeTiers: { small: 0.30, medium: 0.45, large: 0.25 }
  },
  {
    level: 9,
    name: "Density Extremes",
    description: "Master 6 materials with dramatic density contrasts (0.42x Opal floaters to 2.68x Pyrite weights) to Ø186px.",
    colors: ['opal', 'aquamarine', 'jade', 'rhodolite', 'obsidian', 'pyrite'],
    dropBudget: 32,
    targetDiameter: 186,
    timerSeconds: 180,
    avgRadius: 32,
    sizeTiers: { small: 0.28, medium: 0.45, large: 0.27 }
  },
  {
    level: 10,
    name: "Master of Coalescence",
    description: "Final Challenge: 6 apex minerals coalesced simultaneously to Ø192px.",
    colors: ['diamond', 'cyan', 'green', 'red', 'orange', 'purple'],
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
 * Levels 11+ dynamically scale into endless procedural mastery tiers sampling from the 50-color palette.
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

  // Procedurally sample 5-6 harmonious, contrasting materials from the 50-color palette
  const allPaletteIds = BUBBLE_COLORS.map(c => c.id);
  const colorCount = cycle >= 3 ? 6 : 5;
  const step = 7;
  const startIdx = ((num - 1) * step) % allPaletteIds.length;
  const colors = [];
  for (let i = 0; i < colorCount * 2; i++) {
    const cid = allPaletteIds[(startIdx + i * 9) % allPaletteIds.length];
    if (!colors.includes(cid)) {
      colors.push(cid);
    }
    if (colors.length >= colorCount) break;
  }

  return {
    level: num,
    name: `${TITLES[cycle]} ${toRoman(cycleCount)}`,
    description: `Endless Mastery Tier: Coalesce ${colors.length} rare mineral materials to Ø${targetDiameter}px under intense surface tension.`,
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
