# 데이터베이스 스키마 요약

**생성일**: 2025-10-02
**데이터베이스**: MySQL 8.0
**인코딩**: utf8mb4_unicode_ci

---

## 📊 테이블 목록 (10개)

### 1. users (사용자)
- **PK**: `id` (INT)
- **주요 컬럼**:
  - `username` (VARCHAR 50, UNIQUE, NOT NULL)
  - `email` (VARCHAR 100, UNIQUE)
  - `password_hash` (VARCHAR 255)
  - `provider` (VARCHAR 20, DEFAULT 'local')
  - `provider_id` (VARCHAR 255) - 소셜 로그인 ID
  - `email_verified` (BOOLEAN, DEFAULT 0)
  - `created_at`, `last_login` (TIMESTAMP)
- **인덱스**: username, email, provider+provider_id

### 2. stations (역 정보)
- **PK**: `id` (INT)
- **주요 컬럼**:
  - `station_cd` (VARCHAR 10, UNIQUE, NOT NULL) - 역 코드
  - `station_nm` (VARCHAR 50, NOT NULL) - 역 이름
  - `line_num` (VARCHAR 50, NOT NULL) - 노선명
  - `fr_code` (VARCHAR 20) - 외부코드
  - `latitude` (DECIMAL 10,8) - 위도
  - `longitude` (DECIMAL 11,8) - 경도
  - `created_at` (TIMESTAMP)
- **인덱스**: station_cd, line_num, station_nm
- **데이터**: 799개 역 (GPS 좌표 100%)

### 3. challenges (도전 기록)
- **PK**: `id` (INT)
- **주요 컬럼**:
  - `user_id` (BIGINT, NOT NULL)
  - `line_num` (VARCHAR 50, NOT NULL) - 도전 노선
  - `total_stations` (INT, DEFAULT 0) - 총 역 수
  - `completed_stations` (INT, DEFAULT 0) - 완료한 역 수
  - `selected_stations` (JSON) - 선택된 10개 역 ID 배열
  - `final_station_id` (INT) - 최종 선택된 역 ID
  - `status` (ENUM: in_progress, completed, failed, cancelled)
  - `score` (INT, DEFAULT 0) - 획득 점수
  - `time_taken` (INT, DEFAULT 0) - 소요 시간(초)
  - `started_at`, `completed_at` (TIMESTAMP)
- **인덱스**: user_id+status, line_num

### 4. visits (방문 기록)
- **PK**: `id` (INT)
- **주요 컬럼**:
  - `challenge_id` (INT, nullable) - 도전 ID
  - `user_id` (INT, NOT NULL, FK → users)
  - `station_id` (INT, NOT NULL, FK → stations)
  - `start_time` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
  - `arrival_time` (TIMESTAMP)
  - `verified` (BOOLEAN, DEFAULT 0) - legacy
  - `is_verified` (BOOLEAN, DEFAULT 0) - 인증 여부
  - `time_taken` (INT) - 소요 시간(초)
  - `visit_latitude`, `visit_longitude` (DECIMAL) - 방문 시 GPS
  - `created_at` (TIMESTAMP)
- **FK**: user_id → users, station_id → stations, challenge_id → challenges
- **인덱스**: user_id+verified, challenge_id, created_at

### 5. refresh_tokens (리프레시 토큰)
- **PK**: `id` (INT)
- **주요 컬럼**:
  - `user_id` (INT, NOT NULL, FK → users)
  - `token` (VARCHAR 255, NOT NULL)
  - `expires_at` (TIMESTAMP, NOT NULL)
  - `created_at` (TIMESTAMP)
- **FK**: user_id → users (CASCADE DELETE)
- **인덱스**: token, user_id

### 6. password_resets (비밀번호 재설정)
- **PK**: `id` (INT)
- **주요 컬럼**:
  - `user_id` (INT, NOT NULL, FK → users)
  - `token` (VARCHAR 255, NOT NULL)
  - `expires_at` (TIMESTAMP, NOT NULL)
  - `created_at` (TIMESTAMP)
- **FK**: user_id → users (CASCADE DELETE)
- **인덱스**: token, user_id

### 7. user_stats (사용자 통계)
- **PK**: `id` (INT)
- **주요 컬럼**:
  - `user_id` (INT, UNIQUE, NOT NULL, FK → users)
  - `total_challenges` (INT, DEFAULT 0) - 총 도전 횟수
  - `completed_challenges` (INT, DEFAULT 0) - 완료한 도전 수
  - `failed_challenges` (INT, DEFAULT 0) - 실패한 도전 수
  - `success_rate` (DECIMAL 5,2, DEFAULT 0.00) - 성공률(%)
  - `total_visited_stations` (INT, DEFAULT 0) - 총 방문 역 수
  - `unique_visited_stations` (INT, DEFAULT 0) - 고유 방문 역 수
  - `total_play_time` (INT, DEFAULT 0) - 총 플레이 시간(초)
  - `best_time` (INT, DEFAULT 0) - 최단 완료 시간(초)
  - `current_streak` (INT, DEFAULT 0) - 현재 연속 성공
  - `max_streak` (INT, DEFAULT 0) - 최대 연속 성공
  - `total_score` (INT, DEFAULT 0) - 총 획득 점수
  - `first_challenge_at` (TIMESTAMP) - 첫 도전 날짜
  - `last_play_at` (TIMESTAMP) - 마지막 플레이 날짜
- **FK**: user_id → users (CASCADE DELETE)

### 8. user_visited_stations (고유 역 방문 기록)
- **PK**: `id` (INT)
- **주요 컬럼**:
  - `user_id` (INT, NOT NULL, FK → users)
  - `station_id` (INT, NOT NULL, FK → stations)
  - `visit_count` (INT, DEFAULT 1) - 방문 횟수
  - `first_visit_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
  - `last_visit_at` (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)
- **UNIQUE**: (user_id, station_id)
- **FK**: user_id → users, station_id → stations (CASCADE DELETE)

### 9. achievements (업적 정의)
- **PK**: `id` (INT)
- **주요 컬럼**:
  - `name` (VARCHAR 100, NOT NULL) - 업적 이름
  - `description` (TEXT) - 업적 설명
  - `icon` (VARCHAR 10) - 아이콘 이모지
  - `category` (ENUM: challenge, visit, speed, streak, exploration)
  - `tier` (ENUM: bronze, silver, gold, platinum)
  - `condition_type` (VARCHAR 50, NOT NULL) - 조건 타입
  - `condition_value` (INT, NOT NULL) - 조건 값
  - `points` (INT, DEFAULT 100) - 획득 포인트
  - `created_at` (TIMESTAMP)
- **데이터**: 14개 기본 업적

### 10. user_achievements (사용자 업적 달성 기록)
- **PK**: `id` (INT)
- **주요 컬럼**:
  - `user_id` (INT, NOT NULL, FK → users)
  - `achievement_id` (INT, NOT NULL, FK → achievements)
  - `achieved_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **UNIQUE**: (user_id, achievement_id)
- **FK**: user_id → users, achievement_id → achievements (CASCADE DELETE)

---

## 🔗 외래 키 관계

```
users (1) ─────→ (N) refresh_tokens
      (1) ─────→ (N) password_resets
      (1) ─────→ (1) user_stats
      (1) ─────→ (N) user_visited_stations
      (1) ─────→ (N) user_achievements
      (1) ─────→ (N) visits

stations (1) ──→ (N) user_visited_stations
         (1) ──→ (N) visits

challenges (1) → (N) visits

achievements (1) → (N) user_achievements
```

---

## 📈 주요 인덱스

### 성능 최적화 인덱스
- `users`: idx_username, idx_email, idx_provider(provider, provider_id)
- `stations`: idx_line, idx_station_cd, idx_station_nm
- `challenges`: idx_user_status(user_id, status), idx_line
- `visits`: idx_user_verified(user_id, verified), idx_challenge, idx_created_at

### 랭킹/통계용 인덱스
- `user_stats`: idx_total_score, idx_success_rate (컬럼 추가 가능)

---

## 🎯 업적 시스템

### 카테고리
1. **challenge**: 도전 완료 관련
2. **streak**: 연속 성공 관련
3. **exploration**: 역 탐험 관련
4. **speed**: 빠른 완료 관련

### 등급
- **Bronze**: 입문 (100-200 pts)
- **Silver**: 중급 (250-500 pts)
- **Gold**: 고급 (500-1500 pts)
- **Platinum**: 최고급 (2000+ pts)

---

## 🔐 인증 시스템

### JWT 토큰
- **Access Token**: 15분 유효 (메모리/localStorage)
- **Refresh Token**: 7일 유효 (DB 저장)

### 소셜 로그인 지원
- `provider`: local, google, kakao, naver
- `provider_id`: 각 제공자별 고유 ID

---

## 📝 주요 ENUM 값

### challenges.status
- `in_progress`: 진행 중
- `completed`: 완료
- `failed`: 실패
- `cancelled`: 취소

### achievements.category
- `challenge`: 도전
- `visit`: 방문
- `speed`: 속도
- `streak`: 연승
- `exploration`: 탐험

### achievements.tier
- `bronze`: 브론즈
- `silver`: 실버
- `gold`: 골드
- `platinum`: 플래티넘

---

## 🛠️ 유지보수

### 백업 파일
- `schema_backup.sql`: 전체 스키마 구조
- `seeds.sql`: 역 데이터 (799개)
- `achievements_seeds.sql`: 업적 데이터 (14개)

### 복구 방법
```bash
# 스키마만 복구
mysql -u user -p database < schema_backup.sql

# 역 데이터 복구
mysql -u user -p database < seeds.sql

# 업적 데이터 복구
mysql -u user -p database < achievements_seeds.sql
```

---

**마지막 업데이트**: 2025-10-02
**검증 환경**: Docker Compose (MySQL 8.0)
