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
  const [selectedLine, setSelectedLine] = useState('');
  const [stationCount, setStationCount] = useState(10);
  const [userId] = useState('user-' + Date.now());

  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const [challengeId, setChallengeId] = useState(null);
  const [challengeStations, setChallengeStations] = useState([]);
  const [challengeStartTime, setChallengeStartTime] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);

  const [verifyingStationId, setVerifyingStationId] = useState(null);
  const { location, error: geoError, loading: geoLoading, getCurrentPosition } = useGeolocation();

  // 노선 목록 로드
  useEffect(() => {
    loadLines();
  }, []);

  const loadLines = async () => {
    try {
      const data = await stationApi.getLines();
      setLines(data);
      if (data.length > 0) {
        setSelectedLine(data[0]);
      }
    } catch (error) {
      console.error('Failed to load lines:', error);
      alert('노선 목록을 불러오는데 실패했습니다.');
    }
  };

  // 도전 시작
  const handleStartChallenge = async () => {
    if (!selectedLine || stationCount < 1) {
      alert('노선과 역 개수를 선택해주세요.');
      return;
    }

    try {
      const data = await challengeApi.createChallenge(userId, selectedLine, stationCount);
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

  // 도전 시작 버튼
  const handleGoToChallenge = async () => {
    try {
      const data = await challengeApi.getChallengeStations(challengeId);
      setChallengeStations(data);
      setCompletedCount(data.filter(s => s.is_verified).length);
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">도전 설정</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                노선 선택
              </label>
              <select
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {lines.map(line => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                방문할 역 개수: {stationCount}개
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={stationCount}
                onChange={(e) => setStationCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>3개</span>
                <span>20개</span>
              </div>
            </div>

            <button
              onClick={handleStartChallenge}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg
                         hover:bg-blue-700 transition-colors shadow-lg"
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
              {selectedLine} • {stationCount}개 역
            </p>

            <RouletteWheel
              stations={stations}
              onStationSelect={handleStationSelect}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
            />

            {selectedStation && !isSpinning && (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
                <h3 className="text-xl font-bold text-blue-900 mb-2 text-center">
                  선택된 역
                </h3>
                <p className="text-3xl font-bold text-center text-blue-700">
                  {selectedStation.station_nm}
                </p>
                <p className="text-center text-gray-600 mt-2">
                  {selectedStation.line_num}
                </p>

                <button
                  onClick={handleGoToChallenge}
                  className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg font-bold
                             hover:bg-green-700 transition-colors"
                >
                  도전 시작하기
                </button>
              </div>
            )}

            {!selectedStation && !isSpinning && (
              <button
                onClick={() => setIsSpinning(true)}
                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-bold
                           hover:bg-blue-700 transition-colors"
              >
                룰렛 시작
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
                    ? '🎉 모든 역 방문 완료!'
                    : `${challengeStations.length - completedCount}개 역이 남았습니다`}
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
