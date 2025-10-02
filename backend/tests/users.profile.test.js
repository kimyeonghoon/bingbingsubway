const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { generateAccessToken } = require('../src/utils/jwt');

describe('프로필 관리 API', () => {
  let testUserId;
  let testUserToken;
  let otherUserId;

  beforeAll(async () => {
    // 테스트 사용자 1 생성
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [result1] = await pool.query(
      'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
      ['profile-test@example.com', hashedPassword, 'profile-test-user']
    );
    testUserId = result1.insertId;
    testUserToken = generateAccessToken({ id: testUserId });

    // 테스트 사용자 2 생성 (권한 테스트용)
    const [result2] = await pool.query(
      'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
      ['other@example.com', hashedPassword, 'other-user']
    );
    otherUserId = result2.insertId;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await pool.query('DELETE FROM users WHERE id IN (?, ?)', [testUserId, otherUserId]);
    await pool.end();
  });

  describe('GET /api/users/:userId', () => {
    it('자신의 프로필을 조회할 수 있어야 함', async () => {
      const res = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testUserId);
      expect(res.body.email).toBe('profile-test@example.com');
      expect(res.body.username).toBe('profile-test-user');
      expect(res.body.password_hash).toBeUndefined(); // 비밀번호는 반환하지 않음
    });

    it('다른 사용자의 공개 프로필을 조회할 수 있어야 함', async () => {
      const res = await request(app)
        .get(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(otherUserId);
      expect(res.body.username).toBe('other-user');
      expect(res.body.email).toBeUndefined(); // 다른 사용자의 이메일은 비공개
    });

    it('인증 없이 요청 시 401 에러를 반환해야 함', async () => {
      const res = await request(app)
        .get(`/api/users/${testUserId}`);

      expect(res.status).toBe(401);
    });

    it('존재하지 않는 사용자는 404 에러를 반환해야 함', async () => {
      const res = await request(app)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/찾을 수 없습니다/);
    });
  });

  describe('PUT /api/users/:userId', () => {
    it('자신의 프로필을 수정할 수 있어야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          username: 'updated-username'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('프로필이 업데이트되었습니다');

      // DB에서 변경 확인
      const [users] = await pool.query(
        'SELECT username FROM users WHERE id = ?',
        [testUserId]
      );
      expect(users[0].username).toBe('updated-username');

      // 원래대로 복구
      await pool.query(
        'UPDATE users SET username = ? WHERE id = ?',
        ['profile-test-user', testUserId]
      );
    });

    it('다른 사용자의 프로필을 수정할 수 없어야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          username: 'hacked-username'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/권한이 없습니다/);
    });

    it('중복된 사용자명으로 변경 시 400 에러를 반환해야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          username: 'other-user' // 이미 존재하는 사용자명
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/이미 사용 중/);
    });

    it('중복된 이메일로 변경 시 400 에러를 반환해야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          email: 'other@example.com' // 이미 존재하는 이메일
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/이미 사용 중/);
    });

    it('유효하지 않은 이메일 형식은 400 에러를 반환해야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          email: 'invalid-email'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/이메일 형식/);
    });

    it('인증 없이 요청 시 401 에러를 반환해야 함', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .send({
          username: 'new-username'
        });

      expect(res.status).toBe(401);
    });
  });
});
