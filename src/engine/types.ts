export type GameMode = 'simple' | 'continuous' | 'distraction';

export type GamePhase = 'idle' | 'waiting' | 'ready' | 'result' | 'tooEarly';

export interface RoundResult {
  time: number;
  timestamp: number;
  mode: GameMode;
  roundIndex: number;
}

export interface SessionResult {
  mode: GameMode;
  rounds: RoundResult[];
  stats: SessionStats;
  feedback: FeedbackData;
}

export interface SessionStats {
  average: number;
  fastest: number;
  slowest: number;
  percentile: number;
  timeCategory: TimeCategory;
}

export interface TimeCategory {
  label: string;
  color: string;
  emoji: string;
}

export interface FeedbackData {
  title: string;
  message: string;
  tips: string[];
  percentile: number;
  percentileMarkers: PercentileMarker[];
}

export interface PercentileMarker {
  label: string;
  value: number;
  beaten: boolean;
}

export interface HistoryData {
  bestTime: number;
  bestMode: GameMode;
  totalTests: number;
  allResults: RoundResult[];
  recentStats: RecentStats | null;
}

export interface RecentStats {
  average: number;
  fastest: number;
  slowest: number;
  count: number;
}

export interface ModeDescriptor {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  totalRounds: number;
  roundDelayMs: number;
  scheduler: 'standard' | 'distraction';
}

export interface EngineSnapshot {
  phase: GamePhase;
  mode: GameMode;
  currentRound: number;
  totalRounds: number;
  roundTimes: number[];
  lastResult: RoundResult | null;
  sessionResult: SessionResult | null;
  distractionPhase: number;
  isProcessing: boolean;
}

export type EngineListener = (snapshot: EngineSnapshot) => void;
