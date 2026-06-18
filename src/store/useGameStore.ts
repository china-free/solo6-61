import { create } from 'zustand';
import type { GameMode, GameState, GameSession, HistoryRecord, TestResult } from '@/types/game';
import { MODE_CONFIG } from '@/types/game';
import { calculatePercentile } from '@/utils/percentile';

const STORAGE_KEY = 'reactionGameHistory';

const defaultHistory: HistoryRecord = {
  bestTime: Infinity,
  bestMode: 'simple',
  totalTests: 0,
  allResults: []
};

const activeTimers: Set<number> = new Set();

function safeSetTimeout(callback: () => void, delay: number): number {
  const timerId = window.setTimeout(() => {
    activeTimers.delete(timerId);
    callback();
  }, delay);
  activeTimers.add(timerId);
  return timerId;
}

function clearAllTimers() {
  activeTimers.forEach((timerId) => {
    window.clearTimeout(timerId);
  });
  activeTimers.clear();
}

interface GameStore {
  gameState: GameState;
  gameMode: GameMode;
  currentSession: GameSession | null;
  lastResult: number | null;
  lastPercentile: number | null;
  history: HistoryRecord;
  distractionPhase: number;
  startTime: number;
  isProcessing: boolean;

  setGameMode: (mode: GameMode) => void;
  startGame: () => void;
  handleUserResponse: () => void;
  resetGame: () => void;
  loadHistory: () => void;
  saveHistory: (result: TestResult) => void;
  clearHistory: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'idle',
  gameMode: 'simple',
  currentSession: null,
  lastResult: null,
  lastPercentile: null,
  history: defaultHistory,
  distractionPhase: 0,
  startTime: 0,
  isProcessing: false,

  loadHistory: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ history: parsed });
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  },

  saveHistory: (result: TestResult) => {
    const { history } = get();
    const newAllResults = [...history.allResults, result].slice(-100);
    const newBestTime = Math.min(history.bestTime, result.time);
    const newBestMode = newBestTime === result.time ? result.mode : history.bestMode;

    const newHistory: HistoryRecord = {
      bestTime: newBestTime,
      bestMode: newBestMode,
      totalTests: history.totalTests + 1,
      allResults: newAllResults
    };

    set({ history: newHistory });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  },

  clearHistory: () => {
    set({ history: defaultHistory });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  },

  setGameMode: (mode: GameMode) => {
    if (get().gameState !== 'idle' && get().gameState !== 'result' && get().gameState !== 'tooEarly') {
      return;
    }
    set({ gameMode: mode });
  },

  startGame: () => {
    const { gameMode, isProcessing } = get();

    if (isProcessing) {
      return;
    }

    clearAllTimers();

    const config = MODE_CONFIG[gameMode];

    const session: GameSession = {
      mode: gameMode,
      results: [],
      currentRound: 1,
      totalRounds: config.rounds
    };

    set({
      gameState: 'waiting',
      currentSession: session,
      lastResult: null,
      lastPercentile: null,
      distractionPhase: 0,
      isProcessing: true
    });

    if (gameMode === 'distraction') {
      runDistractionSequence();
    } else {
      scheduleGreen();
    }
  },

  handleUserResponse: () => {
    const { gameState, startTime, currentSession, gameMode, isProcessing } = get();

    if (!isProcessing) {
      return;
    }

    if (gameState === 'waiting') {
      clearAllTimers();
      set({
        gameState: 'tooEarly',
        isProcessing: false,
        distractionPhase: 0
      });
      return;
    }

    if (gameState === 'ready') {
      clearAllTimers();
      const reactionTime = Math.round(performance.now() - startTime);
      const percentile = calculatePercentile(reactionTime);

      if (!currentSession) return;

      const newResults = [...currentSession.results, reactionTime];
      const isLastRound = newResults.length >= currentSession.totalRounds;

      const result: TestResult = {
        time: reactionTime,
        timestamp: Date.now(),
        mode: gameMode
      };

      get().saveHistory(result);

      if (isLastRound) {
        set({
          gameState: 'result',
          lastResult: reactionTime,
          lastPercentile: percentile,
          currentSession: {
            ...currentSession,
            results: newResults
          },
          isProcessing: false
        });
      } else {
        set({
          currentSession: {
            ...currentSession,
            results: newResults,
            currentRound: currentSession.currentRound + 1
          },
          lastResult: reactionTime,
          lastPercentile: percentile,
          gameState: 'waiting'
        });

        safeSetTimeout(() => {
          if (get().gameState !== 'waiting') {
            return;
          }
          if (get().gameMode === 'distraction') {
            runDistractionSequence();
          } else {
            scheduleGreen();
          }
        }, 1500);
      }
    }
  },

  resetGame: () => {
    clearAllTimers();
    set({
      gameState: 'idle',
      currentSession: null,
      lastResult: null,
      lastPercentile: null,
      distractionPhase: 0,
      isProcessing: false
    });
  }
}));

function scheduleGreen() {
  const delay = 1000 + Math.random() * 4000;

  safeSetTimeout(() => {
    const state = useGameStore.getState();
    if (state.gameState === 'waiting' && state.isProcessing) {
      useGameStore.setState({
        gameState: 'ready',
        startTime: performance.now()
      });
    }
  }, delay);
}

function runDistractionSequence() {
  const blinkCount = 3 + Math.floor(Math.random() * 3);
  let currentBlink = 0;
  let cancelled = false;

  const checkAndGetState = () => {
    const state = useGameStore.getState();
    if (state.gameState !== 'waiting' || !state.isProcessing) {
      cancelled = true;
      return null;
    }
    return state;
  };

  const blink = () => {
    if (cancelled) return;
    if (!checkAndGetState()) return;

    if (currentBlink >= blinkCount) {
      if (!checkAndGetState()) return;
      useGameStore.setState({
        gameState: 'ready',
        startTime: performance.now(),
        distractionPhase: 0
      });
      return;
    }

    currentBlink++;
    useGameStore.setState({ distractionPhase: currentBlink % 2 === 1 ? 1 : 2 });

    safeSetTimeout(() => {
      if (cancelled) return;
      if (!checkAndGetState()) return;

      useGameStore.setState({ distractionPhase: 0 });
      safeSetTimeout(() => {
        if (!cancelled) {
          blink();
        }
      }, 150 + Math.random() * 200);
    }, 100 + Math.random() * 100);
  };

  safeSetTimeout(blink, 500 + Math.random() * 1000);
}
