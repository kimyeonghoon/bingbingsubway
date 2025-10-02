const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * 액세스 토큰 생성
 * @param {Object} user - 사용자 객체 (id, email, username)
 * @returns {string} JWT 액세스 토큰
 */
function generateAccessToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * 리프레시 토큰 생성
 * @param {Object} user - 사용자 객체 (id)
 * @returns {string} JWT 리프레시 토큰
 */
function generateRefreshToken(user) {
  const payload = {
    id: user.id,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * 액세스 토큰 검증
 * @param {string} token - JWT 액세스 토큰
 * @returns {Object} 디코딩된 페이로드
 * @throws {Error} 토큰이 유효하지 않거나 만료된 경우
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * 리프레시 토큰 검증
 * @param {string} token - JWT 리프레시 토큰
 * @returns {Object} 디코딩된 페이로드
 * @throws {Error} 토큰이 유효하지 않거나 만료된 경우
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
