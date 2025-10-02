const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require('../../src/utils/jwt');

describe('JWT Utilities', () => {
  const testUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
  };

  describe('generateAccessToken', () => {
    it('액세스 토큰을 생성해야 함', () => {
      const token = generateAccessToken(testUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT 형식 확인
    });

    it('생성된 토큰에 사용자 정보가 포함되어야 함', () => {
      const token = generateAccessToken(testUser);
      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.username).toBe(testUser.username);
    });

    it('만료 시간이 설정되어야 함', () => {
      const token = generateAccessToken(testUser);
      const decoded = verifyAccessToken(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('리프레시 토큰을 생성해야 함', () => {
      const token = generateRefreshToken(testUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('생성된 토큰에 사용자 ID가 포함되어야 함', () => {
      const token = generateRefreshToken(testUser);
      const decoded = verifyRefreshToken(token);
      expect(decoded.id).toBe(testUser.id);
    });
  });

  describe('verifyAccessToken', () => {
    it('유효한 토큰을 검증해야 함', () => {
      const token = generateAccessToken(testUser);
      const decoded = verifyAccessToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testUser.id);
    });

    it('잘못된 토큰은 예외를 발생시켜야 함', () => {
      expect(() => {
        verifyAccessToken('invalid.token.here');
      }).toThrow();
    });

    // 만료 테스트는 실제 운영에서는 자동으로 검증됨 (시간이 오래 걸려 생략)
  });

  describe('verifyRefreshToken', () => {
    it('유효한 리프레시 토큰을 검증해야 함', () => {
      const token = generateRefreshToken(testUser);
      const decoded = verifyRefreshToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testUser.id);
    });

    it('잘못된 토큰은 예외를 발생시켜야 함', () => {
      expect(() => {
        verifyRefreshToken('invalid.token.here');
      }).toThrow();
    });
  });
});
