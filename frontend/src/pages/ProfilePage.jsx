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
    <div className="max-w-4xl mx-auto p-4 space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      {/* 프로필 헤더 */}
      <div className="relative overflow-hidden rounded-3xl p-8 shadow-2xl bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 bg-white blur-3xl"></div>
        <div className="relative z-10 flex items-center space-x-4 mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm border-2 border-white/30">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1 text-white">사용자 {userId}</h1>
            <p className="text-blue-100 text-lg">
              {stats?.first_challenge_at
                ? `${new Date(stats.first_challenge_at).toLocaleDateString()} 가입`
                : '신규 사용자'}
            </p>
          </div>
        </div>

        {/* 주요 통계 */}
        <div className="relative z-10 grid grid-cols-4 gap-4">
          <StatBox
            icon={<Trophy className="w-6 h-6 text-yellow-600" />}
            label="총 점수"
            value={stats?.total_score?.toLocaleString() || 0}
          />
          <StatBox
            icon={<Target className="w-6 h-6 text-blue-600" />}
            label="성공률"
            value={`${stats?.success_rate?.toFixed(1) || 0}%`}
          />
          <StatBox
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="최대 연승"
            value={stats?.max_streak || 0}
          />
          <StatBox
            icon={<MapPin className="w-6 h-6 text-purple-600" />}
            label="방문 역"
            value={stats?.unique_visited_stations || 0}
          />
        </div>
      </div>

      {/* 대표 업적 */}
      {topAchievements.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm border-2 border-yellow-300 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            <Award className="w-5 h-5 mr-2 text-yellow-600" />
            대표 업적
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topAchievements.map(achievement => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-400 shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <div className="font-bold text-gray-900 mb-1">{achievement.name}</div>
                <div className="text-sm text-gray-600 mb-2">{achievement.description}</div>
                <div className="text-xs text-yellow-700 font-bold">
                  +{Number(achievement.points)} 포인트
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 가장 많이 방문한 역 */}
      {visitedStations.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm border-2 border-green-300 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            <MapPin className="w-5 h-5 mr-2 text-green-600" />
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
        <div className="bg-white/90 backdrop-blur-sm border-2 border-purple-300 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <Star className="w-5 h-5 mr-2 text-purple-600" />
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
      <div className="bg-white/90 backdrop-blur-sm border-2 border-blue-300 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4 flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
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
        <div className="bg-white/90 backdrop-blur-sm border-2 border-indigo-300 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">노선별 진행률</h2>
          <div className="space-y-4">
            {lineStats.map(line => {
              const percentage = (line.visited_count / line.total_count) * 100;
              const isComplete = percentage === 100;

              return (
                <div key={line.line_num}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{line.line_num}</span>
                    <span className="text-sm text-gray-600 font-semibold">
                      {line.visited_count} / {line.total_count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
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
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 text-center bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-3xl font-bold mb-1 text-white">{value}</div>
      <div className="text-sm text-white/90 font-medium">{label}</div>
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
