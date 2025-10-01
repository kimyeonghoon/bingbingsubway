# Phase 4: JWT 기반 로그인/회원가입 구현 계획

## 📋 작업 개요
이메일 인증은 PTR 레코드 이슈로 보류하고, JWT 기반 로그인/회원가입 기능부터 구현

---

## 🗄️ 1. 데이터베이스 마이그레이션

### users 테이블 수정
```sql
ALTER TABLE users
ADD COLUMN email VARCHAR(255) UNIQUE,
ADD COLUMN password_hash VARCHAR(255),
ADD COLUMN username VARCHAR(50) UNIQUE NOT NULL,
ADD COLUMN provider ENUM('local', 'google', 'kakao', 'naver') DEFAULT 'local',
ADD COLUMN provider_id VARCHAR(255),
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

### refresh_tokens 테이블 생성
```sql
CREATE TABLE refresh_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### password_resets 테이블 생성
```sql
CREATE TABLE password_resets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔧 2. Backend 구현

### 패키지 설치
```bash
cd backend
npm install jsonwebtoken bcrypt cookie-parser express-validator express-rate-limit
```

### 파일 구조
```
backend/src/
├── config/
│   └── jwt.js                    # JWT 설정 (secret, 만료시간)
├── middleware/
│   ├── auth.js                   # JWT 검증 미들웨어
│   ├── rateLimiter.js            # Rate limiting
│   └── validators/
│       └── authValidator.js      # 입력 검증
├── controllers/
│   └── authController.js         # 인증 관련 컨트롤러
├── routes/
│   └── auth.js                   # 인증 라우트
└── utils/
    ├── passwordUtils.js          # 비밀번호 해싱/검증
    └── tokenUtils.js             # JWT 생성/검증
```

### API 엔드포인트

#### 회원가입/로그인
- `POST /api/auth/register`
  - Body: `{ email, password, username }`
  - Response: `{ user, accessToken, refreshToken }`

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ user, accessToken, refreshToken }`

- `POST /api/auth/logout`
  - Header: `Authorization: Bearer {accessToken}`
  - Response: `{ success: true }`

#### 토큰 관리
- `POST /api/auth/refresh`
  - Body: `{ refreshToken }`
  - Response: `{ accessToken, refreshToken }`

- `GET /api/auth/me`
  - Header: `Authorization: Bearer {accessToken}`
  - Response: `{ user }`

#### 비밀번호 관리
- `POST /api/auth/forgot-password`
  - Body: `{ email }`
  - Response: `{ success: true, message }` (이메일 발송 대신 토큰만 생성)

- `POST /api/auth/reset-password`
  - Body: `{ token, newPassword }`
  - Response: `{ success: true }`

- `PUT /api/auth/change-password`
  - Header: `Authorization: Bearer {accessToken}`
  - Body: `{ currentPassword, newPassword }`
  - Response: `{ success: true }`

### JWT 설정
```javascript
// config/jwt.js
{
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d'
}
```

### 환경변수 (.env.example)
```bash
# JWT
JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# 비밀번호 해싱
BCRYPT_ROUNDS=10
```

### 보안 기능
1. **Rate Limiting**
   - 로그인: 5회/10분
   - 회원가입: 3회/시간
   - 비밀번호 재설정: 3회/시간

2. **입력 검증**
   - 이메일 형식 검증
   - 비밀번호 강도 체크 (최소 8자, 영문/숫자/특수문자)
   - XSS 방지 (입력 sanitize)

3. **토큰 보안**
   - HTTP-only 쿠키로 Refresh Token 저장
   - Access Token은 응답 Body로 전달 (Frontend에서 메모리 저장)
   - CSRF 방지 (SameSite=Strict)

---

## 🎨 3. Frontend 구현

### 패키지 설치
```bash
cd frontend
npm install zustand react-router-dom
```

### 파일 구조
```
frontend/src/
├── stores/
│   └── authStore.js              # Zustand 인증 상태 관리
├── pages/
│   ├── Login.jsx                 # 로그인 페이지
│   ├── Register.jsx              # 회원가입 페이지
│   ├── ForgotPassword.jsx        # 비밀번호 찾기
│   └── ResetPassword.jsx         # 비밀번호 재설정
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── PasswordStrength.jsx  # 비밀번호 강도 표시
│   └── common/
│       └── ProtectedRoute.jsx    # 인증 필요한 라우트
└── services/
    └── authApi.js                # 인증 API 호출
```

### 라우팅 (React Router)
```javascript
// App.jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />

  {/* 보호된 라우트 */}
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<Home />} />
    <Route path="/challenge/:id" element={<Challenge />} />
    <Route path="/profile" element={<Profile />} />
  </Route>
</Routes>
```

### 인증 상태 관리 (Zustand)
```javascript
// stores/authStore.js
{
  user: null,
  accessToken: null,
  isAuthenticated: false,
  login: (email, password) => {},
  register: (email, password, username) => {},
  logout: () => {},
  refreshToken: () => {},
  checkAuth: () => {}
}
```

### 자동 토큰 갱신
- Axios Interceptor로 401 에러 감지
- Refresh Token으로 자동 갱신
- 갱신 실패 시 로그아웃

---

## 🔄 4. 기존 사용자 마이그레이션

### localStorage userId 처리
1. 로그인/회원가입 시 기존 localStorage userId 확인
2. 있으면 해당 데이터를 새 계정에 연결
3. 없으면 새 userId 생성

```javascript
// 회원가입 시
const oldUserId = localStorage.getItem('userId');
if (oldUserId) {
  // 기존 데이터 마이그레이션
  await migrateUserData(oldUserId, newUserId);
  localStorage.removeItem('userId');
}
```

---

## ✅ 5. 테스트 계획

### Backend 테스트 (Jest)
- [ ] 회원가입 (이메일 중복, 비밀번호 검증)
- [ ] 로그인 (성공/실패, Rate limiting)
- [ ] JWT 토큰 생성/검증
- [ ] Refresh Token 갱신
- [ ] 비밀번호 변경/재설정
- [ ] 인증 미들웨어

### Frontend 테스트 (Vitest)
- [ ] 로그인 폼 렌더링
- [ ] 회원가입 폼 검증
- [ ] 비밀번호 강도 체크
- [ ] 인증 상태 관리
- [ ] Protected Route 동작

---

## 📝 6. 작업 순서

### Step 1: 데이터베이스
1. 마이그레이션 SQL 작성
2. Docker MySQL에 적용
3. 테스트 데이터 확인

### Step 2: Backend
1. JWT 설정 파일 작성
2. 유틸리티 함수 (비밀번호, 토큰)
3. 미들웨어 (인증, Rate limiting, 검증)
4. 컨트롤러 작성
5. 라우트 연결
6. 테스트 작성 및 실행

### Step 3: Frontend
1. Zustand 스토어 작성
2. 인증 API 서비스
3. 로그인/회원가입 UI
4. Protected Route
5. 자동 토큰 갱신
6. 테스트 작성 및 실행

### Step 4: 통합 테스트
1. 회원가입 → 로그인 플로우
2. 토큰 갱신 플로우
3. 로그아웃 플로우
4. 비밀번호 재설정 플로우

---

## 🚧 보류된 기능

### 이메일 인증 (PTR 레코드 이슈)
- 회원가입 시 이메일 인증 링크 발송
- 이메일 미인증 시 일부 기능 제한
- 추후 SMTP 설정 완료 후 추가

### 소셜 로그인
- Google OAuth
- Kakao OAuth
- Naver OAuth
- Phase 4 후반부에 추가 예정

---

## 📌 다음 작업 시 실행할 명령어

```bash
# 데이터베이스 마이그레이션
docker exec -i bingbing-mysql mysql -uroot -prootpassword bingbing_subway < database/migrations/002_add_auth.sql

# Backend 패키지 설치
cd backend
npm install jsonwebtoken bcrypt cookie-parser express-validator express-rate-limit

# Frontend 패키지 설치
cd frontend
npm install zustand react-router-dom

# 테스트 실행
npm test
```

---

**작성일**: 2025-10-02
**현재 상태**: 계획 단계, 구현 준비 완료
**다음 단계**: Step 1 (데이터베이스 마이그레이션)부터 시작
