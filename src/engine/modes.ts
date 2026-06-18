import type { ModeDescriptor, GameMode } from './types';

export const MODES: Record<GameMode, ModeDescriptor> = {
  simple: {
    id: 'simple',
    name: '简单模式',
    description: '单次测试，快速测量反应速度',
    icon: '⚡',
    totalRounds: 1,
    roundDelayMs: 0,
    scheduler: 'standard'
  },
  continuous: {
    id: 'continuous',
    name: '连续模式',
    description: '5次测试，计算平均反应时间',
    icon: '🔄',
    totalRounds: 5,
    roundDelayMs: 1500,
    scheduler: 'standard'
  },
  distraction: {
    id: 'distraction',
    name: '干扰模式',
    description: '屏幕多次闪烁后才变绿，挑战更高',
    icon: '💫',
    totalRounds: 1,
    roundDelayMs: 0,
    scheduler: 'distraction'
  }
};

export const ALL_MODES: GameMode[] = ['simple', 'continuous', 'distraction'];

export function getMode(mode: GameMode): ModeDescriptor {
  return MODES[mode];
}
