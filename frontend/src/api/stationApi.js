import api from './axios';

export const stationApi = {
  // 모든 노선 조회
  getLines: async () => {
    const response = await api.get('/lines');
    return response.data;
  },

  // 특정 노선의 역 목록 조회
  getStationsByLine: async (lineName) => {
    const response = await api.get(`/lines/${lineName}/stations`);
    return response.data;
  },

  // 역 상세 정보 조회
  getStationById: async (id) => {
    const response = await api.get(`/stations/${id}`);
    return response.data;
  },

  // 랜덤 역 선택
  getRandomStations: async (lineName, count = 10) => {
    const response = await api.get(`/lines/${lineName}/random`, {
      params: { count }
    });
    return response.data;
  }
};
