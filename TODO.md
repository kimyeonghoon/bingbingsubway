# 📋 할 일 목록

## 🎯 우선순위 1: 기능 완성도 개선

### 1. 테스트 커버리지 향상
**현재 상태**: Backend 33%, Frontend 31개 통과
**목표**: 70%+

- [ ] Achievement 컨트롤러 테스트 작성
- [ ] Leaderboard 컨트롤러 테스트 작성
- [ ] UserStats 컨트롤러 테스트 작성
- [x] Frontend 컴포넌트 테스트 보완
  - [x] RouletteWheel 테스트 (8개 통과)
  - [x] Timer 테스트 (4개 통과)
  - [x] StationCard 테스트 (5개 통과)
  - [x] ProgressBar 테스트 (4개 통과)
  - [x] StatsDashboard 테스트 (4개 통과)
  - [x] AchievementsPage 테스트 (3개 통과)
  - [x] LeaderboardPage 테스트 (3개 통과)

### 2. GPS 인증 로직 개선
- [ ] 100m 반경 정확도 검증
- [ ] 3시간 타이머 만료 처리 로직 확인
- [ ] 중복 방문 방지 체크
- [ ] GPS 권한 거부 시 처리

### 3. 도전 완료/실패 처리
- [ ] 타이머 만료 시 자동 실패 처리
- [ ] 통계 자동 업데이트 확인
- [ ] 업적 조건 자동 체크 검증
- [ ] 스트릭(연승) 계산 로직 테스트

---

## 🎨 우선순위 2: UI/UX 개선

### 4. 반응형 디자인 점검 ✅
- [x] 모바일 화면 테스트 (320px ~ 480px)
- [x] 태블릿 레이아웃 확인 (768px ~ 1024px)
- [x] 최대 너비 640px 적용 확인
- [x] 가로 모드 대응 (CSS media queries)

### 5. 접근성 개선 ✅
- [x] 키보드 네비게이션 테스트 (focus-visible, focus-ring)
- [x] 스크린 리더 지원 (aria-label, role, aria-live 추가)
- [x] 색상 대비 확인 (WCAG 2.1 AA 기준)
- [x] 포커스 상태 시각화 (전역 CSS, focus-ring)

### 6. 로딩 상태 개선 ✅
- [x] 스켈레톤 UI 추가 (SkeletonLoader.jsx)
- [x] 에러 메시지 일관성 체크 (ErrorMessage.jsx)
- [x] 재시도 로직 구현 (retryRequest helper)
- [x] 네트워크 오류 처리 (handleApiError)

---

## 🚀 우선순위 3: 배포 준비

### 7. 환경 변수 점검
- [ ] .env.example 파일 확인
- [ ] 민감 정보 노출 체크
- [ ] 프로덕션 설정 분리
- [ ] CORS 환경별 설정

### 8. 성능 최적화
- [x] 번들 사이즈 분석 (55KB CSS + 316KB JS)
- [ ] 번들 사이즈 추가 최적화 (vite-bundle-visualizer)
- [ ] 이미지 최적화
- [ ] API 응답 시간 측정
- [x] 빌드 시간 확인 (1.46초 ✅)

### 9. 배포 테스트
- [ ] Railway (Backend) 배포
- [ ] Vercel (Frontend) 배포
- [ ] HTTPS 설정 확인 (GPS API 요구사항)
- [ ] 프로덕션 DB 연결 테스트

---

## 🐛 우선순위 4: 버그 수정

### 10. 알려진 이슈 해결
- [x] Tailwind CSS v4 완전 마이그레이션 확인
- [x] VSCode 경고 제거 완료 확인
- [ ] 브라우저 콘솔 에러 체크
- [ ] React DevTools 경고 확인

---

## ✅ 완료된 작업

### 2025-10-02 (오늘)
- [x] Tailwind CSS v4 완전 마이그레이션
- [x] @tailwindcss/postcss 플러그인 설치
- [x] CSS 기반 설정 (@theme 블록)
- [x] 반응형 디자인 CSS (모바일/태블릿)
- [x] 접근성 개선 (키보드, 스크린 리더, 포커스)
- [x] 스켈레톤 로딩 컴포넌트
- [x] 표준화된 에러 메시지 컴포넌트
- [x] API 재시도 로직 및 에러 핸들링
- [x] Frontend 테스트 31개 통과
- [x] 빌드 성공 (1.46초, 316KB)

### 2025-10-01
- [x] 전체 UI에 다채로운 색상 그라데이션 적용
- [x] Tailwind CSS v4 문법 수정 (@import "tailwindcss")
- [x] VSCode Tailwind CSS 경고 해결 설정
- [x] 페이지별 테마 색상 적용
- [x] 버튼 및 카드 그라데이션 + 애니메이션
- [x] Phase 3 기능 구현 (통계, 업적, 랭킹, 프로필)
- [x] Backend API 26개 테스트 통과
- [x] Frontend 컴포넌트 일부 테스트 작성

---

## 📊 현재 상태

**Phase 3**: 사용자 기록 시스템 - **95% 완료** 🚧
- Backend API: ✅ 완료
- Frontend UI: ✅ 완료
- UI/UX 개선: ✅ 완료 (반응형, 접근성, 에러처리)
- Frontend 테스트: ✅ 완료 (31개 통과)
- Backend 테스트: 🚧 진행 중 (33%)
- 디자인: ✅ 완료

**Phase 4**: 배포 - **준비 중** ⏳

---

## 🔧 기술 이슈

### Tailwind CSS v4 ✅
- `@import "tailwindcss"` 방식 사용
- `@tailwindcss/postcss` 플러그인 설치 완료
- CSS 기반 설정 (`@theme` 블록 사용)
- tailwind.config.js 제거 (v4는 CSS 파일에서 직접 설정)

### 테스트
- Backend: Jest + Supertest (33% 커버리지)
- Frontend: Vitest + React Testing Library ✅
  - 7개 파일, 31개 테스트 통과
  - 빌드 시간: 1.46초
  - 번들 사이즈: 316KB (gzip 99KB)
- 목표: Backend 70%+ 커버리지

---

## 📝 메모

### 기술 스택
- Docker Compose MySQL 사용 중
- UTF-8MB4 인코딩 설정 완료
- 799개 역 데이터 100% GPS 좌표 포함
- React 19 + Vite
- Tailwind CSS v4 (CSS-based config)
- Lucide React 아이콘

### 신규 컴포넌트 (2025-10-02)
- `SkeletonLoader.jsx`: 8가지 스켈레톤 UI 컴포넌트
- `ErrorMessage.jsx`: 표준화된 에러 메시지 + 11가지 ERROR_MESSAGES
- API 재시도 로직: `retryRequest()`, `handleApiError()`

### 접근성 개선
- Skip to main content 링크
- ARIA labels, roles, live regions
- 키보드 네비게이션 (focus-ring)
- WCAG 2.1 AA 색상 대비
- prefers-reduced-motion 지원
- prefers-contrast 지원
