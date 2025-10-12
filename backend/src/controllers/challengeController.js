const { pool } = require('../config/database');

/**
 * 새로운 도전 생성
 */
async function createChallenge(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const { lineName, stationCount } = req.body;
    const userId = req.user.id; // JWT에서 가져온 사용자 ID

    if (!lineName || !stationCount) {
      return res.status(400).json({
        error: 'lineName, stationCount는 필수입니다.'
      });
    }

    await connection.beginTransaction();

    // 1. 이미 완료한 역 제외하고 랜덤 역 선택
    const [stations] = await connection.execute(
      `SELECT * FROM stations
       WHERE line_num = ?
       AND id NOT IN (
         SELECT DISTINCT final_station_id
         FROM challenges
         WHERE user_id = ? AND status = 'completed' AND final_station_id IS NOT NULL
       )
       ORDER BY RAND()
       LIMIT ${stationCount}`,
      [lineName, userId]
    );

    if (stations.length < stationCount) {
      await connection.rollback();

      // 해당 노선의 전체 역 수 확인
      const [totalStations] = await connection.execute(
        `SELECT COUNT(*) as total FROM stations WHERE line_num = ?`,
        [lineName]
      );

      // 이미 완료한 역 수 확인
      const [completedStations] = await connection.execute(
        `SELECT COUNT(DISTINCT final_station_id) as completed
         FROM challenges
         WHERE user_id = ? AND status = 'completed' AND final_station_id IS NOT NULL
         AND final_station_id IN (SELECT id FROM stations WHERE line_num = ?)`,
        [userId, lineName]
      );

      const remainingCount = stations.length;
      const completedCount = completedStations[0].completed;
      const totalCount = totalStations[0].total;

      return res.status(400).json({
        error: `해당 노선에 아직 방문하지 않은 역이 ${stationCount}개 미만입니다.`,
        requested: parseInt(stationCount),
        available: remainingCount,
        completed: completedCount,
        total: totalCount,
        suggestion: remainingCount > 0 ? `${remainingCount}개 이하로 선택해주세요.` : '이 노선의 모든 역을 완료했습니다! 🎉'
      });
    }

    // 2. 도전 레코드 생성
    const [result] = await connection.execute(
      'INSERT INTO challenges (user_id, line_num, total_stations, completed_stations) VALUES (?, ?, ?, 0)',
      [userId, lineName, stationCount]
    );

    const challengeId = result.insertId;

    // 3. 각 역에 대한 방문 레코드 생성 (미완료 상태)
    const visitValues = stations.map(station => [
      challengeId,
      userId,
      station.id,
      false
    ]);

    await connection.query(
      'INSERT INTO visits (challenge_id, user_id, station_id, is_verified) VALUES ?',
      [visitValues]
    );

    await connection.commit();

    res.status(201).json({
      challengeId,
      stations: stations.map(s => ({
        id: s.id,
        name: s.station_nm,
        code: s.station_cd,
        line: s.line_num,
        latitude: s.latitude,
        longitude: s.longitude
      }))
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * 사용자의 모든 도전 조회
 */
async function getChallengesByUser(req, res, next) {
  try {
    const { userId } = req.params;
    const requestUserId = req.user.id; // 인증된 사용자 ID

    // 디버깅 로그
    console.log('[getChallengesByUser] URL userId:', userId, 'JWT userId:', requestUserId);

    // 권한 확인: 본인의 도전만 조회 가능
    if (parseInt(userId) !== requestUserId) {
      console.log('[getChallengesByUser] 권한 오류: URL userId와 JWT userId 불일치');
      return res.status(403).json({ error: '다른 사용자의 도전을 조회할 권한이 없습니다' });
    }

    const [rows] = await pool.execute(
      `SELECT
        c.id,
        c.line_num,
        c.total_stations,
        c.completed_stations,
        c.final_station_id,
        c.status,
        UNIX_TIMESTAMP(c.started_at) * 1000 as created_at,
        UNIX_TIMESTAMP(c.completed_at) * 1000 as completed_at
      FROM challenges c
      WHERE c.user_id = ?
      ORDER BY c.started_at DESC`,
      [userId]
    );

    console.log('[getChallengesByUser] 조회 결과:', rows.length, '개 도전');
    res.json(rows);
  } catch (error) {
    console.error('[getChallengesByUser] 에러:', error);
    next(error);
  }
}

/**
 * 특정 도전의 역 목록 및 방문 상태 조회
 */
async function getChallengeStations(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT
        s.id,
        s.station_cd,
        s.station_nm,
        s.line_num,
        s.latitude,
        s.longitude,
        v.is_verified,
        v.arrival_time as visited_at,
        v.visit_latitude as verified_latitude,
        v.visit_longitude as verified_longitude
      FROM visits v
      JOIN stations s ON v.station_id = s.id
      WHERE v.challenge_id = ?
      ORDER BY s.station_cd`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '도전을 찾을 수 없습니다.' });
    }

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

/**
 * 도전 완료 처리
 * POST /api/challenges/:id/complete
 */
async function completeChallenge(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id; // JWT에서 가져온 사용자 ID

    await connection.beginTransaction();

    // 1. 도전 정보 조회
    const [challenges] = await connection.execute(
      'SELECT * FROM challenges WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (challenges.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '도전을 찾을 수 없습니다.' });
    }

    const challenge = challenges[0];

    if (challenge.status === 'completed' || challenge.status === 'failed') {
      await connection.rollback();
      return res.status(400).json({ error: '이미 완료되었거나 실패한 도전입니다.' });
    }

    // 2. 방문 확인한 역 개수 확인
    const [visitCounts] = await connection.execute(
      'SELECT COUNT(*) as verified_count FROM visits WHERE challenge_id = ? AND is_verified = TRUE',
      [id]
    );

    const verifiedCount = visitCounts[0].verified_count;

    if (verifiedCount < challenge.total_stations) {
      await connection.rollback();
      return res.status(400).json({
        error: '모든 역을 방문하지 않았습니다.',
        verified: verifiedCount,
        total: challenge.total_stations
      });
    }

    // 3. 도전 시간 계산
    const startTime = new Date(challenge.started_at);
    const endTime = new Date();
    const timeTaken = Math.floor((endTime - startTime) / 1000); // 초 단위

    // 4. 점수 계산 (기본 100점 + 빠른 완료 보너스)
    let score = 100;
    if (timeTaken < 600) score += 200; // 10분 이내
    else if (timeTaken < 900) score += 100; // 15분 이내
    else if (timeTaken < 1200) score += 50; // 20분 이내
    else if (timeTaken < 1800) score += 30; // 30분 이내

    // 5. 도전 상태 업데이트
    await connection.execute(
      `UPDATE challenges SET
        status = 'completed',
        completed_at = NOW(),
        time_taken = ?,
        score = ?,
        completed_stations = total_stations
      WHERE id = ?`,
      [timeTaken, score, id]
    );

    // 6. 사용자 통계 업데이트
    const { updateUserStats } = require('./userStatsController');
    await updateUserStats(userId, {
      isSuccess: true,
      timeTaken,
      score,
      visitedStations: challenge.total_stations
    });

    // 7. user_visited_stations 업데이트
    const [visitedStations] = await connection.execute(
      'SELECT DISTINCT station_id FROM visits WHERE challenge_id = ? AND is_verified = TRUE',
      [id]
    );

    for (const visit of visitedStations) {
      await connection.execute(
        `INSERT INTO user_visited_stations (user_id, station_id, visit_count, first_visit_at, last_visit_at)
         VALUES (?, ?, 1, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           visit_count = visit_count + 1,
           last_visit_at = NOW()`,
        [userId, visit.station_id]
      );
    }

    // 8. 업적 체크
    const { checkAndUpdateAchievements } = require('../utils/statsHelper');
    await checkAndUpdateAchievements(userId, connection);

    await connection.commit();

    res.json({
      success: true,
      challengeId: id,
      status: 'completed',
      timeTaken,
      score
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * 도전 실패 처리
 * POST /api/challenges/:id/fail
 */
async function failChallenge(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { reason = 'timeout' } = req.body;
    const userId = req.user.id; // JWT에서 가져온 사용자 ID

    await connection.beginTransaction();

    // 1. 도전 정보 조회
    const [challenges] = await connection.execute(
      'SELECT * FROM challenges WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (challenges.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '도전을 찾을 수 없습니다.' });
    }

    const challenge = challenges[0];

    if (challenge.status === 'completed' || challenge.status === 'failed') {
      await connection.rollback();
      return res.status(400).json({ error: '이미 완료되었거나 실패한 도전입니다.' });
    }

    // 2. 도전 시간 계산
    const startTime = new Date(challenge.started_at);
    const endTime = new Date();
    const timeTaken = Math.floor((endTime - startTime) / 1000);

    // 3. 방문한 역 개수 확인
    const [visitCounts] = await connection.execute(
      'SELECT COUNT(*) as verified_count FROM visits WHERE challenge_id = ? AND is_verified = TRUE',
      [id]
    );

    const verifiedCount = visitCounts[0].verified_count;

    // 4. 도전 상태 업데이트
    await connection.execute(
      `UPDATE challenges SET
        status = 'failed',
        completed_at = NOW(),
        time_taken = ?,
        score = 0,
        completed_stations = ?
      WHERE id = ?`,
      [timeTaken, verifiedCount, id]
    );

    // 5. 사용자 통계 업데이트
    const { updateUserStats } = require('./userStatsController');
    await updateUserStats(userId, {
      isSuccess: false,
      timeTaken,
      score: 0,
      visitedStations: verifiedCount
    });

    // 6. user_visited_stations 업데이트 (방문한 역만)
    if (verifiedCount > 0) {
      const [visitedStations] = await connection.execute(
        'SELECT DISTINCT station_id FROM visits WHERE challenge_id = ? AND is_verified = TRUE',
        [id]
      );

      for (const visit of visitedStations) {
        await connection.execute(
          `INSERT INTO user_visited_stations (user_id, station_id, visit_count, first_visit_at, last_visit_at)
           VALUES (?, ?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             visit_count = visit_count + 1,
             last_visit_at = NOW()`,
          [userId, visit.station_id]
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      challengeId: id,
      status: 'failed',
      reason,
      timeTaken,
      verifiedStations: verifiedCount,
      totalStations: challenge.total_stations
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * 도전 취소 처리
 * POST /api/challenges/:id/cancel
 */
async function cancelChallenge(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id; // JWT에서 가져온 사용자 ID

    await connection.beginTransaction();

    // 1. 도전 정보 조회
    const [challenges] = await connection.execute(
      'SELECT * FROM challenges WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (challenges.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '도전을 찾을 수 없습니다.' });
    }

    const challenge = challenges[0];

    if (challenge.status !== 'in_progress') {
      await connection.rollback();
      return res.status(400).json({ error: '진행 중인 도전만 취소할 수 있습니다.' });
    }

    // 2. 도전 시간 계산
    const startTime = new Date(challenge.started_at);
    const endTime = new Date();
    const timeTaken = Math.floor((endTime - startTime) / 1000);

    // 3. 방문한 역 개수 확인 (참고용)
    const [visitCounts] = await connection.execute(
      'SELECT COUNT(*) as verified_count FROM visits WHERE challenge_id = ? AND is_verified = TRUE',
      [id]
    );

    const verifiedCount = visitCounts[0].verified_count;

    // 4. 도전 상태 업데이트 (cancelled)
    await connection.execute(
      `UPDATE challenges SET
        status = 'cancelled',
        completed_at = NOW(),
        time_taken = ?,
        score = 0,
        completed_stations = ?
      WHERE id = ?`,
      [timeTaken, verifiedCount, id]
    );

    await connection.commit();

    res.json({
      success: true,
      challengeId: id,
      status: 'cancelled',
      timeTaken,
      verifiedStations: verifiedCount,
      totalStations: challenge.total_stations
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * 룰렛에서 최종 역 선택
 * PUT /api/challenges/:id/select-station
 */
async function selectStation(req, res, next) {
  try {
    const { id } = req.params;
    const { stationId } = req.body;
    const userId = req.user.id;

    if (!stationId) {
      return res.status(400).json({ error: 'stationId is required' });
    }

    // 도전 조회 및 권한 확인
    const [challenges] = await pool.execute(
      'SELECT * FROM challenges WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (challenges.length === 0) {
      return res.status(404).json({ error: '도전을 찾을 수 없습니다.' });
    }

    const challenge = challenges[0];

    if (challenge.status !== 'in_progress') {
      return res.status(400).json({ error: '진행 중인 도전만 역을 선택할 수 있습니다.' });
    }

    // final_station_id 업데이트
    await pool.execute(
      'UPDATE challenges SET final_station_id = ? WHERE id = ?',
      [stationId, id]
    );

    console.log('[selectStation] 도전', id, '의 최종 역 선택:', stationId);

    res.json({
      success: true,
      challengeId: id,
      stationId
    });
  } catch (error) {
    console.error('[selectStation] 에러:', error);
    next(error);
  }
}

module.exports = {
  createChallenge,
  getChallengesByUser,
  getChallengeStations,
  completeChallenge,
  failChallenge,
  cancelChallenge,
  selectStation
};
