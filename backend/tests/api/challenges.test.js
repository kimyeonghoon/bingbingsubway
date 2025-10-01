const request = require('supertest');
const app = require('../../src/server');
const { pool } = require('../../src/config/database');

describe('Challenge API', () => {
  let testUserId = 'test-user-' + Date.now();
  let challengeId;

  afterAll(async () => {
    // 테스트 데이터 정리
    if (challengeId) {
      await pool.execute('DELETE FROM visits WHERE challenge_id = ?', [challengeId]);
      await pool.execute('DELETE FROM challenges WHERE id = ?', [challengeId]);
    }
    await pool.end();
  });

  describe('POST /api/challenges', () => {
    test('새로운 도전을 생성해야 함', async () => {
      const response = await request(app)
        .post('/api/challenges')
        .send({
          userId: testUserId,
          lineName: '1호선',
          stationCount: 5
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('challengeId');
      expect(response.body).toHaveProperty('stations');
      expect(response.body.stations.length).toBe(5);

      // 다음 테스트를 위해 challengeId 저장
      challengeId = response.body.challengeId;
    });

    test('필수 파라미터 누락 시 400을 반환해야 함', async () => {
      const response = await request(app)
        .post('/api/challenges')
        .send({
          userId: testUserId,
          lineName: '1호선'
          // stationCount 누락
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('노선에 역이 부족하면 400을 반환해야 함', async () => {
      const response = await request(app)
        .post('/api/challenges')
        .send({
          userId: testUserId,
          lineName: '1호선',
          stationCount: 1000 // 불가능한 수
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/challenges/:userId', () => {
    test('사용자의 도전 목록을 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/challenges/${testUserId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('line_num');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('GET /api/challenges/:id/stations', () => {
    test('도전의 역 목록과 방문 상태를 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/challenges/${challengeId}/stations`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(5);
      expect(response.body[0]).toHaveProperty('station_nm');
      expect(response.body[0]).toHaveProperty('is_verified');
      expect(response.body[0].is_verified).toBe(0); // 아직 미인증
    });

    test('존재하지 않는 도전 ID는 404를 반환해야 함', async () => {
      const response = await request(app)
        .get('/api/challenges/999999/stations')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
