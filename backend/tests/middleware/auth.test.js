const { authenticateToken } = require('../../src/middleware/auth');
const { generateAccessToken } = require('../../src/utils/jwt');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('authenticateToken', () => {
    it('유효한 토큰이 있으면 req.user를 설정하고 next를 호출해야 함', () => {
      const user = { id: 1, email: 'test@example.com', username: 'testuser' };
      const token = generateAccessToken(user);

      req.headers.authorization = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user.id);
      expect(req.user.email).toBe(user.email);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('토큰이 없으면 401 에러를 반환해야 함', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('잘못된 형식의 Authorization 헤더는 401 에러를 반환해야 함', () => {
      req.headers.authorization = 'InvalidFormat token';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('유효하지 않은 토큰은 403 에러를 반환해야 함', () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('Bearer 없이 토큰만 있으면 401 에러를 반환해야 함', () => {
      const user = { id: 1, email: 'test@example.com', username: 'testuser' };
      const token = generateAccessToken(user);

      req.headers.authorization = token; // Bearer 없음

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
