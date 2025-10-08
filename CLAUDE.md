# 🚇 빙빙 지하철

수도권 지하철역을 룰렛으로 랜덤 선택하여 방문하는 GPS 기반 챌린지 게임

---

## ⚠️ 개발 원칙

1. **모든 개발은 TDD 방식으로 진행**
2. **테이블 구조 변경 시 ❗❗❗❗❗❗❗❗❗❗ 표시 필수**

---

## 📋 주요 기능

### 게임 플로우
1. **노선 선택**: 1~9호선, 분당선, 경의중앙선 등 선택
2. **역 개수 설정**: 3~20개 역 랜덤 추출
3. **룰렛 애니메이션**: 최종 도전 역 선택
4. **GPS 인증**: 200m 반경 내 방문 인증
5. **시간 제한**: 3시간 타이머
6. **진행률 표시**: 실시간 방문 기록

### 사용자 시스템
- **인증**: JWT 기반 (Access 15분, Refresh 7일)
- **통계**: 도전 횟수, 성공률, 방문 역, 플레이 시간
- **업적**: 14개 업적 (Bronze ~ Platinum)
- **랭킹**: 전체/주간 리더보드

---

## 🗄️ 데이터베이스 (MySQL 8.0)

### 테이블 구조 (10개)

#### 1. 사용자 관련
- **users**: 사용자 정보 (username, email, password_hash, provider)
- **refresh_tokens**: JWT 리프레시 토큰
- **password_resets**: 비밀번호 재설정 토큰

#### 2. 게임 관련
- **stations**: 역 정보 (799개, GPS 100%)
- **challenges**: 도전 기록 (status: in_progress/completed/failed/cancelled)
- **visits**: 방문 기록 (GPS 좌표, 인증 여부)

#### 3. 통계/업적
- **user_stats**: 사용자 통계 (도전 횟수, 성공률, 스트릭)
- **user_visited_stations**: 고유 역 방문 기록
- **achievements**: 업적 정의 (14개)
- **user_achievements**: 사용자 업적 달성 기록

### 데이터 정보
- **역 데이터**: 799개 (GPS 좌표 100%)
- **업적**: 14개 (challenge, streak, exploration, speed)
- **인코딩**: utf8mb4_unicode_ci

---

## 🔧 기술 스택

### Backend
- **Runtime**: Node.js 22
- **Framework**: Express.js 4
- **Database**: MySQL 8.0 (mysql2)
- **Auth**: JWT (jsonwebtoken, bcryptjs)
- **Email**: nodemailer
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Routing**: React Router 7
- **HTTP**: Axios
- **Styling**: Tailwind CSS 4 (CSS-based config)
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Container**: Docker Compose
- **Environment**: dotenv
- **CORS**: Express CORS middleware

---

## 📂 프로젝트 구조

```
bingbingsubway/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    # MySQL 연결 설정
│   │   ├── controllers/       # 8개 컨트롤러
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── stationController.js
│   │   │   ├── challengeController.js
│   │   │   ├── visitController.js
│   │   │   ├── userStatsController.js
│   │   │   ├── achievementController.js
│   │   │   └── leaderboardController.js
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT 검증
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   └── index.js       # 라우트 정의
│   │   ├── services/
│   │   │   └── emailService.js
│   │   ├── utils/
│   │   │   ├── distance.js    # GPS 거리 계산
│   │   │   ├── jwt.js
│   │   │   └── statsHelper.js
│   │   └── server.js          # Express 앱
│   ├── tests/                 # Jest 테스트
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # React + Vite 앱
│   ├── src/
│   │   ├── api/               # API 레이어
│   │   │   ├── axios.js
│   │   │   ├── authApi.js
│   │   │   ├── challengeApi.js
│   │   │   ├── stationApi.js
│   │   │   └── visitApi.js
│   │   ├── components/        # 공통 컴포넌트
│   │   │   ├── RouletteWheel.jsx
│   │   │   ├── Timer.jsx
│   │   │   ├── StationCard.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── StatsDashboard.jsx
│   │   │   ├── SkeletonLoader.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useGeolocation.js
│   │   ├── pages/             # 8개 페이지
│   │   │   ├── HomePage.jsx
│   │   │   ├── ChallengePage.jsx
│   │   │   ├── StatsPage.jsx
│   │   │   ├── AchievementsPage.jsx
│   │   │   ├── LeaderboardPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── test/                  # Vitest 테스트
│   ├── .env.example
│   └── package.json
│
├── database/
│   ├── schema.sql             # 테이블 정의
│   ├── seeds.sql              # 799개 역 데이터
│   ├── achievements_seeds.sql # 14개 업적
│   └── SCHEMA_SUMMARY.md
│
├── docker-compose.yml         # MySQL 8.0
└── CLAUDE.md                  # 이 파일
```

---

## 🚀 개발 환경 설정

### 1. 의존성 설치

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. 환경변수 설정

#### Backend `.env`
```bash
# Database
DATABASE_HOST=localhost
DATABASE_USER=subway_user
DATABASE_PASSWORD=subway_pass
DATABASE_NAME=subway_roulette
DATABASE_PORT=3306

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-secret-key-min-32-characters-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (선택)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@example.com
```

#### Frontend `.env`
```bash
VITE_API_URL=http://localhost:3000/api
```

### 3. Docker로 MySQL 실행

```bash
# MySQL 컨테이너 시작 (schema.sql, seeds.sql 자동 실행)
docker compose up -d

# 데이터베이스 확인
docker exec bingbing_subway_mysql mysql -usubway_user -psubway_pass subway_roulette -e "SELECT COUNT(*) FROM stations;"
```

### 4. 서버 실행

```bash
# Backend (http://localhost:3000)
cd backend
npm run dev

# Frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## 📡 API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보
- `POST /api/auth/forgot-password` - 비밀번호 재설정 요청
- `POST /api/auth/reset-password` - 비밀번호 재설정

### 역 정보 (Stations)
- `GET /api/lines` - 모든 노선 목록
- `GET /api/lines/:lineName/stations` - 특정 노선의 역 목록
- `GET /api/stations/:id` - 역 상세 정보
- `GET /api/lines/:lineName/random?count=10` - 랜덤 역 선택

### 도전 (Challenges) - 인증 필수
- `POST /api/challenges` - 새 도전 생성
- `GET /api/challenges/:userId` - 사용자 도전 목록
- `GET /api/challenges/:id/stations` - 도전의 역 목록
- `PUT /api/challenges/:id/select-station` - 최종 역 선택
- `POST /api/challenges/:id/complete` - 도전 완료
- `POST /api/challenges/:id/fail` - 도전 실패
- `POST /api/challenges/:id/cancel` - 도전 취소

### 방문 (Visits) - 인증 필수
- `POST /api/visits` - 역 방문 인증 (GPS)
- `GET /api/visits/:userId` - 사용자 방문 기록

### 사용자 (Users) - 인증 필수
- `GET /api/users/:userId` - 프로필 조회
- `PUT /api/users/:userId` - 프로필 수정
- `PUT /api/users/:userId/password` - 비밀번호 변경
- `DELETE /api/users/:userId` - 회원 탈퇴

### 통계 (User Stats) - 인증 필수
- `GET /api/users/:userId/stats` - 사용자 통계
- `GET /api/users/:userId/visited-stations` - 방문 역 목록
- `GET /api/users/:userId/line-stats` - 노선별 통계
- `GET /api/users/:userId/recent-activities` - 최근 활동

### 업적 (Achievements)
- `GET /api/achievements` - 전체 업적 목록 (공개)
- `GET /api/users/:userId/achievements` - 사용자 업적 (인증 필수)
- `GET /api/users/:userId/achievements/progress` - 업적 진행률 (인증 필수)

### 랭킹 (Leaderboard)
- `GET /api/leaderboard` - 전체 랭킹
- `GET /api/leaderboard/weekly` - 주간 랭킹
- `GET /api/users/:userId/rank` - 내 순위

### 헬스체크
- `GET /health` - 서버 상태 확인

---

## 🧪 테스트

### Backend (Jest)
```bash
cd backend
npm test                  # 전체 테스트 실행
npm run test:coverage     # 커버리지 포함
```

**현재 커버리지**: 33% → 목표 70%+

### Frontend (Vitest)
```bash
cd frontend
npm test                  # 전체 테스트 실행
```

**현재 상태**: 31개 테스트 통과 ✅

---

## 🔐 보안 가이드

### 환경변수 보호
1. **.env 파일은 절대 커밋하지 않음** (`.gitignore`에 포함)
2. **.env.example에는 플레이스홀더만 작성**
3. **실제 값은 로컬 환경에만 존재**

### JWT 토큰
- **Access Token**: 15분 유효 (메모리/localStorage)
- **Refresh Token**: 7일 유효 (DB 저장, HTTP-only 쿠키)

### CORS 설정
- `FRONTEND_URL` 환경변수로 허용 도메인 제한

### SQL Injection 방지
- `mysql2`의 Prepared Statements 사용

### GPS 보안
- HTTPS 필수 (Geolocation API 요구사항)

---

## 📝 개발 워크플로우

### Git 커밋 규칙
- **커밋**: 작업 단위로 자동 수행
- **푸시**: 사용자가 명시적으로 요청할 때만
- **커밋 전 체크** (자동):
  - `git status` 실행
  - 민감 정보 포함 여부 검사
  - 안전 확인 후 커밋 진행

### 테스트 주도 개발 (TDD)
1. 테스트 작성
2. 기능 구현
3. `npm test` 실행
4. 결과 확인 및 리팩토링
5. 성공 시 커밋

---

## 🎨 디자인

### 색상
- **Primary**: #3B82F6 (파란색)
- **Success**: #10B981 (녹색)
- **Danger**: #EF4444 (빨간색)

### 레이아웃
- **최대 너비**: 640px (모바일 중심)
- **반응형**: 모바일 우선 (320px~)

### 접근성
- WCAG 2.1 AA 준수
- 키보드 네비게이션
- 스크린 리더 지원
- Skip to main content

---

## 📊 현재 진행 상태

### Phase 3: 사용자 기록 시스템 - **완료** ✅
- Backend API: 완료
- Frontend UI: 완료
- 통계/업적/랭킹: 완료
- 테스트: Backend 33%, Frontend 31개 통과

---

## 🐛 알려진 이슈

### 해결 완료 ✅
1. **GPS 범위**: 100m → 200m로 조정 완료
2. **룰렛 초기화**: 노선 확정 후 의도하지 않은 노선 방지 완료
3. **통계 페이지**: 방문한 역에 도전 성공 시간 표시 완료
4. **업적 갱신**: 7회 방문 인증 시 "첫 발걸음", "도전자" 업적 미달성 문제 해결
5. **프로필 표시**: 회원가입 시 이름 입력했으나 "사용자 N"으로 표기 문제 해결
6. **대중교통 검색 버튼**: 위치 정보를 찾을 수 없다는 메시지 발생 문제 해결

**현재 알려진 이슈 없음** 🎉

---

## 📚 참고 문서

- **BACKEND_PLAN.md**: Backend 상세 개발 계획
- **FRONTEND_PLAN.md**: Frontend 상세 개발 계획
- **PHASE4_AUTH_PLAN.md**: 인증 시스템 구현 계획
- **DEPLOYMENT.md**: 배포 가이드
- **TODO.md**: 할 일 목록 및 진행 상황
- **database/SCHEMA_SUMMARY.md**: DB 스키마 요약

---

## 📄 라이선스

MIT

---

**개발 환경**: Node.js 22, React 19, MySQL 8.0, Docker Compose
**상태**: Phase 3 완료, Phase 4 배포 준비
**다음 작업**: 실제 테스트 후 개선 사항 수정
