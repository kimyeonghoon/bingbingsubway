-- 빙빙 지하철 데이터베이스 스키마
-- MySQL 8.0

-- 1. users (사용자 테이블)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
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

-- 3. visits (방문 기록 테이블)
CREATE TABLE IF NOT EXISTS visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  station_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL COMMENT '출발 시간',
  arrival_time TIMESTAMP COMMENT '도착 시간',
  verified BOOLEAN DEFAULT FALSE COMMENT '인증 여부',
  time_taken INT COMMENT '소요 시간(초)',
  visit_latitude DECIMAL(10, 8) COMMENT '방문 시 위도',
  visit_longitude DECIMAL(11, 8) COMMENT '방문 시 경도',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  INDEX idx_user_verified (user_id, verified),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. challenges (도전 기록 테이블)
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

-- 5. 통계 뷰 (선택사항)
CREATE OR REPLACE VIEW station_visit_stats AS
SELECT
  s.id AS station_id,
  s.station_nm,
  s.line_num,
  COUNT(v.id) AS visit_count,
  COUNT(DISTINCT v.user_id) AS unique_visitors
FROM stations s
LEFT JOIN visits v ON s.id = v.id AND v.verified = TRUE
GROUP BY s.id, s.station_nm, s.line_num;
