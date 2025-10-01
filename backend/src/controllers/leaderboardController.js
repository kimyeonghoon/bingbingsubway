const { pool } = require('../config/database');

/**
 * 전체 랭킹 조회
 * GET /api/leaderboard
 */
async function getLeaderboard(req, res, next) {
  try {
    const { type = 'score', limit = 100, offset = 0 } = req.query;

    let orderBy;
    switch (type) {
      case 'score':
        orderBy = 'us.total_score DESC, us.success_rate DESC';
        break;
      case 'streak':
        orderBy = 'us.max_streak DESC, us.total_score DESC';
        break;
      case 'stations':
        orderBy = 'us.unique_visited_stations DESC, us.total_score DESC';
        break;
      case 'success_rate':
        orderBy = 'us.success_rate DESC, us.completed_challenges DESC';
        break;
      default:
        orderBy = 'us.total_score DESC';
    }

    // 동적 ORDER BY는 prepared statement로 처리할 수 없으므로 pool.query 사용
    const query = `SELECT
        us.user_id,
        us.total_challenges,
        us.completed_challenges,
        us.success_rate,
        us.unique_visited_stations,
        us.max_streak,
        us.total_score,
        us.last_challenge_at,
        (SELECT COUNT(DISTINCT ua.achievement_id)
         FROM user_achievements ua
         WHERE ua.user_id = us.user_id) as achievement_count
      FROM user_stats us
      WHERE us.total_challenges > 0
      ORDER BY ${orderBy}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rankings] = await pool.query(query);

    // 순위 추가
    const rankingsWithRank = rankings.map((user, index) => ({
      rank: parseInt(offset) + index + 1,
      ...user
    }));

    // 전체 사용자 수
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM user_stats WHERE total_challenges > 0`
    );

    res.json({
      rankings: rankingsWithRank,
      total: countRows[0].total,
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 주간 랭킹 조회
 * GET /api/leaderboard/weekly
 */
async function getWeeklyLeaderboard(req, res, next) {
  try {
    const { limit = 100 } = req.query;

    // 이번 주의 도전 기록 기준 랭킹
    const [rankings] = await pool.execute(
      `SELECT
        c.user_id,
        COUNT(*) as weekly_challenges,
        SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as weekly_completed,
        SUM(c.score) as weekly_score,
        ROUND(SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as weekly_success_rate
      FROM challenges c
      WHERE c.started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY c.user_id
      HAVING weekly_challenges > 0
      ORDER BY weekly_score DESC, weekly_success_rate DESC
      LIMIT ?`,
      [parseInt(limit)]
    );

    // 순위 추가
    const rankingsWithRank = rankings.map((user, index) => ({
      rank: index + 1,
      ...user
    }));

    res.json({
      rankings: rankingsWithRank,
      period: 'weekly',
      limit: parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 사용자 랭킹 위치 조회
 * GET /api/users/:userId/rank
 */
async function getUserRank(req, res, next) {
  try {
    const { userId } = req.params;

    // 전체 점수 순위
    const [scoreRank] = await pool.execute(
      `SELECT COUNT(*) + 1 as rank
       FROM user_stats
       WHERE total_score > (SELECT total_score FROM user_stats WHERE user_id = ?)
       AND total_challenges > 0`,
      [userId]
    );

    // 스트릭 순위
    const [streakRank] = await pool.execute(
      `SELECT COUNT(*) + 1 as rank
       FROM user_stats
       WHERE max_streak > (SELECT max_streak FROM user_stats WHERE user_id = ?)
       AND total_challenges > 0`,
      [userId]
    );

    // 방문 역 수 순위
    const [stationRank] = await pool.execute(
      `SELECT COUNT(*) + 1 as rank
       FROM user_stats
       WHERE unique_visited_stations > (SELECT unique_visited_stations FROM user_stats WHERE user_id = ?)
       AND total_challenges > 0`,
      [userId]
    );

    // 성공률 순위 (최소 10번 이상 도전한 사용자 중)
    const [successRateRank] = await pool.execute(
      `SELECT COUNT(*) + 1 as rank
       FROM user_stats
       WHERE success_rate > (SELECT success_rate FROM user_stats WHERE user_id = ?)
       AND total_challenges >= 10`,
      [userId]
    );

    // 사용자 통계
    const [userStats] = await pool.execute(
      `SELECT * FROM user_stats WHERE user_id = ?`,
      [userId]
    );

    if (userStats.length === 0) {
      return res.json({
        user_id: userId,
        ranks: {
          score: null,
          streak: null,
          stations: null,
          success_rate: null
        },
        stats: null
      });
    }

    res.json({
      user_id: userId,
      ranks: {
        score: scoreRank[0].rank,
        streak: streakRank[0].rank,
        stations: stationRank[0].rank,
        success_rate: successRateRank[0].rank
      },
      stats: userStats[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLeaderboard,
  getWeeklyLeaderboard,
  getUserRank
};
