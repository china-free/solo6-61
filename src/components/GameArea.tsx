import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { getTimeCategory } from '@/utils/stats';
import { MODE_CONFIG } from '@/types/game';

export default function GameArea() {
  const {
    gameState,
    gameMode,
    lastResult,
    lastPercentile,
    currentSession,
    distractionPhase,
    isProcessing,
    startGame,
    handleUserResponse,
    resetGame
  } = useGameStore();

  const lastActionRef = useRef<number>(0);
  const DEBOUNCE_MS = 50;

  const handleAction = useCallback(() => {
    const now = Date.now();
    if (now - lastActionRef.current < DEBOUNCE_MS) {
      return;
    }
    lastActionRef.current = now;

    if (gameState === 'idle' || gameState === 'result' || gameState === 'tooEarly') {
      startGame();
    } else if ((gameState === 'waiting' || gameState === 'ready') && isProcessing) {
      handleUserResponse();
    }
  }, [gameState, isProcessing, startGame, handleUserResponse]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction]);

  const handleClick = useCallback(() => {
    handleAction();
  }, [handleAction]);

  const getAreaStyles = () => {
    switch (gameState) {
      case 'idle':
        return {
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)'
        };
      case 'waiting':
        if (distractionPhase === 1) {
          return { background: '#00ff88', transition: 'background 100ms ease' };
        } else if (distractionPhase === 2) {
          return { background: '#ff2d55', transition: 'background 100ms ease' };
        }
        return {
          background: 'linear-gradient(135deg, #ff2d55 0%, #ff6b6b 100%)',
          boxShadow: 'inset 0 0 100px rgba(255, 45, 85, 0.5)'
        };
      case 'ready':
        return {
          background: 'linear-gradient(135deg, #00ff88 0%, #00ffcc 100%)',
          boxShadow: 'inset 0 0 100px rgba(0, 255, 136, 0.5)'
        };
      case 'result':
      case 'tooEarly':
        return {
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)'
        };
      default:
        return {};
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameState === 'idle') {
      startGame();
    } else {
      resetGame();
    }
  };

  const renderContent = () => {
    switch (gameState) {
      case 'idle':
        return (
          <div className="text-center animate-fadeIn">
            <div className="text-8xl mb-8">🎯</div>
            <h1
              className="text-5xl md:text-7xl font-bold text-white mb-6"
              style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 40px rgba(0, 212, 255, 0.5)' }}
            >
              反应速度测试
            </h1>
            <p className="text-xl text-white/70 mb-8 max-w-lg mx-auto">
              当前模式：<span className="text-cyan-400 font-bold">{MODE_CONFIG[gameMode].name}</span>
            </p>
            <button
              className="px-12 py-5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-2xl font-bold rounded-2xl hover:scale-105 transition-all duration-300"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                boxShadow: '0 0 40px rgba(0, 212, 255, 0.4)'
              }}
              onClick={handleButtonClick}
            >
              点击开始
            </button>
            <p className="mt-6 text-white/50 text-sm">或按空格键开始</p>
          </div>
        );

      case 'waiting':
        return (
          <div className="text-center">
            <div
              className={`text-6xl md:text-8xl font-bold text-white mb-6 ${distractionPhase === 0 ? 'animate-pulse' : ''}`}
              style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 30px rgba(255, 255, 255, 0.5)' }}
            >
              等待...
            </div>
            <p className="text-2xl text-white/90">变绿后立即点击！</p>
            {currentSession && currentSession.totalRounds > 1 && (
              <p className="mt-4 text-white/70 text-lg">
                第 {currentSession.currentRound} / {currentSession.totalRounds} 轮
              </p>
            )}
          </div>
        );

      case 'ready':
        return (
          <div className="text-center">
            <div
              className="text-6xl md:text-8xl font-bold text-white mb-6 animate-bounce"
              style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 30px rgba(255, 255, 255, 0.5)' }}
            >
              点击！
            </div>
            <p className="text-2xl text-white/90">现在！快！</p>
          </div>
        );

      case 'tooEarly':
        return (
          <div className="text-center animate-fadeIn">
            <div className="text-7xl mb-6">😅</div>
            <h2
              className="text-4xl md:text-5xl font-bold text-red-400 mb-4"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              太早了！
            </h2>
            <p className="text-xl text-white/70 mb-8">请等屏幕变绿后再点击</p>
            <button
              className="px-8 py-4 bg-red-500/20 border-2 border-red-400 text-red-300 text-xl font-bold rounded-xl hover:bg-red-500/30 transition-all"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
              onClick={handleButtonClick}
            >
              重新开始
            </button>
            <p className="mt-4 text-white/50 text-sm">或按空格键重试</p>
          </div>
        );

      case 'result': {
        const category = lastResult ? getTimeCategory(lastResult) : null;
        const showStats = currentSession && currentSession.results.length > 1;

        return (
          <div className="text-center animate-fadeIn">
            {category && (
              <div className="text-6xl mb-4">{category.emoji}</div>
            )}
            <h2
              className="text-3xl md:text-4xl font-bold text-white/80 mb-4"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              反应时间
            </h2>
            <div
              className="text-7xl md:text-9xl font-bold mb-2"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: category?.color || '#00ff88',
                textShadow: `0 0 50px ${category?.color || '#00ff88'}40`
              }}
            >
              {lastResult}
            </div>
            <p className="text-3xl text-white/60 mb-4">毫秒</p>
            {category && (
              <span
                className="inline-block px-6 py-2 rounded-full text-lg font-bold mb-6"
                style={{ backgroundColor: `${category.color}20`, color: category.color, border: `2px solid ${category.color}40` }}
              >
                {category.label}
              </span>
            )}

            {showStats && currentSession && (
              <div className="mt-6 p-6 bg-white/5 rounded-2xl border border-white/10 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  本次统计
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-white/50 text-sm">平均</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {Math.round(currentSession.results.reduce((a, b) => a + b, 0) / currentSession.results.length)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">最快</p>
                    <p className="text-2xl font-bold text-green-400">
                      {Math.min(...currentSession.results)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">最慢</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {Math.max(...currentSession.results)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 justify-center flex-wrap">
                  {currentSession.results.map((time, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/10 rounded-lg text-sm font-mono text-white/80"
                    >
                      {time}ms
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lastPercentile !== null && (
              <div className="mt-6 text-lg text-white/70">
                超过 <span className="text-cyan-400 font-bold">{lastPercentile}%</span> 的用户
              </div>
            )}

            <button
              className="mt-8 px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xl font-bold rounded-xl hover:scale-105 transition-all duration-300"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                boxShadow: '0 0 30px rgba(0, 212, 255, 0.4)'
              }}
              onClick={handleButtonClick}
            >
              再来一次
            </button>
            <p className="mt-4 text-white/50 text-sm">或按空格键重新开始</p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className="w-full min-h-[500px] md:min-h-[600px] flex items-center justify-center rounded-3xl cursor-pointer select-none transition-all duration-200 overflow-hidden relative"
      style={{
        ...getAreaStyles(),
        border: '3px solid rgba(255, 255, 255, 0.1)'
      }}
      onClick={handleClick}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'256\' height=\'256\' fill=\'none\'/%3E%3Cpath d=\'M0 0h256v256H0z\' fill=\'url(%23grain)\'/%3E%3Cdefs%3E%3Cfilter id=\'noise\' x=\'0\' y=\'0\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Cpattern id=\'grain\' width=\'100%25\' height=\'100%25\' patternUnits=\'userSpaceOnUse\'%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/pattern%3E%3C/defs%3E%3C/svg%3E")'
        }}
      />
      <div className="relative z-10 p-8">
        {renderContent()}
      </div>
    </div>
  );
}
