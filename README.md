# 🚇 빙빙 지하철

서울 지하철역을 룰렛으로 선택하여 방문하는 GPS 기반 챌린지 게임

## ✨ 주요 기능

- 🎯 노선 선택 및 역 개수 설정 (3~20개)
- 🎡 룰렛 애니메이션으로 랜덤 역 선택
- 📍 GPS 기반 방문 인증 (100m 반경)
- ⏱️ 3시간 제한 타이머
- 📊 실시간 진행률 표시
- ✅ 방문 완료 기록

## 🏗️ 기술 스택

### Backend
- **Framework**: Node.js + Express.js
- **Database**: MySQL 8.0
- **Driver**: mysql2 (Promise-based)
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Database Hosting**: PlanetScale / Railway / Docker
- **Environment**: dotenv
- **CORS**: Express CORS middleware

## 📦 프로젝트 구조

```
bingbing_subway/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # DB 연결 설정
│   │   ├── controllers/    # API 컨트롤러
│   │   ├── middleware/     # 에러 핸들러
│   │   ├── routes/         # 라우트 정의
│   │   ├── utils/          # 거리 계산 등
│   │   └── server.js       # Express 앱
│   ├── tests/              # Jest 테스트
│   └── package.json
│
├── frontend/               # React + Vite 앱
│   ├── src/
│   │   ├── api/           # API 통신 레이어
│   │   ├── components/    # React 컴포넌트
│   │   ├── hooks/         # Custom Hooks
│   │   ├── test/          # Vitest 설정
│   │   └── App.jsx        # 메인 앱
│   └── package.json
│
├── database/              # DB 스키마 & 시드
│   ├── schema.sql        # 테이블 정의
│   └── seeds.sql         # 799개 역 데이터 (GPS 100%)
│
├── CLAUDE.md             # 프로젝트 가이드 (간결)
├── BACKEND_PLAN.md       # Backend 개발 계획
├── FRONTEND_PLAN.md      # Frontend 개발 계획
└── README.md             # 이 파일
```

## 🚀 시작하기

### 1. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u your_username -p

# 데이터베이스 생성 및 데이터 로드
CREATE DATABASE subway_roulette;
USE subway_roulette;

SOURCE database/schema.sql;
SOURCE database/seeds.sql;
```

### 2. Backend 설정 및 실행

```bash
cd backend
npm install

# .env 파일 생성 (.env.example 참고)
cp .env.example .env
# .env 파일에 실제 DB 접속 정보 입력

# 개발 서버 실행
npm run dev
```

Backend는 `http://localhost:3000`에서 실행됩니다.

### 3. Frontend 설정 및 실행

```bash
cd frontend
npm install

# (선택) .env 파일 생성
cp .env.example .env

# 개발 서버 실행
npm run dev
```

Frontend는 `http://localhost:5173`에서 실행됩니다.

## 🧪 테스트

```bash
# Backend 테스트
cd backend
npm test

# Frontend 테스트
cd frontend
npm test
```

## 📡 API 엔드포인트

### 역 정보
- `GET /api/lines` - 모든 노선 목록
- `GET /api/lines/:lineName/stations` - 특정 노선의 역 목록
- `GET /api/stations/:id` - 역 상세 정보
- `GET /api/lines/:lineName/random?count=10` - 랜덤 역 선택

### 도전 관리
- `POST /api/challenges` - 새 도전 생성
- `GET /api/challenges/:userId` - 사용자 도전 목록
- `GET /api/challenges/:id/stations` - 도전의 역 목록

### 방문 인증
- `POST /api/visits` - 역 방문 인증 (GPS)
- `GET /api/visits/:userId` - 사용자 방문 기록

### 헬스체크
- `GET /health` - 서버 상태 확인

## 📊 데이터

- **총 역 개수**: 799개
- **GPS 좌표**: 100% 포함
- **노선 형식**: "1호선", "2호선" 등
- **데이터 출처**: 서울교통공사 + 서울시 역사마스터 정보 (병합 처리)

## 🔐 보안

- ⚠️ `.env` 파일은 **절대** 커밋하지 않음
- `.env.example`에는 **플레이스홀더만** 포함
- 실제 API 키/비밀번호는 로컬 환경에만 존재

## 📝 개발 워크플로우

1. **커밋**: 작업 단위로 자동 커밋
2. **푸시**: 사용자 요청 시에만 수행
3. **테스트**: TDD 방식으로 Jest/Vitest 사용
4. **문서화**: CLAUDE.md, BACKEND_PLAN.md, FRONTEND_PLAN.md 참고

## 🎮 게임 플로우

1. **설정 단계**: 노선 및 역 개수 선택
2. **룰렛 단계**: 룰렛을 돌려 랜덤 역 확인
3. **도전 단계**:
   - 선택된 역들을 방문
   - GPS로 100m 반경 내 인증
   - 3시간 내 모든 역 방문 완료

## 📄 라이선스

MIT

## 👤 개발자

Generated with Claude Code
