export type GameMode = 'simple' | 'continuous' | 'distraction';

export type GameState = 'idle' | 'waiting' | 'ready' | 'result' | 'tooEarly';

export interface TestResult {
  time: number;
  timestamp: number;
  mode: GameMode;
}

export interface GameSession {
  mode: GameMode;
  results: number[];
  currentRound: number;
  totalRounds: number;
}

export interface Stats {
  average: number;
  fastest: number;
  slowest: number;
  percentile: number;
}

export interface HistoryRecord {
  bestTime: number;
  bestMode: GameMode;
  totalTests: number;
  allResults: TestResult[];
}

export const MODE_CONFIG: Record<GameMode, { name: string; description: string; rounds: number; icon: string }> = {
  simple: {
    name: '简单模式',
    description: '单次测试，快速测量反应速度',
    rounds: 1,
    icon: '⚡'
  },
  continuous: {
    name: '连续模式',
    description: '5次测试，计算平均反应时间',
    rounds: 5,
    icon: '🔄'
  },
  distraction: {
    name: '干扰模式',
    description: '屏幕多次闪烁后才变绿，挑战更高',
    rounds: 1,
    icon: '💫'
  }
};
