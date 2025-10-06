const { pool } = require('../../src/config/database');
const { checkAndUpdateAchievements } = require('../../src/utils/statsHelper');

describe('statsHelper - checkAndUpdateAchievements', () => {
  let connection;
  let testUserId;

  beforeAll(async () => {
    connection = await pool.getConnection();
  });

  beforeEach(async () => {
    // 테스트 사용자 생성
    const [result] = await connection.execute(
      `INSERT INTO users (email, username, password_hash, provider)
       VALUES ('test_achievement@test.com', 'Test User', 'hash', 'local')`
    );
    testUserId = result.insertId;

    // user_stats 생성
    await connection.execute(
      `INSERT INTO user_stats (user_id, total_challenges, completed_challenges, unique_visited_stations, current_streak, best_time)
       VALUES (?, 21, 21, 21, 25, 11)`,
      [testUserId]
    );
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await connection.execute('DELETE FROM user_achievements WHERE user_id = ?', [testUserId]);
    await connection.execute('DELETE FROM user_stats WHERE user_id = ?', [testUserId]);
    await connection.execute('DELETE FROM users WHERE id = ?', [testUserId]);
  });

  afterAll(async () => {
    connection.release();
    await pool.end();
  });

  test('21개 완료 시 "챌린저" 업적(10개) 달성', async () => {
    await checkAndUpdateAchievements(testUserId, connection);

    // 디버깅: 모든 달성 업적 확인
    const [allAchievements] = await connection.execute(
      `SELECT a.name, a.condition_type, a.condition_value
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ?`,
      [testUserId]
    );
    console.log('모든 달성 업적:', allAchievements);

    const [achievements] = await connection.execute(
      `SELECT a.name, a.condition_type, a.condition_value
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ? AND a.condition_type = 'success_count' AND a.condition_value = 10`,
      [testUserId]
    );

    expect(achievements.length).toBe(1);
    expect(achievements[0].condition_value).toBe(10);
  });

  test('25연승 시 연승 업적 3개 모두 달성', async () => {
    await checkAndUpdateAchievements(testUserId, connection);

    const [achievements] = await connection.execute(
      `SELECT a.name, a.condition_value
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ? AND a.condition_type = 'streak'
       ORDER BY a.condition_value`,
      [testUserId]
    );

    expect(achievements.length).toBe(3);
    expect(achievements[0].condition_value).toBe(3); // 3연승
    expect(achievements[1].condition_value).toBe(5); // 5연승
    expect(achievements[2].condition_value).toBe(10); // 10연승
  });

  test('21개 역 방문 시 "탐험가" 업적(10개) 달성', async () => {
    await checkAndUpdateAchievements(testUserId, connection);

    const [achievements] = await connection.execute(
      `SELECT a.name, a.condition_value
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ? AND a.condition_type = 'station_count' AND a.condition_value = 10`,
      [testUserId]
    );

    expect(achievements.length).toBe(1);
    expect(achievements[0].condition_value).toBe(10);
  });

  test('11초 완료 시 스피드 업적 3개 모두 달성', async () => {
    await checkAndUpdateAchievements(testUserId, connection);

    const [achievements] = await connection.execute(
      `SELECT a.name, a.condition_value
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ? AND a.condition_type = 'time'
       ORDER BY a.condition_value DESC`,
      [testUserId]
    );

    expect(achievements.length).toBe(3);
    expect(achievements[0].condition_value).toBe(600); // 10분(600초)
    expect(achievements[1].condition_value).toBe(300); // 5분(300초)
    expect(achievements[2].condition_value).toBe(180); // 3분(180초)
  });

  test('중복 업적 달성은 무시됨', async () => {
    // 첫 번째 체크
    await checkAndUpdateAchievements(testUserId, connection);

    const [firstCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?',
      [testUserId]
    );

    // 두 번째 체크 (중복)
    await checkAndUpdateAchievements(testUserId, connection);

    const [secondCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?',
      [testUserId]
    );

    // 중복 체크해도 개수 동일
    expect(secondCount[0].count).toBe(firstCount[0].count);
  });
});
