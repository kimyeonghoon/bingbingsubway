import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RouletteWheel from '../components/RouletteWheel';
import { stationApi, challengeApi } from '../services/api';

export default function HomePage({ userId }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('setup'); // setup, roulette
  const [lines, setLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState('');
  const [stationCount] = useState(10);

  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [challengeId, setChallengeId] = useState(null);
  const [challengeStartTime, setChallengeStartTime] = useState(null);

  // 저장된 도전 정보 복구
  useEffect(() => {
    const savedChallenge = localStorage.getItem('bingbing_currentChallenge');
    if (savedChallenge) {
      try {
        const challenge = JSON.parse(savedChallenge);
        setSelectedLine(challenge.selectedLine);
        setChallengeId(challenge.challengeId);
        setStations(challenge.stations || []);
        setSelectedStation(challenge.selectedStation || null);
        setChallengeStartTime(challenge.challengeStartTime ? new Date(challenge.challengeStartTime) : null);
        setStep('setup');
      } catch (error) {
        console.error('Failed to restore challenge:', error);
        localStorage.removeItem('bingbing_currentChallenge');
      }
    }
  }, []);

  // 도전 정보 저장
  useEffect(() => {
    if (step !== 'setup') {
      const challengeData = {
        step,
        selectedLine,
        challengeId,
        stations,
        selectedStation,
        challengeStartTime,
      };
      localStorage.setItem('bingbing_currentChallenge', JSON.stringify(challengeData));
    }
  }, [step, selectedLine, challengeId, stations, selectedStation, challengeStartTime]);

  // 노선 목록 로드
  useEffect(() => {
    loadLines();
  }, []);

  const loadLines = async () => {
    try {
      const data = await stationApi.getLines();
      setLines(data);
    } catch (error) {
      console.error('Failed to load lines:', error);
      alert('노선 목록을 불러오는데 실패했습니다.');
    }
  };

  // 도전 시작
  const handleStartChallenge = async () => {
    if (lines.length === 0) {
      alert('노선 정보를 불러오는 중입니다.');
      return;
    }

    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    setSelectedLine(randomLine);

    alert(`이번에 도전할 노선은 ${randomLine}입니다.`);

    try {
      const data = await challengeApi.createChallenge(userId, randomLine, stationCount);
      setChallengeId(data.challengeId);
      setStations(data.stations);
      setChallengeStartTime(new Date());
      setStep('roulette');
    } catch (error) {
      console.error('Failed to create challenge:', error);
      alert('도전 생성에 실패했습니다.');
    }
  };

  // 룰렛에서 역 선택
  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  // 룰렛 회전 완료
  const handleSpinComplete = () => {
    setIsSpinning(false);
  };

  // 도전 페이지로 이동
  const handleGoToChallenge = () => {
    navigate(`/challenge?id=${challengeId}&station=${selectedStation.id}&user=${userId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">🎡 빙빙 지하철</h1>
        <p className="text-gray-600 text-lg">랜덤으로 선택된 역을 방문하는 지하철 룰렛 게임</p>
      </header>

      {step === 'setup' && (
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">도전 시작</h2>

          {/* 진행 중인 도전이 있으면 표시 */}
          {challengeId && selectedStation && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
              <h3 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2">
                <span className="text-xl">🎯</span>
                진행 중인 도전
              </h3>
              <p className="text-gray-700 mb-2">
                노선: <span className="font-bold text-yellow-700">{selectedLine}</span>
              </p>
              <p className="text-gray-700 mb-4">
                역: <span className="font-bold text-yellow-700">{selectedStation.station_nm || selectedStation.name}</span>
              </p>
              <button
                onClick={handleGoToChallenge}
                className="w-full py-3 bg-yellow-500 text-white rounded-lg font-bold
                           hover:bg-yellow-600 transition-colors shadow-sm"
              >
                도전 이어하기
              </button>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-xl">🎲</span>
              <span className="font-bold">랜덤 노선</span>이 선택됩니다!
            </p>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="text-xl">🎡</span>
              룰렛을 돌려 <span className="font-bold text-blue-600">랜덤 1개 역</span>을 선택하고 방문하세요!
            </p>
          </div>

          <button
            onClick={handleStartChallenge}
            disabled={lines.length === 0}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg
                       hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg
                       disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {challengeId ? '🎯 새로운 도전 시작' : '🚀 도전 시작'}
          </button>
        </div>
      )}

      {step === 'roulette' && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            룰렛을 돌려 역을 확인하세요!
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {selectedLine} • 1개 역 선택
          </p>

          <RouletteWheel
            stations={stations}
            onStationSelect={handleStationSelect}
            isSpinning={isSpinning}
            onSpinComplete={handleSpinComplete}
            selectedStation={selectedStation}
            onSpin={() => setIsSpinning(true)}
          />

          {selectedStation && !isSpinning && (
            <div className="mt-8 p-6 bg-green-50 border-2 border-green-400 rounded-2xl">
              <h3 className="text-xl font-bold text-green-700 mb-3 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">🎉</span>
                뽑힌 역
              </h3>
              <p className="text-4xl font-bold text-center text-gray-900 my-4">
                {selectedStation.station_nm || selectedStation.name}
              </p>
              <p className="text-center text-green-700 mt-2 font-bold text-lg">
                {selectedStation.line_num || selectedStation.line}
              </p>

              <button
                onClick={handleGoToChallenge}
                className="w-full mt-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg
                           hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
              >
                🚇 도전 시작하기
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                💡 중앙 버튼을 다시 클릭하면 다른 역을 뽑을 수 있습니다
              </p>
            </div>
          )}

          {!selectedStation && !isSpinning && (
            <div
              onClick={() => setIsSpinning(true)}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-bold
                         hover:bg-blue-700 transition-colors shadow-md cursor-pointer text-center"
            >
              🎡 룰렛 중앙을 클릭하세요!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
