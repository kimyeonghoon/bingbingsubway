import { useState, useEffect } from 'react';
import { userStatsApi, achievementApi } from '../services/api';
import { User, Trophy, MapPin, Calendar, Star, Award, TrendingUp } from 'lucide-react';

export default function ProfilePage({ userId }) {
  const [stats, setStats] = useState(null);
  const [visitedStations, setVisitedStations] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [lineStats, setLineStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();

    // 색상 디버깅
    console.log('🎨 ProfilePage 색상 체크:');
    console.log('%c 트로피 (노란색)', 'color: #CA8A04; font-weight: bold; font-size: 16px');
    console.log('%c 타겟 (파란색)', 'color: #2563EB; font-weight: bold; font-size: 16px');
    console.log('%c 연승 (초록색)', 'color: #16A34A; font-weight: bold; font-size: 16px');
    console.log('%c 방문역 (보라색)', 'color: #9333EA; font-weight: bold; font-size: 16px');
    console.log('진행률 바 - 파란색: #2563EB, 완료: #16A34A');

    // DOM 직접 확인
    setTimeout(() => {
      const icons = document.querySelectorAll('svg');
      console.log('📍 SVG 아이콘 개수:', icons.length);
      icons.forEach((icon, i) => {
        const style = window.getComputedStyle(icon);
        console.log(`아이콘 ${i}: color=${style.color}, fill=${style.fill}`);
      });
    }, 1000);
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, achievementsData, lineStatsData, visitedData] = await Promise.all([
        userStatsApi.getUserStats(userId),
        achievementApi.getUserAchievements(userId),
        userStatsApi.getLineStats(userId),
        userStatsApi.getVisitedStations(userId, 5, 0)
      ]);

      setStats(statsData);
      setAchievements(achievementsData.achievements || []);
      setLineStats(lineStatsData);
      setVisitedStations(visitedData.stations || []);
    } catch (err) {
      setError('프로필을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-900">프로필 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const achievedAchievements = achievements.filter(a => a.is_achieved);
  const topAchievements = achievedAchievements
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  const completedLines = lineStats.filter(
    line => line.visited_count >= line.total_count
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 프로필 헤더 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DBEAFE' }}>
            <User className="w-10 h-10" style={{ color: '#2563EB' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1 text-gray-900">사용자 {userId}</h1>
            <p className="text-gray-600">
              {stats?.first_challenge_at
                ? `${new Date(stats.first_challenge_at).toLocaleDateString()} 가입`
                : '신규 사용자'}
            </p>
          </div>
        </div>

        {/* 주요 통계 */}
        <div className="grid grid-cols-4 gap-4">
          <StatBox
            icon={<Trophy className="w-5 h-5" style={{ color: '#CA8A04' }} />}
            label="총 점수"
            value={stats?.total_score?.toLocaleString() || 0}
          />
          <StatBox
            icon={<Target className="w-5 h-5" style={{ color: '#2563EB' }} />}
            label="성공률"
            value={`${stats?.success_rate?.toFixed(1) || 0}%`}
          />
          <StatBox
            icon={<TrendingUp className="w-5 h-5" style={{ color: '#16A34A' }} />}
            label="최대 연승"
            value={stats?.max_streak || 0}
          />
          <StatBox
            icon={<MapPin className="w-5 h-5" style={{ color: '#9333EA' }} />}
            label="방문 역"
            value={stats?.unique_visited_stations || 0}
          />
        </div>
      </div>

      {/* 대표 업적 */}
      {topAchievements.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
            <Award className="w-5 h-5 mr-2" style={{ color: '#CA8A04' }} />
            대표 업적
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topAchievements.map(achievement => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-400"
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <div className="font-bold text-gray-900 mb-1">{achievement.name}</div>
                <div className="text-sm text-gray-600 mb-2">{achievement.description}</div>
                <div className="text-xs text-yellow-700 font-medium">
                  +{Number(achievement.points)} 포인트
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 가장 많이 방문한 역 */}
      {visitedStations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
            <MapPin className="w-5 h-5 mr-2" style={{ color: '#16A34A' }} />
            가장 많이 방문한 역 TOP 5
          </h2>
          <div className="space-y-3">
            {visitedStations.map((station, index) => (
              <div
                key={station.station_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{station.station_nm}</div>
                    <div className="text-sm text-gray-600">{station.line_num}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {station.visit_count}회
                  </div>
                  <div className="text-xs text-gray-500">
                    최근: {new Date(station.last_visit_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 완료한 노선 */}
      {completedLines.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
            <Star className="w-5 h-5 mr-2" style={{ color: '#9333EA' }} />
            완료한 노선
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {completedLines.map(line => (
              <div
                key={line.line_num}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-300 text-center"
              >
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {line.line_num}
                </div>
                <div className="text-xs text-gray-600">
                  {line.total_count}개 역 완료
                </div>
                <div className="mt-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 전체 통계 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
          <Calendar className="w-5 h-5 mr-2" style={{ color: '#2563EB' }} />
          전체 통계
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatItem
            label="총 도전"
            value={stats?.total_challenges || 0}
          />
          <StatItem
            label="성공한 도전"
            value={stats?.completed_challenges || 0}
          />
          <StatItem
            label="실패한 도전"
            value={(stats?.total_challenges || 0) - (stats?.completed_challenges || 0)}
          />
          <StatItem
            label="현재 연승"
            value={stats?.current_streak || 0}
          />
          <StatItem
            label="평균 완료 시간"
            value={stats?.average_time ? `${Math.floor(stats.average_time / 60)}분` : '-'}
          />
          <StatItem
            label="획득한 업적"
            value={`${achievedAchievements.length}/${achievements.length}`}
          />
        </div>
      </div>

      {/* 노선별 진행률 */}
      {lineStats.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-900">노선별 진행률</h2>
          <div className="space-y-4">
            {lineStats.map(line => {
              const percentage = (line.visited_count / line.total_count) * 100;
              const barColor = percentage === 100 ? 'bg-green-600' : 'bg-blue-600';
              console.log(`📈 진행률 바: ${line.line_num} - ${percentage.toFixed(1)}%, 색상: ${barColor}`);

              return (
                <div key={line.line_num}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{line.line_num}</span>
                    <span className="text-sm text-gray-600">
                      {line.visited_count} / {line.total_count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: percentage === 100 ? '#16A34A' : '#2563EB'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value }) {
  // 렌더링 시 색상 체크
  useEffect(() => {
    console.log(`📊 StatBox 렌더: ${label}`, { value });
  }, [label, value]);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-2xl font-bold mb-1 text-gray-900">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function Target({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" strokeWidth="2" />
    </svg>
  );
}
