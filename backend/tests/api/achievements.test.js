const request = require('supertest');
const app = require('../../src/server');
const { pool } = require('../../src/config/database');

describe('Achievement API', () => {
  let testUserId = Date.now();
  let testChallengeId;

  // 테스트 전 사용자 통계 및 도전 생성
  beforeAll(async () => {
    // 테스트 사용자 통계 생성
    await pool.execute(
      `INSERT INTO user_stats (
        user_id, total_challenges, completed_challenges, failed_challenges,
        success_rate, total_visited_stations, unique_visited_stations,
        total_play_time, current_streak, max_streak, total_score,
        first_challenge_at, last_challenge_at
      ) VALUES (?, 5, 3, 2, 60.00, 15, 10, 3600, 2, 3, 500, NOW(), NOW())`,
      [testUserId]
    );

    // 테스트 도전 생성
    const [result] = await pool.execute(
      `INSERT INTO challenges (user_id, line_num, total_stations, status, started_at)
       VALUES (?, '1호선', 10, 'completed', NOW())`,
      [testUserId]
    );
    testChallengeId = result.insertId;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await pool.execute('DELETE FROM user_achievements WHERE user_id = ?', [testUserId]);
    await pool.execute('DELETE FROM challenges WHERE id = ?', [testChallengeId]);
    await pool.execute('DELETE FROM user_stats WHERE user_id = ?', [testUserId]);
    await pool.end();
  });

  describe('GET /api/achievements', () => {
    test('모든 업적 목록을 반환해야 함', async () => {
      const response = await request(app)
        .get('/api/achievements')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('code');
      expect(response.body[0]).toHaveProperty('category');
      expect(response.body[0]).toHaveProperty('condition_type');
      expect(response.body[0]).toHaveProperty('condition_value');
      expect(response.body[0]).toHaveProperty('points');
    });

    test('카테고리별 업적 필터링이 동작해야 함', async () => {
      const response = await request(app)
        .get('/api/achievements?category=challenge')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(achievement => {
        expect(achievement.category).toBe('challenge');
      });
    });

    test('티어별 업적 필터링이 동작해야 함', async () => {
      const response = await request(app)
        .get('/api/achievements?tier=bronze')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(achievement => {
        expect(achievement.tier).toBe('bronze');
      });
    });
  });

  describe('GET /api/users/:userId/achievements', () => {
    test('사용자의 업적 목록을 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/achievements`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('achievements');
      expect(response.body).toHaveProperty('grouped');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('achieved');
      expect(Array.isArray(response.body.achievements)).toBe(true);
      expect(typeof response.body.grouped).toBe('object');
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.achieved).toBe('number');
    });

    test('달성/미달성 상태가 포함되어야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/achievements`)
        .expect(200);

      response.body.achievements.forEach(achievement => {
        expect(achievement).toHaveProperty('is_achieved');
        expect(typeof achievement.is_achieved).toBe('number'); // MySQL BOOLEAN은 TINYINT(0/1)
      });
    });

    test('존재하지 않는 사용자도 빈 업적 목록을 반환해야 함', async () => {
      const nonExistentUserId = 999999999;
      const response = await request(app)
        .get(`/api/users/${nonExistentUserId}/achievements`)
        .expect(200);

      expect(response.body.achievements.length).toBeGreaterThan(0);
      expect(response.body.achieved).toBe(0);
    });
  });

  describe('GET /api/users/:userId/achievements/progress', () => {
    test('업적 진행률을 반환해야 함', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}/achievements/progress`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('progress');
      expect(Array.isArray(response.body.progress)).toBe(true);
      expect(response.body.progress.length).toBeGreaterThan(0);

      response.body.progress.forEach(achievement => {
        expect(achievement).toHaveProperty('progress');
        expect(achievement).toHaveProperty('is_achieved');
        expect(achievement.progress).toBeGreaterThanOrEqual(0);
        expect(achievement.progress).toBeLessThanOrEqual(100);
      });
    });

    test('통계가 없는 사용자는 빈 진행률을 반환해야 함', async () => {
      const nonExistentUserId = 999999999;
      const response = await request(app)
        .get(`/api/users/${nonExistentUserId}/achievements/progress`)
        .expect(200);

      expect(response.body).toHaveProperty('progress');
      expect(response.body.progress).toEqual([]);
    });

    test('달성한 업적은 100% 진행률을 가져야 함', async () => {
      // 업적 하나를 달성시킴
      const [achievements] = await pool.execute(
        'SELECT * FROM achievements LIMIT 1'
      );
      const testAchievement = achievements[0];

      await pool.execute(
        `INSERT INTO user_achievements (user_id, achievement_id, progress)
         VALUES (?, ?, 100)
         ON DUPLICATE KEY UPDATE progress = 100`,
        [testUserId, testAchievement.id]
      );

      const response = await request(app)
        .get(`/api/users/${testUserId}/achievements/progress`)
        .expect(200);

      const achieved = response.body.progress.find(a => a.id === testAchievement.id);
      expect(achieved).toBeDefined();
      expect(achieved.progress).toBe(100);
      expect(achieved.is_achieved).toBe(true);
    });
  });
});
