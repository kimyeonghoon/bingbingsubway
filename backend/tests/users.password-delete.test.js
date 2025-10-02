const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { generateAccessToken } = require('../src/utils/jwt');

describe('비밀번호 변경 및 회원탈퇴 API', () => {
  let testUserId;
  let testUserToken;
  let testUserEmail = 'password-change-test@example.com';

  beforeEach(async () => {
    // 각 테스트마다 새로운 사용자 생성
    const hashedPassword = await bcrypt.hash('oldPassword123', 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
      [testUserEmail, hashedPassword, 'password-test-user']
    );
    testUserId = result.insertId;
    testUserToken = generateAccessToken({ id: testUserId });
  });

  afterEach(async () => {
    // 각 테스트 후 데이터 정리
    await pool.query('DELETE FROM users WHERE id = ?', [testUserId]);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('PUT /api/users/:userId/password', () => {
    it('올바른 현재 비밀번호로 변경할 수 있어야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}/password`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          currentPassword: 'oldPassword123',
          newPassword: 'newPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('비밀번호가 변경되었습니다');

      // 새 비밀번호로 로그인 확인
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'newPassword123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.accessToken).toBeDefined();
    });

    it('잘못된 현재 비밀번호는 401 에러를 반환해야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}/password`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/현재 비밀번호가 일치하지 않습니다/);
    });

    it('새 비밀번호가 너무 짧으면 400 에러를 반환해야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}/password`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          currentPassword: 'oldPassword123',
          newPassword: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/8자 이상/);
    });

    it('필수 필드 누락 시 400 에러를 반환해야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}/password`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          currentPassword: 'oldPassword123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('다른 사용자의 비밀번호를 변경할 수 없어야 함', async () => {
      // 다른 사용자 생성
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [result] = await pool.query(
        'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
        ['other@example.com', hashedPassword, 'other-user']
      );
      const otherUserId = result.insertId;

      const res = await request(app)
        .put(`/api/users/${otherUserId}/password`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newPassword123'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/권한이 없습니다/);

      // 정리
      await pool.query('DELETE FROM users WHERE id = ?', [otherUserId]);
    });

    it('인증 없이 요청 시 401 에러를 반환해야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}/password`)
        .send({
          currentPassword: 'oldPassword123',
          newPassword: 'newPassword123'
        });

      expect(res.status).toBe(401);
    });

    it('비밀번호 변경 시 모든 리프레시 토큰이 삭제되어야 함', async () => {
      // 리프레시 토큰 생성
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [testUserId, 'test-refresh-token', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      );

      const res = await request(app)
        .put(`/api/users/${testUserId}/password`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          currentPassword: 'oldPassword123',
          newPassword: 'newPassword123'
        });

      expect(res.status).toBe(200);

      // 리프레시 토큰이 삭제되었는지 확인
      const [tokens] = await pool.query(
        'SELECT * FROM refresh_tokens WHERE user_id = ?',
        [testUserId]
      );
      expect(tokens.length).toBe(0);
    });
  });

  describe('DELETE /api/users/:userId', () => {
    it('올바른 비밀번호로 회원탈퇴할 수 있어야 함', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          password: 'oldPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('회원탈퇴가 완료되었습니다');

      // 사용자가 삭제되었는지 확인
      const [users] = await pool.query(
        'SELECT * FROM users WHERE id = ?',
        [testUserId]
      );
      expect(users.length).toBe(0);
    });

    it('잘못된 비밀번호는 401 에러를 반환해야 함', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          password: 'wrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/비밀번호가 일치하지 않습니다/);

      // 사용자가 삭제되지 않았는지 확인
      const [users] = await pool.query(
        'SELECT * FROM users WHERE id = ?',
        [testUserId]
      );
      expect(users.length).toBe(1);
    });

    it('비밀번호 없이 요청 시 400 에러를 반환해야 함', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('다른 사용자를 탈퇴시킬 수 없어야 함', async () => {
      // 다른 사용자 생성
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [result] = await pool.query(
        'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
        ['other@example.com', hashedPassword, 'other-user']
      );
      const otherUserId = result.insertId;

      const res = await request(app)
        .delete(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          password: 'password123'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/권한이 없습니다/);

      // 정리
      await pool.query('DELETE FROM users WHERE id = ?', [otherUserId]);
    });

    it('인증 없이 요청 시 401 에러를 반환해야 함', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .send({
          password: 'oldPassword123'
        });

      expect(res.status).toBe(401);
    });

    it('회원탈퇴 시 관련 데이터가 모두 삭제되어야 함 (CASCADE)', async () => {
      // 리프레시 토큰 생성
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [testUserId, 'test-refresh-token', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      );

      // 비밀번호 재설정 토큰 생성
      await pool.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [testUserId, 'test-reset-token', new Date(Date.now() + 60 * 60 * 1000)]
      );

      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          password: 'oldPassword123'
        });

      expect(res.status).toBe(200);

      // 리프레시 토큰이 삭제되었는지 확인
      const [tokens] = await pool.query(
        'SELECT * FROM refresh_tokens WHERE user_id = ?',
        [testUserId]
      );
      expect(tokens.length).toBe(0);

      // 비밀번호 재설정 토큰이 삭제되었는지 확인
      const [resets] = await pool.query(
        'SELECT * FROM password_resets WHERE user_id = ?',
        [testUserId]
      );
      expect(resets.length).toBe(0);
    });
  });
});
