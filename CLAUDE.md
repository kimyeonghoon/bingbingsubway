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

### Phase 1: Backend API
- 역 정보 조회
- 도전 시작/방문 기록
- GPS 인증

### Phase 2: Frontend
- 노선 선택 UI
- 돌림판 애니메이션
- 타이머 (3시간)
- GPS 인증 컴포넌트
- 방문 기록 목록

### Phase 3: 배포
- Backend: Railway
- Frontend: Vercel

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

**데이터베이스**: MySQL 8.0 (PlanetScale)
**상태**: Phase 0 완료, Backend/Frontend 개발 대기
**예상 기간**: 4-5일
**개발 환경**: 원격 서버 (SSH)
