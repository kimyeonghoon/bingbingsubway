import { useState, useEffect } from 'react';

const RouletteWheel = ({ stations, onStationSelect, isSpinning, onSpinComplete }) => {
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

  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
    '#10B981', '#06B6D4', '#6366F1', '#F97316'
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-96 h-96 mx-auto">
        {/* 포인터 (빨간 삼각형) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
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
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                  >
                    {station.station_nm || station.name}
                  </text>
                </g>
              );
            })}
            {/* 중앙 원 */}
            <circle cx="0" cy="0" r="30" fill="white" stroke="#333" strokeWidth="3" />
            <text
              x="0"
              y="0"
              fill="#1e40af"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              빙빙
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default RouletteWheel;
