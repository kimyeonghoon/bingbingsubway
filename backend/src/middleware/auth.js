const { verifyAccessToken } = require('../utils/jwt');

/**
 * JWT 토큰 인증 미들웨어
 * Authorization: Bearer <token> 헤더에서 토큰을 추출하고 검증
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const user = verifyAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  authenticateToken,
};
