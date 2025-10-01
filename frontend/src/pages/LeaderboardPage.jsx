import { useState, useEffect } from 'react';
import { leaderboardApi } from '../services/api';
import { Trophy, TrendingUp, Medal, Crown, Award, Target } from 'lucide-react';

export default function LeaderboardPage({ userId }) {
  const [rankings, setRankings] = useState([]);
  const [total, setTotal] = useState(0);
  const [myRank, setMyRank] = useState(null);
  const [type, setType] = useState('score');
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [type, period]);

  useEffect(() => {
    if (userId) {
      loadMyRank();
    }
  }, [userId]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (period === 'weekly') {
        data = await leaderboardApi.getWeeklyLeaderboard(100);
      } else {
        data = await leaderboardApi.getLeaderboard(type, 100, 0);
      }

      setRankings(data.rankings || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError('랭킹을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRank = async () => {
    try {
      const data = await leaderboardApi.getUserRank(userId);
      setMyRank(data);
    } catch (err) {
      console.error('내 랭킹 조회 실패:', err);
    }
  };

  const types = {
    score: { label: '점수', icon: <Trophy className="w-4 h-4" /> },
    streak: { label: '연승', icon: <TrendingUp className="w-4 h-4" /> },
    stations: { label: '방문 역', icon: <Target className="w-4 h-4" /> },
    success_rate: { label: '성공률', icon: <Award className="w-4 h-4" /> }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">랭킹 불러오는 중...</div>
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
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Crown className="w-8 h-8 mr-2" />
          랭킹
        </h1>
        <p className="text-purple-100">
          전체 {total.toLocaleString()}명의 플레이어
        </p>
      </div>

      {/* 내 랭킹 */}
      {myRank && myRank.stats && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 font-medium mb-1">내 순위</div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">점수</div>
                  <div className="font-bold text-blue-700">#{myRank.ranks.score}</div>
                </div>
                <div>
                  <div className="text-gray-600">연승</div>
                  <div className="font-bold text-blue-700">#{myRank.ranks.streak}</div>
                </div>
                <div>
                  <div className="text-gray-600">방문역</div>
                  <div className="font-bold text-blue-700">#{myRank.ranks.stations}</div>
                </div>
                <div>
                  <div className="text-gray-600">성공률</div>
                  <div className="font-bold text-blue-700">#{myRank.ranks.success_rate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 기간 선택 */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'weekly'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            주간
          </button>
        </div>

        {/* 타입 선택 (전체 기간만) */}
        {period === 'all' && (
          <div className="flex gap-2 flex-wrap">
            {Object.entries(types).map(([key, { label, icon }]) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  type === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 랭킹 목록 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {rankings.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            랭킹 데이터가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rankings.map((user, index) => (
              <RankingItem
                key={user.user_id}
                user={user}
                rank={user.rank}
                type={type}
                period={period}
                isMe={user.user_id === userId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RankingItem({ user, rank, type, period, isMe }) {
  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
        2: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white',
        3: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
      };
      return colors[rank];
    }
    return 'bg-gray-100 text-gray-700';
  };

  const getMainValue = () => {
    if (period === 'weekly') {
      return {
        label: '주간 점수',
        value: user.weekly_score?.toLocaleString() || 0
      };
    }

    switch (type) {
      case 'score':
        return {
          label: '총 점수',
          value: user.total_score?.toLocaleString() || 0
        };
      case 'streak':
        return {
          label: '최대 연승',
          value: user.max_streak || 0
        };
      case 'stations':
        return {
          label: '방문 역',
          value: user.unique_visited_stations || 0
        };
      case 'success_rate':
        return {
          label: '성공률',
          value: `${user.success_rate?.toFixed(1) || 0}%`
        };
      default:
        return { label: '', value: 0 };
    }
  };

  const mainValue = getMainValue();

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors ${
        isMe ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
    >
      <div className="flex items-center space-x-4">
        {/* 순위 */}
        <div className="flex-shrink-0 w-16 text-center">
          {rank <= 3 ? (
            <div className="flex items-center justify-center">
              {getRankIcon(rank)}
            </div>
          ) : (
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getRankBadge(rank)}`}>
              #{rank}
            </div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`font-bold ${isMe ? 'text-blue-600' : 'text-gray-900'}`}>
                사용자 {user.user_id}
              </span>
              {isMe && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  나
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {mainValue.value}
              </div>
              <div className="text-xs text-gray-500">{mainValue.label}</div>
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            {period === 'weekly' ? (
              <>
                <div>
                  <div className="text-gray-600">주간 도전</div>
                  <div className="font-medium">{user.weekly_challenges || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">주간 성공</div>
                  <div className="font-medium">{user.weekly_completed || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">성공률</div>
                  <div className="font-medium">{user.weekly_success_rate?.toFixed(1) || 0}%</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-gray-600">총 도전</div>
                  <div className="font-medium">{user.total_challenges || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">성공</div>
                  <div className="font-medium">{user.completed_challenges || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">업적</div>
                  <div className="font-medium">{user.achievement_count || 0}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
