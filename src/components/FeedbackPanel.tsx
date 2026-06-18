import { Lightbulb, TrendingUp, Award } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { getFeedback } from '@/utils/percentile';

export default function FeedbackPanel() {
  const { lastResult, lastPercentile, gameState } = useGameStore();

  if (gameState !== 'result' || lastResult === null || lastPercentile === null) {
    return null;
  }

  const feedback = getFeedback(lastPercentile, lastResult);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-gradient-to-br from-cyan-900/30 to-purple-900/30 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-8 h-8 text-yellow-400" />
          <h2
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            训练反馈
          </h2>
        </div>

        <div className="space-y-6">
          <div className="text-center md:text-left">
            <h3
              className="text-3xl font-bold mb-3"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {feedback.title}
            </h3>
            <p className="text-white/80 text-lg">{feedback.message}</p>
          </div>

          <div className="relative h-8 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${lastPercentile}%`,
                background: lastPercentile >= 80
                  ? 'linear-gradient(to right, #00ff88, #00ffcc)'
                  : lastPercentile >= 50
                  ? 'linear-gradient(to right, #00d4ff, #a855f7)'
                  : 'linear-gradient(to right, #ffd700, #ff9500)'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                超过 {lastPercentile}% 的用户
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <PercentileMarker label="5%" value={380} current={lastResult} />
            <PercentileMarker label="25%" value={300} current={lastResult} />
            <PercentileMarker label="50%" value={250} current={lastResult} />
            <PercentileMarker label="75%" value={200} current={lastResult} />
            <PercentileMarker label="95%" value={120} current={lastResult} />
          </div>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h4 className="text-white font-bold">训练建议</h4>
            </div>
            <ul className="space-y-3">
              {feedback.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-white/70">
                  <TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20">
            <p className="text-white/60 text-sm text-center">
              💡 小提示：人的平均反应时间约为 <span className="text-cyan-400 font-bold">250ms</span>，
              专业电竞选手可以达到 <span className="text-green-400 font-bold">150ms</span> 以下！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PercentileMarker({ label, value, current }: { label: string; value: number; current: number }) {
  const isBetter = current <= value;

  return (
    <div
      className={`p-3 rounded-xl transition-all ${
        isBetter ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 border border-white/10'
      }`}
    >
      <p className={`text-xs ${isBetter ? 'text-green-400' : 'text-white/40'}`}>{label}</p>
      <p className={`text-lg font-bold ${isBetter ? 'text-green-400' : 'text-white/60'}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
        {value}ms
      </p>
      {isBetter && <span className="text-xs text-green-400">✓ 已超越</span>}
    </div>
  );
}
