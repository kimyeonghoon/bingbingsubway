const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool: db } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const emailService = require('../services/emailService');

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

/**
 * 토큰 갱신
 * POST /api/auth/refresh
 */
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;

    // 입력 검증
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // 리프레시 토큰 검증
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // DB에서 리프레시 토큰 확인
    const [tokens] = await db.query(
      'SELECT user_id, expires_at FROM refresh_tokens WHERE token = ?',
      [refreshToken]
    );

    if (tokens.length === 0) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    const tokenData = tokens[0];

    // 만료 시간 확인
    if (new Date(tokenData.expires_at) < new Date()) {
      // 만료된 토큰 삭제
      await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // 사용자 정보 조회
    const [users] = await db.query(
      'SELECT id, email, username, provider, email_verified, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];

    // 새 토큰 생성
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // 기존 리프레시 토큰 삭제
    await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);

    // 새 리프레시 토큰 저장
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, newRefreshToken, expiresAt]
    );

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 로그아웃
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    // 입력 검증
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // DB에서 리프레시 토큰 삭제
    await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 현재 사용자 정보 조회
 * GET /api/auth/me
 */
async function me(req, res) {
  try {
    // req.user는 authenticateToken 미들웨어에서 설정됨
    const userId = req.user.id;

    // DB에서 최신 사용자 정보 조회
    const [users] = await db.query(
      'SELECT id, email, username, provider, email_verified, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(users[0]);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 비밀번호 재설정 요청
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // 입력 검증
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // 사용자 조회
    const [users] = await db.query(
      'SELECT id, email, username FROM users WHERE email = ?',
      [email]
    );

    // 보안상 이유로 사용자가 존재하지 않아도 성공 응답 반환
    if (users.length === 0) {
      return res.status(200).json({ message: '비밀번호 재설정 이메일이 발송되었습니다' });
    }

    const user = users[0];

    // 재설정 토큰 생성 (32바이트 랜덤 문자열)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간 후

    // 기존 재설정 토큰 삭제
    await db.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);

    // 새 재설정 토큰 저장
    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    // 이메일 발송
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await emailService.sendPasswordResetEmail(user.email, user.username, resetUrl);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // 이메일 발송 실패해도 사용자에게는 성공 응답 반환 (보안)
    }

    res.status(200).json({ message: '비밀번호 재설정 이메일이 발송되었습니다' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 비밀번호 재설정
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    // 입력 검증
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return res.status(400).json({ error: '비밀번호는 최소 8자 이상이어야 합니다' });
    }

    // 토큰 조회
    const [tokens] = await db.query(
      'SELECT user_id, expires_at FROM password_resets WHERE token = ?',
      [token]
    );

    if (tokens.length === 0) {
      return res.status(401).json({ error: '유효하지 않은 재설정 토큰입니다' });
    }

    const tokenData = tokens[0];

    // 만료 시간 확인
    if (new Date(tokenData.expires_at) < new Date()) {
      // 만료된 토큰 삭제
      await db.query('DELETE FROM password_resets WHERE token = ?', [token]);
      return res.status(401).json({ error: '재설정 토큰이 만료되었습니다' });
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10);

    // 비밀번호 업데이트
    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, tokenData.user_id]
    );

    // 재설정 토큰 삭제
    await db.query('DELETE FROM password_resets WHERE token = ?', [token]);

    // 기존 리프레시 토큰 모두 삭제 (보안)
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [tokenData.user_id]);

    res.status(200).json({ message: '비밀번호가 재설정되었습니다' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
};
