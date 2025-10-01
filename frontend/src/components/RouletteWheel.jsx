import { useState, useEffect } from 'react';

const RouletteWheel = ({ stations, onStationSelect, isSpinning, onSpinComplete, selectedStation, onSpin }) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isSpinning) {
      spin();
    }
  }, [isSpinning]);

  const spin = () => {
    if (!stations || stations.length === 0) return;

    const randomIndex = Math.floor(Math.random() * stations.length);
    const degreesPerStation = 360 / stations.length;
    // 조각의 중앙을 가리키도록 절반만큼 더해줌
    const targetDegree = randomIndex * degreesPerStation + (degreesPerStation / 2);
    // 시계 반대방향으로 회전 (음수)
    const spinAmount = -(360 * 5 + targetDegree);
    const newRotation = rotation + spinAmount;

    setRotation(newRotation);

    setTimeout(() => {
      onStationSelect(stations[randomIndex]);
      onSpinComplete();
    }, 4000);
  };

  const handleCenterClick = () => {
    if (!isSpinning && stations && stations.length > 0) {
      onSpin();
    }
  };

  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
    '#10B981', '#06B6D4', '#6366F1', '#F97316'
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-96 h-96 mx-auto">
        {/* 포인터 (빨간 삼각형) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 pointer-events-none">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-red-600"></div>
        </div>

        {/* 회전하는 룰렛 */}
        <svg
          width="384"
          height="384"
          viewBox="0 0 384 384"
          className="drop-shadow-2xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          <g transform="translate(192, 192)">
            {stations && stations.map((station, index) => {
              const angle = (360 / stations.length) * index;
              const nextAngle = (360 / stations.length) * (index + 1);
              const startAngle = (angle - 90) * (Math.PI / 180);
              const endAngle = (nextAngle - 90) * (Math.PI / 180);

              const x1 = 180 * Math.cos(startAngle);
              const y1 = 180 * Math.sin(startAngle);
              const x2 = 180 * Math.cos(endAngle);
              const y2 = 180 * Math.sin(endAngle);

              const largeArc = (nextAngle - angle) > 180 ? 1 : 0;
              const pathData = `M 0 0 L ${x1} ${y1} A 180 180 0 ${largeArc} 1 ${x2} ${y2} Z`;

              const textAngle = angle + (360 / stations.length) / 2;
              const textRadius = 120;
              const textX = textRadius * Math.cos((textAngle - 90) * (Math.PI / 180));
              const textY = textRadius * Math.sin((textAngle - 90) * (Math.PI / 180));

              const stationName = station.station_nm || station.name;
              const fontSize = stationName.length > 5 ? 11 : 14;

              return (
                <g key={station.id}>
                  <path
                    d={pathData}
                    fill={colors[index % colors.length]}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize={fontSize}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                  >
                    {stationName}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* 중앙 클릭 가능한 버튼 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <button
            onClick={handleCenterClick}
            disabled={isSpinning || !stations || stations.length === 0}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-800
                       border-4 border-white shadow-xl flex items-center justify-center
                       transition-all duration-200 transform
                       hover:scale-110 hover:shadow-2xl active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       cursor-pointer group relative overflow-hidden"
            style={{ zIndex: 30 }}
          >
            {/* 반짝이는 효과 */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>

            {/* 중앙 텍스트 */}
            <span className="relative z-10 text-white font-bold text-2xl group-hover:animate-pulse">
              {isSpinning ? '🌀' : '빙빙'}
            </span>

            {/* 테두리 효과 */}
            {!isSpinning && (
              <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-75"></div>
            )}
          </button>
        </div>
      </div>

      {/* 안내 텍스트 */}
      {!selectedStation && !isSpinning && (
        <p className="mt-4 text-sm text-gray-600 animate-bounce">
          👆 중앙의 "빙빙"을 클릭하세요!
        </p>
      )}
    </div>
  );
};

export default RouletteWheel;
