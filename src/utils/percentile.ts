const MEAN = 250;
const STD_DEV = 80;

function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

function normalCDF(x: number, mean: number, stdDev: number): number {
  return 0.5 * (1 + erf((x - mean) / (stdDev * Math.sqrt(2))));
}

export function calculatePercentile(reactionTime: number): number {
  const cdf = normalCDF(reactionTime, MEAN, STD_DEV);
  return Math.round((1 - cdf) * 100);
}

export function getFeedback(percentile: number, time: number): {
  title: string;
  message: string;
  tips: string[];
} {
  if (percentile >= 95) {
    return {
      title: '🔥 难以置信！',
      message: `您的反应速度超过 ${percentile}% 的用户！您拥有超凡的神经反应能力！`,
      tips: [
        '您的反应速度已经超越绝大多数人',
        '可以尝试挑战干扰模式进一步提升',
        '保持规律作息，维持巅峰状态'
      ]
    };
  } else if (percentile >= 80) {
    return {
      title: '⭐ 非常出色！',
      message: `您的反应速度超过 ${percentile}% 的用户！属于顶尖水平！`,
      tips: [
        '您的反应速度非常优秀',
        '尝试连续模式稳定发挥',
        '适当休息，避免疲劳'
      ]
    };
  } else if (percentile >= 60) {
    return {
      title: '🎯 表现优秀！',
      message: `您的反应速度超过 ${percentile}% 的用户！继续加油！`,
      tips: [
        '反应速度高于平均水平',
        '多加练习可以更快',
        '保持专注，减少分心'
      ]
    };
  } else if (percentile >= 40) {
    return {
      title: '👍 表现良好！',
      message: `您的反应速度超过 ${percentile}% 的用户！还有提升空间！`,
      tips: [
        '反应速度处于中等偏上水平',
        '通过训练可以显著提升',
        '保持放松，不要紧张'
      ]
    };
  } else {
    return {
      title: '💪 继续努力！',
      message: `您的反应速度超过 ${percentile}% 的用户！多加练习会更好！`,
      tips: [
        '反应速度可以通过训练提升',
        '建议每天练习5-10分钟',
        '保持充足睡眠，反应会更快'
      ]
    };
  }
}
