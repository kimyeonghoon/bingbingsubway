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
        <div className="text-white text-lg">통계 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-300 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 relative z-10">
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
      <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/70 mb-2 font-semibold">총 점수</div>
            <div className="text-4xl font-bold text-white">
              {stats?.total_score?.toLocaleString() || 0}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/70 mb-2 font-semibold">평균 시간</div>
            <div className="text-3xl font-bold text-white">
              {stats?.average_time ? `${Math.floor(stats.average_time / 60)}분` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 노선별 통계 */}
      {lineStats.length > 0 && (
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
            <TrendingUp className="w-6 h-6 mr-2 text-blue-400" />
            노선별 통계
          </h2>
          <div className="space-y-4">
            {lineStats.map((line) => (
              <LineStatBar key={line.line_num} line={line} />
            ))}
          </div>
        </div>
      )}

      {/* 최근 활동 */}
      {recentActivities.length > 0 && (
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
            <Clock className="w-6 h-6 mr-2 text-blue-400" />
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
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-5 shadow-xl hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        {icon}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/70 font-semibold">{label}</div>
    </div>
  );
}

function LineStatBar({ line }) {
  const percentage = (line.visited_count / line.total_count) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="font-bold text-white">{line.line_num}</span>
        <span className="text-white/70 font-semibold">
          {line.visited_count} / {line.total_count}
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 shadow-lg"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-white/60 mt-1 font-semibold">
        {percentage.toFixed(1)}% 완료
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  const isSuccess = activity.status === 'completed';
  const date = activity.started_at ? new Date(activity.started_at) : null;
  const timeAgo = date && !isNaN(date) ? getTimeAgo(date) : '-';

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${isSuccess ? 'bg-green-400 shadow-lg shadow-green-500/50' : 'bg-red-400 shadow-lg shadow-red-500/50'}`} />
        <div>
          <div className="font-bold text-white">{activity.line_num}</div>
          <div className="text-sm text-white/70">
            {activity.final_station_name || '역 선택'} 방문
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-bold ${isSuccess ? 'text-green-300' : 'text-red-300'}`}>
          {isSuccess ? '성공' : '실패'}
        </div>
        <div className="text-xs text-white/60">{timeAgo}</div>
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
