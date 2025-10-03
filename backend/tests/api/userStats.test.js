const request = require('supertest');
const app = require('../../src/server');
const { pool } = require('../../src/config/database');

describe('UserStats API', () => {
  let testUserId = Date.now();
  let testStationIds = [];

  // 테스트 전 사용자 통계 및 방문 기록 생성
  beforeAll(async () => {
    // 테스트 사용자 통계 생성
    await pool.execute(
      `INSERT INTO user_stats (
        user_id, total_challenges, completed_challenges, failed_challenges,
        success_rate, total_visited_stations, unique_visited_stations,
        total_play_time, current_streak, max_streak, total_score,
        first_challenge_at, last_play_at
      ) VALUES (?, 10, 7, 3, 70.00, 25, 15, 7200, 3, 5, 1500, NOW(), NOW())`,
      [testUserId]
    );

    // 테스트용 역 ID 조회 (1호선 역 5개)
    const [stations] = await pool.execute(
      `SELECT id FROM stations WHERE line_num = '1호선' LIMIT 5`
    );
    testStationIds = stations.map(s => s.id);

    // 방문 기록 추가
    for (let i = 0; i < testStationIds.length; i++) {
      await pool.execute(
        `INSERT INTO user_visited_stations (user_id, station_id, visit_count, first_visit_at, last_visit_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [testUserId, testStationIds[i], i + 1]
      );
    }

    // 테스트용 도전 기록 추가
    for (let i = 0; i < 3; i++) {
      await pool.execute(
        `INSERT INTO challenges (user_id, line_num, total_stations, status, score, started_at, completed_at)
         VALUES (?, '1호선', 10, ?, 200, NOW(), NOW())`,
        [testUserId, i < 2 ? 'completed' : 'failed']
      );
    }
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await pool.execute('DELETE FROM challenges WHERE user_id = ?', [testUserId]);
    await pool.execute('DELETE FROM user_visited_stations WHERE user_id = ?', [testUserId]);
    await pool.execute('DELETE FROM user_stats WHERE user_id = ?', [testUserId]);
    await pool.end();
  });

  describe('GET /api/users/:userId/stats', () => {
    test('사용자 통계를 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/stats`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user_id');
      expect(response.body).toHaveProperty('total_challenges');
      expect(response.body).toHaveProperty('completed_challenges');
      expect(response.body).toHaveProperty('failed_challenges');
      expect(response.body).toHaveProperty('success_rate');
      expect(response.body).toHaveProperty('total_visited_stations');
      expect(response.body).toHaveProperty('unique_visited_stations');
      expect(response.body).toHaveProperty('total_play_time');
      expect(response.body).toHaveProperty('current_streak');
      expect(response.body).toHaveProperty('max_streak');
      expect(response.body).toHaveProperty('total_score');

      expect(Number(response.body.user_id)).toBe(testUserId);
      expect(response.body.total_challenges).toBe(10);
      expect(response.body.completed_challenges).toBe(7);
      expect(parseFloat(response.body.success_rate)).toBeCloseTo(70.00, 2);
    });

    test('통계가 없는 사용자는 기본값을 반환해야 함', async () => {
      const nonExistentUserId = 999999999;
      const response = await request(app)
        .get(`/api/users/${nonExistentUserId}/stats`)
        .expect(200);

      expect(Number(response.body.user_id)).toBe(nonExistentUserId);
      expect(response.body.total_challenges).toBe(0);
      expect(response.body.completed_challenges).toBe(0);
      expect(response.body.failed_challenges).toBe(0);
      expect(response.body.success_rate).toBe(0.00);
      expect(response.body.total_score).toBe(0);
    });
  });

  describe('GET /api/users/:userId/visited-stations', () => {
    test('방문한 역 목록을 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/visited-stations`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('stations');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(Array.isArray(response.body.stations)).toBe(true);
      expect(response.body.stations.length).toBeGreaterThan(0);

      // 각 역 정보가 필수 필드를 가져야 함
      response.body.stations.forEach(station => {
        expect(station).toHaveProperty('station_id');
        expect(station).toHaveProperty('station_nm');
        expect(station).toHaveProperty('line_num');
        expect(station).toHaveProperty('first_visit_at');
        expect(station).toHaveProperty('visit_count');
        expect(station).toHaveProperty('last_visit_at');
      });

      expect(response.body.total).toBe(testStationIds.length);
    });

    test('limit 파라미터가 동작해야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/visited-stations?limit=3`)
        .expect(200);

      expect(response.body.stations.length).toBeLessThanOrEqual(3);
      expect(response.body.limit).toBe(3);
    });

    test('offset 파라미터가 동작해야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/visited-stations?limit=2&offset=2`)
        .expect(200);

      expect(response.body.offset).toBe(2);
    });

    test('방문한 역이 없는 사용자는 빈 배열을 반환해야 함', async () => {
      const nonExistentUserId = 999999999;
      const response = await request(app)
        .get(`/api/users/${nonExistentUserId}/visited-stations`)
        .expect(200);

      expect(response.body.stations).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    test('최근 방문 순서로 정렬되어야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/visited-stations`)
        .expect(200);

      if (response.body.stations.length > 1) {
        const dates = response.body.stations.map(s => new Date(s.last_visit_at));
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
        }
      }
    });
  });

  describe('GET /api/users/:userId/line-stats', () => {
    test('노선별 통계를 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/line-stats`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // 각 노선 통계가 필수 필드를 가져야 함
      response.body.forEach(lineStat => {
        expect(lineStat).toHaveProperty('line_num');
        expect(lineStat).toHaveProperty('visited_count');
        expect(lineStat).toHaveProperty('total_count');
        expect(lineStat).toHaveProperty('completion_rate');
        expect(Number(lineStat.total_count)).toBeGreaterThan(0);
        expect(Number(lineStat.visited_count)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(lineStat.completion_rate)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(lineStat.completion_rate)).toBeLessThanOrEqual(100);
      });
    });

    test('1호선의 방문 역 수가 정확해야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/line-stats`)
        .expect(200);

      const line1Stats = response.body.find(stat => stat.line_num === '1호선');
      expect(line1Stats).toBeDefined();
      expect(line1Stats.visited_count).toBe(testStationIds.length);
    });

    test('완료율 기준으로 정렬되어야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/line-stats`)
        .expect(200);

      if (response.body.length > 1) {
        const rates = response.body.map(stat => parseFloat(stat.completion_rate));
        for (let i = 0; i < rates.length - 1; i++) {
          expect(rates[i]).toBeGreaterThanOrEqual(rates[i + 1]);
        }
      }
    });

    test('방문한 역이 없는 사용자도 모든 노선 통계를 반환해야 함', async () => {
      const nonExistentUserId = 999999999;
      const response = await request(app)
        .get(`/api/users/${nonExistentUserId}/line-stats`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // 방문한 역이 없으므로 모든 노선의 visited_count가 0이어야 함
      response.body.forEach(lineStat => {
        expect(Number(lineStat.visited_count)).toBe(0);
        expect(parseFloat(lineStat.completion_rate)).toBe(0);
      });
    });
  });

  describe('GET /api/users/:userId/recent-activities', () => {
    test('최근 활동 내역을 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/recent-activities`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // 각 활동이 필수 필드를 가져야 함
      response.body.forEach(activity => {
        expect(activity).toHaveProperty('challenge_id');
        expect(activity).toHaveProperty('line_num');
        expect(activity).toHaveProperty('status');
        expect(activity).toHaveProperty('total_stations');
        expect(activity).toHaveProperty('started_at');
      });
    });

    test('최근 순서로 정렬되어야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/recent-activities`)
        .expect(200);

      if (response.body.length > 1) {
        const dates = response.body.map(a => new Date(a.started_at));
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
        }
      }
    });

    test('limit 파라미터가 동작해야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/recent-activities?limit=2`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(2);
    });

    test('활동이 없는 사용자는 빈 배열을 반환해야 함', async () => {
      const nonExistentUserId = 999999999;
      const response = await request(app)
        .get(`/api/users/${nonExistentUserId}/recent-activities`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
