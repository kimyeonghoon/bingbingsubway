-- 빙빙 지하철 데이터베이스 스키마
-- MySQL 8.0

-- 1. users (사용자 테이블)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) COMMENT '비밀번호 해시',
  provider VARCHAR(20) DEFAULT 'local' COMMENT '인증 제공자 (local/google/kakao/naver)',
  provider_id VARCHAR(255) COMMENT '소셜 로그인 ID',
  email_verified BOOLEAN DEFAULT FALSE COMMENT '이메일 인증 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_provider (provider, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. stations (역 정보 테이블)
CREATE TABLE IF NOT EXISTS stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_cd VARCHAR(10) UNIQUE NOT NULL COMMENT '역 코드',
  station_nm VARCHAR(50) NOT NULL COMMENT '역 이름',
  line_num VARCHAR(50) NOT NULL COMMENT '노선명',
  fr_code VARCHAR(20) COMMENT '외부코드',
  latitude DECIMAL(10, 8) COMMENT '위도',
  longitude DECIMAL(11, 8) COMMENT '경도',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_line (line_num),
  INDEX idx_station_cd (station_cd),
  INDEX idx_station_nm (station_nm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. challenges (도전 기록 테이블)
CREATE TABLE IF NOT EXISTS challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  line_num VARCHAR(50) NOT NULL COMMENT '도전 노선',
  total_stations INT NOT NULL DEFAULT 0 COMMENT '총 역 수',
  completed_stations INT NOT NULL DEFAULT 0 COMMENT '완료한 역 수',
  selected_stations JSON COMMENT '선택된 10개 역 ID 배열',
  final_station_id INT COMMENT '최종 선택된 역 ID',
  status ENUM('in_progress', 'completed', 'failed', 'cancelled') DEFAULT 'in_progress',
  score INT DEFAULT 0 COMMENT '획득 점수',
  time_taken INT DEFAULT 0 COMMENT '소요 시간(초)',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_user_status (user_id, status),
  INDEX idx_line (line_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. visits (방문 기록 테이블)
CREATE TABLE IF NOT EXISTS visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challenge_id INT COMMENT '도전 ID',
  user_id INT NOT NULL,
  station_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '출발 시간',
  arrival_time TIMESTAMP COMMENT '도착 시간',
  verified BOOLEAN DEFAULT FALSE COMMENT '인증 여부 (legacy)',
  is_verified BOOLEAN DEFAULT FALSE COMMENT '인증 여부',
  time_taken INT COMMENT '소요 시간(초)',
  visit_latitude DECIMAL(10, 8) COMMENT '방문 시 위도',
  visit_longitude DECIMAL(11, 8) COMMENT '방문 시 경도',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  INDEX idx_user_verified (user_id, verified),
  INDEX idx_challenge (challenge_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. refresh_tokens (리프레시 토큰 테이블)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. password_resets (비밀번호 재설정 테이블)
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. user_stats (사용자 통계 테이블)
CREATE TABLE IF NOT EXISTS user_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  total_challenges INT DEFAULT 0 COMMENT '총 도전 횟수',
  completed_challenges INT DEFAULT 0 COMMENT '완료한 도전 수',
  failed_challenges INT DEFAULT 0 COMMENT '실패한 도전 수',
  success_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '성공률 (%)',
  total_visited_stations INT DEFAULT 0 COMMENT '총 방문 역 수',
  unique_visited_stations INT DEFAULT 0 COMMENT '고유 방문 역 수',
  total_play_time INT DEFAULT 0 COMMENT '총 플레이 시간 (초)',
  best_time INT DEFAULT 0 COMMENT '최단 완료 시간 (초)',
  current_streak INT DEFAULT 0 COMMENT '현재 연속 성공',
  max_streak INT DEFAULT 0 COMMENT '최대 연속 성공',
  total_score INT DEFAULT 0 COMMENT '총 획득 점수',
  first_challenge_at TIMESTAMP NULL COMMENT '첫 도전 날짜',
  last_play_at TIMESTAMP NULL COMMENT '마지막 플레이 날짜',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_total_score (total_score),
  INDEX idx_success_rate (success_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. user_visited_stations (고유 역 방문 기록)
CREATE TABLE IF NOT EXISTS user_visited_stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  station_id INT NOT NULL,
  visit_count INT DEFAULT 1 COMMENT '방문 횟수',
  first_visit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '첫 방문 날짜',
  last_visit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 방문 날짜',
  UNIQUE KEY unique_user_station (user_id, station_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_visit_count (visit_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. achievements (업적 정의 테이블)
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '업적 이름',
  description TEXT COMMENT '업적 설명',
  icon VARCHAR(10) COMMENT '아이콘 이모지',
  category ENUM('challenge', 'visit', 'speed', 'streak', 'exploration') NOT NULL COMMENT '업적 카테고리',
  tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze' COMMENT '업적 등급',
  condition_type VARCHAR(50) NOT NULL COMMENT '조건 타입',
  condition_value INT NOT NULL COMMENT '조건 값',
  points INT DEFAULT 100 COMMENT '획득 포인트',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. user_achievements (사용자 업적 달성 기록)
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '달성 날짜',
  UNIQUE KEY unique_user_achievement (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_achieved_at (achieved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 통계 뷰 (선택사항)
CREATE OR REPLACE VIEW station_visit_stats AS
SELECT
  s.id AS station_id,
  s.station_nm,
  s.line_num,
  COUNT(v.id) AS visit_count,
  COUNT(DISTINCT v.user_id) AS unique_visitors
FROM stations s
LEFT JOIN visits v ON s.id = v.station_id AND v.is_verified = TRUE
GROUP BY s.id, s.station_nm, s.line_num;
