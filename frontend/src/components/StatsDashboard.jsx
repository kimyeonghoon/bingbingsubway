import { useState, useEffect } from 'react';
import { userStatsApi } from '../services/api';
import { Trophy, Target, Flame, MapPin, Clock, TrendingUp } from 'lucide-react';

export default function StatsDashboard({ userId }) {
  const [stats, setStats] = useState(null);
  const [lineStats, setLineStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, lineStatsData, activitiesData] = await Promise.all([
        userStatsApi.getUserStats(userId),
        userStatsApi.getLineStats(userId),
        userStatsApi.getRecentActivities(userId, 10)
      ]);

      setStats(statsData);
      setLineStats(lineStatsData);
      setRecentActivities(activitiesData);
    } catch (err) {
      setError('통계를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">통계 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 기본 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-6 h-6 text-blue-500" />}
          label="총 도전"
          value={stats?.total_challenges || 0}
        />
        <StatCard
          icon={<Trophy className="w-6 h-6 text-yellow-500" />}
          label="성공률"
          value={`${stats?.success_rate?.toFixed(1) || 0}%`}
        />
        <StatCard
          icon={<Flame className="w-6 h-6 text-orange-500" />}
          label="최대 연승"
          value={stats?.max_streak || 0}
        />
        <StatCard
          icon={<MapPin className="w-6 h-6 text-green-500" />}
          label="방문 역"
          value={stats?.unique_visited_stations || 0}
        />
      </div>

      {/* 점수 및 시간 */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">총 점수</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.total_score?.toLocaleString() || 0}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">평균 시간</div>
            <div className="text-2xl font-semibold text-purple-600">
              {stats?.average_time ? `${Math.floor(stats.average_time / 60)}분` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 노선별 통계 */}
      {lineStats.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            노선별 통계
          </h2>
          <div className="space-y-3">
            {lineStats.map((line) => (
              <LineStatBar key={line.line_num} line={line} />
            ))}
          </div>
        </div>
      )}

      {/* 최근 활동 */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            최근 활동
          </h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function LineStatBar({ line }) {
  const percentage = (line.visited_count / line.total_count) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="font-medium">{line.line_num}</span>
        <span className="text-gray-600">
          {line.visited_count} / {line.total_count}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {percentage.toFixed(1)}% 완료
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  const isSuccess = activity.status === 'completed';
  const date = new Date(activity.created_at);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`} />
        <div>
          <div className="font-medium">{activity.line_num}</div>
          <div className="text-sm text-gray-600">
            {activity.visited_count} / {activity.total_count} 역 방문
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
          {isSuccess ? '성공' : '실패'}
        </div>
        <div className="text-xs text-gray-500">{timeAgo}</div>
      </div>
    </div>
  );
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return '방금 전';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`;

  return date.toLocaleDateString();
}
