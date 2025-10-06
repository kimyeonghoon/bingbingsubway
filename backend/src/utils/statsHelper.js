const { pool } = require('../config/database');

/**
 * 챌린지 완료 시 사용자 통계 업데이트
 * @param {number} userId - 사용자 ID
 * @param {number} challengeId - 챌린지 ID
 * @param {Object} connection - DB connection (트랜잭션용)
 */
async function updateStatsOnChallengeComplete(userId, challengeId, connection) {
  const conn = connection || pool;

  try {
    // 1. user_stats 레코드 존재 확인 및 생성
    const [existing] = await conn.execute(
      'SELECT id FROM user_stats WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      await conn.execute(
        `INSERT INTO user_stats (user_id, first_challenge_at) VALUES (?, NOW())`,
        [userId]
      );
    }

    // 2. 챌린지 정보 조회
    const [challenges] = await conn.execute(
      'SELECT started_at, completed_at FROM challenges WHERE id = ?',
      [challengeId]
    );

    if (challenges.length === 0) return;

    const challenge = challenges[0];
    const playTime = Math.floor(
      (new Date(challenge.completed_at) - new Date(challenge.started_at)) / 1000
    ); // 초 단위

    // 3. 방문한 역 수 조회
    const [visitCount] = await conn.execute(
      'SELECT COUNT(*) as count FROM visits WHERE challenge_id = ? AND is_verified = true',
      [challengeId]
    );

    const visitedStations = visitCount[0].count;

    // 4. user_stats 업데이트
    await conn.execute(
      `UPDATE user_stats
       SET total_challenges = total_challenges + 1,
           completed_challenges = completed_challenges + 1,
           total_visited_stations = total_visited_stations + ?,
           total_play_time = total_play_time + ?,
           current_streak = current_streak + 1,
           max_streak = GREATEST(max_streak, current_streak + 1),
           total_score = total_score + 100,
           success_rate = (completed_challenges * 100.0) / total_challenges,
           last_play_at = NOW(),
           best_time = CASE
             WHEN best_time = 0 OR best_time IS NULL THEN ?
             WHEN ? < best_time THEN ?
             ELSE best_time
           END
       WHERE user_id = ?`,
      [visitedStations, playTime, playTime, playTime, playTime, userId]
    );

    // 5. user_visited_stations에 방문한 역 추가
    const [visitedStationIds] = await conn.execute(
      'SELECT station_id FROM visits WHERE challenge_id = ? AND is_verified = true',
      [challengeId]
    );

    for (const row of visitedStationIds) {
      const stationId = row.station_id;

      // 이미 방문한 역인지 확인
      const [existingVisit] = await conn.execute(
        'SELECT id, visit_count FROM user_visited_stations WHERE user_id = ? AND station_id = ?',
        [userId, stationId]
      );

      if (existingVisit.length === 0) {
        // 첫 방문
        await conn.execute(
          'INSERT INTO user_visited_stations (user_id, station_id, first_visit_at, visit_count) VALUES (?, ?, NOW(), 1)',
          [userId, stationId]
        );

        // unique_visited_stations 증가
        await conn.execute(
          'UPDATE user_stats SET unique_visited_stations = unique_visited_stations + 1 WHERE user_id = ?',
          [userId]
        );
      } else {
        // 재방문
        await conn.execute(
          'UPDATE user_visited_stations SET visit_count = visit_count + 1, last_visit_at = NOW() WHERE id = ?',
          [existingVisit[0].id]
        );
      }
    }

    console.log(`[statsHelper] 사용자 ${userId}의 통계 업데이트 완료 (챌린지 ${challengeId})`);
  } catch (error) {
    console.error('[statsHelper] 통계 업데이트 실패:', error);
    throw error;
  }
}

/**
 * 챌린지 실패 시 사용자 통계 업데이트
 * @param {number} userId - 사용자 ID
 * @param {Object} connection - DB connection (트랜잭션용)
 */
async function updateStatsOnChallengeFail(userId, connection) {
  const conn = connection || pool;

  try {
    // 1. user_stats 레코드 존재 확인 및 생성
    const [existing] = await conn.execute(
      'SELECT id FROM user_stats WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      await conn.execute(
        `INSERT INTO user_stats (user_id, first_challenge_at) VALUES (?, NOW())`,
        [userId]
      );
    }

    // 2. user_stats 업데이트 (실패)
    await conn.execute(
      `UPDATE user_stats
       SET total_challenges = total_challenges + 1,
           failed_challenges = failed_challenges + 1,
           current_streak = 0,
           success_rate = (completed_challenges * 100.0) / total_challenges,
           last_play_at = NOW()
       WHERE user_id = ?`,
      [userId]
    );

    console.log(`[statsHelper] 사용자 ${userId}의 통계 업데이트 완료 (실패)`);
  } catch (error) {
    console.error('[statsHelper] 통계 업데이트 실패:', error);
    throw error;
  }
}

/**
 * 사용자 업적 체크 및 갱신
 * @param {number} userId - 사용자 ID
 * @param {Object} connection - DB connection (트랜잭션용)
 */
async function checkAndUpdateAchievements(userId, connection) {
  const conn = connection || pool;

  try {
    // 1. 현재 사용자 통계 조회
    const [userStats] = await conn.execute(
      `SELECT
        total_challenges,
        completed_challenges,
        unique_visited_stations,
        current_streak,
        best_time,
        success_rate
      FROM user_stats
      WHERE user_id = ?`,
      [userId]
    );

    if (userStats.length === 0) return;

    const stats = userStats[0];

    // 2. 달성 가능한 업적 조회
    const [achievements] = await conn.execute(
      `SELECT id, condition_type, condition_value
       FROM achievements
       WHERE
         (condition_type = 'challenge_count' AND condition_value <= ?) OR
         (condition_type = 'success_count' AND condition_value <= ?) OR
         (condition_type = 'station_count' AND condition_value <= ?) OR
         (condition_type = 'streak' AND condition_value <= ?) OR
         (condition_type = 'time' AND condition_value >= ?) OR
         (condition_type = 'success_rate' AND condition_value <= ? AND ? >= 10)`,
      [
        stats.total_challenges,
        stats.completed_challenges,
        stats.unique_visited_stations,
        stats.current_streak,
        stats.best_time, // best_time은 작을수록 좋으므로 >= 조건 (600초 조건이면 11초는 달성)
        stats.success_rate,
        stats.completed_challenges // success_rate는 10회 이상일 때만
      ]
    );

    // 3. 각 업적을 user_achievements에 추가 (중복 무시)
    for (const achievement of achievements) {
      await conn.execute(
        `INSERT INTO user_achievements (user_id, achievement_id, achieved_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE achievement_id = achievement_id`,
        [userId, achievement.id]
      );
    }

    console.log(`[statsHelper] 사용자 ${userId}의 업적 ${achievements.length}개 체크 완료`);
  } catch (error) {
    console.error('[statsHelper] 업적 체크 실패:', error);
    throw error;
  }
}

module.exports = {
  updateStatsOnChallengeComplete,
  updateStatsOnChallengeFail,
  checkAndUpdateAchievements
};
