# 빙빙 지하철 Frontend

## 설치

```bash
npm install
```

## 환경 변수 설정 (선택사항)

`.env` 파일을 생성하여 API URL을 설정할 수 있습니다:

```bash
VITE_API_URL=http://localhost:3000/api
```

기본값은 `http://localhost:3000/api`입니다.

## 실행

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run preview
```

## 테스트

```bash
npm test
```

## 주요 기능

- 노선 선택 및 역 개수 설정
- 룰렛을 통한 랜덤 역 선택
- GPS 기반 방문 인증 (100m 반경)
- 3시간 타이머
- 진행률 표시
- 방문 기록 관리

## 기술 스택

- React 19
- Vite
- TailwindCSS
- Axios
- Vitest
