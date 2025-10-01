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
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">🎡 룰렛 게임</h1>
        <p className="text-white/80 text-lg">랜덤으로 선택된 역을 방문하는 지하철 룰렛 게임</p>
      </header>

      {step === 'setup' && (
        <div className="max-w-md mx-auto backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">빙빙 지하철 룰렛</h2>

          {/* 진행 중인 도전이 있으면 표시 */}
          {challengeId && selectedStation && (
            <div className="mb-6 p-5 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl shadow-lg">
              <h3 className="text-sm font-bold text-yellow-300 mb-3 flex items-center gap-2">
                <span className="text-xl">🎯</span>
                진행 중인 도전
              </h3>
              <p className="text-white/90 mb-2">
                노선: <span className="font-bold text-yellow-300">{selectedLine}</span>
              </p>
              <p className="text-white/90 mb-4">
                역: <span className="font-bold text-yellow-300">{selectedStation.station_nm || selectedStation.name}</span>
              </p>
              <button
                onClick={handleGoToChallenge}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold
                           hover:from-yellow-600 hover:to-orange-600 transition-all duration-300
                           shadow-lg hover:shadow-xl hover:scale-105"
              >
                도전 이어하기
              </button>
            </div>
          )}

          <div className="mb-6 p-5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl">
            <p className="text-white/90 mb-3 flex items-center gap-2">
              <span className="text-xl">🎲</span>
              <span className="font-bold">랜덤 노선</span>이 선택됩니다!
            </p>
            <p className="text-white/80 flex items-center gap-2">
              <span className="text-xl">🎡</span>
              룰렛을 돌려 <span className="font-bold text-blue-300">랜덤 1개 역</span>을 선택하고 방문하세요!
            </p>
          </div>

          <button
            onClick={handleStartChallenge}
            disabled={lines.length === 0}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg
                       hover:from-blue-700 hover:to-indigo-700 transition-all duration-300
                       shadow-xl hover:shadow-2xl hover:scale-105
                       disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {challengeId ? '🎯 새로운 도전 시작' : '🚀 도전 시작'}
          </button>
        </div>
      )}

      {step === 'roulette' && (
        <div className="max-w-2xl mx-auto backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">
            룰렛을 돌려 역을 확인하세요!
          </h2>
          <p className="text-center text-white/80 mb-6 text-lg">
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
            <div className="mt-8 p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl shadow-2xl">
              <h3 className="text-2xl font-bold text-green-300 mb-3 text-center flex items-center justify-center gap-2">
                <span className="text-3xl">🎉</span>
                뽑힌 역
              </h3>
              <p className="text-5xl font-bold text-center text-white my-6 drop-shadow-lg">
                {selectedStation.station_nm || selectedStation.name}
              </p>
              <p className="text-center text-green-300 mt-2 font-bold text-xl">
                {selectedStation.line_num || selectedStation.line}
              </p>

              <button
                onClick={handleGoToChallenge}
                className="w-full mt-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg
                           hover:from-green-700 hover:to-emerald-700 transition-all duration-300
                           shadow-xl hover:shadow-2xl hover:scale-105"
              >
                🚇 도전 시작하기
              </button>

              <p className="text-center text-sm text-white/60 mt-4">
                💡 중앙 버튼을 다시 클릭하면 다른 역을 뽑을 수 있습니다
              </p>
            </div>
          )}

          {!selectedStation && !isSpinning && (
            <div
              onClick={() => setIsSpinning(true)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg
                         hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg cursor-pointer text-center
                         transform hover:scale-105 active:scale-95"
            >
              🎡 룰렛 중앙을 클릭하세요!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
