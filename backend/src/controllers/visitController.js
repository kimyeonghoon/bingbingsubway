const { pool } = require('../config/database');
const { calculateDistance } = require('../utils/distance');

const VERIFICATION_RADIUS = 100; // 미터
const TIME_LIMIT = 3 * 60 * 60 * 1000; // 3시간 (밀리초)

/**
 * 역 방문 인증
 */
async function createVisit(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const { challengeId, stationId, latitude, longitude, accuracy } = req.body;
    const userId = req.user.id; // JWT에서 가져온 사용자 ID

    if (!challengeId || !stationId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'challengeId, stationId, latitude, longitude는 필수입니다.'
      });
    }

    // GPS 정확도 검증 (선택적, 정확도가 너무 낮으면 경고)
    if (accuracy && accuracy > 50) {
      console.warn(`GPS accuracy is low: ${accuracy}m for user ${userId}`);
    }

    await connection.beginTransaction();

    // 1. 도전 정보 조회
    const [challenges] = await connection.execute(
      'SELECT * FROM challenges WHERE id = ? AND user_id = ?',
      [challengeId, userId]
    );

    if (challenges.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '도전을 찾을 수 없습니다.' });
    }

    const challenge = challenges[0];

    // 2. 시간 제한 확인 (3시간)
    const challengeStartedAt = new Date(challenge.started_at).getTime();
    const now = Date.now();
    const elapsedTime = now - challengeStartedAt;

    if (elapsedTime > TIME_LIMIT) {
      // 자동으로 실패 처리
      await connection.execute(
        `UPDATE challenges SET status = 'failed', completed_at = NOW() WHERE id = ?`,
        [challengeId]
      );

      await connection.rollback();
      return res.status(400).json({
        error: '시간 제한(3시간)이 초과되었습니다.',
        timeLimit: TIME_LIMIT / 1000 / 60, // 분 단위
        elapsedTime: elapsedTime / 1000 / 60, // 분 단위
        autoFailed: true
      });
    }

    // 3. 역 정보 조회
    const [stations] = await connection.execute(
      'SELECT * FROM stations WHERE id = ?',
      [stationId]
    );

    if (stations.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '역을 찾을 수 없습니다.' });
    }

    const station = stations[0];

    // 4. GPS 좌표 검증
    const distance = calculateDistance(
      latitude,
      longitude,
      parseFloat(station.latitude),
      parseFloat(station.longitude)
    );

    if (distance > VERIFICATION_RADIUS) {
      await connection.rollback();
      return res.status(400).json({
        error: '역과의 거리가 너무 멉니다.',
        distance: Math.round(distance),
        maxDistance: VERIFICATION_RADIUS,
        stationName: station.station_nm,
        accuracy: accuracy || null,
        message: `현재 위치는 ${station.station_nm}에서 약 ${Math.round(distance)}m 떨어져 있습니다. ${VERIFICATION_RADIUS}m 이내로 이동해주세요.`
      });
    }

    // 5. 방문 레코드 확인 및 업데이트
    const [visits] = await connection.execute(
      'SELECT * FROM visits WHERE challenge_id = ? AND user_id = ? AND station_id = ?',
      [challengeId, userId, stationId]
    );

    if (visits.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '해당 역은 이 도전에 포함되지 않습니다.' });
    }

    if (visits[0].is_verified) {
      await connection.rollback();
      return res.status(400).json({
        error: '이미 인증된 역입니다.',
        visitedAt: visits[0].visited_at
      });
    }

    // 6. 방문 인증 처리
    await connection.execute(
      `UPDATE visits
       SET is_verified = true,
           visited_at = NOW(),
           verified_latitude = ?,
           verified_longitude = ?
       WHERE id = ?`,
      [latitude, longitude, visits[0].id]
    );

    // 7. 도전의 완료된 역 수 업데이트
    const [verifiedCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM visits WHERE challenge_id = ? AND is_verified = true',
      [challengeId]
    );

    const completedStations = verifiedCount[0].count;

    await connection.execute(
      `UPDATE challenges
       SET completed_stations = ?,
           completed_at = CASE WHEN ? = total_stations THEN NOW() ELSE completed_at END
       WHERE id = ?`,
      [completedStations, completedStations, challengeId]
    );

    await connection.commit();

    res.json({
      success: true,
      stationName: station.station_nm,
      distance: Math.round(distance),
      completedStations,
      totalStations: challenge.total_stations,
      isAllCompleted: completedStations === challenge.total_stations
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * 사용자의 모든 방문 기록 조회
 */
async function getVisitsByUser(req, res, next) {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(
      `SELECT
        v.id,
        v.challenge_id,
        v.station_id,
        s.station_nm,
        s.station_cd,
        s.line_num,
        v.is_verified,
        v.visited_at,
        v.verified_latitude,
        v.verified_longitude
      FROM visits v
      JOIN stations s ON v.station_id = s.id
      WHERE v.user_id = ?
      ORDER BY v.visited_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createVisit,
  getVisitsByUser
};
