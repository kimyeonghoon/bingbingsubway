const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

describe('비밀번호 재설정 API', () => {
  let testUserId;
  let testUserEmail = 'reset-test@example.com';

  beforeAll(async () => {
    // 테스트 사용자 생성
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
      [testUserEmail, hashedPassword, 'reset-test-user']
    );
    testUserId = result.insertId;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await pool.query('DELETE FROM password_resets WHERE user_id = ?', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = ?', [testUserId]);
    await pool.end();
  });

  describe('POST /api/auth/forgot-password', () => {
    it('유효한 이메일로 재설정 토큰을 생성해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUserEmail });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('비밀번호 재설정 이메일이 발송되었습니다');

      // DB에 토큰이 저장되었는지 확인
      const [rows] = await pool.query(
        'SELECT * FROM password_resets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [testUserId]
      );
      expect(rows.length).toBe(1);
      expect(rows[0].token).toBeDefined();
      expect(new Date(rows[0].expires_at) > new Date()).toBe(true);
    });

    it('존재하지 않는 이메일은 성공 응답을 반환해야 함 (보안상)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('비밀번호 재설정 이메일이 발송되었습니다');
    });

    it('이메일 없이 요청 시 400 에러를 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      // 유효한 재설정 토큰 생성
      resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간 후

      await pool.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [testUserId, resetToken, expiresAt]
      );
    });

    afterEach(async () => {
      // 재설정 토큰 정리
      await pool.query('DELETE FROM password_resets WHERE user_id = ?', [testUserId]);
    });

    it('유효한 토큰으로 비밀번호를 재설정해야 함', async () => {
      const newPassword = 'newPassword123';
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('비밀번호가 재설정되었습니다');

      // 새 비밀번호로 로그인 가능한지 확인
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: newPassword
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.accessToken).toBeDefined();

      // 토큰이 삭제되었는지 확인
      const [rows] = await pool.query(
        'SELECT * FROM password_resets WHERE token = ?',
        [resetToken]
      );
      expect(rows.length).toBe(0);
    });

    it('만료된 토큰은 401 에러를 반환해야 함', async () => {
      // 만료된 토큰 생성
      const expiredToken = crypto.randomBytes(32).toString('hex');
      const expiredAt = new Date(Date.now() - 1000); // 1초 전 만료

      await pool.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [testUserId, expiredToken, expiredAt]
      );

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: expiredToken,
          password: 'newPassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('재설정 토큰이 만료되었습니다');
    });

    it('잘못된 토큰은 401 에러를 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newPassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('유효하지 않은 재설정 토큰입니다');
    });

    it('비밀번호가 너무 짧으면 400 에러를 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/비밀번호/);
    });
  });
});
