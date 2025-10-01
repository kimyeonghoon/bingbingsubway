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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">🚇 빙빙 지하철</h1>
          <p className="text-white/80 text-lg">역 방문 도전 진행 중</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <h2 className="text-3xl font-bold text-white">
                {selectedLine} 도전
              </h2>
              <Timer startTime={challengeStartTime} />
            </div>

            <ProgressBar completed={completedCount} total={challengeStations.length} />

            <div className="mt-6 text-center">
              <p className="text-white/90 text-lg font-semibold">
                {completedCount === challengeStations.length
                  ? '🎉 역 방문 완료!'
                  : '선택된 역을 방문하세요!'}
              </p>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">방문할 역</h3>

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
              className="w-full mt-6 py-3 bg-gray-600 text-white rounded-lg font-bold
                         hover:bg-gray-700 transition-colors"
            >
              메인으로
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
