import { create } from 'zustand';
import { useEffect } from 'react';
import {
  gameEngine,
  type EngineSnapshot,
  type HistoryData,
  type GameMode,
  type SessionResult,
  type RoundResult
} from '@/engine';

interface GameStoreState extends EngineSnapshot {
  history: HistoryData;
  setMode: (mode: GameMode) => void;
  start: () => void;
  reset: () => void;
  handleInput: () => void;
  clearHistory: () => void;
}

export const useGameStore = create<GameStoreState>((set) => {
  const unsubscribe = gameEngine.subscribe((snap) => {
    set({
      ...snap,
      history: gameEngine.getHistory()
    });
  });

  const initialSnap = gameEngine.snapshot();

  return {
    ...initialSnap,
    history: gameEngine.getHistory(),
    setMode: (mode) => {
      gameEngine.setMode(mode);
    },
    start: () => {
      gameEngine.startSession();
    },
    reset: () => {
      gameEngine.reset();
    },
    handleInput: () => {
      gameEngine.handleUserInput();
    },
    clearHistory: () => {
      gameEngine.clearHistory();
    }
  };
});

export function useSyncEngine(): void {
  useEffect(() => {
    return () => {
      /* engine is singleton, don't destroy here */
    };
  }, []);
}

export type { SessionResult, RoundResult };
