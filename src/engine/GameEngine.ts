import { TimerManager } from './TimerManager';
import { getMode } from './modes';
import {
  buildSessionResult,
  loadHistory,
  saveHistory,
  appendToHistory,
  clearHistoryStorage
} from './ResultProcessor';
import type {
  GameMode,
  GamePhase,
  RoundResult,
  SessionResult,
  HistoryData,
  EngineSnapshot,
  EngineListener
} from './types';

const INPUT_DEBOUNCE_MS = 50;

export class GameEngine {
  private timer: TimerManager;
  private listeners: Set<EngineListener> = new Set();
  private lastInputAt = 0;

  private phase: GamePhase = 'idle';
  private mode: GameMode = 'simple';
  private roundIndex = 0;
  private roundResults: RoundResult[] = [];
  private readyAt = 0;
  private distractionPhase = 0;
  private sessionResult: SessionResult | null = null;
  private history: HistoryData;

  constructor() {
    this.timer = new TimerManager();
    this.history = loadHistory();
  }

  subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const snap = this.snapshot();
    this.listeners.forEach(l => l(snap));
  }

  snapshot(): EngineSnapshot {
    return {
      phase: this.phase,
      mode: this.mode,
      currentRound: this.roundIndex + 1,
      totalRounds: getMode(this.mode).totalRounds,
      roundTimes: this.roundResults.map(r => r.time),
      lastResult: this.roundResults.length > 0 ? this.roundResults[this.roundResults.length - 1] : null,
      sessionResult: this.sessionResult,
      distractionPhase: this.distractionPhase,
      isProcessing: this.phase === 'waiting' || this.phase === 'ready'
    };
  }

  getHistory(): HistoryData {
    return this.history;
  }

  clearHistory(): void {
    clearHistoryStorage();
    this.history = loadHistory();
    this.emit();
  }

  setMode(mode: GameMode): void {
    if (this.phase === 'waiting' || this.phase === 'ready') return;
    if (this.mode === mode) return;
    this.mode = mode;
    this.emit();
  }

  startSession(): void {
    if (this.shouldBlockInput()) return;
    this.timer.clearAll();
    this.resetInternalState();
    this.phase = 'waiting';
    this.sessionResult = null;
    this.emit();
    this.scheduleNextRoundStart(0);
  }

  reset(): void {
    this.timer.clearAll();
    this.resetInternalState();
    this.phase = 'idle';
    this.sessionResult = null;
    this.emit();
  }

  handleUserInput(): void {
    const now = Date.now();
    if (now - this.lastInputAt < INPUT_DEBOUNCE_MS) return;
    this.lastInputAt = now;

    switch (this.phase) {
      case 'idle':
      case 'result':
      case 'tooEarly':
        this.startSession();
        break;
      case 'waiting':
        this.onTooEarly();
        break;
      case 'ready':
        this.onRoundResponse();
        break;
    }
  }

  private shouldBlockInput(): boolean {
    return this.phase === 'waiting' || this.phase === 'ready';
  }

  private resetInternalState(): void {
    this.roundIndex = 0;
    this.roundResults = [];
    this.readyAt = 0;
    this.distractionPhase = 0;
  }

  private onTooEarly(): void {
    this.timer.clearAll();
    this.phase = 'tooEarly';
    this.distractionPhase = 0;
    this.emit();
  }

  private onRoundResponse(): void {
    const reactionMs = Math.round(performance.now() - this.readyAt);
    this.timer.clearAll();

    const result: RoundResult = {
      time: reactionMs,
      timestamp: Date.now(),
      mode: this.mode,
      roundIndex: this.roundIndex
    };
    this.roundResults.push(result);
    this.history = appendToHistory(this.history, result);
    saveHistory(this.history);

    const modeCfg = getMode(this.mode);
    const isLastRound = this.roundIndex + 1 >= modeCfg.totalRounds;

    if (isLastRound) {
      this.finishSession();
    } else {
      this.advanceToNextRound(modeCfg.roundDelayMs);
    }
  }

  private advanceToNextRound(delayMs: number): void {
    this.roundIndex++;
    this.phase = 'waiting';
    this.emit();
    this.scheduleNextRoundStart(delayMs);
  }

  private finishSession(): void {
    this.sessionResult = buildSessionResult(this.mode, this.roundResults);
    this.phase = 'result';
    this.emit();
  }

  private scheduleNextRoundStart(initialDelay: number): void {
    const modeCfg = getMode(this.mode);

    const startScheduler = () => {
      if (this.phase !== 'waiting') return;
      if (modeCfg.scheduler === 'distraction') {
        this.runDistractionScheduler();
      } else {
        this.runStandardScheduler();
      }
    };

    if (initialDelay > 0) {
      this.timer.setTimeout(startScheduler, initialDelay);
    } else {
      startScheduler();
    }
  }

  private runStandardScheduler(): void {
    const delay = 1000 + Math.random() * 4000;
    this.timer.setTimeout(() => {
      if (this.phase !== 'waiting') return;
      this.setReady();
    }, delay);
  }

  private runDistractionScheduler(): void {
    const blinkCount = 3 + Math.floor(Math.random() * 3);
    let blinkNum = 0;
    let cancelled = false;

    const checkAlive = (): boolean => {
      if (cancelled || this.phase !== 'waiting') {
        cancelled = true;
        return false;
      }
      return true;
    };

    const step = () => {
      if (!checkAlive()) return;

      if (blinkNum >= blinkCount) {
        this.distractionPhase = 0;
        this.setReady();
        return;
      }

      blinkNum++;
      this.distractionPhase = blinkNum % 2 === 1 ? 1 : 2;
      this.emit();

      this.timer.setTimeout(() => {
        if (!checkAlive()) return;
        this.distractionPhase = 0;
        this.emit();
        this.timer.setTimeout(step, 150 + Math.random() * 200);
      }, 100 + Math.random() * 100);
    };

    this.timer.setTimeout(step, 500 + Math.random() * 1000);
  }

  private setReady(): void {
    this.phase = 'ready';
    this.readyAt = performance.now();
    this.emit();
  }

  destroy(): void {
    this.timer.destroy();
    this.listeners.clear();
  }
}

export const gameEngine = new GameEngine();
