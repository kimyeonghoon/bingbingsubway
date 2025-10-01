import { useState, useEffect } from 'react';
import { achievementApi } from '../services/api';
import { Trophy, Lock, Star, Award } from 'lucide-react';

export default function AchievementsPage({ userId }) {
  const [achievements, setAchievements] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [total, setTotal] = useState(0);
  const [achieved, setAchieved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await achievementApi.getUserAchievements(userId);
      setAchievements(data.achievements || []);
      setGrouped(data.grouped || {});
      setTotal(data.total || 0);
      setAchieved(data.achieved || 0);
    } catch (err) {
      setError('업적을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = {
    all: '전체',
    beginner: '시작',
    streak: '연승',
    explorer: '탐험',
    speed: '속도',
    master: '마스터',
    perfect: '완벽'
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const achievedCount = filteredAchievements.filter(a => a.is_achieved).length;
  const totalCount = filteredAchievements.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">업적 불러오는 중...</div>
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
      {/* 헤더 */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-3 flex items-center">
              <Trophy className="w-10 h-10 mr-3 text-yellow-400" />
              업적
            </h1>
            <p className="text-yellow-200 text-lg font-semibold">
              {achieved} / {total} 달성 ({((achieved / total) * 100).toFixed(1)}%)
            </p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold text-yellow-300">{achieved}</div>
            <div className="text-sm text-yellow-200 font-semibold">달성한 업적</div>
          </div>
        </div>
        {/* 진행률 바 */}
        <div className="mt-6 bg-white/10 rounded-full h-4 overflow-hidden border border-white/20">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full h-4 transition-all duration-500 shadow-lg"
            style={{ width: `${(achieved / total) * 100}%` }}
          />
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Object.entries(categories).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
              selectedCategory === key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                : 'backdrop-blur-sm bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            {label}
            {key !== 'all' && grouped[key] && (
              <span className="ml-2 text-xs opacity-80">
                ({grouped[key].filter(a => a.is_achieved).length}/{grouped[key].length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 업적 목록 */}
      <div className="space-y-4">
        {filteredAchievements.length === 0 ? (
          <div className="text-center text-white/60 py-12">
            업적이 없습니다.
          </div>
        ) : (
          filteredAchievements.map(achievement => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
            />
          ))
        )}
      </div>

      {/* 하단 통계 */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
        <div className="text-center backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-4">
          <div className="text-4xl font-bold text-blue-300">{achievedCount}</div>
          <div className="text-sm text-white/70 font-semibold">현재 카테고리 달성</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">
            {achievements.reduce((sum, a) => sum + (a.is_achieved ? a.points : 0), 0)}
          </div>
          <div className="text-sm text-gray-600">획득한 포인트</div>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievement }) {
  const isAchieved = achievement.is_achieved;
  const tierColors = {
    bronze: 'from-orange-400 to-orange-600',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-cyan-400 to-blue-600',
    diamond: 'from-purple-400 to-pink-600'
  };

  const tierBorder = {
    bronze: 'border-orange-400',
    silver: 'border-gray-400',
    gold: 'border-yellow-400',
    platinum: 'border-cyan-400',
    diamond: 'border-purple-400'
  };

  return (
    <div
      className={`backdrop-blur-xl rounded-xl p-5 shadow-xl border-2 transition-all duration-300 ${
        isAchieved
          ? `bg-white/10 ${tierBorder[achievement.tier]} shadow-2xl hover:scale-105`
          : 'bg-white/5 border-white/10 opacity-50'
      }`}
    >
      <div className="flex items-start space-x-4">
        {/* 아이콘 */}
        <div
          className={`flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-4xl ${
            isAchieved
              ? `bg-gradient-to-br ${tierColors[achievement.tier]} text-white shadow-lg shadow-${achievement.tier}-500/50`
              : 'bg-white/10 grayscale'
          }`}
        >
          {isAchieved ? achievement.icon : <Lock className="w-8 h-8 text-gray-400" />}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-bold text-xl ${isAchieved ? 'text-white' : 'text-white/40'}`}>
              {achievement.name}
            </h3>
            <div className="flex items-center space-x-2">
              {isAchieved && (
                <Star className="w-6 h-6 text-yellow-400 fill-current" />
              )}
              <span className={`text-sm font-bold ${isAchieved ? 'text-blue-300' : 'text-white/30'}`}>
                {Number(achievement.points)}P
              </span>
            </div>
          </div>

          <p className={`text-sm mb-3 ${isAchieved ? 'text-white/80' : 'text-white/30'}`}>
            {achievement.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                isAchieved
                  ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {getCategoryLabel(achievement.category)}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isAchieved
                  ? `bg-gradient-to-r ${tierColors[achievement.tier]} text-white`
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {getTierLabel(achievement.tier)}
              </span>
            </div>

            {isAchieved && achievement.achieved_at && (
              <div className="text-xs text-gray-500">
                {new Date(achievement.achieved_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* 조건 표시 */}
          {!isAchieved && (
            <div className="mt-2 text-xs text-gray-500">
              조건: {getConditionText(achievement)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryLabel(category) {
  const labels = {
    beginner: '시작',
    streak: '연승',
    explorer: '탐험',
    speed: '속도',
    master: '마스터',
    perfect: '완벽'
  };
  return labels[category] || category;
}

function getTierLabel(tier) {
  const labels = {
    bronze: '브론즈',
    silver: '실버',
    gold: '골드',
    platinum: '플래티넘',
    diamond: '다이아몬드'
  };
  return labels[tier] || tier;
}

function getConditionText(achievement) {
  const { condition_type, condition_value } = achievement;

  switch (condition_type) {
    case 'challenge_count':
      return `도전 ${condition_value}회`;
    case 'success_count':
      return `성공 ${condition_value}회`;
    case 'streak':
      return `연속 ${condition_value}회 성공`;
    case 'station_count':
      return `${condition_value}개 역 방문`;
    case 'time':
      return `${Math.floor(condition_value / 60)}분 이내 완료`;
    case 'line_complete':
      return condition_value === 0 ? '모든 노선 완료' : '특정 노선 완료';
    default:
      return '조건 확인 필요';
  }
}
