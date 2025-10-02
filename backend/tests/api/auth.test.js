const request = require('supertest');
const app = require('../../src/server');
const { pool: db } = require('../../src/config/database');

describe('Auth API', () => {
  // 테스트 후 생성된 사용자 정리
  afterEach(async () => {
    await db.query('DELETE FROM users WHERE email LIKE ?', ['test%@example.com']);
    await db.query('DELETE FROM users WHERE email = ?', ['login@example.com']);
  });

  afterAll(async () => {
    await db.end();
  });

  describe('POST /api/auth/register', () => {
    it('새 사용자를 등록해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          username: 'testuser',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.username).toBe('testuser');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('이메일 중복 시 에러를 반환해야 함', async () => {
      // 첫 번째 사용자 등록
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'Password123!',
          username: 'testuser2',
        });

      // 같은 이메일로 두 번째 등록 시도
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'Password456!',
          username: 'testuser3',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('사용자명 중복 시 에러를 반환해야 함', async () => {
      // 첫 번째 사용자 등록
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test3@example.com',
          password: 'Password123!',
          username: 'duplicateuser',
        });

      // 같은 사용자명으로 두 번째 등록 시도
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test4@example.com',
          password: 'Password456!',
          username: 'duplicateuser',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('필수 필드 누락 시 에러를 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test5@example.com',
          // password 누락
          username: 'testuser5',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('비밀번호가 너무 짧으면 에러를 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test6@example.com',
          password: '123',
          username: 'testuser6',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('잘못된 이메일 형식은 에러를 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          username: 'testuser7',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 테스트 사용자 등록
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
          username: 'loginuser',
        });
    });

    it('올바른 자격증명으로 로그인해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('잘못된 비밀번호는 에러를 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('존재하지 않는 이메일은 에러를 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('필수 필드 누락 시 에러를 반환해야 함', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          // password 누락
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});
