const request = require('supertest');
const app = require('../../src/server');
const { pool } = require('../../src/config/database');

describe('Leaderboard API', () => {
  let testUserIds = [];

  // 테스트 전 여러 사용자 통계 생성
  beforeAll(async () => {
    const baseTime = Date.now();

    // 5명의 테스트 사용자 생성
    for (let i = 0; i < 5; i++) {
      const userId = baseTime + i;
      testUserIds.push(userId);

      await pool.execute(
        `INSERT INTO user_stats (
          user_id, total_challenges, completed_challenges, failed_challenges,
          success_rate, unique_visited_stations, max_streak, total_score,
          first_challenge_at, last_challenge_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          10 + i * 5,           // total_challenges
          8 + i * 3,            // completed_challenges
          2 + i * 2,            // failed_challenges
          80 - i * 5,           // success_rate
          20 + i * 10,          // unique_visited_stations
          5 + i * 2,            // max_streak
          1000 + i * 500        // total_score
        ]
      );

      // 최근 도전 기록 추가 (주간 랭킹용)
      await pool.execute(
        `INSERT INTO challenges (user_id, line_num, total_stations, status, score, started_at)
         VALUES (?, '1호선', 10, 'completed', ?, NOW())`,
        [userId, 100 + i * 50]
      );
    }
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    for (const userId of testUserIds) {
      await pool.execute('DELETE FROM challenges WHERE user_id = ?', [userId]);
      await pool.execute('DELETE FROM user_stats WHERE user_id = ?', [userId]);
    }
    await pool.end();
  });

  describe('GET /api/leaderboard', () => {
    test('전체 랭킹을 반환해야 함', async () => {
      const response = await request(app)
        .get('/api/leaderboard')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('rankings');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(Array.isArray(response.body.rankings)).toBe(true);
      expect(response.body.rankings.length).toBeGreaterThan(0);

      // 각 랭킹 항목이 필수 필드를 가져야 함
      response.body.rankings.forEach(ranking => {
        expect(ranking).toHaveProperty('rank');
        expect(ranking).toHaveProperty('user_id');
        expect(ranking).toHaveProperty('total_score');
        expect(ranking).toHaveProperty('total_challenges');
        expect(ranking).toHaveProperty('success_rate');
      });
    });

    test('점수 기준 정렬이 동작해야 함', async () => {
      const response = await request(app)
        .get('/api/leaderboard?type=score')
        .expect(200);

      const scores = response.body.rankings.map(r => r.total_score);
      const sortedScores = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sortedScores);
    });

    test('스트릭 기준 정렬이 동작해야 함', async () => {
      const response = await request(app)
        .get('/api/leaderboard?type=streak')
        .expect(200);

      const streaks = response.body.rankings.map(r => r.max_streak);
      const sortedStreaks = [...streaks].sort((a, b) => b - a);
      expect(streaks).toEqual(sortedStreaks);
    });

    test('방문 역 수 기준 정렬이 동작해야 함', async () => {
      const response = await request(app)
        .get('/api/leaderboard?type=stations')
        .expect(200);

      const stations = response.body.rankings.map(r => r.unique_visited_stations);
      const sortedStations = [...stations].sort((a, b) => b - a);
      expect(stations).toEqual(sortedStations);
    });

    test('성공률 기준 정렬이 동작해야 함', async () => {
      const response = await request(app)
        .get('/api/leaderboard?type=success_rate')
        .expect(200);

      const rates = response.body.rankings.map(r => parseFloat(r.success_rate));
      const sortedRates = [...rates].sort((a, b) => b - a);
      expect(rates).toEqual(sortedRates);
    });

    test('limit 파라미터가 동작해야 함', async () => {
      const response = await request(app)
        .get('/api/leaderboard?limit=3')
        .expect(200);

      expect(response.body.rankings.length).toBeLessThanOrEqual(3);
      expect(response.body.limit).toBe(3);
    });

    test('offset 파라미터가 동작해야 함', async () => {
      const response1 = await request(app)
        .get('/api/leaderboard?limit=2&offset=0')
        .expect(200);

      const response2 = await request(app)
        .get('/api/leaderboard?limit=2&offset=2')
        .expect(200);

      // offset이 적용되면 다른 사용자가 조회되어야 함
      if (response1.body.rankings.length > 0 && response2.body.rankings.length > 0) {
        expect(response1.body.rankings[0].user_id).not.toBe(response2.body.rankings[0].user_id);
      }

      expect(response1.body.rankings[0].rank).toBe(1);
      expect(response2.body.rankings[0].rank).toBe(3);
    });
  });

  describe('GET /api/leaderboard/weekly', () => {
    test('주간 랭킹을 반환해야 함', async () => {
      const response = await request(app)
        .get('/api/leaderboard/weekly')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('rankings');
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.period).toBe('weekly');
      expect(Array.isArray(response.body.rankings)).toBe(true);

      // 주간 랭킹 항목이 필수 필드를 가져야 함
      if (response.body.rankings.length > 0) {
        response.body.rankings.forEach(ranking => {
          expect(ranking).toHaveProperty('rank');
          expect(ranking).toHaveProperty('user_id');
          expect(ranking).toHaveProperty('weekly_challenges');
          expect(ranking).toHaveProperty('weekly_completed');
          expect(ranking).toHaveProperty('weekly_score');
          expect(ranking).toHaveProperty('weekly_success_rate');
        });
      }
    });

    test('주간 점수 기준으로 정렬되어야 함', async () => {
      const response = await request(app)
        .get('/api/leaderboard/weekly')
        .expect(200);

      if (response.body.rankings.length > 1) {
        const scores = response.body.rankings.map(r => r.weekly_score);
        const sortedScores = [...scores].sort((a, b) => b - a);
        expect(scores).toEqual(sortedScores);
      }
    });

    test('limit 파라미터가 동작해야 함', async () => {
      const response = await request(app)
        .get('/api/leaderboard/weekly?limit=3')
        .expect(200);

      expect(response.body.rankings.length).toBeLessThanOrEqual(3);
      expect(response.body.limit).toBe(3);
    });
  });

  describe('GET /api/users/:userId/rank', () => {
    test('사용자 순위를 반환해야 함', async () => {
      const testUserId = testUserIds[0];
      const response = await request(app)
        .get(`/api/users/${testUserId}/rank`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user_id');
      expect(response.body).toHaveProperty('ranks');
      expect(response.body).toHaveProperty('stats');
      expect(Number(response.body.user_id)).toBe(testUserId);

      // 모든 순위 타입이 포함되어야 함
      expect(response.body.ranks).toHaveProperty('score');
      expect(response.body.ranks).toHaveProperty('streak');
      expect(response.body.ranks).toHaveProperty('stations');
      expect(response.body.ranks).toHaveProperty('success_rate');

      // 순위는 1 이상이어야 함
      expect(response.body.ranks.score).toBeGreaterThanOrEqual(1);
      expect(response.body.ranks.streak).toBeGreaterThanOrEqual(1);
      expect(response.body.ranks.stations).toBeGreaterThanOrEqual(1);
      expect(response.body.ranks.success_rate).toBeGreaterThanOrEqual(1);
    });

    test('통계가 없는 사용자는 null 순위를 반환해야 함', async () => {
      const nonExistentUserId = 999999999;
      const response = await request(app)
        .get(`/api/users/${nonExistentUserId}/rank`)
        .expect(200);

      expect(Number(response.body.user_id)).toBe(nonExistentUserId);
      expect(response.body.ranks.score).toBeNull();
      expect(response.body.ranks.streak).toBeNull();
      expect(response.body.ranks.stations).toBeNull();
      expect(response.body.ranks.success_rate).toBeNull();
      expect(response.body.stats).toBeNull();
    });

    test('높은 점수를 가진 사용자가 더 높은 순위를 가져야 함', async () => {
      // 가장 높은 점수의 사용자 (testUserIds[4])
      const highScoreUserId = testUserIds[4];
      const highScoreResponse = await request(app)
        .get(`/api/users/${highScoreUserId}/rank`)
        .expect(200);

      // 가장 낮은 점수의 사용자 (testUserIds[0])
      const lowScoreUserId = testUserIds[0];
      const lowScoreResponse = await request(app)
        .get(`/api/users/${lowScoreUserId}/rank`)
        .expect(200);

      expect(highScoreResponse.body.ranks.score).toBeLessThan(lowScoreResponse.body.ranks.score);
    });
  });
});
