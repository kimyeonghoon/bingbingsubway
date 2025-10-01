# 빙빙 지하철 Backend API

## 설치

```bash
npm install
```

## 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```bash
DATABASE_HOST=localhost
DATABASE_USER=your_mysql_username
DATABASE_PASSWORD=your_mysql_password
DATABASE_NAME=subway_roulette
DATABASE_PORT=3306

PORT=3000
NODE_ENV=development

FRONTEND_URL=http://localhost:5173
```

## 데이터베이스 초기화

```bash
# MySQL에 접속하여 데이터베이스 생성
mysql -u your_username -p

# MySQL 프롬프트에서 실행
CREATE DATABASE subway_roulette;
USE subway_roulette;

# 스키마 적용
SOURCE ../database/schema.sql;

# 역 데이터 삽입
SOURCE ../database/seeds.sql;
```

## 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 테스트

```bash
# 유틸리티 테스트 (DB 불필요)
npm test -- tests/utils/

# 전체 테스트 (DB 연결 필요)
npm test
```

## API 엔드포인트

### 역 정보
- `GET /api/lines` - 모든 노선 목록
- `GET /api/lines/:lineName/stations` - 특정 노선의 역 목록
- `GET /api/stations/:id` - 역 상세 정보
- `GET /api/lines/:lineName/random?count=10` - 랜덤 역 선택

### 도전
- `POST /api/challenges` - 새 도전 생성
- `GET /api/challenges/:userId` - 사용자 도전 목록
- `GET /api/challenges/:id/stations` - 도전의 역 목록

### 방문 인증
- `POST /api/visits` - 역 방문 인증 (GPS)
- `GET /api/visits/:userId` - 사용자 방문 기록

### 헬스체크
- `GET /health` - 서버 상태 확인
