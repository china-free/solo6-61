import type {
  RoundResult,
  SessionResult,
  SessionStats,
  FeedbackData,
  TimeCategory,
  HistoryData,
  PercentileMarker,
  GameMode,
  RecentStats
} from './types';

const HISTORY_STORAGE_KEY = 'reactionGameHistory_v2';
const HISTORY_RESULT_LIMIT = 100;

const NORMAL_DIST_MEAN = 250;
const NORMAL_DIST_STD = 80;

const PERCENTILE_MARKERS: Omit<PercentileMarker, 'beaten'>[] = [
  { label: '5%', value: 380 },
  { label: '25%', value: 300 },
  { label: '50%', value: 250 },
  { label: '75%', value: 200 },
  { label: '95%', value: 120 }
];

function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function normalCDF(x: number, mean: number, stdDev: number): number {
  return 0.5 * (1 + erf((x - mean) / (stdDev * Math.sqrt(2))));
}

export function calculatePercentile(reactionTime: number): number {
  const cdf = normalCDF(reactionTime, NORMAL_DIST_MEAN, NORMAL_DIST_STD);
  return Math.max(0, Math.min(100, Math.round((1 - cdf) * 100)));
}

export function getTimeCategory(ms: number): TimeCategory {
  if (ms < 150) return { label: '超神级', color: '#ff00ff', emoji: '🚀' };
  if (ms < 200) return { label: '极速',   color: '#00ff88', emoji: '⚡' };
  if (ms < 250) return { label: '优秀',   color: '#00d4ff', emoji: '🎯' };
  if (ms < 300) return { label: '良好',   color: '#ffd700', emoji: '👍' };
  if (ms < 400) return { label: '一般',   color: '#ff9500', emoji: '😊' };
  return { label: '需提升', color: '#ff2d55', emoji: '💪' };
}

function getFeedbackText(percentile: number): { title: string; message: string; tips: string[] } {
  if (percentile >= 95) {
    return {
      title: '🔥 难以置信！',
      message: `您的反应速度超过 ${percentile}% 的用户！您拥有超凡的神经反应能力！`,
      tips: ['您的反应速度已经超越绝大多数人', '可以尝试挑战干扰模式进一步提升', '保持规律作息，维持巅峰状态']
    };
  }
  if (percentile >= 80) {
    return {
      title: '⭐ 非常出色！',
      message: `您的反应速度超过 ${percentile}% 的用户！属于顶尖水平！`,
      tips: ['您的反应速度非常优秀', '尝试连续模式稳定发挥', '适当休息，避免疲劳']
    };
  }
  if (percentile >= 60) {
    return {
      title: '🎯 表现优秀！',
      message: `您的反应速度超过 ${percentile}% 的用户！继续加油！`,
      tips: ['反应速度高于平均水平', '多加练习可以更快', '保持专注，减少分心']
    };
  }
  if (percentile >= 40) {
    return {
      title: '👍 表现良好！',
      message: `您的反应速度超过 ${percentile}% 的用户！还有提升空间！`,
      tips: ['反应速度处于中等偏上水平', '通过训练可以显著提升', '保持放松，不要紧张']
    };
  }
  return {
    title: '💪 继续努力！',
    message: `您的反应速度超过 ${percentile}% 的用户！多加练习会更好！`,
    tips: ['反应速度可以通过训练提升', '建议每天练习5-10分钟', '保持充足睡眠，反应会更快']
  };
}

export function computeSessionStats(rounds: RoundResult[]): SessionStats {
  const times = rounds.map(r => r.time);
  const sorted = [...times].sort((a, b) => a - b);
  const fastest = sorted[0];
  const slowest = sorted[sorted.length - 1];
  const average = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const percentile = calculatePercentile(average);
  return {
    average,
    fastest,
    slowest,
    percentile,
    timeCategory: getTimeCategory(average)
  };
}

export function computeFeedback(percentile: number, bestTime: number): FeedbackData {
  const text = getFeedbackText(percentile);
  const markers: PercentileMarker[] = PERCENTILE_MARKERS.map(m => ({
    ...m,
    beaten: bestTime <= m.value
  }));
  return {
    ...text,
    percentile,
    percentileMarkers: markers
  };
}

export function buildSessionResult(mode: GameMode, rounds: RoundResult[]): SessionResult {
  const stats = computeSessionStats(rounds);
  const feedback = computeFeedback(stats.percentile, stats.fastest);
  return { mode, rounds, stats, feedback };
}

export function loadHistory(): HistoryData {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return emptyHistory();
    const parsed = JSON.parse(raw) as HistoryData;
    return validateHistory(parsed);
  } catch {
    return emptyHistory();
  }
}

export function saveHistory(history: HistoryData): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* ignore */
  }
}

export function clearHistoryStorage(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function appendToHistory(history: HistoryData, result: RoundResult): HistoryData {
  const allResults = [...history.allResults, result].slice(-HISTORY_RESULT_LIMIT);
  const bestTime = Math.min(history.bestTime === Infinity ? result.time : history.bestTime, result.time);
  const bestMode = bestTime === result.time ? result.mode : history.bestMode;
  return {
    bestTime,
    bestMode,
    totalTests: history.totalTests + 1,
    allResults,
    recentStats: computeRecentStats(allResults)
  };
}

function computeRecentStats(results: RoundResult[]): RecentStats | null {
  if (results.length < 2) return null;
  const recent = results.slice(-20);
  const times = recent.map(r => r.time);
  const sorted = [...times].sort((a, b) => a - b);
  return {
    average: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    fastest: sorted[0],
    slowest: sorted[sorted.length - 1],
    count: times.length
  };
}

function emptyHistory(): HistoryData {
  return {
    bestTime: Infinity,
    bestMode: 'simple',
    totalTests: 0,
    allResults: [],
    recentStats: null
  };
}

function validateHistory(h: any): HistoryData {
  if (typeof h !== 'object' || h === null) return emptyHistory();
  return {
    bestTime: typeof h.bestTime === 'number' ? h.bestTime : Infinity,
    bestMode: h.bestMode || 'simple',
    totalTests: typeof h.totalTests === 'number' ? h.totalTests : 0,
    allResults: Array.isArray(h.allResults) ? h.allResults : [],
    recentStats: h.recentStats || null
  };
}
