-- Phase 3: 사용자 기록 시스템 마이그레이션
-- 실행 방법: mysql -u root -p bingbing_subway < migrations/001_add_user_stats.sql

-- 1. user_stats 테이블: 사용자별 통계
CREATE TABLE IF NOT EXISTS user_stats (
  user_id BIGINT PRIMARY KEY,
  total_challenges INT DEFAULT 0 COMMENT '총 도전 횟수',
  completed_challenges INT DEFAULT 0 COMMENT '성공한 도전 수',
  failed_challenges INT DEFAULT 0 COMMENT '실패한 도전 수',
  success_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT '성공률 (%)',
  total_visited_stations INT DEFAULT 0 COMMENT '총 방문한 역 수 (중복 포함)',
  unique_visited_stations INT DEFAULT 0 COMMENT '고유 방문 역 수',
  total_play_time INT DEFAULT 0 COMMENT '총 플레이 시간 (초)',
  current_streak INT DEFAULT 0 COMMENT '현재 연속 성공',
  max_streak INT DEFAULT 0 COMMENT '최대 연속 성공',
  total_score INT DEFAULT 0 COMMENT '총 점수',
  first_challenge_at TIMESTAMP NULL COMMENT '첫 도전 날짜',
  last_challenge_at TIMESTAMP NULL COMMENT '마지막 도전 날짜',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_success_rate (success_rate DESC),
  INDEX idx_total_score (total_score DESC),
  INDEX idx_max_streak (max_streak DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. user_visited_stations 테이블: 고유 역 방문 기록
CREATE TABLE IF NOT EXISTS user_visited_stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  station_id INT NOT NULL,
  first_visit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '첫 방문 날짜',
  visit_count INT DEFAULT 1 COMMENT '방문 횟수',
  last_visit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_station (user_id, station_id),
  INDEX idx_user_id (user_id),
  INDEX idx_station_id (station_id),
  INDEX idx_visit_count (visit_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. achievements 테이블: 업적 정의
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL COMMENT '업적 코드',
  name VARCHAR(100) NOT NULL COMMENT '업적 이름',
  description TEXT COMMENT '업적 설명',
  icon VARCHAR(10) COMMENT '이모지 아이콘',
  category ENUM('beginner', 'streak', 'explorer', 'speed', 'master', 'perfect') NOT NULL COMMENT '업적 카테고리',
  condition_type ENUM('challenge_count', 'success_count', 'streak', 'station_count', 'time', 'line_complete') NOT NULL COMMENT '달성 조건 타입',
  condition_value INT NOT NULL COMMENT '달성 조건 값',
  points INT DEFAULT 0 COMMENT '업적 점수',
  tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze' COMMENT '업적 등급',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. user_achievements 테이블: 사용자별 업적 달성 기록
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  achievement_id INT NOT NULL,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '달성 날짜',
  progress INT DEFAULT 0 COMMENT '진행률 (0-100)',
  UNIQUE KEY unique_user_achievement (user_id, achievement_id),
  INDEX idx_user_id (user_id),
  INDEX idx_achievement_id (achievement_id),
  INDEX idx_achieved_at (achieved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. challenges 테이블 확인 (이미 존재하는 경우 스킵)
-- total_stations, completed_stations는 이미 존재

-- 6. visits 테이블 확인 (이미 존재하는 경우 스킵)
-- challenge_id, distance, is_verified는 이미 존재할 수 있음
