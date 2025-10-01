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
 */
async function getRandomStations(req, res, next) {
  try {
    const { lineName } = req.params;
    const count = parseInt(req.query.count) || 10;

    const [rows] = await pool.execute(
      'SELECT * FROM stations WHERE line_num = ? ORDER BY RAND() LIMIT ?',
      [lineName, count]
    );

    if (rows.length < count) {
      return res.status(400).json({
        error: `해당 노선에 ${count}개 이상의 역이 없습니다. (현재: ${rows.length}개)`
      });
    }

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
