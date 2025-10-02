-- 빙빙 지하철 데이터베이스 스키마 백업
-- MySQL 8.0
-- 생성일: 2025-10-02
-- 설명: Docker 환경에서 검증된 실제 스키마

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- 1. users (사용자 테이블)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '비밀번호 해시',
  `provider` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'local' COMMENT '인증 제공자 (local/google/kakao/naver)',
  `provider_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '소셜 로그인 ID',
  `email_verified` tinyint(1) DEFAULT '0' COMMENT '이메일 인증 여부',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_provider` (`provider`,`provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. stations (역 정보 테이블)
DROP TABLE IF EXISTS `stations`;
CREATE TABLE `stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_cd` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '역 코드',
  `station_nm` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '역 이름',
  `line_num` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '노선명',
  `fr_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '외부코드',
  `latitude` decimal(10,8) DEFAULT NULL COMMENT '위도',
  `longitude` decimal(11,8) DEFAULT NULL COMMENT '경도',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `station_cd` (`station_cd`),
  KEY `idx_line` (`line_num`),
  KEY `idx_station_cd` (`station_cd`),
  KEY `idx_station_nm` (`station_nm`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. challenges (도전 기록 테이블)
DROP TABLE IF EXISTS `challenges`;
CREATE TABLE `challenges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `line_num` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '도전 노선',
  `total_stations` int NOT NULL DEFAULT '0' COMMENT '총 역 수',
  `completed_stations` int NOT NULL DEFAULT '0' COMMENT '완료한 역 수',
  `selected_stations` json DEFAULT NULL COMMENT '선택된 10개 역 ID 배열',
  `final_station_id` int DEFAULT NULL COMMENT '최종 선택된 역 ID',
  `status` enum('in_progress','completed','failed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'in_progress',
  `score` int DEFAULT '0' COMMENT '획득 점수',
  `time_taken` int DEFAULT '0' COMMENT '소요 시간(초)',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_line` (`line_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. visits (방문 기록 테이블)
DROP TABLE IF EXISTS `visits`;
CREATE TABLE `visits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `challenge_id` int DEFAULT NULL COMMENT '도전 ID',
  `user_id` int NOT NULL,
  `station_id` int NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '출발 시간',
  `arrival_time` timestamp NULL DEFAULT NULL COMMENT '도착 시간',
  `verified` tinyint(1) DEFAULT '0' COMMENT '인증 여부 (legacy)',
  `is_verified` tinyint(1) DEFAULT '0' COMMENT '인증 여부',
  `visited_at` timestamp NULL DEFAULT NULL COMMENT '방문 인증 시각',
  `time_taken` int DEFAULT NULL COMMENT '소요 시간(초)',
  `visit_latitude` decimal(10,8) DEFAULT NULL COMMENT '방문 시 위도',
  `visit_longitude` decimal(11,8) DEFAULT NULL COMMENT '방문 시 경도',
  `verified_latitude` decimal(10,8) DEFAULT NULL COMMENT '인증 시 위도',
  `verified_longitude` decimal(11,8) DEFAULT NULL COMMENT '인증 시 경도',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `station_id` (`station_id`),
  KEY `idx_user_verified` (`user_id`,`verified`),
  KEY `idx_challenge` (`challenge_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `visits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visits_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visits_ibfk_3` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. refresh_tokens (리프레시 토큰 테이블)
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. password_resets (비밀번호 재설정 테이블)
DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. user_stats (사용자 통계 테이블)
DROP TABLE IF EXISTS `user_stats`;
CREATE TABLE `user_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `total_challenges` int DEFAULT '0' COMMENT '총 도전 횟수',
  `completed_challenges` int DEFAULT '0' COMMENT '완료한 도전 수',
  `failed_challenges` int DEFAULT '0' COMMENT '실패한 도전 수',
  `success_rate` decimal(5,2) DEFAULT '0.00' COMMENT '성공률 (%)',
  `total_visited_stations` int DEFAULT '0' COMMENT '총 방문 역 수',
  `unique_visited_stations` int DEFAULT '0' COMMENT '고유 방문 역 수',
  `total_play_time` int DEFAULT '0' COMMENT '총 플레이 시간 (초)',
  `best_time` int DEFAULT '0' COMMENT '최단 완료 시간 (초)',
  `current_streak` int DEFAULT '0' COMMENT '현재 연속 성공',
  `max_streak` int DEFAULT '0' COMMENT '최대 연속 성공',
  `total_score` int DEFAULT '0' COMMENT '총 획득 점수',
  `first_challenge_at` timestamp NULL DEFAULT NULL COMMENT '첫 도전 날짜',
  `last_play_at` timestamp NULL DEFAULT NULL COMMENT '마지막 플레이 날짜',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `user_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. user_visited_stations (고유 역 방문 기록)
DROP TABLE IF EXISTS `user_visited_stations`;
CREATE TABLE `user_visited_stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `station_id` int NOT NULL,
  `visit_count` int DEFAULT '1' COMMENT '방문 횟수',
  `first_visit_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '첫 방문 날짜',
  `last_visit_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 방문 날짜',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_station` (`user_id`,`station_id`),
  KEY `station_id` (`station_id`),
  CONSTRAINT `user_visited_stations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_visited_stations_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. achievements (업적 정의 테이블)
DROP TABLE IF EXISTS `achievements`;
CREATE TABLE `achievements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '업적 이름',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '업적 설명',
  `icon` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '아이콘 이모지',
  `category` enum('challenge','visit','speed','streak','exploration') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '업적 카테고리',
  `tier` enum('bronze','silver','gold','platinum') COLLATE utf8mb4_unicode_ci DEFAULT 'bronze' COMMENT '업적 등급',
  `condition_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '조건 타입',
  `condition_value` int NOT NULL COMMENT '조건 값',
  `points` int DEFAULT '100' COMMENT '획득 포인트',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. user_achievements (사용자 업적 달성 기록)
DROP TABLE IF EXISTS `user_achievements`;
CREATE TABLE `user_achievements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `achievement_id` int NOT NULL,
  `achieved_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '달성 날짜',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_achievement` (`user_id`,`achievement_id`),
  KEY `achievement_id` (`achievement_id`),
  CONSTRAINT `user_achievements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_achievements_ibfk_2` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
