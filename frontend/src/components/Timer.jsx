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
    <div className={`p-4 rounded-lg text-center ${
      isExpired ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
    }`}>
      <div className="text-sm font-semibold mb-1">남은 시간</div>
      <div className="text-3xl font-bold font-mono">
        {formatTime(timeRemaining)}
      </div>
      {isExpired && (
        <div className="text-sm mt-2 font-semibold">시간 초과!</div>
      )}
    </div>
  );
};

export default Timer;
