import api from './axios';

export const visitApi = {
  // 역 방문 인증
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

  // 사용자의 방문 기록 조회
  getVisitsByUser: async (userId) => {
    const response = await api.get(`/visits/${userId}`);
    return response.data;
  }
};
