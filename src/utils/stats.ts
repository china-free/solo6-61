import type { Stats } from '@/types/game';

export function calculateStats(results: number[]): Stats | null {
  if (results.length === 0) return null;

  const sorted = [...results].sort((a, b) => a - b);
  const fastest = sorted[0];
  const slowest = sorted[sorted.length - 1];
  const average = Math.round(results.reduce((a, b) => a + b, 0) / results.length);

  return {
    average,
    fastest,
    slowest,
    percentile: 0
  };
}

export function formatTime(ms: number): string {
  return `${ms} ms`;
}

export function getTimeCategory(ms: number): { label: string; color: string; emoji: string } {
  if (ms < 150) {
    return { label: '超神级', color: '#ff00ff', emoji: '🚀' };
  } else if (ms < 200) {
    return { label: '极速', color: '#00ff88', emoji: '⚡' };
  } else if (ms < 250) {
    return { label: '优秀', color: '#00d4ff', emoji: '🎯' };
  } else if (ms < 300) {
    return { label: '良好', color: '#ffd700', emoji: '👍' };
  } else if (ms < 400) {
    return { label: '一般', color: '#ff9500', emoji: '😊' };
  } else {
    return { label: '需提升', color: '#ff2d55', emoji: '💪' };
  }
}
