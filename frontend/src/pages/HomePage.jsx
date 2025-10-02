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
    if (!userId) return;

    const savedChallenge = localStorage.getItem('bingbing_currentChallenge');
    if (savedChallenge) {
      try {
        const challenge = JSON.parse(savedChallenge);

        // 저장된 도전의 userId와 현재 로그인한 userId가 다르면 초기화
        if (challenge.userId && challenge.userId !== userId) {
          console.log('다른 사용자의 도전 정보 삭제');
          localStorage.removeItem('bingbing_currentChallenge');
          return;
        }

        setSelectedLine(challenge.selectedLine);
        setChallengeId(challenge.challengeId);
        setStations(challenge.stations || []);
        setSelectedStation(challenge.selectedStation || null);
        setChallengeStartTime(challenge.challengeStartTime ? new Date(challenge.challengeStartTime) : null);

        // 진행 중인 도전이 있으면 도전 페이지로 이동
        if (challenge.challengeId && challenge.selectedStation) {
          console.log('진행 중인 도전 발견, 도전 페이지로 이동');
          navigate('/challenge');
        } else if (challenge.selectedLine && challenge.stations && challenge.stations.length > 0) {
          // 룰렛 단계
          setStep('roulette');
        } else {
          setStep('setup');
        }
      } catch (error) {
        console.error('Failed to restore challenge:', error);
        localStorage.removeItem('bingbing_currentChallenge');
      }
    }
  }, [userId]);

  // 도전 정보 저장
  useEffect(() => {
    if (step !== 'setup' && userId) {
      const challengeData = {
        userId, // 현재 로그인한 사용자 ID 저장
        step,
        selectedLine,
        challengeId,
        stations,
        selectedStation,
        challengeStartTime,
      };
      localStorage.setItem('bingbing_currentChallenge', JSON.stringify(challengeData));
    }
  }, [step, selectedLine, challengeId, stations, selectedStation, challengeStartTime, userId]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Vibrant background decoration */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-blue-300 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-purple-300 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-pink-200 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            🎡 빙빙 지하철
          </h1>
          <p className="text-gray-700 text-lg font-medium">
            랜덤으로 선택된 역을 방문하는 지하철 룰렛 게임
          </p>
        </header>

      {step === 'setup' && (
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-blue-200">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 text-center">도전 시작</h2>

          {/* 진행 중인 도전이 있으면 표시 */}
          {challengeId && selectedStation && (
            <div className="mb-6 p-5 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-2xl shadow-lg">
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
                aria-label="진행 중인 도전 이어하기"
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold
                           hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg
                           transform hover:scale-105 focus:ring-4 focus:ring-yellow-300 focus:outline-none"
              >
                도전 이어하기
              </button>
            </div>
          )}

          <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-2xl shadow-md">
            <p className="text-gray-800 mb-3 flex items-center gap-2 font-semibold">
              <span className="text-2xl">🎲</span>
              <span className="font-bold text-blue-600">랜덤 노선</span>이 선택됩니다!
            </p>
            <p className="text-gray-700 flex items-center gap-2">
              <span className="text-2xl">🎡</span>
              룰렛을 돌려 <span className="font-bold text-purple-600">랜덤 1개 역</span>을 선택하고 방문하세요!
            </p>
          </div>

          <button
            onClick={handleStartChallenge}
            disabled={lines.length === 0}
            aria-label={challengeId ? '새로운 도전 시작하기' : '도전 시작하기'}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg
                       hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl
                       disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105
                       focus:ring-4 focus:ring-blue-300 focus:outline-none"
          >
            {challengeId ? '새로운 도전 시작' : '도전 시작'}
          </button>
        </div>
      )}

      {step === 'roulette' && (
        <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-purple-200">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 text-center">
            룰렛을 돌려 역을 확인하세요!
          </h2>
          <p className="text-center text-gray-700 mb-6 font-semibold">
            <span className="text-blue-600">{selectedLine}</span> • 1개 역 선택
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
            <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-3xl shadow-xl">
              <h3 className="text-xl font-bold text-green-700 mb-3 text-center flex items-center justify-center gap-2">
                <span className="text-3xl">🎉</span>
                뽑힌 역
              </h3>
              <p className="text-4xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent my-4">
                {selectedStation.station_nm || selectedStation.name}
              </p>
              <p className="text-center text-green-700 mt-2 font-bold text-lg">
                {selectedStation.line_num || selectedStation.line}
              </p>

              <button
                onClick={handleGoToChallenge}
                aria-label="선택된 역으로 도전 시작하기"
                className="w-full mt-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-lg
                           hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl
                           transform hover:scale-105 focus:ring-4 focus:ring-green-300 focus:outline-none"
              >
                도전 시작하기
              </button>

              <p className="text-center text-sm text-gray-600 mt-4 font-medium">
                중앙 버튼을 다시 클릭하면 다른 역을 뽑을 수 있습니다
              </p>
            </div>
          )}

          {!selectedStation && !isSpinning && (
            <div
              onClick={() => setIsSpinning(true)}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg
                         hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg cursor-pointer text-center
                         transform hover:scale-105"
            >
              룰렛 중앙을 클릭하세요
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
