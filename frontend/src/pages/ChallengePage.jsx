import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Timer from '../components/Timer';
import StationCard from '../components/StationCard';
import ProgressBar from '../components/ProgressBar';
import { challengeApi } from '../api/challengeApi';
import { visitApi } from '../api/visitApi';
import { useGeolocation } from '../hooks/useGeolocation';

function ChallengePage() {
  const [searchParams] = useSearchParams();
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
        location.longitude
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-900 mb-2">🚇 빙빙 지하철</h1>
          <p className="text-gray-600">역 방문 도전 진행 중</p>
        </header>

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
            <h3 className="text-xl font-bold text-gray-800 mb-4">방문할 역</h3>

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
              onClick={() => window.close()}
              className="w-full mt-6 py-3 bg-gray-600 text-white rounded-lg font-bold
                         hover:bg-gray-700 transition-colors"
            >
              창 닫기
            </button>
          </div>

          {geoError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              GPS 오류: {geoError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChallengePage;
