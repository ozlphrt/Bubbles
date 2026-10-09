/**
 * Aerodrop 50-Gemstone & Mineral Material Palette
 * Defines 50 distinct materials spanning density, elasticity, friction,
 * buoyancy, gravity scale, wobble harmonics, and gemstone optics.
 */

export const BUBBLE_COLORS = [
  // 1-10: Feather & Ultra-Light Floaters (density 0.28 - 0.55)
  { 
    id: 'white', alias: 'pearl', name: 'Pearl', hex: '#f8fafc', hue: 210, isWhite: true, 
    material: 'Organic Nacre', density: 0.35, massFactor: 0.35, gravityScale: 0.45, buoyancy: 0.14, 
    elasticity: 0.92, friction: 0.008, wobbleFreq: 0.24, shininess: 1.00, reflectivity: 0.95, smoothness: 0.96, 
    densityLabel: 'Ultra-Light' 
  },
  { 
    id: 'diamond', name: 'Diamond', hex: '#e0f2fe', hue: 200, isWhite: true, 
    material: 'Pure Carbon', density: 0.28, massFactor: 0.28, gravityScale: 0.38, buoyancy: 0.18, 
    elasticity: 0.96, friction: 0.006, wobbleFreq: 0.26, shininess: 1.00, reflectivity: 0.98, smoothness: 0.98, 
    densityLabel: 'Feather-Light' 
  },
  { 
    id: 'moonstone', name: 'Moonstone', hex: '#e2e8f0', hue: 215, isWhite: true, 
    material: 'Feldspar', density: 0.38, massFactor: 0.38, gravityScale: 0.48, buoyancy: 0.12, 
    elasticity: 0.90, friction: 0.009, wobbleFreq: 0.23, shininess: 0.92, reflectivity: 0.94, smoothness: 0.95, 
    densityLabel: 'Ultra-Light' 
  },
  { 
    id: 'opal', name: 'Opal', hex: '#f0fdf4', hue: 140, isWhite: true, 
    material: 'Hydrated Silica', density: 0.42, massFactor: 0.42, gravityScale: 0.52, buoyancy: 0.11, 
    elasticity: 0.88, friction: 0.010, wobbleFreq: 0.22, shininess: 0.95, reflectivity: 0.92, smoothness: 0.94, 
    densityLabel: 'Ultra-Light' 
  },
  { 
    id: 'aquamarine', name: 'Aquamarine', hex: '#38bdf8', hue: 198, isWhite: false, 
    material: 'Beryl', density: 0.46, massFactor: 0.46, gravityScale: 0.56, buoyancy: 0.09, 
    elasticity: 0.89, friction: 0.010, wobbleFreq: 0.21, shininess: 0.93, reflectivity: 0.90, smoothness: 0.92, 
    densityLabel: 'Light Floater' 
  },
  { 
    id: 'morganite', name: 'Morganite', hex: '#fbcfe8', hue: 325, isWhite: false, 
    material: 'Rose Beryl', density: 0.48, massFactor: 0.48, gravityScale: 0.58, buoyancy: 0.08, 
    elasticity: 0.87, friction: 0.011, wobbleFreq: 0.20, shininess: 0.90, reflectivity: 0.88, smoothness: 0.90, 
    densityLabel: 'Light Floater' 
  },
  { 
    id: 'kunzite', name: 'Kunzite', hex: '#f472b6', hue: 330, isWhite: false, 
    material: 'Spodumene', density: 0.50, massFactor: 0.50, gravityScale: 0.60, buoyancy: 0.08, 
    elasticity: 0.86, friction: 0.011, wobbleFreq: 0.20, shininess: 0.88, reflectivity: 0.87, smoothness: 0.89, 
    densityLabel: 'Light Floater' 
  },
  { 
    id: 'larimar', name: 'Larimar', hex: '#67e8f9', hue: 188, isWhite: false, 
    material: 'Pectolite', density: 0.52, massFactor: 0.52, gravityScale: 0.62, buoyancy: 0.07, 
    elasticity: 0.85, friction: 0.012, wobbleFreq: 0.19, shininess: 0.89, reflectivity: 0.86, smoothness: 0.88, 
    densityLabel: 'Light Floater' 
  },
  { 
    id: 'fluorite', name: 'Fluorite', hex: '#a7f3d0', hue: 152, isWhite: false, 
    material: 'Halide', density: 0.54, massFactor: 0.54, gravityScale: 0.64, buoyancy: 0.07, 
    elasticity: 0.84, friction: 0.012, wobbleFreq: 0.19, shininess: 0.85, reflectivity: 0.84, smoothness: 0.86, 
    densityLabel: 'Light' 
  },
  { 
    id: 'heliodor', name: 'Heliodor', hex: '#fde047', hue: 52, isWhite: false, 
    material: 'Golden Beryl', density: 0.55, massFactor: 0.55, gravityScale: 0.65, buoyancy: 0.06, 
    elasticity: 0.85, friction: 0.012, wobbleFreq: 0.19, shininess: 0.92, reflectivity: 0.88, smoothness: 0.90, 
    densityLabel: 'Light' 
  },

  // 11-20: Light & Springy Minerals (density 0.65 - 0.88)
  { 
    id: 'cyan', alias: 'sapphire', name: 'Sapphire', hex: '#0ea5e9', hue: 205, isWhite: false, 
    material: 'Corundum', density: 0.65, massFactor: 0.65, gravityScale: 0.70, buoyancy: 0.06, 
    elasticity: 0.86, friction: 0.011, wobbleFreq: 0.19, shininess: 0.94, reflectivity: 0.88, smoothness: 0.92, 
    densityLabel: 'Light' 
  },
  { 
    id: 'topaz', name: 'Topaz', hex: '#fb923c', hue: 28, isWhite: false, 
    material: 'Nesosilicate', density: 0.68, massFactor: 0.68, gravityScale: 0.72, buoyancy: 0.05, 
    elasticity: 0.94, friction: 0.009, wobbleFreq: 0.21, shininess: 0.95, reflectivity: 0.92, smoothness: 0.94, 
    densityLabel: 'Springy Light' 
  },
  { 
    id: 'rose_quartz', name: 'Rose Quartz', hex: '#fb7185', hue: 350, isWhite: false, 
    material: 'Quartz', density: 0.70, massFactor: 0.70, gravityScale: 0.74, buoyancy: 0.04, 
    elasticity: 0.82, friction: 0.013, wobbleFreq: 0.18, shininess: 0.86, reflectivity: 0.82, smoothness: 0.85, 
    densityLabel: 'Light' 
  },
  { 
    id: 'chrysoprase', name: 'Chrysoprase', hex: '#34d399', hue: 156, isWhite: false, 
    material: 'Chalcedony', density: 0.72, massFactor: 0.72, gravityScale: 0.76, buoyancy: 0.04, 
    elasticity: 0.83, friction: 0.013, wobbleFreq: 0.18, shininess: 0.84, reflectivity: 0.80, smoothness: 0.84, 
    densityLabel: 'Light' 
  },
  { 
    id: 'citrine', name: 'Citrine', hex: '#eab308', hue: 48, isWhite: false, 
    material: 'Quartz', density: 0.74, massFactor: 0.74, gravityScale: 0.78, buoyancy: 0.03, 
    elasticity: 0.84, friction: 0.014, wobbleFreq: 0.18, shininess: 0.90, reflectivity: 0.85, smoothness: 0.88, 
    densityLabel: 'Light' 
  },
  { 
    id: 'peridot', name: 'Peridot', hex: '#84cc16', hue: 84, isWhite: false, 
    material: 'Olivine', density: 0.78, massFactor: 0.78, gravityScale: 0.82, buoyancy: 0.02, 
    elasticity: 0.91, friction: 0.011, wobbleFreq: 0.19, shininess: 0.88, reflectivity: 0.86, smoothness: 0.87, 
    densityLabel: 'Springy Light' 
  },
  { 
    id: 'tanzanite', name: 'Tanzanite', hex: '#6366f1', hue: 239, isWhite: false, 
    material: 'Sorosilicate', density: 0.80, massFactor: 0.80, gravityScale: 0.84, buoyancy: 0.02, 
    elasticity: 0.85, friction: 0.014, wobbleFreq: 0.17, shininess: 0.92, reflectivity: 0.89, smoothness: 0.90, 
    densityLabel: 'Medium-Light' 
  },
  { 
    id: 'turquoise', name: 'Turquoise', hex: '#06b6d4', hue: 187, isWhite: false, 
    material: 'Hydrated Copper', density: 0.82, massFactor: 0.82, gravityScale: 0.86, buoyancy: 0.01, 
    elasticity: 0.76, friction: 0.016, wobbleFreq: 0.16, shininess: 0.74, reflectivity: 0.70, smoothness: 0.75, 
    densityLabel: 'Medium-Light' 
  },
  { 
    id: 'apatite', name: 'Apatite', hex: '#0284c7', hue: 201, isWhite: false, 
    material: 'Phosphate', density: 0.85, massFactor: 0.85, gravityScale: 0.88, buoyancy: 0.01, 
    elasticity: 0.88, friction: 0.013, wobbleFreq: 0.18, shininess: 0.91, reflectivity: 0.87, smoothness: 0.89, 
    densityLabel: 'Medium-Light' 
  },
  { 
    id: 'sunstone', name: 'Sunstone', hex: '#f97316', hue: 24, isWhite: false, 
    material: 'Plagioclase', density: 0.88, massFactor: 0.88, gravityScale: 0.90, buoyancy: 0.00, 
    elasticity: 0.80, friction: 0.015, wobbleFreq: 0.17, shininess: 0.89, reflectivity: 0.85, smoothness: 0.84, 
    densityLabel: 'Medium-Light' 
  },

  // 21-30: Balanced Harmonious Gemstones (density 0.95 - 1.25)
  { 
    id: 'green', alias: 'emerald', name: 'Emerald', hex: '#10b981', hue: 156, isWhite: false, 
    material: 'Beryl', density: 0.95, massFactor: 0.95, gravityScale: 0.95, buoyancy: 0.00, 
    elasticity: 0.78, friction: 0.015, wobbleFreq: 0.16, shininess: 0.72, reflectivity: 0.66, smoothness: 0.68, 
    densityLabel: 'Medium' 
  },
  { 
    id: 'tourmaline', name: 'Tourmaline', hex: '#ec4899', hue: 330, isWhite: false, 
    material: 'Cyclosilicate', density: 0.98, massFactor: 0.98, gravityScale: 0.98, buoyancy: 0.00, 
    elasticity: 0.82, friction: 0.015, wobbleFreq: 0.16, shininess: 0.87, reflectivity: 0.84, smoothness: 0.86, 
    densityLabel: 'Medium' 
  },
  { 
    id: 'zircon', name: 'Zircon', hex: '#0ea5e9', hue: 195, isWhite: false, 
    material: 'Nesosilicate', density: 1.02, massFactor: 1.02, gravityScale: 1.02, buoyancy: -0.01, 
    elasticity: 0.93, friction: 0.010, wobbleFreq: 0.17, shininess: 0.97, reflectivity: 0.94, smoothness: 0.95, 
    densityLabel: 'Balanced' 
  },
  { 
    id: 'jade', name: 'Jade', hex: '#059669', hue: 161, isWhite: false, 
    material: 'Nephrite', density: 1.05, massFactor: 1.05, gravityScale: 1.05, buoyancy: -0.01, 
    elasticity: 0.74, friction: 0.018, wobbleFreq: 0.15, shininess: 0.70, reflectivity: 0.65, smoothness: 0.72, 
    densityLabel: 'Balanced' 
  },
  { 
    id: 'lapis', name: 'Lapis', hex: '#1d4ed8', hue: 224, isWhite: false, 
    material: 'Metamorphic Rock', density: 1.10, massFactor: 1.10, gravityScale: 1.08, buoyancy: -0.02, 
    elasticity: 0.72, friction: 0.018, wobbleFreq: 0.15, shininess: 0.76, reflectivity: 0.72, smoothness: 0.74, 
    densityLabel: 'Balanced' 
  },
  { 
    id: 'chalcedony', name: 'Chalcedony', hex: '#60a5fa', hue: 213, isWhite: false, 
    material: 'Microcrystalline Quartz', density: 1.12, massFactor: 1.12, gravityScale: 1.10, buoyancy: -0.02, 
    elasticity: 0.79, friction: 0.016, wobbleFreq: 0.15, shininess: 0.80, reflectivity: 0.76, smoothness: 0.82, 
    densityLabel: 'Balanced' 
  },
  { 
    id: 'iolite', name: 'Iolite', hex: '#4f46e5', hue: 243, isWhite: false, 
    material: 'Cordierite', density: 1.15, massFactor: 1.15, gravityScale: 1.12, buoyancy: -0.03, 
    elasticity: 0.81, friction: 0.016, wobbleFreq: 0.14, shininess: 0.86, reflectivity: 0.82, smoothness: 0.85, 
    densityLabel: 'Balanced' 
  },
  { 
    id: 'aventurine', name: 'Aventurine', hex: '#15803d', hue: 142, isWhite: false, 
    material: 'Quartzite', density: 1.18, massFactor: 1.18, gravityScale: 1.14, buoyancy: -0.03, 
    elasticity: 0.73, friction: 0.018, wobbleFreq: 0.14, shininess: 0.75, reflectivity: 0.70, smoothness: 0.72, 
    densityLabel: 'Balanced' 
  },
  { 
    id: 'orange', alias: 'amber', name: 'Amber', hex: '#f59e0b', hue: 42, isWhite: false, 
    material: 'Fossilized Resin', density: 1.22, massFactor: 1.22, gravityScale: 1.16, buoyancy: -0.04, 
    elasticity: 0.68, friction: 0.019, wobbleFreq: 0.13, shininess: 0.78, reflectivity: 0.72, smoothness: 0.72, 
    densityLabel: 'Dense' 
  },
  { 
    id: 'beryl', name: 'Beryl', hex: '#86efac', hue: 142, isWhite: false, 
    material: 'Cyclosilicate', density: 1.25, massFactor: 1.25, gravityScale: 1.18, buoyancy: -0.04, 
    elasticity: 0.83, friction: 0.015, wobbleFreq: 0.14, shininess: 0.88, reflectivity: 0.83, smoothness: 0.86, 
    densityLabel: 'Dense' 
  },

  // 31-40: Dense & Solid Materials (density 1.32 - 1.78)
  { 
    id: 'carnelian', name: 'Carnelian', hex: '#ea580c', hue: 21, isWhite: false, 
    material: 'Silica Agate', density: 1.32, massFactor: 1.32, gravityScale: 1.22, buoyancy: -0.05, 
    elasticity: 0.75, friction: 0.018, wobbleFreq: 0.13, shininess: 0.82, reflectivity: 0.78, smoothness: 0.80, 
    densityLabel: 'Dense' 
  },
  { 
    id: 'alexandrite', name: 'Alexandrite', hex: '#0d9488', hue: 175, isWhite: false, 
    material: 'Chrysoberyl', density: 1.38, massFactor: 1.38, gravityScale: 1.25, buoyancy: -0.06, 
    elasticity: 0.85, friction: 0.016, wobbleFreq: 0.13, shininess: 0.94, reflectivity: 0.90, smoothness: 0.92, 
    densityLabel: 'Dense' 
  },
  { 
    id: 'rhodolite', name: 'Rhodolite', hex: '#be185d', hue: 335, isWhite: false, 
    material: 'Pyrope Almandine', density: 1.45, massFactor: 1.45, gravityScale: 1.30, buoyancy: -0.07, 
    elasticity: 0.77, friction: 0.019, wobbleFreq: 0.12, shininess: 0.89, reflectivity: 0.86, smoothness: 0.88, 
    densityLabel: 'Dense' 
  },
  { 
    id: 'tsavorite', name: 'Tsavorite', hex: '#16a34a', hue: 142, isWhite: false, 
    material: 'Grossular Garnet', density: 1.50, massFactor: 1.50, gravityScale: 1.34, buoyancy: -0.08, 
    elasticity: 0.78, friction: 0.019, wobbleFreq: 0.12, shininess: 0.90, reflectivity: 0.88, smoothness: 0.88, 
    densityLabel: 'Dense' 
  },
  { 
    id: 'malachite', name: 'Malachite', hex: '#047857', hue: 163, isWhite: false, 
    material: 'Copper Carbonate', density: 1.55, massFactor: 1.55, gravityScale: 1.38, buoyancy: -0.08, 
    elasticity: 0.64, friction: 0.024, wobbleFreq: 0.11, shininess: 0.68, reflectivity: 0.64, smoothness: 0.70, 
    densityLabel: 'Heavy' 
  },
  { 
    id: 'coral', name: 'Coral', hex: '#f87171', hue: 0, isWhite: false, 
    material: 'Calcium Carbonate', density: 1.60, massFactor: 1.60, gravityScale: 1.40, buoyancy: -0.09, 
    elasticity: 0.65, friction: 0.023, wobbleFreq: 0.11, shininess: 0.72, reflectivity: 0.68, smoothness: 0.74, 
    densityLabel: 'Heavy' 
  },
  { 
    id: 'garnet', name: 'Garnet', hex: '#b91c1c', hue: 0, isWhite: false, 
    material: 'Silicate Mineral', density: 1.65, massFactor: 1.65, gravityScale: 1.42, buoyancy: -0.09, 
    elasticity: 0.72, friction: 0.021, wobbleFreq: 0.11, shininess: 0.88, reflectivity: 0.84, smoothness: 0.85, 
    densityLabel: 'Heavy' 
  },
  { 
    id: 'spinel', name: 'Spinel', hex: '#dc2626', hue: 0, isWhite: false, 
    material: 'Magnesium Aluminate', density: 1.70, massFactor: 1.70, gravityScale: 1.44, buoyancy: -0.10, 
    elasticity: 0.82, friction: 0.019, wobbleFreq: 0.11, shininess: 0.92, reflectivity: 0.88, smoothness: 0.90, 
    densityLabel: 'Heavy' 
  },
  { 
    id: 'red', alias: 'ruby', name: 'Ruby', hex: '#f43f5e', hue: 350, isWhite: false, 
    material: 'Corundum', density: 1.75, massFactor: 1.75, gravityScale: 1.45, buoyancy: -0.10, 
    elasticity: 0.62, friction: 0.022, wobbleFreq: 0.11, shininess: 0.90, reflectivity: 0.92, smoothness: 0.86, 
    densityLabel: 'Heavy' 
  },
  { 
    id: 'ametrine', name: 'Ametrine', hex: '#c084fc', hue: 270, isWhite: false, 
    material: 'Quartz Solid Solution', density: 1.78, massFactor: 1.78, gravityScale: 1.47, buoyancy: -0.11, 
    elasticity: 0.75, friction: 0.020, wobbleFreq: 0.10, shininess: 0.86, reflectivity: 0.82, smoothness: 0.84, 
    densityLabel: 'Heavy' 
  },

  // 41-50: Heavy, Ultra-Dense & Metallic Minerals (density 1.88 - 2.80)
  { 
    id: 'charoite', name: 'Charoite', hex: '#7e22ce', hue: 273, isWhite: false, 
    material: 'Silicate Hydroxide', density: 1.88, massFactor: 1.88, gravityScale: 1.52, buoyancy: -0.12, 
    elasticity: 0.66, friction: 0.022, wobbleFreq: 0.10, shininess: 0.80, reflectivity: 0.76, smoothness: 0.78, 
    densityLabel: 'Heavy' 
  },
  { 
    id: 'sodalite', name: 'Sodalite', hex: '#1e40af', hue: 224, isWhite: false, 
    material: 'Chloric Silicate', density: 1.95, massFactor: 1.95, gravityScale: 1.56, buoyancy: -0.13, 
    elasticity: 0.68, friction: 0.023, wobbleFreq: 0.09, shininess: 0.78, reflectivity: 0.74, smoothness: 0.76, 
    densityLabel: 'Heavy' 
  },
  { 
    id: 'jasper', name: 'Jasper', hex: '#991b1b', hue: 0, isWhite: false, 
    material: 'Chalcedony Aggregate', density: 2.05, massFactor: 2.05, gravityScale: 1.62, buoyancy: -0.14, 
    elasticity: 0.60, friction: 0.025, wobbleFreq: 0.09, shininess: 0.70, reflectivity: 0.66, smoothness: 0.70, 
    densityLabel: 'Ultra-Heavy' 
  },
  { 
    id: 'serpentine', name: 'Serpentine', hex: '#14532d', hue: 142, isWhite: false, 
    material: 'Magnesium Hydrosilicate', density: 2.15, massFactor: 2.15, gravityScale: 1.68, buoyancy: -0.15, 
    elasticity: 0.58, friction: 0.026, wobbleFreq: 0.08, shininess: 0.66, reflectivity: 0.62, smoothness: 0.68, 
    densityLabel: 'Ultra-Heavy' 
  },
  { 
    id: 'purple', alias: 'amethyst', name: 'Amethyst', hex: '#a855f7', hue: 275, isWhite: false, 
    material: 'Quartz Crystal', density: 2.30, massFactor: 2.30, gravityScale: 1.75, buoyancy: -0.16, 
    elasticity: 0.55, friction: 0.026, wobbleFreq: 0.08, shininess: 0.85, reflectivity: 0.80, smoothness: 0.82, 
    densityLabel: 'Super-Heavy' 
  },
  { 
    id: 'cordierite', name: 'Cordierite', hex: '#3730a3', hue: 244, isWhite: false, 
    material: 'Cyclosilicate', density: 2.38, massFactor: 2.38, gravityScale: 1.78, buoyancy: -0.17, 
    elasticity: 0.56, friction: 0.026, wobbleFreq: 0.08, shininess: 0.82, reflectivity: 0.78, smoothness: 0.80, 
    densityLabel: 'Super-Heavy' 
  },
  { 
    id: 'obsidian', name: 'Obsidian', hex: '#334155', hue: 217, isWhite: false, 
    material: 'Volcanic Glass', density: 2.45, massFactor: 2.45, gravityScale: 1.80, buoyancy: -0.18, 
    elasticity: 0.52, friction: 0.027, wobbleFreq: 0.07, shininess: 0.95, reflectivity: 0.90, smoothness: 0.94, 
    densityLabel: 'Super-Heavy' 
  },
  { 
    id: 'onyx', name: 'Onyx', hex: '#1e293b', hue: 222, isWhite: false, 
    material: 'Banded Chalcedony', density: 2.55, massFactor: 2.55, gravityScale: 1.82, buoyancy: -0.19, 
    elasticity: 0.50, friction: 0.028, wobbleFreq: 0.07, shininess: 0.92, reflectivity: 0.88, smoothness: 0.90, 
    densityLabel: 'Super-Heavy' 
  },
  { 
    id: 'pyrite', name: 'Pyrite', hex: '#ca8a04', hue: 42, isWhite: false, 
    material: 'Iron Disulfide', density: 2.68, massFactor: 2.68, gravityScale: 1.84, buoyancy: -0.20, 
    elasticity: 0.62, friction: 0.028, wobbleFreq: 0.07, shininess: 0.96, reflectivity: 0.94, smoothness: 0.92, 
    densityLabel: 'Metallic Heavy' 
  },
  { 
    id: 'hematite', name: 'Hematite', hex: '#475569', hue: 215, isWhite: false, 
    material: 'Iron Oxide', density: 2.80, massFactor: 2.80, gravityScale: 1.85, buoyancy: -0.22, 
    elasticity: 0.48, friction: 0.030, wobbleFreq: 0.06, shininess: 0.98, reflectivity: 0.96, smoothness: 0.96, 
    densityLabel: 'Metallic Ultra-Heavy' 
  }
];

/**
 * Finds a color entry by primary ID or legacy alias
 */
export function getColorById(id) {
  if (!id) return null;
  return BUBBLE_COLORS.find(c => c.id === id || c.alias === id) || null;
}

/**
 * Returns display name for a color ID
 */
export function getColorDisplayName(id) {
  const c = getColorById(id);
  return c ? c.name : id;
}

export const GEMSTONE_FAMILIES = [
  { id: 'white', name: 'White / Pearl', members: ['white', 'diamond', 'moonstone', 'opal'] },
  { id: 'red', name: 'Crimson / Red', members: ['red', 'garnet', 'spinel', 'jasper'] },
  { id: 'orange', name: 'Amber / Orange', members: ['orange', 'topaz', 'sunstone', 'carnelian', 'pyrite'] },
  { id: 'yellow', name: 'Gold / Citrine', members: ['citrine', 'heliodor'] },
  { id: 'lime', name: 'Lime / Peridot', members: ['peridot', 'beryl'] },
  { id: 'green', name: 'Emerald / Jade', members: ['green', 'jade', 'malachite', 'tsavorite', 'aventurine', 'chrysoprase', 'fluorite', 'serpentine'] },
  { id: 'cyan', name: 'Cyan / Turquoise', members: ['aquamarine', 'turquoise', 'larimar', 'alexandrite', 'apatite', 'zircon'] },
  { id: 'blue', name: 'Cobalt / Sapphire', members: ['cyan', 'lapis', 'tanzanite', 'sodalite', 'iolite', 'cordierite', 'chalcedony'] },
  { id: 'purple', name: 'Amethyst / Violet', members: ['purple', 'charoite', 'ametrine'] },
  { id: 'pink', name: 'Rose / Pink', members: ['rose_quartz', 'tourmaline', 'kunzite', 'morganite', 'rhodolite'] }
];

export const FAMILY_CONFLICTS = {
  'red': ['pink'],
  'pink': ['red'],
  'orange': ['yellow'],
  'yellow': ['orange'],
  'cyan': ['blue'],
  'blue': ['cyan'],
  'lime': ['green'],
  'green': ['lime']
};

/**
 * Computes perceptual color distance between two gemstones
 */
function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
}

export function getGemstoneDifference(c1, c2) {
  if (!c1 || !c2) return 0;
  if (c1.id === c2.id) return 0;

  // Whites are visually distinct from all rich saturated colors
  if (c1.isWhite && c2.isWhite) return 0;
  if (c1.isWhite || c2.isWhite) {
    const other = c1.isWhite ? c2 : c1;
    const [r, g, b] = hexToRgb(other.hex);
    return Math.sqrt(2 * (255 - r) ** 2 + 4 * (255 - g) ** 2 + 3 * (255 - b) ** 2);
  }

  // Circular hue distance (0 - 180 degrees)
  let hueDist = Math.abs(c1.hue - c2.hue);
  if (hueDist > 180) hueDist = 360 - hueDist;

  // Weighted perceptual RGB distance
  const [r1, g1, b1] = hexToRgb(c1.hex);
  const [r2, g2, b2] = hexToRgb(c2.hex);
  const rgbDist = Math.sqrt(2 * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + 3 * (b1 - b2) ** 2);

  return { hueDist, rgbDist, totalScore: rgbDist + hueDist * 1.0 };
}

/**
 * Selects a set of distinct, contrasting gemstones for a level run.
 * Guarantees:
 * 1. Every gemstone belongs to a different color family.
 * 2. No confusable adjacent families (e.g. Red and Pink, Yellow and Orange) are mixed.
 * 3. Max 1 white/pearlescent gemstone per level.
 * 4. Pairwise hue distance >= 40 deg (>= 44 deg for 4-5 colors) between chromatic gems.
 * 5. Diverse physical attributes (densities, buoyancies, and elasticities).
 */
export function selectDiverseLevelColors(count = 4, excludeIds = []) {
  const targetCount = Math.max(3, Math.min(6, Math.floor(count)));

  for (let trial = 0; trial < 250; trial++) {
    const shuffledFamilies = [...GEMSTONE_FAMILIES].sort(() => Math.random() - 0.5);
    const chosenFamilies = [];

    for (const fam of shuffledFamilies) {
      const hasConflict = chosenFamilies.some(f => FAMILY_CONFLICTS[f.id] && FAMILY_CONFLICTS[f.id].includes(fam.id));
      if (hasConflict && (shuffledFamilies.length - chosenFamilies.length) > (targetCount - chosenFamilies.length)) {
        continue;
      }
      chosenFamilies.push(fam);
      if (chosenFamilies.length === targetCount) break;
    }

    if (chosenFamilies.length < targetCount) continue;

    const gems = chosenFamilies.map(f => {
      const availableMembers = f.members.filter(id => !excludeIds.includes(id));
      const pool = availableMembers.length > 0 ? availableMembers : f.members;
      const chosenId = pool[Math.floor(Math.random() * pool.length)];
      return getColorById(chosenId);
    }).filter(Boolean);

    if (gems.length !== targetCount) continue;

    // Check pairwise distinctness
    let valid = true;
    const minHueDist = targetCount >= 6 ? 36 : 44;

    for (let i = 0; i < gems.length; i++) {
      for (let j = i + 1; j < gems.length; j++) {
        const g1 = gems[i];
        const g2 = gems[j];

        if (g1.isWhite && g2.isWhite) {
          valid = false;
          break;
        }

        if (!g1.isWhite && !g2.isWhite) {
          let hd = Math.abs(g1.hue - g2.hue);
          if (hd > 180) hd = 360 - hd;
          if (hd < minHueDist) {
            valid = false;
            break;
          }
        }
      }
      if (!valid) break;
    }

    if (valid) {
      return gems;
    }
  }

  // Fallback safe preset if needed
  const fallbackIds = ['white', 'red', 'green', 'orange', 'cyan', 'purple'].slice(0, targetCount);
  return fallbackIds.map(getColorById);
}

/**
 * Samples a random set of distinct color IDs from the 50-color palette
 */
export function samplePaletteColors(count = 4, exclude = []) {
  return selectDiverseLevelColors(count, exclude).map(c => c.id);
}
