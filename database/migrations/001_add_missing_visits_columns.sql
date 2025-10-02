-- 마이그레이션: visits 테이블에 누락된 컬럼 추가
-- 작성일: 2025-10-03
-- 설명: visited_at, verified_latitude, verified_longitude 컬럼 추가

USE bingbing_subway;

-- visited_at 컬럼 추가 (방문 인증 시각)
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS visited_at timestamp NULL DEFAULT NULL COMMENT '방문 인증 시각'
AFTER is_verified;

-- verified_latitude 컬럼 추가 (인증 시 위도)
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS verified_latitude decimal(10,8) DEFAULT NULL COMMENT '인증 시 위도'
AFTER visit_longitude;

-- verified_longitude 컬럼 추가 (인증 시 경도)
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS verified_longitude decimal(11,8) DEFAULT NULL COMMENT '인증 시 경도'
AFTER verified_latitude;

-- 마이그레이션 완료 확인
SELECT 'Migration completed successfully' AS status;
DESCRIBE visits;
