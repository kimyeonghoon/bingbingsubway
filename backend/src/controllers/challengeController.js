const { pool } = require('../config/database');

/**
 * 새로운 도전 생성
 */
async function createChallenge(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const { userId, lineName, stationCount } = req.body;

    if (!userId || !lineName || !stationCount) {
      return res.status(400).json({
        error: 'userId, lineName, stationCount는 필수입니다.'
      });
    }

    await connection.beginTransaction();

    // 1. 랜덤 역 선택
    const [stations] = await connection.execute(
      'SELECT * FROM stations WHERE line_num = ? ORDER BY RAND() LIMIT ?',
      [lineName, stationCount]
    );

    if (stations.length < stationCount) {
      await connection.rollback();
      return res.status(400).json({
        error: `해당 노선에 ${stationCount}개 이상의 역이 없습니다.`
      });
    }

    // 2. 도전 레코드 생성
    const [result] = await connection.execute(
      'INSERT INTO challenges (user_id, line_num, total_stations, completed_stations, created_at) VALUES (?, ?, ?, 0, NOW())',
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

    const [rows] = await pool.execute(
      `SELECT
        c.id,
        c.line_num,
        c.total_stations,
        c.completed_stations,
        c.created_at,
        c.completed_at,
        CASE
          WHEN c.completed_stations = c.total_stations THEN 'completed'
          ELSE 'in_progress'
        END as status
      FROM challenges c
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
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
        v.visited_at,
        v.verified_latitude,
        v.verified_longitude
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

module.exports = {
  createChallenge,
  getChallengesByUser,
  getChallengeStations
};
