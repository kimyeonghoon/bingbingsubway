import api from './axios';

export const challengeApi = {
  // 새 도전 생성
  createChallenge: async (userId, lineName, stationCount) => {
    const response = await api.post('/challenges', {
      userId,
      lineName,
      stationCount
    });
    return response.data;
  },

  // 사용자의 도전 목록 조회
  getChallengesByUser: async (userId) => {
    const response = await api.get(`/challenges/${userId}`);
    return response.data;
  },

  // 도전의 역 목록 및 방문 상태 조회
  getChallengeStations: async (challengeId) => {
    const response = await api.get(`/challenges/${challengeId}/stations`);
    return response.data;
  }
};
