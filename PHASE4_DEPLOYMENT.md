# Phase 4: 배포 가이드

## 📋 배포 체크리스트

### ✅ 준비 완료
- [x] Backend Railway 설정 파일 (`railway.json`, `.nvmrc`)
- [x] Frontend Vercel 설정 파일 (`vercel.json`)
- [x] 환경변수 템플릿 (`.env.example`, `.env.production.example`)
- [x] `.gitignore` 업데이트 (민감 정보 보호)
- [x] 프로덕션 빌드 테스트 (307KB, gzip 98KB)

### 🚀 배포 순서

#### 1단계: Railway Backend 배포
```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 생성
railway init

# MySQL 추가
# Railway Dashboard → New → Database → MySQL

# 환경변수 설정 (Railway Dashboard)
DATABASE_HOST=${{MySQL.MYSQL_HOST}}
DATABASE_USER=${{MySQL.MYSQL_USER}}
DATABASE_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DATABASE_NAME=${{MySQL.MYSQL_DATABASE}}
DATABASE_PORT=${{MySQL.MYSQL_PORT}}
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://임시_URL.vercel.app  # 나중에 업데이트

# 배포
cd backend
railway up
```

**데이터베이스 초기화**:
```bash
# Railway MySQL 접속
railway run mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE

# 스키마 및 시드 로드
SOURCE database/schema.sql;
SOURCE database/seeds.sql;
```

**배포 확인**:
```bash
# Backend URL 확인 (Railway Dashboard에서 복사)
curl https://your-backend-url.railway.app/health

# 응답 예상:
# {"status":"OK","timestamp":"..."}
```

#### 2단계: Vercel Frontend 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# Vercel 로그인
vercel login

# 프로젝트 배포
cd frontend
vercel

# 프로덕션 배포
vercel --prod
```

**Vercel Dashboard 설정**:
1. Project Settings → General
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. Project Settings → Environment Variables
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

**배포 확인**:
```bash
# Frontend URL 확인
curl -I https://your-frontend-url.vercel.app

# 응답 예상:
# HTTP/2 200
```

#### 3단계: CORS 설정 업데이트
Railway Backend 환경변수 업데이트:
```bash
FRONTEND_URL=https://your-frontend-url.vercel.app
```

Railway Dashboard에서 Backend 서비스 재배포 또는 재시작

#### 4단계: 프로덕션 테스트
- [ ] Frontend 사이트 접속 확인
- [ ] 노선 선택 기능 확인
- [ ] 룰렛 회전 및 애니메이션 확인
- [ ] GPS 위치 권한 요청 확인 (HTTPS 필수)
- [ ] 역 방문 인증 테스트
- [ ] 통계/업적/랭킹 페이지 확인
- [ ] 개발자 도구 → Network 탭에서 API 호출 확인
- [ ] 모바일 브라우저에서 테스트 (실제 GPS)

## 📊 배포 후 모니터링

### Railway (Backend)
- Dashboard → Deployments: 배포 히스토리
- Dashboard → Metrics: CPU, 메모리, 네트워크 사용량
- Dashboard → Logs: 실시간 로그

### Vercel (Frontend)
- Dashboard → Analytics: 페이지 뷰, 성능
- Dashboard → Deployments: 배포 히스토리
- Dashboard → Functions: 실행 로그 (API routes 사용 시)

## 🔄 지속적 배포 (CI/CD)

### 자동 배포
```bash
# 코드 변경 후
git add .
git commit -m "feat: 새 기능 추가"
git push origin main
```

- Railway: GitHub 푸시 시 자동 배포
- Vercel: GitHub 푸시 시 자동 배포
- PR 생성 시: Vercel이 자동으로 Preview URL 생성

### 수동 배포
```bash
# Railway
cd backend
railway up

# Vercel
cd frontend
vercel --prod
```

## 📁 배포 파일 구조
```
bingbing_subway/
├── backend/
│   ├── railway.json          # Railway 설정
│   ├── .nvmrc                # Node 버전
│   ├── .gitignore            # Git 제외 파일
│   ├── .env.example          # 환경변수 템플릿
│   ├── DEPLOYMENT.md         # Backend 배포 가이드
│   └── package.json          # start 스크립트 포함
├── frontend/
│   ├── vercel.json           # Vercel 설정
│   ├── .gitignore            # Git 제외 파일
│   ├── .env.example          # 개발 환경변수
│   ├── .env.production.example # 프로덕션 환경변수 템플릿
│   ├── DEPLOYMENT.md         # Frontend 배포 가이드
│   └── package.json          # build 스크립트 포함
└── PHASE4_DEPLOYMENT.md      # 이 파일
```

## 🔐 보안 체크리스트
- [x] `.env` 파일 `.gitignore`에 추가
- [x] 환경변수 템플릿만 커밋 (`.env.example`)
- [x] 프로덕션 환경변수는 플랫폼 Dashboard에서 설정
- [x] CORS 설정 (특정 Frontend URL만 허용)
- [x] HTTPS 강제 (GPS API 요구사항, Vercel 자동 제공)

## 💰 비용 예상

### Railway
- **Hobby Plan**: $5/월 (500시간 실행 시간 포함)
- MySQL: 추가 $5/월
- **총**: ~$10/월

### Vercel
- **Hobby Plan**: 무료
  - 100GB 대역폭/월
  - 무제한 배포
  - 자동 HTTPS

**총 예상 비용**: ~$10/월

## 📚 참고 문서
- [Railway 문서](https://docs.railway.app)
- [Vercel 문서](https://vercel.com/docs)
- Backend 배포 가이드: `backend/DEPLOYMENT.md`
- Frontend 배포 가이드: `frontend/DEPLOYMENT.md`

## 🆘 문제 해결

### Backend 연결 실패
1. Railway Dashboard → Logs 확인
2. 환경변수 설정 확인
3. MySQL 연결 정보 확인
4. `/health` 엔드포인트 테스트

### Frontend API 호출 실패
1. 개발자 도구 → Network 탭 확인
2. CORS 에러 → Backend `FRONTEND_URL` 확인
3. 환경변수 `VITE_API_URL` 확인
4. Railway Backend URL 정확한지 확인

### GPS 작동 안 함
1. HTTPS 연결 확인 (필수)
2. 브라우저 위치 권한 확인
3. 모바일에서 테스트 (데스크톱은 GPS 부정확)

## ✅ 배포 완료 후
Phase 4 완료! 다음 단계:
- 사용자 피드백 수집
- 성능 모니터링
- 버그 수정 및 기능 개선
- 커스텀 도메인 설정 (선택)
