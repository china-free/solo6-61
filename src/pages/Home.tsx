import ModeSelector from '@/components/ModeSelector';
import GameArea from '@/components/GameArea';
import StatsCard from '@/components/StatsCard';
import FeedbackPanel from '@/components/FeedbackPanel';
import { useGameStore } from '@/store/useGameStore';

export default function Home() {
  const { phase } = useGameStore();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center mb-4">
          <h1
            className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-2"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            ⚡ 反应速度测试 ⚡
          </h1>
          <p className="text-white/50">测试并提升你的神经反应速度</p>
        </header>

        <ModeSelector />

        <GameArea />

        {phase === 'result' && <FeedbackPanel />}

        <StatsCard />

        <footer className="text-center text-white/30 text-sm py-8">
          <p>💡 提示：你可以用鼠标点击或按空格键来响应</p>
          <p className="mt-2">反应速度可以通过持续训练获得提升</p>
        </footer>
      </div>
    </div>
  );
}
