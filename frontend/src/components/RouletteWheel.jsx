import { useState } from 'react';

const RouletteWheel = ({ stations, onStationSelect, isSpinning, onSpinComplete }) => {
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (isSpinning || !stations || stations.length === 0) return;

    const randomIndex = Math.floor(Math.random() * stations.length);
    const spins = 5 + Math.random() * 3; // 5-8회 회전
    const degreePerStation = 360 / stations.length;
    const targetRotation = rotation + (360 * spins) + (randomIndex * degreePerStation);

    setRotation(targetRotation);

    setTimeout(() => {
      onStationSelect(stations[randomIndex]);
      onSpinComplete();
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-80 h-80 rounded-full border-8 border-blue-500 bg-white shadow-2xl overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-3000 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {stations && stations.map((station, index) => {
            const angle = (360 / stations.length) * index;
            return (
              <div
                key={station.id}
                className="absolute left-1/2 top-1/2 origin-top w-0 h-0"
                style={{
                  transform: `rotate(${angle}deg) translateY(-140px)`,
                }}
              >
                <div className="transform -rotate-90 text-xs font-bold truncate w-32 text-center">
                  {station.station_nm}
                </div>
              </div>
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 border-4 border-white shadow-lg flex items-center justify-center text-white font-bold">
              빙빙
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-12 border-transparent border-t-red-500 z-10"></div>
      </div>

      <button
        onClick={spin}
        disabled={isSpinning || !stations || stations.length === 0}
        className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg
                   hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors shadow-lg"
      >
        {isSpinning ? '돌리는 중...' : '룰렛 돌리기'}
      </button>
    </div>
  );
};

export default RouletteWheel;
