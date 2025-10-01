import { useState, useEffect } from 'react';

const Timer = ({ startTime, timeLimit = 3 * 60 * 60 * 1000 }) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!startTime) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - new Date(startTime).getTime();
      const remaining = timeLimit - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsExpired(true);
        clearInterval(timer);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, timeLimit]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-5 rounded-xl text-center backdrop-blur-sm border-2 transition-all duration-300 ${
      isExpired
        ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-400/40 text-red-300'
        : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-400/30 text-blue-300'
    }`}>
      <div className="text-sm font-bold mb-2 text-white/80">남은 시간</div>
      <div className="text-4xl font-bold font-mono text-white drop-shadow-lg">
        {formatTime(timeRemaining)}
      </div>
      {isExpired && (
        <div className="text-sm mt-2 font-bold text-red-300 animate-pulse">⏰ 시간 초과!</div>
      )}
    </div>
  );
};

export default Timer;
