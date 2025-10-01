# Backend 배포 가이드 (Railway)

## 🚀 Railway 배포 단계

### 1. Railway 계정 및 프로젝트 생성
1. [Railway](https://railway.app) 가입
2. "New Project" → "Deploy from GitHub repo" 선택
3. `bingbing_subway` 레포지토리 연결

### 2. MySQL 데이터베이스 추가
1. Railway 프로젝트에서 "+ New" → "Database" → "MySQL" 선택
2. 데이터베이스가 프로비저닝되면 자동으로 환경변수 생성됨:
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
   - `MYSQL_PORT`
   - `DATABASE_URL`

### 3. 데이터베이스 스키마 및 시드 로드
Railway MySQL에 연결하여 스키마와 데이터를 로드:

```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# MySQL 셸 접속
railway run mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE

# 또는 로컬에서 직접 접속 (Railway에서 DATABASE_URL 복사)
mysql -h containers-us-west-xxx.railway.app -u root -p subway_roulette
```

MySQL 셸에서 실행:
```sql
SOURCE database/schema.sql;
SOURCE database/seeds.sql;
```

### 4. Backend 서비스 환경변수 설정
Railway Dashboard → Backend 서비스 → Variables에 추가:

```bash
# 데이터베이스 (Railway MySQL에서 자동 생성된 값 사용)
DATABASE_HOST=${{MySQL.MYSQL_HOST}}
DATABASE_USER=${{MySQL.MYSQL_USER}}
DATABASE_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DATABASE_NAME=${{MySQL.MYSQL_DATABASE}}
DATABASE_PORT=${{MySQL.MYSQL_PORT}}

# 서버 설정
PORT=3000
NODE_ENV=production

# CORS (Frontend Vercel URL로 업데이트 필요)
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### 5. 배포 설정
Backend 서비스 설정:
- **Root Directory**: `/backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Healthcheck Path**: `/health`

### 6. 배포 및 확인
1. Railway가 자동으로 배포 시작
2. 배포 완료 후 생성된 URL 확인 (예: `https://bingbing-subway-production.up.railway.app`)
3. 헬스체크 확인:
   ```bash
   curl https://your-backend-url.railway.app/health
   ```

## 🔧 배포 후 설정

### Frontend 환경변수 업데이트
Frontend의 `.env.production` 또는 Vercel 환경변수에 Backend URL 추가:
```bash
VITE_API_URL=https://your-backend-url.railway.app/api
```

### Backend CORS 업데이트
Frontend 배포 완료 후, Railway Backend 환경변수에서 `FRONTEND_URL` 업데이트:
```bash
FRONTEND_URL=https://your-frontend-url.vercel.app
```

## 📊 모니터링
- Railway Dashboard에서 로그, 메트릭 확인
- `/health` 엔드포인트로 서버 상태 모니터링

## 🔄 재배포
코드 변경 후:
```bash
git add .
git commit -m "Update backend"
git push origin main
```
Railway가 자동으로 재배포합니다.

## 💡 팁
- Railway는 GitHub 푸시 시 자동 배포됩니다
- 환경변수 변경 시 수동 재배포 필요
- 무료 티어: 월 500시간, $5 크레딧
- 프로덕션 전 staging 환경 권장
