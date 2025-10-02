-- Phase 4: 사용자 인증 시스템 마이그레이션
-- JWT 기반 로그인/회원가입을 위한 스키마 확장

-- 1. users 테이블 확장
ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) COMMENT 'bcrypt 해시',
  ADD COLUMN provider ENUM('local', 'google', 'kakao', 'naver') DEFAULT 'local' COMMENT '인증 제공자',
  ADD COLUMN provider_id VARCHAR(255) COMMENT '소셜 로그인 ID',
  ADD COLUMN email_verified BOOLEAN DEFAULT FALSE COMMENT '이메일 인증 여부',
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 이메일 NOT NULL로 변경 (local 제공자는 필수)
ALTER TABLE users
  MODIFY COLUMN email VARCHAR(100) NOT NULL;

-- provider_id 유니크 인덱스 추가 (소셜 로그인 중복 방지)
ALTER TABLE users
  ADD UNIQUE KEY uk_provider_id (provider, provider_id);

-- 2. refresh_tokens (리프레시 토큰 테이블)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token VARCHAR(500) NOT NULL COMMENT 'JWT 리프레시 토큰',
  expires_at TIMESTAMP NOT NULL COMMENT '만료 시간',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token(255)),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. password_resets (비밀번호 재설정 테이블)
CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token VARCHAR(255) NOT NULL COMMENT '재설정 토큰',
  expires_at TIMESTAMP NOT NULL COMMENT '만료 시간 (1시간)',
  used BOOLEAN DEFAULT FALSE COMMENT '사용 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
