const request = require('supertest');
const app = require('../../src/server');
const { pool } = require('../../src/config/database');

describe('Visit API', () => {
  let testUserId = 'test-user-visit-' + Date.now();
  let challengeId;
  let stationId;
  let stationLat;
  let stationLon;

  beforeAll(async () => {
    // 테스트용 도전 생성
    const response = await request(app)
      .post('/api/challenges')
      .send({
        userId: Date.now(),  // 숫자 타입으로 변경
        lineName: '1호선',
        stationCount: 3
      })
      .expect(201);

    challengeId = response.body.challengeId;
    stationId = response.body.stations[0].id;
    stationLat = parseFloat(response.body.stations[0].latitude);
    stationLon = parseFloat(response.body.stations[0].longitude);
    testUserId = response.body.challengeId; // userId를 challengeId로 사용
  }, 10000);

  afterAll(async () => {
    // 테스트 데이터 정리
    if (challengeId) {
      await pool.execute('DELETE FROM visits WHERE challenge_id = ?', [challengeId]);
      await pool.execute('DELETE FROM challenges WHERE id = ?', [challengeId]);
    }
    await pool.end();
  });

  describe('POST /api/visits', () => {
    test('역 근처에서 방문 인증에 성공해야 함', async () => {
      const response = await request(app)
        .post('/api/visits')
        .send({
          challengeId,
          userId: testUserId,
          stationId,
          latitude: stationLat,
          longitude: stationLon
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('stationName');
      expect(response.body).toHaveProperty('distance');
      expect(response.body.distance).toBeLessThan(100);
    });

    test('이미 인증된 역은 중복 인증할 수 없어야 함', async () => {
      const response = await request(app)
        .post('/api/visits')
        .send({
          challengeId,
          userId: testUserId,
          stationId,
          latitude: stationLat,
          longitude: stationLon
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('이미 인증');
    });

    test('역에서 멀리 떨어진 곳에서는 인증 실패해야 함', async () => {
      // 도전의 두 번째 역 사용
      const stationsResponse = await request(app)
        .get(`/api/challenges/${challengeId}/stations`);

      const secondStation = stationsResponse.body[1];

      // 역에서 약 1km 떨어진 좌표
      const farLat = parseFloat(secondStation.latitude) + 0.01;
      const farLon = parseFloat(secondStation.longitude) + 0.01;

      const response = await request(app)
        .post('/api/visits')
        .send({
          challengeId,
          userId: testUserId,
          stationId: secondStation.id,
          latitude: farLat,
          longitude: farLon
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('distance');
      expect(response.body.distance).toBeGreaterThan(100);
    });

    test('필수 파라미터 누락 시 400을 반환해야 함', async () => {
      const response = await request(app)
        .post('/api/visits')
        .send({
          challengeId,
          userId: testUserId,
          stationId
          // latitude, longitude 누락
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('존재하지 않는 도전 ID는 404를 반환해야 함', async () => {
      const response = await request(app)
        .post('/api/visits')
        .send({
          challengeId: 999999,
          userId: testUserId,
          stationId,
          latitude: stationLat,
          longitude: stationLon
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/visits/:userId', () => {
    test('사용자의 방문 기록을 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/visits/${testUserId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('station_nm');
      expect(response.body[0]).toHaveProperty('is_verified');
    });
  });
});
