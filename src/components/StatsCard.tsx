import { Trophy, Zap, Clock, Target } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { MODE_CONFIG } from '@/types/game';
import { calculateStats } from '@/utils/stats';

export default function StatsCard() {
  const { history, clearHistory } = useGameStore();
  const hasHistory = history.totalTests > 0;
  const stats = hasHistory ? calculateStats(history.allResults.slice(-20).map(r => r.time)) : null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-2xl font-bold text-white flex items-center gap-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <Trophy className="w-8 h-8 text-yellow-400" />
            历史记录
          </h2>
          {hasHistory && (
            <button
              onClick={clearHistory}
              className="text-sm text-white/50 hover:text-red-400 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10"
            >
              清除记录
            </button>
          )}
        </div>

        {!hasHistory ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-white/50 text-lg">还没有测试记录</p>
            <p className="text-white/30 text-sm mt-2">完成测试后这里会显示你的成绩统计</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem
                icon={<Zap className="w-5 h-5" />}
                label="最佳成绩"
                value={history.bestTime === Infinity ? '--' : `${history.bestTime} ms`}
                subtext={history.bestTime === Infinity ? '' : MODE_CONFIG[history.bestMode].name}
                color="text-green-400"
              />
              <StatItem
                icon={<Target className="w-5 h-5" />}
                label="总测试次数"
                value={history.totalTests.toString()}
                color="text-cyan-400"
              />
              <StatItem
                icon={<Clock className="w-5 h-5" />}
                label="平均反应"
                value={stats ? `${stats.average} ms` : '--'}
                color="text-purple-400"
              />
              <StatItem
                icon={<Trophy className="w-5 h-5" />}
                label="最近最快"
                value={stats ? `${stats.fastest} ms` : '--'}
                color="text-yellow-400"
              />
            </div>

            {history.allResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-white/70 text-sm mb-3">最近 10 次成绩</h3>
                <div className="flex flex-wrap gap-2">
                  {history.allResults.slice(-10).map((result, index) => (
                    <div
                      key={index}
                      className={`px-3 py-2 rounded-lg text-sm font-mono ${
                        result.time === history.bestTime
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/5 text-white/70 border border-white/10'
                      }`}
                    >
                      {result.time}ms
                      <span className="text-xs text-white/40 ml-1">
                        {MODE_CONFIG[result.mode].icon}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats && history.allResults.length >= 5 && (
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white/70 text-sm mb-3">成绩分布</h3>
                <MiniChart data={history.allResults.slice(-20).map(r => r.time)} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  subtext,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-white/50 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
        {value}
      </p>
      {subtext && <p className="text-white/30 text-xs mt-1">{subtext}</p>}
    </div>
  );
}

function MiniChart({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100;
        const normalizedHeight = Math.max(10, height);
        const isMin = value === min;
        const isMax = value === max;

        return (
          <div
            key={index}
            className="flex-1 rounded-t transition-all duration-300 hover:opacity-80"
            style={{
              height: `${normalizedHeight}%`,
              background: isMin
                ? 'linear-gradient(to top, #00ff88, #00ffcc)'
                : isMax
                ? 'linear-gradient(to top, #ff2d55, #ff6b6b)'
                : 'linear-gradient(to top, #00d4ff, #a855f7)'
            }}
            title={`${value}ms`}
          />
        );
      })}
    </div>
  );
}
