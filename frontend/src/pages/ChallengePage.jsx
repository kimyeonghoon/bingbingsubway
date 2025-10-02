import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Timer from '../components/Timer';
import StationCard from '../components/StationCard';
import ProgressBar from '../components/ProgressBar';
import { challengeApi, visitApi } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';

function ChallengePage({ userId }) {
  const navigate = useNavigate();

  const [challengeId, setChallengeId] = useState(null);
  const [challengeStations, setChallengeStations] = useState([]);
  const [challengeStartTime, setChallengeStartTime] = useState(new Date());
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedLine, setSelectedLine] = useState('');
  const [finalStationId, setFinalStationId] = useState(null);

  const [verifyingStationId, setVerifyingStationId] = useState(null);
  const { location, error: geoError, getCurrentPosition } = useGeolocation();

  // 서버에서 진행 중인 도전 불러오기
  useEffect(() => {
    if (!userId) return;

    const loadChallenge = async () => {
      try {
        // 1. 진행 중인 도전 조회
        const challenges = await challengeApi.getChallengesByUser(userId);
        const inProgressChallenge = challenges.find(c => c.status === 'in_progress');

        if (!inProgressChallenge) {
          console.log('진행 중인 도전이 없음, 홈으로 이동');
          navigate('/');
          return;
        }

        // 2. final_station_id가 없으면 홈으로 (룰렛 선택 안 됨)
        if (!inProgressChallenge.final_station_id) {
          console.log('역이 선택되지 않음, 홈으로 이동');
          navigate('/');
          return;
        }

        // 3. 도전 데이터 설정
        setChallengeId(inProgressChallenge.id);
        setSelectedLine(inProgressChallenge.line_num);

        // 시간 파싱 (서버에서 이미 한국 시간으로 변환됨)
        // MySQL CONVERT_TZ로 +09:00 시간대 반환
        const startTime = new Date(inProgressChallenge.created_at);

        console.log('=== 시간 디버깅 ===');
        console.log('서버 created_at (원본):', inProgressChallenge.created_at);
        console.log('파싱된 시작 시간:', startTime);
        console.log('현재 시간:', new Date());
        console.log('경과 시간(분):', Math.floor((Date.now() - startTime.getTime()) / 1000 / 60));

        setChallengeStartTime(startTime);
        setFinalStationId(inProgressChallenge.final_station_id);

        // 4. 역 목록 및 방문 상태 조회
        const stations = await challengeApi.getChallengeStations(inProgressChallenge.id);

        // 5. final_station_id에 해당하는 역만 필터링 (1개만 표시)
        const finalStation = stations.find(s => s.id === inProgressChallenge.final_station_id);

        if (!finalStation) {
          console.error('최종 선택된 역을 찾을 수 없음');
          navigate('/');
          return;
        }

        setChallengeStations([finalStation]); // 1개 역만 설정

        // 6. 완료 여부 확인 (1개 역만 확인)
        const completed = finalStation.is_verified ? 1 : 0;
        setCompletedCount(completed);

        console.log('도전 데이터 로드 완료:', {
          challengeId: inProgressChallenge.id,
          line: inProgressChallenge.line_num,
          stations: stations.length,
          completed
        });

      } catch (error) {
        console.error('도전 데이터 로드 실패:', error);
        navigate('/');
      }
    };

    loadChallenge();
  }, [userId, navigate]);

  useEffect(() => {
    if (location && verifyingStationId) {
      verifyVisit();
    }
  }, [location, verifyingStationId]);

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

      // 서버에서 최신 도전 상태 다시 불러오기 (final_station만)
      const stations = await challengeApi.getChallengeStations(challengeId);
      const finalStation = stations.find(s => s.id === finalStationId);

      if (finalStation) {
        setChallengeStations([finalStation]);
        setCompletedCount(finalStation.is_verified ? 1 : 0);
      }

      // 1개 역 도전이므로 인증 완료 시 바로 완료
      if (finalStation?.is_verified) {
        alert('🎉 역 방문 완료! 축하합니다!');
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to verify visit:', error);
      const errorMsg = error.response?.data?.error || '방문 인증에 실패했습니다.';
      alert(errorMsg);
    } finally {
      setVerifyingStationId(null);
    }
  };

  const handleCancelChallenge = async () => {
    if (!window.confirm('정말로 이 도전을 취소하시겠습니까?')) {
      return;
    }

    try {
      await challengeApi.cancelChallenge(challengeId);
      alert('도전이 취소되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('Failed to cancel challenge:', error);
      const errorMsg = error.response?.data?.error || '도전 취소에 실패했습니다.';
      alert(errorMsg);
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

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleCancelChallenge}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold
                           hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl
                           transform hover:scale-105"
              >
                도전 취소
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl font-bold
                           hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl
                           transform hover:scale-105"
              >
                메인으로
              </button>
            </div>
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
