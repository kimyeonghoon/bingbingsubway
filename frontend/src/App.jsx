import { useState, useEffect } from 'react';
import RouletteWheel from './components/RouletteWheel';
import Timer from './components/Timer';
import StationCard from './components/StationCard';
import ProgressBar from './components/ProgressBar';
import { stationApi } from './api/stationApi';
import { challengeApi } from './api/challengeApi';
import { visitApi } from './api/visitApi';
import { useGeolocation } from './hooks/useGeolocation';

function App() {
  const [step, setStep] = useState('setup'); // setup, roulette, challenge
  const [lines, setLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState(''); // 랜덤으로 선택될 노선
  const [stationCount] = useState(10); // 룰렛에 표시할 역 개수 (고정)
  const [userId] = useState(() => {
    // localStorage에서 userId 복구 또는 새로 생성
    const savedUserId = localStorage.getItem('bingbing_userId');
    if (savedUserId) {
      return parseInt(savedUserId);
    }
    const newUserId = Date.now();
    localStorage.setItem('bingbing_userId', newUserId.toString());
    return newUserId;
  });

  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const [challengeId, setChallengeId] = useState(null);
  const [challengeStations, setChallengeStations] = useState([]);
  const [challengeStartTime, setChallengeStartTime] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);

  const [verifyingStationId, setVerifyingStationId] = useState(null);
  const { location, error: geoError, loading: geoLoading, getCurrentPosition } = useGeolocation();

  // 저장된 도전 정보 복구
  useEffect(() => {
    const savedChallenge = localStorage.getItem('bingbing_currentChallenge');
    if (savedChallenge) {
      try {
        const challenge = JSON.parse(savedChallenge);
        setStep(challenge.step);
        setSelectedLine(challenge.selectedLine);
        setChallengeId(challenge.challengeId);
        setStations(challenge.stations || []);
        setSelectedStation(challenge.selectedStation || null);
        setChallengeStartTime(challenge.challengeStartTime ? new Date(challenge.challengeStartTime) : null);
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

    // 랜덤으로 노선 선택
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

  // 도전 시작 버튼 - 룰렛에서 선택된 1개 역만 방문
  const handleGoToChallenge = async () => {
    try {
      const data = await challengeApi.getChallengeStations(challengeId);
      // 룰렛에서 선택된 역만 필터링
      const selectedStationData = data.filter(s => s.id === selectedStation.id);
      setChallengeStations(selectedStationData);
      setCompletedCount(selectedStationData.filter(s => s.is_verified).length);
      setStep('challenge');
    } catch (error) {
      console.error('Failed to load challenge stations:', error);
      alert('도전 정보를 불러오는데 실패했습니다.');
    }
  };

  // 역 방문 인증
  const handleVerifyStation = async (station) => {
    setVerifyingStationId(station.id);
    getCurrentPosition();
  };

  // GPS 위치 획득 후 인증 처리
  useEffect(() => {
    if (location && verifyingStationId) {
      verifyVisit();
    }
  }, [location, verifyingStationId]);

  const verifyVisit = async () => {
    if (!location || !verifyingStationId) return;

    try {
      const result = await visitApi.createVisit(
        challengeId,
        userId,
        verifyingStationId,
        location.latitude,
        location.longitude
      );

      alert(`${result.stationName} 인증 완료! (거리: ${result.distance}m)`);

      // 도전 상태 갱신
      const data = await challengeApi.getChallengeStations(challengeId);
      setChallengeStations(data);
      setCompletedCount(data.filter(s => s.is_verified).length);

      if (result.isAllCompleted) {
        alert('🎉 모든 역 방문 완료! 축하합니다!');
      }
    } catch (error) {
      console.error('Failed to verify visit:', error);
      const errorMsg = error.response?.data?.error || '방문 인증에 실패했습니다.';
      alert(errorMsg);
    } finally {
      setVerifyingStationId(null);
    }
  };

  // 새로운 도전 시작
  const handleReset = () => {
    setStep('setup');
    setStations([]);
    setSelectedStation(null);
    setChallengeId(null);
    setChallengeStations([]);
    setChallengeStartTime(null);
    setCompletedCount(0);
    setSelectedLine('');
    // localStorage 초기화
    localStorage.removeItem('bingbing_currentChallenge');
  };

  // 재도전 (같은 노선으로 다시 시작)
  const handleRetry = async () => {
    if (!selectedLine) {
      alert('노선 정보가 없습니다.');
      return;
    }

    try {
      const data = await challengeApi.createChallenge(userId, selectedLine, stationCount);
      setChallengeId(data.challengeId);
      setStations(data.stations);
      setSelectedStation(null);
      setChallengeStations([]);
      setChallengeStartTime(new Date());
      setCompletedCount(0);
      setStep('roulette');
    } catch (error) {
      console.error('Failed to retry challenge:', error);
      alert('재도전 생성에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-900 mb-2">🚇 빙빙 지하철</h1>
          <p className="text-gray-600">랜덤으로 선택된 역을 방문하는 지하철 룰렛 게임</p>
        </header>

        {step === 'setup' && (
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">빙빙 지하철 룰렛</h2>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                🎲 <span className="font-bold">랜덤 노선</span>이 선택됩니다!
              </p>
              <p className="text-sm text-gray-700">
                🎡 룰렛을 돌려 <span className="font-bold text-blue-600">랜덤 1개 역</span>을 선택하고 방문하세요!
              </p>
            </div>

            <button
              onClick={handleStartChallenge}
              disabled={lines.length === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg
                         hover:bg-blue-700 transition-colors shadow-lg
                         disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              도전 시작
            </button>
          </div>
        )}

        {step === 'roulette' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
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
            />

            {selectedStation && !isSpinning && (
              <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-400 shadow-lg">
                <h3 className="text-xl font-bold text-green-900 mb-2 text-center">
                  🎉 뽑힌 역
                </h3>
                <p className="text-4xl font-bold text-center text-green-700 my-4">
                  {selectedStation.station_nm || selectedStation.name}
                </p>
                <p className="text-center text-gray-600 mt-2 font-semibold">
                  {selectedStation.line_num || selectedStation.line}
                </p>

                <button
                  onClick={() => {
                    const challengeUrl = `/challenge?id=${challengeId}&station=${selectedStation.id}&user=${userId}`;
                    window.open(challengeUrl, '_blank');
                  }}
                  className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg font-bold text-lg
                             hover:bg-green-700 transition-colors shadow-lg"
                >
                  🚇 도전 시작하기
                </button>

                <div className="flex gap-3 mt-3">
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold
                               hover:bg-blue-700 transition-colors"
                  >
                    🔄 재도전
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 bg-gray-600 text-white rounded-lg font-semibold
                               hover:bg-gray-700 transition-colors"
                  >
                    처음으로
                  </button>
                </div>
              </div>
            )}

            {!selectedStation && !isSpinning && (
              <button
                onClick={() => setIsSpinning(true)}
                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg
                           hover:bg-blue-700 transition-colors shadow-lg"
              >
                🎡 룰렛 돌리기
              </button>
            )}
          </div>
        )}

        {step === 'challenge' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedLine} 도전
                </h2>
                <Timer startTime={challengeStartTime} />
              </div>

              <ProgressBar completed={completedCount} total={challengeStations.length} />

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {completedCount === challengeStations.length
                    ? '🎉 역 방문 완료!'
                    : '선택된 역을 방문하세요!'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">방문할 역 목록</h3>

              <div className="space-y-3">
                {challengeStations.map(station => (
                  <StationCard
                    key={station.id}
                    station={station}
                    isVerified={station.is_verified}
                    onVerify={handleVerifyStation}
                    isVerifying={verifyingStationId === station.id}
                  />
                ))}
              </div>

              <button
                onClick={handleReset}
                className="w-full mt-6 py-3 bg-gray-600 text-white rounded-lg font-bold
                           hover:bg-gray-700 transition-colors"
              >
                새로운 도전 시작
              </button>
            </div>

            {geoError && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                GPS 오류: {geoError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
