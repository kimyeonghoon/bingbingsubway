const request = require('supertest');
const app = require('../../src/server');
const { pool } = require('../../src/config/database');

describe('Challenge API', () => {
  let testUserId;
  let accessToken;
  let challengeId;

  // 테스트 사용자 등록 및 토큰 획득
  beforeAll(async () => {
    const uniqueEmail = `challenge-test-${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password: 'Password123!',
        username: `challenge-user-${Date.now()}`,
      });

    testUserId = res.body.user.id;
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (challengeId) {
      await pool.execute('DELETE FROM visits WHERE challenge_id = ?', [challengeId]);
      await pool.execute('DELETE FROM challenges WHERE id = ?', [challengeId]);
    }
    if (testUserId) {
      await pool.execute('DELETE FROM user_stats WHERE user_id = ?', [testUserId]);
      await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [testUserId]);
      await pool.execute('DELETE FROM users WHERE id = ?', [testUserId]);
    }
    await pool.end();
  });

  describe('POST /api/challenges', () => {
    test('새로운 도전을 생성해야 함', async () => {
      const response = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
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
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lineName: '1호선'
          // stationCount 누락
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('요청한 개수보다 역이 적으면 가능한 만큼 반환해야 함', async () => {
      const response = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lineName: '1호선',
          stationCount: 1000 // 불가능한 수
        })
        .expect(201);

      expect(response.body).toHaveProperty('challengeId');
      expect(response.body).toHaveProperty('stations');
      expect(response.body.stations.length).toBeGreaterThan(0);
      expect(response.body.stations.length).toBeLessThan(1000);
    });
  });

  describe('GET /api/challenges/:userId', () => {
    test('사용자의 도전 목록을 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/challenges/${testUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
