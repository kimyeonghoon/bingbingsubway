const { pool } = require('../config/database');

/**
 * 사용자 통계 조회
 * GET /api/users/:userId/stats
 */
async function getUserStats(req, res, next) {
  try {
    const { userId } = req.params;

    // user_stats 조회 (없으면 기본값 반환)
    const [statsRows] = await pool.execute(
      `SELECT * FROM user_stats WHERE user_id = ?`,
      [userId]
    );

    let stats;
    if (statsRows.length === 0) {
      // 통계가 없으면 기본값 생성
      stats = {
        user_id: userId,
        total_challenges: 0,
        completed_challenges: 0,
        failed_challenges: 0,
        success_rate: 0.00,
        total_visited_stations: 0,
        unique_visited_stations: 0,
        total_play_time: 0,
        best_time: 0,
        current_streak: 0,
        max_streak: 0,
        total_score: 0,
        first_challenge_at: null,
        last_challenge_at: null
      };
    } else {
      // 숫자 타입 변환
      stats = {
        ...statsRows[0],
        total_challenges: parseInt(statsRows[0].total_challenges) || 0,
        completed_challenges: parseInt(statsRows[0].completed_challenges) || 0,
        failed_challenges: parseInt(statsRows[0].failed_challenges) || 0,
        success_rate: parseFloat(statsRows[0].success_rate) || 0,
        total_visited_stations: parseInt(statsRows[0].total_visited_stations) || 0,
        unique_visited_stations: parseInt(statsRows[0].unique_visited_stations) || 0,
        total_play_time: parseInt(statsRows[0].total_play_time) || 0,
        best_time: parseInt(statsRows[0].best_time) || 0,
        current_streak: parseInt(statsRows[0].current_streak) || 0,
        max_streak: parseInt(statsRows[0].max_streak) || 0,
        total_score: parseInt(statsRows[0].total_score) || 0
      };
    }

    res.json(stats);
  } catch (error) {
    next(error);
  }
}

/**
 * 사용자가 방문한 역 목록 조회
 * GET /api/users/:userId/visited-stations
 */
async function getVisitedStations(req, res, next) {
  try {
    const { userId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    const [stations] = await pool.execute(
      `SELECT
        uvs.station_id,
        s.station_nm,
        s.line_num,
        uvs.first_visit_at,
        uvs.visit_count,
        uvs.last_visit_at
      FROM user_visited_stations uvs
      JOIN stations s ON uvs.station_id = s.id
      WHERE uvs.user_id = ?
      ORDER BY uvs.last_visit_at DESC
      LIMIT ${parsedLimit} OFFSET ${parsedOffset}`,
      [userId]
    );

    // 총 방문 역 수
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM user_visited_stations WHERE user_id = ?`,
      [userId]
    );

    res.json({
      stations: stations.map(s => ({
        ...s,
        visit_count: parseInt(s.visit_count) || 0
      })),
      total: countRows[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 노선별 통계 조회
 * GET /api/users/:userId/line-stats
 */
async function getLineStats(req, res, next) {
  try {
    const { userId } = req.params;

    const [lineStats] = await pool.execute(
      `SELECT
        s.line_num,
        COUNT(DISTINCT s.id) as total_stations,
        COUNT(DISTINCT uvs.station_id) as visited_stations,
        ROUND(
          COALESCE(COUNT(DISTINCT uvs.station_id) * 100.0 / NULLIF(COUNT(DISTINCT s.id), 0), 0),
          2
        ) as completion_rate,
        COALESCE(
          (SELECT COUNT(*) FROM challenges c WHERE c.line_num = s.line_num AND c.user_id = ?),
          0
        ) as total_challenges,
        COALESCE(
          (SELECT COUNT(*) FROM challenges c WHERE c.line_num = s.line_num AND c.user_id = ? AND c.status = 'completed'),
          0
        ) as completed_challenges,
        COALESCE(
          ROUND(
            (SELECT COUNT(*) FROM challenges c WHERE c.line_num = s.line_num AND c.user_id = ? AND c.status = 'completed') * 100.0 /
            NULLIF((SELECT COUNT(*) FROM challenges c WHERE c.line_num = s.line_num AND c.user_id = ?), 0),
            2
          ),
          0
        ) as success_rate
      FROM stations s
      LEFT JOIN user_visited_stations uvs ON s.id = uvs.station_id AND uvs.user_id = ?
      GROUP BY s.line_num
      HAVING total_challenges > 0 OR visited_stations > 0
      ORDER BY completion_rate DESC, s.line_num`,
      [userId, userId, userId, userId, userId]
    );

    // 숫자 타입 변환
    const lineStatsWithNumbers = lineStats.map(line => ({
      ...line,
      total_stations: parseInt(line.total_stations) || 0,
      visited_stations: parseInt(line.visited_stations) || 0,
      completion_rate: parseFloat(line.completion_rate) || 0,
      total_challenges: parseInt(line.total_challenges) || 0,
      completed_challenges: parseInt(line.completed_challenges) || 0,
      success_rate: parseFloat(line.success_rate) || 0
    }));

    res.json(lineStatsWithNumbers);
  } catch (error) {
    next(error);
  }
}

/**
 * 최근 활동 내역 조회
 * GET /api/users/:userId/recent-activities
 */
async function getRecentActivities(req, res, next) {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const parsedLimit = parseInt(limit);

    const [activities] = await pool.execute(
      `SELECT
        c.id as challenge_id,
        c.line_num,
        c.status,
        c.total_stations,
        c.completed_stations,
        c.started_at,
        c.completed_at,
        s.station_nm as final_station_name
      FROM challenges c
      LEFT JOIN stations s ON c.final_station_id = s.id
      WHERE c.user_id = ?
      ORDER BY c.started_at DESC
      LIMIT ${parsedLimit}`,
      [userId]
    );

    // 숫자 타입 변환
    const activitiesWithNumbers = activities.map(activity => ({
      ...activity,
      total_stations: parseInt(activity.total_stations) || 0,
      completed_stations: parseInt(activity.completed_stations) || 0
    }));

    res.json(activitiesWithNumbers);
  } catch (error) {
    next(error);
  }
}

/**
 * 통계 업데이트 (내부 함수)
 */
async function updateUserStats(userId, challengeResult) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      isSuccess,
      timeTaken,
      score,
      visitedStations
    } = challengeResult;

    // user_stats가 없으면 생성
    const [existing] = await connection.execute(
      `SELECT * FROM user_stats WHERE user_id = ? FOR UPDATE`,
      [userId]
    );

    if (existing.length === 0) {
      // 새로운 통계 생성
      await connection.execute(
        `INSERT INTO user_stats (
          user_id, total_challenges, completed_challenges, failed_challenges,
          success_rate, total_visited_stations, unique_visited_stations,
          total_play_time, current_streak, max_streak, total_score,
          first_challenge_at, last_challenge_at
        ) VALUES (?, 1, ?, ?, ?, ?, 0, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          isSuccess ? 1 : 0,
          isSuccess ? 0 : 1,
          isSuccess ? 100.00 : 0.00,
          visitedStations || 0,
          timeTaken || 0,
          isSuccess ? 1 : 0,
          isSuccess ? 1 : 0,
          score || 0
        ]
      );
    } else {
      // 기존 통계 업데이트
      const stats = existing[0];
      const newTotalChallenges = stats.total_challenges + 1;
      const newCompletedChallenges = stats.completed_challenges + (isSuccess ? 1 : 0);
      const newFailedChallenges = stats.failed_challenges + (isSuccess ? 0 : 1);
      const newSuccessRate = (newCompletedChallenges / newTotalChallenges) * 100;
      const newCurrentStreak = isSuccess ? stats.current_streak + 1 : 0;
      const newMaxStreak = Math.max(stats.max_streak, newCurrentStreak);
      const newTotalScore = stats.total_score + (score || 0);
      const newTotalPlayTime = stats.total_play_time + (timeTaken || 0);
      const newTotalVisitedStations = stats.total_visited_stations + (visitedStations || 0);

      await connection.execute(
        `UPDATE user_stats SET
          total_challenges = ?,
          completed_challenges = ?,
          failed_challenges = ?,
          success_rate = ?,
          total_visited_stations = ?,
          total_play_time = ?,
          current_streak = ?,
          max_streak = ?,
          total_score = ?,
          last_challenge_at = NOW(),
          updated_at = NOW()
        WHERE user_id = ?`,
        [
          newTotalChallenges,
          newCompletedChallenges,
          newFailedChallenges,
          newSuccessRate,
          newTotalVisitedStations,
          newTotalPlayTime,
          newCurrentStreak,
          newMaxStreak,
          newTotalScore,
          userId
        ]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getUserStats,
  getVisitedStations,
  getLineStats,
  getRecentActivities,
  updateUserStats
};
