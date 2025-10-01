# Frontend 배포 가이드 (Vercel)

## 🚀 Vercel 배포 단계

### 1. Vercel 계정 및 프로젝트 생성
1. [Vercel](https://vercel.com) 가입 (GitHub 계정 연동)
2. "Add New Project" 클릭
3. GitHub에서 `bingbing_subway` 레포지토리 선택
4. "Import" 클릭

### 2. 프로젝트 설정
**Framework Preset**: Vite
**Root Directory**: `frontend`
**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm install`

### 3. 환경변수 설정
Vercel Dashboard → Project → Settings → Environment Variables에 추가:

```bash
# Production
VITE_API_URL=https://your-backend-url.railway.app/api
```

**중요**: Railway Backend URL을 먼저 배포하고 해당 URL로 업데이트해야 합니다.

### 4. 배포
1. "Deploy" 버튼 클릭
2. Vercel가 자동으로 빌드 및 배포 시작
3. 배포 완료 후 URL 확인 (예: `https://bingbing-subway.vercel.app`)

### 5. 배포 후 설정

#### Backend CORS 업데이트
Railway Backend 환경변수에서 `FRONTEND_URL`을 Vercel URL로 업데이트:
```bash
FRONTEND_URL=https://your-frontend-url.vercel.app
```

Railway Dashboard에서 Backend 서비스 재시작 또는 재배포

### 6. 커스텀 도메인 (선택사항)
Vercel Dashboard → Project → Settings → Domains에서 커스텀 도메인 추가 가능

## 🧪 배포 확인

### 1. 프로덕션 빌드 로컬 테스트
```bash
cd frontend

# 환경변수 설정 (.env.production 생성)
echo "VITE_API_URL=https://your-backend-url.railway.app/api" > .env.production

# 빌드
npm run build

# 프리뷰
npm run preview
```

브라우저에서 `http://localhost:4173` 접속하여 테스트

### 2. 프로덕션 사이트 테스트
- [ ] 홈페이지 로드 확인
- [ ] 노선 선택 → 룰렛 회전 확인
- [ ] GPS 위치 권한 요청 확인 (HTTPS 필수)
- [ ] 통계 페이지 로드 확인
- [ ] 업적 페이지 로드 확인
- [ ] 랭킹 페이지 로드 확인
- [ ] 네트워크 탭에서 Backend API 호출 확인

## 🔄 재배포
코드 변경 후:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```
Vercel가 자동으로 재배포합니다.

## 📊 모니터링
- Vercel Dashboard에서 배포 로그, 분석 확인
- Web Vitals 모니터링
- 함수 로그 (API routes 사용 시)

## 🎨 빌드 최적화

### 1. 번들 크기 분석
```bash
npm install -D rollup-plugin-visualizer
```

`vite.config.js`에 추가:
```javascript
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    react(),
    visualizer({ open: true })
  ]
}
```

### 2. 코드 스플리팅
React Router의 lazy loading 활용 (이미 적용됨)

### 3. 이미지 최적화
- WebP 포맷 사용
- 적절한 크기로 리사이징
- Lazy loading 적용

## 💡 팁
- Vercel은 GitHub 푸시 시 자동 배포됩니다
- Preview 배포: PR 생성 시 자동으로 미리보기 URL 생성
- 환경변수 변경 시 재배포 필요
- 무료 티어: 월 100GB 대역폭, Hobby 프로젝트 무제한
- GPS API는 HTTPS 필수 (Vercel은 자동 HTTPS 제공)

## 🔐 보안
- API 키는 반드시 환경변수로 관리
- `.env` 파일은 절대 커밋하지 않음
- `.env.production.example`만 커밋 (템플릿용)
