import { useState, useEffect } from 'react';
import { statsApi } from '../services/api';

export default function StatsPage({ userId }) {
  const [stats, setStats] = useState(null);
  const [visitedStations, setVisitedStations] = useState([]);
  const [lineStats, setLineStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, visitedData, lineData] = await Promise.all([
        statsApi.getUserStats(userId),
        statsApi.getVisitedStations(userId),
        statsApi.getLineStats(userId)
      ]);

      console.log('Stats loaded:', { statsData, visitedData, lineData });

      setStats(statsData);
      setVisitedStations(visitedData.stations || visitedData || []);
      setLineStats(lineData || []);
    } catch (error) {
      console.error('통계 로드 실패:', error);
      setError('통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">통계를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-bold text-xl mb-4">⚠️ {error}</p>
          <button
            onClick={loadStats}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatTime = (seconds) => {
    if (!seconds) return '0초';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    }
    return `${secs}초`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // UTC 시간을 받아서 KST로 변환
    const date = new Date(dateString);
    // toLocaleString으로 한국 시간대 명시
    const formatted = date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    // "2025. 10. 04. 00:57" -> "2025-10-04 00:57"
    return formatted.replace(/\. /g, '-').replace(/\.$/, ' ').trim().replace(/-(\d{2}:\d{2})/, ' $1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📊 나의 통계
          </h1>
          <p className="text-gray-600 font-medium">당신의 빙빙 지하철 여정을 확인하세요</p>
        </header>

        {/* 기본 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 총 도전 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-gray-600 text-sm font-semibold mb-1">총 도전</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total_challenges}</p>
          </div>

          {/* 성공률 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-gray-600 text-sm font-semibold mb-1">성공률</p>
            <p className="text-3xl font-bold text-green-600">{Number(stats.success_rate || 0).toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.completed_challenges}승 {stats.failed_challenges}패
            </p>
          </div>

          {/* 방문한 역 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
            <div className="text-3xl mb-2">🚉</div>
            <p className="text-gray-600 text-sm font-semibold mb-1">방문한 역</p>
            <p className="text-3xl font-bold text-purple-600">{stats.unique_visited_stations}</p>
            <p className="text-xs text-gray-500 mt-1">고유 역 {stats.unique_visited_stations}개</p>
          </div>

          {/* 점수 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-200">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-gray-600 text-sm font-semibold mb-1">총 점수</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.total_score}</p>
            <p className="text-xs text-gray-500 mt-1">최고 기록: {formatTime(stats.best_time)}</p>
          </div>
        </div>

        {/* 노선별 통계 */}
        {lineStats && lineStats.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🚇</span>
              노선별 통계
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lineStats.map((line) => {
                const completionRate = parseFloat(line.completion_rate) || 0;
                const successRate = parseFloat(line.success_rate) || 0;
                const visitedStations = parseInt(line.visited_stations) || 0;
                const totalStations = parseInt(line.total_stations) || 0;
                const totalChallenges = parseInt(line.total_challenges) || 0;
                const completedChallenges = parseInt(line.completed_challenges) || 0;

                return (
                  <div key={line.line_num} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <p className="font-bold text-blue-700 mb-3">{line.line_num}</p>

                    {/* 진행률 바 */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>진행률</span>
                        <span className="font-bold text-blue-600">{completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, completionRate)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {visitedStations}/{totalStations} 역 방문
                      </p>
                    </div>

                    {/* 통계 */}
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>도전: {totalChallenges}회</p>
                      <p>성공: {completedChallenges}회</p>
                      {totalChallenges > 0 && (
                        <p>성공률: {successRate.toFixed(1)}%</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 방문한 역 목록 */}
        {visitedStations && visitedStations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📍</span>
              방문한 역 ({visitedStations.length}개)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {visitedStations.map((station) => (
                <div
                  key={station.station_id || station.id}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200"
                >
                  <p className="font-bold text-purple-700 text-base mb-1">{station.station_nm}</p>
                  <p className="text-xs text-gray-600 mb-2">{station.line_num}</p>
                  {station.first_visit_at && (
                    <p className="text-xs text-gray-500">
                      🕐 {formatDate(station.first_visit_at)}
                    </p>
                  )}
                  {station.visit_count > 1 && (
                    <p className="text-xs text-purple-600 mt-1">✓ {station.visit_count}회 방문</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 데이터 없을 때 */}
        {stats.total_challenges === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
            <div className="text-6xl mb-4">🎡</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">아직 도전이 없습니다</h3>
            <p className="text-gray-600 mb-6">첫 도전을 시작하고 통계를 확인해보세요!</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg
                         hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
            >
              도전 시작하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
