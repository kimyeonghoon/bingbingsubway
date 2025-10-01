import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Error handler with retry logic
const handleApiError = (error, retryFn = null) => {
  const errorResponse = {
    message: '알 수 없는 오류가 발생했습니다.',
    status: error.response?.status,
    retry: retryFn
  };

  if (error.code === 'ECONNABORTED') {
    errorResponse.message = '요청 시간이 초과되었습니다.';
  } else if (error.code === 'ERR_NETWORK') {
    errorResponse.message = '네트워크 연결을 확인해주세요.';
  } else if (error.response) {
    switch (error.response.status) {
      case 400:
        errorResponse.message = error.response.data?.message || '잘못된 요청입니다.';
        break;
      case 401:
        errorResponse.message = '인증이 필요합니다.';
        break;
      case 403:
        errorResponse.message = '접근 권한이 없습니다.';
        break;
      case 404:
        errorResponse.message = '요청한 정보를 찾을 수 없습니다.';
        break;
      case 500:
        errorResponse.message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        break;
      default:
        errorResponse.message = error.response.data?.message || '오류가 발생했습니다.';
    }
  }

  return errorResponse;
};

// Retry helper
const retryRequest = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
};

// 역 정보 API
export const stationApi = {
  getLines: async () => {
    try {
      return await retryRequest(async () => {
        const response = await api.get('/lines');
        return response.data;
      });
    } catch (error) {
      throw handleApiError(error, () => stationApi.getLines());
    }
  },

  getStationsByLine: async (lineName) => {
    try {
      return await retryRequest(async () => {
        const response = await api.get(`/lines/${encodeURIComponent(lineName)}/stations`);
        return response.data;
      });
    } catch (error) {
      throw handleApiError(error, () => stationApi.getStationsByLine(lineName));
    }
  },

  getRandomStations: async (lineName, count = 10) => {
    try {
      return await retryRequest(async () => {
        const response = await api.get(`/lines/${encodeURIComponent(lineName)}/random`, {
          params: { count }
        });
        return response.data;
      });
    } catch (error) {
      throw handleApiError(error, () => stationApi.getRandomStations(lineName, count));
    }
  },

  getStationById: async (stationId) => {
    try {
      return await retryRequest(async () => {
        const response = await api.get(`/stations/${stationId}`);
        return response.data;
      });
    } catch (error) {
      throw handleApiError(error, () => stationApi.getStationById(stationId));
    }
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
  createVisit: async (challengeId, userId, stationId, latitude, longitude, accuracy) => {
    const response = await api.post('/visits', {
      challengeId,
      userId,
      stationId,
      latitude,
      longitude,
      accuracy
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
