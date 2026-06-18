import { useGameStore } from '@/store/useGameStore';
import { MODE_CONFIG, type GameMode } from '@/types/game';

const modes: GameMode[] = ['simple', 'continuous', 'distraction'];

export default function ModeSelector() {
  const { gameMode, setGameMode, gameState } = useGameStore();
  const isDisabled = gameState === 'waiting' || gameState === 'ready';

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-white/90 mb-4 text-center" style={{ fontFamily: "'Orbitron', sans-serif" }}>
        选择游戏模式
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const config = MODE_CONFIG[mode];
          const isSelected = gameMode === mode;

          return (
            <button
              key={mode}
              onClick={() => setGameMode(mode)}
              disabled={isDisabled}
              className={`
                relative p-6 rounded-2xl transition-all duration-300
                flex flex-col items-center gap-3
                ${isSelected
                  ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              `}
              style={{
                boxShadow: isSelected
                  ? '0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)'
                  : 'none'
              }}
            >
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-pulse" />
              )}
              <span className="text-4xl">{config.icon}</span>
              <h3
                className="text-lg font-bold text-white"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {config.name}
              </h3>
              <p className="text-sm text-white/60 text-center">{config.description}</p>
              <span className="text-xs text-cyan-400 font-mono">
                {config.rounds} 轮测试
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
