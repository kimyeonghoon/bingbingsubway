const bcrypt = require('bcryptjs');
const { pool: db } = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

/**
 * 회원가입
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { email, password, username } = req.body;

    // 입력 검증
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // 비밀번호 길이 검증 (최소 8자)
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // 이메일 중복 확인
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 사용자명 중복 확인
    const [existingUsernames] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsernames.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10);

    // 사용자 생성
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, username, provider, email_verified) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, username, 'local', false]
    );

    const userId = result.insertId;

    // 생성된 사용자 조회
    const [users] = await db.query(
      'SELECT id, email, username, provider, email_verified, created_at FROM users WHERE id = ?',
      [userId]
    );

    const user = users[0];

    // JWT 토큰 생성
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 리프레시 토큰 DB에 저장
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, refreshToken, expiresAt]
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 로그인
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 입력 검증
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 사용자 조회
    const [users] = await db.query(
      'SELECT id, email, username, password_hash, provider, email_verified, created_at FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // password_hash 제거
    delete user.password_hash;

    // JWT 토큰 생성
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 리프레시 토큰 DB에 저장
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, expiresAt]
    );

    // 마지막 로그인 시간 업데이트
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    res.status(200).json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  register,
  login,
};
