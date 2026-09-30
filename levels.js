/**
 * Bubble Sim - Level Configurations
 * 10 Progressive levels with expanding color palette, increasing target diameters,
 * timer constraints, and drop budgets.
 */

export const LEVEL_DEFINITIONS = [
  {
    level: 1,
    name: "First Steps",
    description: "Tutorial - Merge same colors to reach the target size. Don't let them exceed Ø200px or they pop!",
    colors: ['white', 'green', 'red', 'orange'],
    dropBudget: 20,
    targetDiameter: 140,
    timerSeconds: null // Untimed free play
  },
  {
    level: 2,
    name: "Surface Tension",
    description: "Grow your bubbles larger. Balance room and color clusters.",
    colors: ['white', 'green', 'red', 'orange'],
    dropBudget: 22,
    targetDiameter: 155,
    timerSeconds: null
  },
  {
    level: 3,
    name: "Against the Clock",
    description: "The timer begins! Merge fast and clean before time expires.",
    colors: ['white', 'green', 'red', 'orange'],
    dropBudget: 24,
    targetDiameter: 165,
    timerSeconds: 120
  },
  {
    level: 4,
    name: "Violet Harmony",
    description: "Purple unlocked (5 colors). More colors mean fewer matches.",
    colors: ['white', 'green', 'red', 'orange', 'purple'],
    dropBudget: 25,
    targetDiameter: 160,
    timerSeconds: 110
  },
  {
    level: 5,
    name: "Chromatic Cascade",
    description: "5 colors to Ø170px. Keep your arena clean.",
    colors: ['white', 'green', 'red', 'orange', 'purple'],
    dropBudget: 26,
    targetDiameter: 170,
    timerSeconds: 100
  },
  {
    level: 6,
    name: "Prism Realm",
    description: "All 6 colors unlocked (introducing Cyan). Complete color spectrum.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 28,
    targetDiameter: 165,
    timerSeconds: 95
  },
  {
    level: 7,
    name: "Pressure Wave",
    description: "6 colors pushed to Ø175px.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 30,
    targetDiameter: 175,
    timerSeconds: 85
  },
  {
    level: 8,
    name: "The Danger Zone",
    description: "Target Ø180px - very close to the 200px burst threshold!",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 30,
    targetDiameter: 180,
    timerSeconds: 75
  },
  {
    level: 9,
    name: "Critical Mass",
    description: "Target Ø185px. High precision required.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 32,
    targetDiameter: 185,
    timerSeconds: 65
  },
  {
    level: 10,
    name: "Master of Coalescence",
    description: "Final Challenge: 6 colors simultaneously at Ø190px in 60s.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 35,
    targetDiameter: 190,
    timerSeconds: 60
  }
];
