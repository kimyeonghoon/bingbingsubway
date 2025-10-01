# 🚀 빙빙 지하철 - 간편 배포 가이드

## 빠른 시작 (5분)

### 1️⃣ Railway Backend 배포

1. **Railway 가입 및 프로젝트 생성**
   - [Railway](https://railway.app) 접속 → GitHub 계정으로 로그인
   - "New Project" → "Deploy from GitHub repo"
   - `bingbing_subway` 선택

2. **MySQL 추가**
   - 프로젝트에서 "+ New" → "Database" → "MySQL"
   - 자동으로 환경변수 생성됨

3. **Backend 서비스 설정**
   - Root Directory: `backend`
   - Start Command: `npm start`
   - 환경변수 추가:
     ```
     PORT=3000
     NODE_ENV=production
     FRONTEND_URL=https://임시.vercel.app
     ```

4. **데이터베이스 초기화**
   ```bash
   # Railway CLI 설치
   npm i -g @railway/cli

   # 로그인 및 프로젝트 연결
   railway login
   railway link

   # MySQL 접속 (Railway Dashboard에서 연결 정보 확인)
   railway run mysql -h <HOST> -u <USER> -p<PASSWORD> <DATABASE>

   # SQL 실행
   SOURCE database/schema.sql;
   SOURCE database/seeds.sql;
   ```

5. **배포 확인**
   - Railway가 자동으로 URL 생성 (예: `https://xxx.railway.app`)
   - 헬스체크: `curl https://xxx.railway.app/health`

---

### 2️⃣ Vercel Frontend 배포

1. **Vercel 가입 및 프로젝트 생성**
   - [Vercel](https://vercel.com) 접속 → GitHub 계정으로 로그인
   - "Add New Project"
   - `bingbing_subway` 선택

2. **프로젝트 설정**
   - Framework: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **환경변수 설정**
   - Settings → Environment Variables
   - 추가:
     ```
     VITE_API_URL=https://YOUR_BACKEND_URL.railway.app/api
     ```
   - `YOUR_BACKEND_URL`을 1단계의 Railway URL로 교체

4. **배포**
   - "Deploy" 버튼 클릭
   - Vercel이 자동으로 URL 생성 (예: `https://xxx.vercel.app`)

---

### 3️⃣ CORS 설정 업데이트

1. Railway Dashboard → Backend 서비스 → Variables
2. `FRONTEND_URL` 업데이트:
   ```
   FRONTEND_URL=https://YOUR_FRONTEND_URL.vercel.app
   ```
3. Backend 재배포 (자동)

---

## ✅ 배포 완료 확인

프로덕션 사이트에서 테스트:
- [ ] 홈페이지 로드
- [ ] 노선 선택 → 룰렛 회전
- [ ] GPS 위치 권한 요청 (HTTPS)
- [ ] 통계/업적/랭킹 페이지
- [ ] 모바일 브라우저에서 GPS 테스트

---

## 🔄 재배포 (자동)

```bash
git add .
git commit -m "Update"
git push origin main
```
→ Railway와 Vercel이 자동으로 재배포합니다.

---

## 📚 상세 가이드
- **Backend 배포**: `backend/DEPLOYMENT.md`
- **Frontend 배포**: `frontend/DEPLOYMENT.md`
- **Phase 4 전체**: `PHASE4_DEPLOYMENT.md`

---

## 💰 비용
- **Railway**: ~$10/월 (Backend + MySQL)
- **Vercel**: 무료 (Hobby Plan)
- **총**: ~$10/월

---

## 🆘 문제 해결

### "Backend API 호출 실패"
→ `VITE_API_URL` 환경변수 확인 (Vercel Dashboard)

### "CORS 에러"
→ `FRONTEND_URL` 환경변수 확인 (Railway Dashboard)

### "GPS 작동 안 함"
→ HTTPS 연결 필수 (Vercel 자동 제공)
→ 모바일 브라우저에서 테스트

---

**배포 완료! 🎉**
