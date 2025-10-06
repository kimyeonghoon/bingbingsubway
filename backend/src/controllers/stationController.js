const { pool } = require('../config/database');

/**
 * 모든 노선 목록 조회
 */
async function getLines(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT line_num FROM stations ORDER BY line_num'
    );
    const lines = rows.map(row => row.line_num);
    res.json(lines);
  } catch (error) {
    next(error);
  }
}

/**
 * 특정 노선의 모든 역 조회
 */
async function getStationsByLine(req, res, next) {
  try {
    const { lineName } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM stations WHERE line_num = ? ORDER BY station_cd',
      [lineName]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '해당 노선의 역을 찾을 수 없습니다.' });
    }

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

/**
 * 특정 역 상세 정보 조회
 */
async function getStationById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM stations WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '역을 찾을 수 없습니다.' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

/**
 * 랜덤으로 N개의 역 선택 (특정 노선)
 *
 * 요청한 개수보다 역이 적을 경우:
 * - 해당 노선의 모든 역을 반환 (GTX-A는 9개)
 * - 최소 3개 미만인 경우에만 에러 반환
 */
async function getRandomStations(req, res, next) {
  try {
    const { lineName } = req.params;
    const requestedCount = parseInt(req.query.count) || 10;

    // 최소 요청 개수 체크
    if (requestedCount < 3) {
      return res.status(400).json({
        error: '최소 3개 이상의 역을 요청해야 합니다.'
      });
    }

    // 노선의 전체 역 개수 확인
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM stations WHERE line_num = ?',
      [lineName]
    );

    const totalStations = countResult[0].total;

    if (totalStations === 0) {
      return res.status(404).json({
        error: '해당 노선의 역을 찾을 수 없습니다.'
      });
    }

    if (totalStations < 3) {
      return res.status(400).json({
        error: `해당 노선에 역이 너무 적습니다. (현재: ${totalStations}개, 최소: 3개 필요)`
      });
    }

    // 실제 반환할 개수 결정: min(요청 개수, 전체 역 개수)
    const actualCount = Math.min(requestedCount, totalStations);

    // LIMIT는 prepared statement에서 바인딩할 수 없으므로 정수로 변환 후 직접 삽입
    const [rows] = await pool.execute(
      `SELECT * FROM stations WHERE line_num = ? ORDER BY RAND() LIMIT ${actualCount}`,
      [lineName]
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLines,
  getStationsByLine,
  getStationById,
  getRandomStations
};
