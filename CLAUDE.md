# 🎡 빙빙 지하철

## 📋 개요

수도권 지하철역을 돌림판으로 랜덤 선택하여 방문하는 게임

**주요 기능**:
1. 특정 노선에서 10개 역 랜덤 추출
2. 돌림판으로 최종 역 선택
3. GPS 인증 (100m 반경, 3시간 제한)
4. 방문 기록 저장 및 진행률 표시

---

## 🗄️ 데이터베이스 (MySQL 8.0)

### 테이블
1. **users**: 사용자 정보
2. **stations**: 역 정보 (799개, GPS 좌표 포함)
3. **visits**: 방문 기록
4. **challenges**: 도전 기록

### 호스팅
- **PlanetScale** (무료 티어 추천)
- Railway / Docker (대안)

---

## 🔧 기술 스택

### Backend
- Node.js + Express
- mysql2
- cors, dotenv

### Frontend
- React 18 + Vite
- TailwindCSS
- Axios, Lucide React

### APIs
- Geolocation API (GPS)
- REST API (Backend 통신)

---

## 📂 프로젝트 구조

```
bingbing_subway/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/api.js
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── .env
│   └── package.json
├── database/
│   ├── schema.sql
│   └── seeds.sql (799개 역, GPS 100%)
└── CLAUDE.md
```

---

## 🚀 개발 단계

### Phase 0: DB 설정 ✅
- schema.sql, seeds.sql 완료

### Phase 1: Backend API ✅
- 역 정보 조회
- 도전 시작/방문 기록
- GPS 인증

### Phase 2: Frontend ✅
- 노선 선택 UI
- 돌림판 애니메이션
- 타이머 (3시간)
- GPS 인증 컴포넌트
- 방문 기록 목록

### Phase 3: 사용자 기록 시스템 ✅
#### 데이터베이스 확장
- **user_stats** 테이블: 사용자별 통계
  - 총 도전 횟수, 성공/실패 수, 성공률
  - 총 방문 역 수, 총 플레이 시간
  - 연속 성공 기록, 현재 스트릭
  - 첫 도전 날짜, 마지막 플레이 날짜

- **user_visited_stations** 테이블: 고유 역 방문 기록
  - user_id, station_id, 첫 방문 날짜, 방문 횟수

- **user_achievements** 테이블: 업적 달성 기록
  - user_id, achievement_id, 달성 날짜

- **achievements** 테이블: 업적 정의
  - 🚇 첫 발걸음, 🔥 연승왕, 🗺️ 탐험가
  - ⏱️ 스피드러너, 🌟 노선 마스터, 💯 완벽주의자

#### Backend API
- **GET /api/users/:userId/stats**: 사용자 통계
- **GET /api/users/:userId/visited-stations**: 방문 역 목록
- **GET /api/users/:userId/achievements**: 달성한 업적
- **GET /api/users/:userId/line-stats**: 노선별 통계
- **GET /api/leaderboard**: 랭킹 (전체/주간)
- **POST /api/challenges/:challengeId/complete**: 도전 완료 처리
- **POST /api/challenges/:challengeId/fail**: 도전 실패 처리

#### Frontend
- **통계 대시보드**
  - 기본 통계 카드 (도전 횟수, 성공률)
  - 역 방문 지도 (노선별 시각화)
  - 시간 기록 차트
  - 노선별 통계 그래프

- **업적 페이지**
  - 달성/미달성 업적 목록
  - 진행률 표시
  - 업적 상세 정보

- **랭킹 페이지**
  - 전체 랭킹 (TOP 100)
  - 주간 랭킹
  - 내 순위 표시

- **프로필 페이지**
  - 기본 정보
  - 대표 업적 표시
  - 가장 많이 방문한 역 TOP 5
  - 완료한 노선 목록

#### 게임 로직 개선
- 도전 완료/실패 시 통계 자동 업데이트
- 업적 조건 자동 체크
- 스트릭 계산 로직
- 점수 시스템 (성공 +100, 빠른 완료 보너스)

### Phase 4: 사용자 인증 시스템 🚧
#### 데이터베이스 확장
- **users 테이블 수정**
  - email (unique, nullable - 소셜 로그인용)
  - password_hash (nullable - 소셜 로그인용)
  - username (unique, not null)
  - provider (local/google/kakao/naver)
  - provider_id (소셜 로그인 ID)
  - email_verified (boolean)
  - created_at, updated_at

- **refresh_tokens 테이블** (JWT 리프레시 토큰)
  - id, user_id, token, expires_at, created_at

- **password_resets 테이블** (비밀번호 재설정)
  - id, user_id, token, expires_at, created_at

#### Backend API
- **인증 API**
  - POST /api/auth/register (이메일 회원가입)
  - POST /api/auth/login (로그인)
  - POST /api/auth/logout (로그아웃)
  - POST /api/auth/refresh (토큰 갱신)
  - POST /api/auth/forgot-password (비밀번호 재설정 요청)
  - POST /api/auth/reset-password (비밀번호 재설정)
  - GET /api/auth/me (현재 사용자 정보)

- **소셜 로그인 API**
  - GET /api/auth/google (Google OAuth)
  - GET /api/auth/google/callback
  - GET /api/auth/kakao (Kakao OAuth)
  - GET /api/auth/kakao/callback
  - GET /api/auth/naver (Naver OAuth)
  - GET /api/auth/naver/callback

- **사용자 관리 API**
  - GET /api/users/:userId (프로필 조회)
  - PUT /api/users/:userId (프로필 수정)
  - DELETE /api/users/:userId (회원탈퇴)
  - PUT /api/users/:userId/password (비밀번호 변경)

#### 인증 구현
- **JWT 토큰 기반 인증**
  - Access Token (15분 유효)
  - Refresh Token (7일 유효)
  - HTTP-only 쿠키로 저장

- **비밀번호 암호화**
  - bcrypt 해싱 (salt rounds: 10)

- **OAuth 2.0 소셜 로그인**
  - Passport.js 사용
  - Google, Kakao, Naver 지원

- **인증 미들웨어**
  - JWT 검증 미들웨어
  - 권한 확인 미들웨어
  - Rate limiting (로그인 시도 제한)

#### Frontend
- **로그인/회원가입 페이지**
  - 이메일/비밀번호 입력
  - 소셜 로그인 버튼 (Google, Kakao, Naver)
  - 비밀번호 찾기 링크
  - 회원가입 링크

- **회원가입 페이지**
  - 이메일, 비밀번호, 닉네임 입력
  - 비밀번호 강도 체크
  - 이메일 중복 확인
  - 약관 동의

- **프로필 설정 페이지**
  - 닉네임 변경
  - 비밀번호 변경
  - 이메일 변경
  - 회원탈퇴

- **인증 상태 관리**
  - React Context / Zustand
  - localStorage에서 JWT 관리로 변경
  - 자동 토큰 갱신
  - 로그아웃 시 토큰 삭제

#### 보안
- **CSRF 방지**
  - CSRF 토큰
  - SameSite 쿠키 설정

- **XSS 방지**
  - 입력 데이터 sanitize
  - Content Security Policy

- **Rate Limiting**
  - 로그인 시도 제한 (5회/10분)
  - API 호출 제한

- **이메일 인증** (선택사항)
  - 회원가입 시 이메일 발송
  - 인증 링크 클릭

#### 마이그레이션
- **기존 사용자 데이터 처리**
  - localStorage userId를 실제 계정으로 마이그레이션
  - 임시 계정 생성 후 연동 안내
  - 데이터 병합 기능

### Phase 5: Docker 배포 (예정)
#### 배포 환경 구성
- **Docker Compose 프로덕션 설정**
  - 멀티 스테이지 빌드 (Frontend)
  - 프로덕션 최적화 설정
  - 환경변수 분리 (.env.production)
  - 볼륨 마운트 설정

- **Nginx 리버스 프록시**
  - Frontend 정적 파일 서빙
  - Backend API 프록시 (/api)
  - SSL/TLS 설정
  - Gzip 압축
  - 캐시 헤더 설정

- **데이터베이스 설정**
  - MySQL 8.0 컨테이너
  - 데이터 영속성 (volumes)
  - 백업 스크립트
  - 초기화 스크립트 자동 실행

#### 프로덕션 최적화
- **Frontend**
  - 번들 사이즈 최적화 (< 500KB)
  - 코드 스플리팅
  - 이미지 최적화
  - PWA 설정 (선택사항)

- **Backend**
  - PM2 프로세스 관리
  - 커넥션 풀 최적화
  - 로그 레벨 설정
  - 에러 추적

- **데이터베이스**
  - 인덱스 최적화
  - 쿼리 성능 튜닝
  - 슬로우 쿼리 로그

#### 모니터링 & 헬스체크
- **헬스체크 엔드포인트**
  - GET /health (서버 상태)
  - GET /api/health (DB 연결 확인)

- **로깅**
  - 애플리케이션 로그
  - 액세스 로그
  - 에러 로그
  - 로그 로테이션

- **모니터링** (선택사항)
  - Docker stats
  - 리소스 사용량 추적
  - 알림 설정

#### 배포 문서
- **서버 배포 가이드**
  - 시스템 요구사항
  - Docker 설치
  - 배포 단계별 가이드
  - 트러블슈팅

- **운영 가이드**
  - 환경변수 설정
  - 백업 및 복구
  - 업데이트 절차
  - 롤백 방법

---

## 🔑 환경변수

### Backend (.env)
```bash
DATABASE_URL=mysql://...
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000/api
```

---

## 📦 설치

### Backend
```bash
npm install express mysql2 cors dotenv
npm install -D nodemon
```

### Frontend
```bash
npm create vite@latest . -- --template react
npm install axios lucide-react
npm install -D tailwindcss autoprefixer postcss
```

---

## 🎯 MVP 기능

1. Backend API (역 정보, 방문 기록)
2. 10개 랜덤 추출
3. 돌림판 UI
4. GPS 인증
5. 방문 기록 저장

---

## 🔐 보안 및 환경변수 관리 (중요!)

### 환경변수 보호 규칙
1. **절대 실제 값을 .env.example에 넣지 말 것**
   - ❌ `DATABASE_URL=mysql://real_user:real_password@host/db`
   - ✅ `DATABASE_URL=mysql://username:password@host:3306/database_name`

2. **.gitignore 필수 확인**
   ```
   .env
   .env.local
   .env.*.local
   ```

3. **example 파일 생성 시**
   - 실제 값이 아닌 플레이스홀더만 사용
   - 주석으로 설명 추가
   - 예시 값은 명확히 가짜임을 표시

4. **개발 중**
   - 사용자가 .env 파일에 실제 값 입력
   - Claude는 .env 파일을 절대 읽지 않음
   - Claude는 .env.example만 생성 (템플릿용)

5. **Git 커밋 규칙**
   - **커밋**: 작업 단위로 자동 수행 (Claude 책임)
   - **푸시**: 사용자가 명시적으로 요청할 때만

6. **커밋 전 필수 체크 (Claude 책임)**
   - `git status` 실행하여 커밋될 파일 확인
   - 각 파일에 민감 정보 포함 여부 검사:
     * 비밀번호, API 키, 토큰
     * 실제 데이터베이스 URL
     * 이메일, 전화번호 등 개인정보
   - 민감 정보 발견 시 커밋 중단하고 사용자에게 경고
   - 안전 확인 후에만 커밋 진행

### 기타 보안
- CORS 설정 (Frontend URL만 허용)
- SQL Injection 방지 (Prepared Statements)
- HTTPS 필수 (GPS API 요구사항)

---

## 📊 성능 목표

- 초기 로딩: < 2초
- 애니메이션: 60 FPS
- 번들 사이즈: < 500KB

---

## 🎨 디자인

- Primary: #3B82F6
- Success: #10B981
- Danger: #EF4444
- 최대 너비: 640px (모바일 중심)

---

## 🧪 테스트 전략 (TDD 방식)

### Claude가 테스트 수행
- 사용자는 기능 요청만 하면 됨
- Claude가 구현 후 자동으로 테스트 실행
- 테스트 결과를 사용자에게 보고

### Backend 테스트
**도구**: Jest + Supertest
```bash
npm install -D jest supertest
```

**테스트 예시**:
```javascript
// __tests__/stations.test.js
describe('GET /api/stations/line/:lineName', () => {
  it('1호선 역 목록을 반환해야 함', async () => {
    const res = await request(app).get('/api/stations/line/1호선');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body[0]).toHaveProperty('station_nm');
  });
});
```

### Frontend 테스트
**도구**: Vitest + React Testing Library
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**테스트 예시**:
```javascript
// src/components/__tests__/RouletteWheel.test.jsx
describe('RouletteWheel', () => {
  it('10개 역을 표시해야 함', () => {
    const stations = [...]; // 10개 역 데이터
    render(<RouletteWheel stations={stations} />);
    expect(screen.getAllByRole('button')).toHaveLength(10);
  });
});
```

### 테스트 실행 프로세스
1. Claude가 기능 구현
2. 관련 테스트 작성
3. `npm test` 실행
4. 결과 확인 및 보고
5. 실패 시 수정 후 재테스트
6. 성공 시 커밋

---

**데이터베이스**: MySQL 8.0 (Docker)
**상태**: Phase 3 완료, Phase 4 사용자 인증 시스템 진행 예정
**다음 작업**: JWT 기반 로그인/회원가입 및 소셜 로그인 구현
**배포 방식**: Docker Compose (Nginx + Backend + MySQL)
**개발 환경**: 원격 서버 (SSH)
