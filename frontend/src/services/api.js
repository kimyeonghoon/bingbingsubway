import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 역 정보 API
export const stationApi = {
  getLines: async () => {
    const response = await api.get('/lines');
    return response.data;
  },

  getStationsByLine: async (lineName) => {
    const response = await api.get(`/lines/${encodeURIComponent(lineName)}/stations`);
    return response.data;
  },

  getRandomStations: async (lineName, count = 10) => {
    const response = await api.get(`/lines/${encodeURIComponent(lineName)}/random`, {
      params: { count }
    });
    return response.data;
  },

  getStationById: async (stationId) => {
    const response = await api.get(`/stations/${stationId}`);
    return response.data;
  }
};

// 도전 API
export const challengeApi = {
  createChallenge: async (userId, lineName, stationCount) => {
    const response = await api.post('/challenges', {
      userId,
      lineName,
      stationCount
    });
    return response.data;
  },

  getChallengesByUser: async (userId) => {
    const response = await api.get(`/challenges/${userId}`);
    return response.data;
  },

  getChallengeStations: async (challengeId) => {
    const response = await api.get(`/challenges/${challengeId}/stations`);
    return response.data;
  },

  completeChallenge: async (challengeId, userId) => {
    const response = await api.post(`/challenges/${challengeId}/complete`, {
      userId
    });
    return response.data;
  },

  failChallenge: async (challengeId, userId, reason = 'timeout') => {
    const response = await api.post(`/challenges/${challengeId}/fail`, {
      userId,
      reason
    });
    return response.data;
  }
};

// 방문 인증 API
export const visitApi = {
  createVisit: async (challengeId, userId, stationId, latitude, longitude) => {
    const response = await api.post('/visits', {
      challengeId,
      userId,
      stationId,
      latitude,
      longitude
    });
    return response.data;
  },

  getVisitsByUser: async (userId) => {
    const response = await api.get(`/visits/${userId}`);
    return response.data;
  }
};

// 사용자 통계 API
export const userStatsApi = {
  getUserStats: async (userId) => {
    const response = await api.get(`/users/${userId}/stats`);
    return response.data;
  },

  getVisitedStations: async (userId, limit = 100, offset = 0) => {
    const response = await api.get(`/users/${userId}/visited-stations`, {
      params: { limit, offset }
    });
    return response.data;
  },

  getLineStats: async (userId) => {
    const response = await api.get(`/users/${userId}/line-stats`);
    return response.data;
  },

  getRecentActivities: async (userId, limit = 20) => {
    const response = await api.get(`/users/${userId}/recent-activities`, {
      params: { limit }
    });
    return response.data;
  }
};

// 업적 API
export const achievementApi = {
  getAllAchievements: async (category = null, tier = null) => {
    const response = await api.get('/achievements', {
      params: { category, tier }
    });
    return response.data;
  },

  getUserAchievements: async (userId) => {
    const response = await api.get(`/users/${userId}/achievements`);
    return response.data;
  },

  getAchievementProgress: async (userId) => {
    const response = await api.get(`/users/${userId}/achievements/progress`);
    return response.data;
  }
};

// 랭킹 API
export const leaderboardApi = {
  getLeaderboard: async (type = 'score', limit = 100, offset = 0) => {
    const response = await api.get('/leaderboard', {
      params: { type, limit, offset }
    });
    return response.data;
  },

  getWeeklyLeaderboard: async (limit = 100) => {
    const response = await api.get('/leaderboard/weekly', {
      params: { limit }
    });
    return response.data;
  },

  getUserRank: async (userId) => {
    const response = await api.get(`/users/${userId}/rank`);
    return response.data;
  }
};

export default api;
