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

interface GameStore {
  gameState: GameState;
  gameMode: GameMode;
  currentSession: GameSession | null;
  lastResult: number | null;
  lastPercentile: number | null;
  history: HistoryRecord;
  distractionPhase: number;
  startTime: number;

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
    const { gameMode } = get();
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
      distractionPhase: 0
    });

    if (gameMode === 'distraction') {
      runDistractionSequence();
    } else {
      scheduleGreen();
    }
  },

  handleUserResponse: () => {
    const { gameState, startTime, currentSession, gameMode } = get();

    if (gameState === 'waiting') {
      set({ gameState: 'tooEarly' });
      return;
    }

    if (gameState === 'ready') {
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
          }
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

        setTimeout(() => {
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
    set({
      gameState: 'idle',
      currentSession: null,
      lastResult: null,
      lastPercentile: null,
      distractionPhase: 0
    });
  }
}));

function scheduleGreen() {
  const delay = 1000 + Math.random() * 4000;

  setTimeout(() => {
    if (useGameStore.getState().gameState === 'waiting') {
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

  const blink = () => {
    if (useGameStore.getState().gameState !== 'waiting') return;

    if (currentBlink >= blinkCount) {
      useGameStore.setState({
        gameState: 'ready',
        startTime: performance.now(),
        distractionPhase: 0
      });
      return;
    }

    currentBlink++;
    useGameStore.setState({ distractionPhase: currentBlink % 2 === 1 ? 1 : 2 });

    setTimeout(() => {
      useGameStore.setState({ distractionPhase: 0 });
      setTimeout(blink, 150 + Math.random() * 200);
    }, 100 + Math.random() * 100);
  };

  setTimeout(blink, 500 + Math.random() * 1000);
}
