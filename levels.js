/**
 * Bubble Sim - Level Configurations
 * 10 Progressive levels with expanding color palette, increasing target diameters,
 * timer constraints, and drop budgets.
 */

export const LEVEL_DEFINITIONS = [
  {
    level: 1,
    name: "First Steps",
    description: "Merge 4 matching colors to Ø155px before the clock expires. Careful not to exceed Ø200px or they pop!",
    colors: ['white', 'green', 'red', 'orange'],
    dropBudget: 20,
    targetDiameter: 155,
    timerSeconds: 75
  },
  {
    level: 2,
    name: "Violet Harmony",
    description: "Purple unlocked (5 colors). More colors create obstacles and require strategic navigation to Ø165px.",
    colors: ['white', 'green', 'red', 'orange', 'purple'],
    dropBudget: 22,
    targetDiameter: 165,
    timerSeconds: 65
  },
  {
    level: 3,
    name: "Against the Clock",
    description: "5 colors pushed to Ø170px. Merge rapidly and keep your clusters organized.",
    colors: ['white', 'green', 'red', 'orange', 'purple'],
    dropBudget: 24,
    targetDiameter: 170,
    timerSeconds: 60
  },
  {
    level: 4,
    name: "Prism Realm",
    description: "All 6 colors unlocked (introducing Cyan). Full color spectrum to Ø170px in 55s.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 25,
    targetDiameter: 170,
    timerSeconds: 55
  },
  {
    level: 5,
    name: "Chromatic Cascade",
    description: "6 colors to Ø175px. Clear paths quickly to merge distant bubbles.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 26,
    targetDiameter: 175,
    timerSeconds: 50
  },
  {
    level: 6,
    name: "Pressure Wave",
    description: "6 colors to Ø178px in 48s. Intense pacing and tight spacing.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 28,
    targetDiameter: 178,
    timerSeconds: 48
  },
  {
    level: 7,
    name: "Surface Tension Peak",
    description: "Target Ø180px - entering dangerous territory near the 200px pop limit!",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 30,
    targetDiameter: 180,
    timerSeconds: 45
  },
  {
    level: 8,
    name: "The Danger Zone",
    description: "Target Ø184px across all 6 colors. One excessive merge and your bubble bursts!",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 30,
    targetDiameter: 184,
    timerSeconds: 40
  },
  {
    level: 9,
    name: "Critical Mass",
    description: "Target Ø188px in 35s. Precision, speed, and spatial awareness required.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 32,
    targetDiameter: 188,
    timerSeconds: 35
  },
  {
    level: 10,
    name: "Master of Coalescence",
    description: "Final Challenge: 6 colors simultaneously at Ø192px in 30s. Pure mastery.",
    colors: ['white', 'green', 'red', 'orange', 'purple', 'cyan'],
    dropBudget: 35,
    targetDiameter: 192,
    timerSeconds: 30
  }
];
