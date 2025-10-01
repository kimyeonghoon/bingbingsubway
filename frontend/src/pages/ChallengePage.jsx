import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Timer from '../components/Timer';
import StationCard from '../components/StationCard';
import ProgressBar from '../components/ProgressBar';
import { challengeApi, visitApi } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';

function ChallengePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const challengeId = searchParams.get('id');
  const stationId = searchParams.get('station');
  const userId = searchParams.get('user');

  const [challengeStations, setChallengeStations] = useState([]);
  const [challengeStartTime, setChallengeStartTime] = useState(new Date());
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedLine, setSelectedLine] = useState('');

  const [verifyingStationId, setVerifyingStationId] = useState(null);
  const { location, error: geoError, getCurrentPosition } = useGeolocation();

  // 저장된 도전 정보 복구
  useEffect(() => {
    const savedProgress = localStorage.getItem(`bingbing_challenge_${challengeId}`);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setChallengeStations(progress.challengeStations || []);
        setCompletedCount(progress.completedCount || 0);
        setSelectedLine(progress.selectedLine || '');
        setChallengeStartTime(progress.challengeStartTime ? new Date(progress.challengeStartTime) : new Date());
      } catch (error) {
        console.error('Failed to restore progress:', error);
      }
    }
  }, [challengeId]);

  useEffect(() => {
    loadChallengeData();
  }, [challengeId, stationId]);

  // 진행 상태 저장
  useEffect(() => {
    if (challengeId && challengeStations.length > 0) {
      const progressData = {
        challengeStations,
        completedCount,
        selectedLine,
        challengeStartTime,
      };
      localStorage.setItem(`bingbing_challenge_${challengeId}`, JSON.stringify(progressData));
    }
  }, [challengeId, challengeStations, completedCount, selectedLine, challengeStartTime]);

  useEffect(() => {
    if (location && verifyingStationId) {
      verifyVisit();
    }
  }, [location, verifyingStationId]);

  const loadChallengeData = async () => {
    try {
      const data = await challengeApi.getChallengeStations(challengeId);
      const selectedStationData = data.filter(s => s.id === parseInt(stationId));
      setChallengeStations(selectedStationData);
      setCompletedCount(selectedStationData.filter(s => s.is_verified).length);

      if (selectedStationData.length > 0) {
        setSelectedLine(selectedStationData[0].line_num);
      }
    } catch (error) {
      console.error('Failed to load challenge stations:', error);
      alert('도전 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleVerifyStation = async (station) => {
    setVerifyingStationId(station.id);
    getCurrentPosition();
  };

  const verifyVisit = async () => {
    if (!location || !verifyingStationId) return;

    try {
      const result = await visitApi.createVisit(
        challengeId,
        userId,
        verifyingStationId,
        location.latitude,
        location.longitude,
        location.accuracy
      );

      alert(`${result.stationName} 인증 완료! (거리: ${result.distance}m)`);

      // 도전 상태 갱신
      const data = await challengeApi.getChallengeStations(challengeId);
      const selectedStationData = data.filter(s => s.id === parseInt(stationId));
      setChallengeStations(selectedStationData);
      setCompletedCount(selectedStationData.filter(s => s.is_verified).length);

      if (result.isAllCompleted) {
        alert('🎉 역 방문 완료! 축하합니다!');
      }
    } catch (error) {
      console.error('Failed to verify visit:', error);
      const errorMsg = error.response?.data?.error || '방문 인증에 실패했습니다.';
      alert(errorMsg);
    } finally {
      setVerifyingStationId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">빙빙 지하철</h1>
          <p className="text-gray-700 font-medium">역 방문 도전 진행 중</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-6 border-2 border-blue-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {selectedLine} 도전
              </h2>
              <Timer startTime={challengeStartTime} />
            </div>

            <ProgressBar completed={completedCount} total={challengeStations.length} />

            <div className="mt-6 text-center">
              <p className="text-gray-800 text-lg font-semibold">
                {completedCount === challengeStations.length
                  ? '🎉 역 방문 완료!'
                  : '📍 선택된 역을 방문하세요'}
              </p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border-2 border-purple-200">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">방문할 역</h3>

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
              onClick={() => navigate('/')}
              className="w-full mt-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl font-bold
                         hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl
                         transform hover:scale-105"
            >
              메인으로
            </button>
          </div>

          {geoError && (
            <div className="mt-4 p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4">
                <div className="text-red-500 text-2xl">⚠️</div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-red-700 mb-2">
                    {typeof geoError === 'object' ? geoError.message : 'GPS 오류'}
                  </h4>
                  <p className="text-red-600 mb-3">
                    {typeof geoError === 'object' ? geoError.detail : geoError}
                  </p>
                  {typeof geoError === 'object' && geoError.action === 'retry' && (
                    <button
                      onClick={() => verifyingStationId && getCurrentPosition()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      다시 시도
                    </button>
                  )}
                  {typeof geoError === 'object' && geoError.action === 'settings' && (
                    <div className="text-sm text-red-700 mt-2">
                      <p className="font-semibold mb-1">설정 방법:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Chrome: 설정 → 개인정보 및 보안 → 사이트 설정 → 위치</li>
                        <li>Safari: 설정 → Safari → 위치</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChallengePage;
