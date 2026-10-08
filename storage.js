/**
 * Aerodrop Game Progress & Storage Service
 * Persists current level, unlocked levels, star ratings, and high scores locally in localStorage.
 */

const STORAGE_KEY = 'bubbles_game_progress';
const LEGACY_STORAGE_KEY = 'aerodrop_game_progress';

export class GameStorage {
  /**
   * Loads player progression from localStorage
   * @returns {{ currentLevel: number, highestLevel: number, completedLevels: Record<string, { score: number, stars: number, completed: boolean }>, totalScore: number }}
   */
  static loadProgress() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      }

      if (!raw) {
        return this.getDefaultProgress();
      }

      const parsed = JSON.parse(raw);
      const currentLevel = Math.max(1, parseInt(parsed.currentLevel, 10) || 1);
      const highestLevel = Math.max(currentLevel, parseInt(parsed.highestLevel, 10) || 1);
      const completedLevels = (typeof parsed.completedLevels === 'object' && parsed.completedLevels !== null) 
        ? parsed.completedLevels 
        : {};
      const totalScore = Math.max(0, parseInt(parsed.totalScore, 10) || 0);

      return {
        currentLevel,
        highestLevel,
        completedLevels,
        totalScore
      };
    } catch (err) {
      console.warn('GameStorage: Failed to read from localStorage, using defaults.', err);
      return this.getDefaultProgress();
    }
  }

  /**
   * Saves active current level (e.g. when player starts a level or selects one)
   * @param {number} levelNum 
   */
  static saveCurrentLevel(levelNum) {
    try {
      const num = Math.max(1, Math.floor(levelNum));
      const prog = this.loadProgress();
      prog.currentLevel = num;
      if (num > prog.highestLevel) {
        prog.highestLevel = num;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
      return prog;
    } catch (err) {
      console.warn('GameStorage: Failed to save current level.', err);
    }
  }

  /**
   * Saves completion of a level and updates high scores, stars, and advances to next level
   * @param {{ level: number, totalScore: number, stars: number }} scoreData 
   */
  static saveLevelWin(scoreData) {
    try {
      const prog = this.loadProgress();
      const lvl = scoreData.level;
      const prevRecord = prog.completedLevels[lvl] || {};
      
      const bestScore = Math.max(prevRecord.score || 0, scoreData.totalScore || 0);
      const bestStars = Math.max(prevRecord.stars || 0, scoreData.stars || 0);

      prog.completedLevels[lvl] = {
        score: bestScore,
        stars: bestStars,
        completed: true,
        completedAt: Date.now()
      };

      // Advance currentLevel to next level
      const nextLvl = lvl + 1;
      prog.currentLevel = nextLvl;
      if (nextLvl > prog.highestLevel) {
        prog.highestLevel = nextLvl;
      }

      // Re-calculate aggregate total score
      let total = 0;
      for (const k in prog.completedLevels) {
        total += prog.completedLevels[k].score || 0;
      }
      prog.totalScore = total;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
      return prog;
    } catch (err) {
      console.warn('GameStorage: Failed to save level win.', err);
    }
  }

  /**
   * Checks if a specific level has been completed
   * @param {number} levelNum 
   */
  static isLevelCompleted(levelNum) {
    const prog = this.loadProgress();
    return !!(prog.completedLevels[levelNum] && prog.completedLevels[levelNum].completed);
  }

  /**
   * Gets stats for a specific level if completed
   * @param {number} levelNum 
   */
  static getLevelStats(levelNum) {
    const prog = this.loadProgress();
    return prog.completedLevels[levelNum] || null;
  }

  /**
   * Resets all saved progress back to Level 1
   */
  static resetProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      const defaults = this.getDefaultProgress();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    } catch (err) {
      console.warn('GameStorage: Failed to reset progress.', err);
      return this.getDefaultProgress();
    }
  }

  static getDefaultProgress() {
    return {
      currentLevel: 1,
      highestLevel: 1,
      completedLevels: {},
      totalScore: 0
    };
  }
}
