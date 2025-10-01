const request = require('supertest');
const app = require('../../src/server');
const { pool } = require('../../src/config/database');

describe('Station API', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/lines', () => {
    test('모든 노선 목록을 반환해야 함', async () => {
      const response = await request(app)
        .get('/api/lines')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/lines/:lineName/stations', () => {
    test('1호선의 모든 역을 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/lines/${encodeURIComponent('1호선')}/stations`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('station_nm');
      expect(response.body[0]).toHaveProperty('latitude');
      expect(response.body[0]).toHaveProperty('longitude');
    });

    test('존재하지 않는 노선은 404를 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/lines/${encodeURIComponent('99호선')}/stations`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/stations/:id', () => {
    test('특정 역의 상세 정보를 반환해야 함', async () => {
      // 먼저 1호선의 첫 번째 역 ID를 가져옴
      const stationsResponse = await request(app)
        .get(`/api/lines/${encodeURIComponent('1호선')}/stations`);

      const firstStationId = stationsResponse.body[0].id;

      const response = await request(app)
        .get(`/api/stations/${firstStationId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('station_nm');
      expect(response.body).toHaveProperty('latitude');
      expect(response.body).toHaveProperty('longitude');
    });

    test('존재하지 않는 역 ID는 404를 반환해야 함', async () => {
      const response = await request(app)
        .get('/api/stations/999999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/lines/:lineName/random', () => {
    test('랜덤으로 10개의 역을 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/lines/${encodeURIComponent('1호선')}/random?count=10`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(10);
      expect(response.body[0]).toHaveProperty('station_nm');
    });

    test('count 파라미터가 없으면 기본값 10을 사용해야 함', async () => {
      const response = await request(app)
        .get(`/api/lines/${encodeURIComponent('1호선')}/random`)
        .expect(200);

      expect(response.body.length).toBe(10);
    });

    test('역 개수보다 많은 수를 요청하면 400을 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/lines/${encodeURIComponent('1호선')}/random?count=1000`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Health Check', () => {
    test('헬스체크 엔드포인트가 정상 작동해야 함', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
