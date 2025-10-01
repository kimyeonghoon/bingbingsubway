const { pool } = require('../config/database');

/**
 * 모든 업적 목록 조회
 * GET /api/achievements
 */
async function getAllAchievements(req, res, next) {
  try {
    const { category, tier } = req.query;

    let query = 'SELECT * FROM achievements WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (tier) {
      query += ' AND tier = ?';
      params.push(tier);
    }

    query += ' ORDER BY category, condition_value ASC';

    const [achievements] = await pool.execute(query, params);

    res.json(achievements);
  } catch (error) {
    next(error);
  }
}

/**
 * 사용자 업적 조회
 * GET /api/users/:userId/achievements
 */
async function getUserAchievements(req, res, next) {
  try {
    const { userId } = req.params;

    const [achievements] = await pool.execute(
      `SELECT
        a.*,
        ua.achieved_at,
        ua.progress,
        CASE WHEN ua.achievement_id IS NOT NULL THEN TRUE ELSE FALSE END as is_achieved
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      ORDER BY is_achieved DESC, a.category, a.condition_value ASC`,
      [userId]
    );

    // 카테고리별로 그룹화
    const grouped = achievements.reduce((acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(achievement);
      return acc;
    }, {});

    res.json({
      achievements,
      grouped,
      total: achievements.length,
      achieved: achievements.filter(a => a.is_achieved).length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 업적 달성 체크 및 업데이트
 * 내부 함수
 */
async function checkAndUpdateAchievements(userId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 사용자 통계 조회
    const [statsRows] = await connection.execute(
      `SELECT * FROM user_stats WHERE user_id = ?`,
      [userId]
    );

    if (statsRows.length === 0) {
      await connection.commit();
      return [];
    }

    const stats = statsRows[0];

    // 고유 방문 역 수 업데이트
    const [visitCountRows] = await connection.execute(
      `SELECT COUNT(DISTINCT station_id) as count FROM user_visited_stations WHERE user_id = ?`,
      [userId]
    );
    const uniqueVisitedStations = visitCountRows[0].count;

    await connection.execute(
      `UPDATE user_stats SET unique_visited_stations = ? WHERE user_id = ?`,
      [uniqueVisitedStations, userId]
    );

    // 모든 업적 조회
    const [achievements] = await connection.execute(
      `SELECT * FROM achievements`
    );

    const newAchievements = [];

    for (const achievement of achievements) {
      // 이미 달성한 업적인지 확인
      const [existingRows] = await connection.execute(
        `SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?`,
        [userId, achievement.id]
      );

      if (existingRows.length > 0) {
        continue; // 이미 달성한 업적은 스킵
      }

      let isAchieved = false;
      let progress = 0;

      // 업적 조건 체크
      switch (achievement.condition_type) {
        case 'challenge_count':
          progress = (stats.total_challenges / achievement.condition_value) * 100;
          isAchieved = stats.total_challenges >= achievement.condition_value;
          break;

        case 'success_count':
          progress = (stats.completed_challenges / achievement.condition_value) * 100;
          isAchieved = stats.completed_challenges >= achievement.condition_value;
          break;

        case 'streak':
          progress = (stats.max_streak / achievement.condition_value) * 100;
          isAchieved = stats.max_streak >= achievement.condition_value;
          break;

        case 'station_count':
          progress = (uniqueVisitedStations / achievement.condition_value) * 100;
          isAchieved = uniqueVisitedStations >= achievement.condition_value;
          break;

        case 'time':
          // 최근 도전 중 조건보다 빠른 기록이 있는지 확인
          const [fastChallenges] = await connection.execute(
            `SELECT * FROM challenges
             WHERE user_id = ? AND status = 'completed' AND time_taken <= ? AND time_taken > 0
             LIMIT 1`,
            [userId, achievement.condition_value]
          );
          isAchieved = fastChallenges.length > 0;
          progress = isAchieved ? 100 : 0;
          break;

        case 'line_complete':
          // 특정 노선의 모든 역 방문 여부
          if (achievement.condition_value === 0) {
            // 전 노선 마스터: 모든 노선 완료 체크
            const [allLines] = await connection.execute(
              `SELECT DISTINCT line_num FROM stations`
            );

            let completedLines = 0;
            for (const line of allLines) {
              const [lineStations] = await connection.execute(
                `SELECT COUNT(DISTINCT id) as total FROM stations WHERE line_num = ?`,
                [line.line_num]
              );
              const [visitedStations] = await connection.execute(
                `SELECT COUNT(DISTINCT uvs.station_id) as visited
                 FROM user_visited_stations uvs
                 JOIN stations s ON uvs.station_id = s.id
                 WHERE uvs.user_id = ? AND s.line_num = ?`,
                [userId, line.line_num]
              );

              if (visitedStations[0].visited >= lineStations[0].total) {
                completedLines++;
              }
            }

            isAchieved = completedLines >= allLines.length;
            progress = (completedLines / allLines.length) * 100;
          } else {
            // 특정 노선 완료 체크 (업적 코드에서 노선명 추출)
            const lineMatch = achievement.code.match(/line_(\d+)/);
            if (lineMatch) {
              const lineName = `${lineMatch[1]}호선`;
              const [lineStations] = await connection.execute(
                `SELECT COUNT(DISTINCT id) as total FROM stations WHERE line_num = ?`,
                [lineName]
              );
              const [visitedStations] = await connection.execute(
                `SELECT COUNT(DISTINCT uvs.station_id) as visited
                 FROM user_visited_stations uvs
                 JOIN stations s ON uvs.station_id = s.id
                 WHERE uvs.user_id = ? AND s.line_num = ?`,
                [userId, lineName]
              );

              progress = (visitedStations[0].visited / lineStations[0].total) * 100;
              isAchieved = visitedStations[0].visited >= lineStations[0].total;
            }
          }
          break;
      }

      // 진행률 제한
      progress = Math.min(100, Math.max(0, progress));

      // 업적 달성 시 user_achievements에 추가
      if (isAchieved) {
        await connection.execute(
          `INSERT INTO user_achievements (user_id, achievement_id, progress)
           VALUES (?, ?, 100)`,
          [userId, achievement.id]
        );

        // 점수 추가
        await connection.execute(
          `UPDATE user_stats SET total_score = total_score + ? WHERE user_id = ?`,
          [achievement.points, userId]
        );

        newAchievements.push(achievement);
      }
    }

    await connection.commit();
    return newAchievements;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 업적 진행률 조회
 * GET /api/users/:userId/achievements/progress
 */
async function getAchievementProgress(req, res, next) {
  try {
    const { userId } = req.params;

    // 통계 조회
    const [statsRows] = await pool.execute(
      `SELECT * FROM user_stats WHERE user_id = ?`,
      [userId]
    );

    if (statsRows.length === 0) {
      return res.json({ progress: [] });
    }

    const stats = statsRows[0];

    // 고유 방문 역 수
    const [visitCountRows] = await pool.execute(
      `SELECT COUNT(DISTINCT station_id) as count FROM user_visited_stations WHERE user_id = ?`,
      [userId]
    );
    const uniqueVisitedStations = visitCountRows[0].count;

    // 각 업적의 진행률 계산
    const [achievements] = await pool.execute(
      `SELECT a.*, ua.achieved_at, ua.progress as saved_progress
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?`,
      [userId]
    );

    const progress = achievements.map(achievement => {
      if (achievement.achieved_at) {
        return {
          ...achievement,
          progress: 100,
          is_achieved: true
        };
      }

      let currentProgress = 0;

      switch (achievement.condition_type) {
        case 'challenge_count':
          currentProgress = (stats.total_challenges / achievement.condition_value) * 100;
          break;
        case 'success_count':
          currentProgress = (stats.completed_challenges / achievement.condition_value) * 100;
          break;
        case 'streak':
          currentProgress = (stats.max_streak / achievement.condition_value) * 100;
          break;
        case 'station_count':
          currentProgress = (uniqueVisitedStations / achievement.condition_value) * 100;
          break;
        default:
          currentProgress = 0;
      }

      return {
        ...achievement,
        progress: Math.min(100, Math.max(0, currentProgress)),
        is_achieved: false
      };
    });

    res.json({ progress });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllAchievements,
  getUserAchievements,
  checkAndUpdateAchievements,
  getAchievementProgress
};
