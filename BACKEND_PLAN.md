# Backend API 개발 계획

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL 연결
│   ├── controllers/
│   │   ├── stationController.js # 역 정보 CRUD
│   │   ├── challengeController.js # 도전 관리
│   │   └── visitController.js   # 방문 기록
│   ├── routes/
│   │   └── index.js             # 라우트 정의
│   ├── middleware/
│   │   └── errorHandler.js      # 에러 처리
│   ├── utils/
│   │   └── distance.js          # GPS 거리 계산
│   └── server.js                # 앱 시작점
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

## 🔌 API 엔드포인트

### 1. 역 정보
```
GET /api/stations                    # 전체 역 조회
GET /api/stations/lines              # 노선 목록
GET /api/stations/line/:lineName     # 특정 노선 역 목록
GET /api/stations/:id                # 특정 역 상세
```

### 2. 도전 (Challenge)
```
POST /api/challenges                 # 도전 시작
  Body: { lineName, selectedStations, finalStationId }

GET /api/challenges/:id              # 도전 조회
PUT /api/challenges/:id/complete     # 도전 완료
PUT /api/challenges/:id/cancel       # 도전 취소
```

### 3. 방문 기록
```
POST /api/visits                     # 방문 기록 생성
  Body: { challengeId, stationId, latitude, longitude }

POST /api/visits/verify              # GPS 인증
  Body: { visitId, latitude, longitude }

GET /api/visits/challenge/:id        # 특정 도전의 방문 기록
GET /api/visits                      # 전체 방문 기록 (페이징)
DELETE /api/visits/:id               # 방문 기록 삭제
```

### 4. 통계
```
GET /api/stats/progress/:lineName    # 노선별 진행률
GET /api/stats/summary               # 전체 통계
```

---

## 🗄️ 데이터베이스 연결

### config/database.js
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

---

## 🛠️ 주요 기능 구현

### 1. 역 정보 조회 (stationController.js)
```javascript
// GET /api/stations/line/:lineName
exports.getStationsByLine = async (req, res) => {
  const { lineName } = req.params;
  const [rows] = await pool.execute(
    'SELECT * FROM stations WHERE line_num = ?',
    [lineName]
  );
  res.json(rows);
};
```

### 2. 랜덤 10개 추출
```javascript
// 클라이언트에서 처리 또는
exports.getRandomStations = async (req, res) => {
  const { lineName, count = 10 } = req.query;
  const [rows] = await pool.execute(
    'SELECT * FROM stations WHERE line_num = ? ORDER BY RAND() LIMIT ?',
    [lineName, parseInt(count)]
  );
  res.json(rows);
};
```

### 3. GPS 인증 (visitController.js)
```javascript
const { calculateDistance } = require('../utils/distance');

exports.verifyVisit = async (req, res) => {
  const { visitId, latitude, longitude } = req.body;

  // 방문 기록 조회
  const [visit] = await pool.execute(
    'SELECT v.*, s.latitude as station_lat, s.longitude as station_lng FROM visits v JOIN stations s ON v.station_id = s.id WHERE v.id = ?',
    [visitId]
  );

  if (!visit[0]) {
    return res.status(404).json({ error: 'Visit not found' });
  }

  // 거리 계산
  const distance = calculateDistance(
    latitude, longitude,
    visit[0].station_lat, visit[0].station_lng
  );

  // 100m 이내 & 3시간 이내 체크
  const timeDiff = Date.now() - new Date(visit[0].start_time).getTime();
  const threeHours = 3 * 60 * 60 * 1000;

  const verified = distance <= 100 && timeDiff <= threeHours;

  // 업데이트
  await pool.execute(
    'UPDATE visits SET verified = ?, visit_latitude = ?, visit_longitude = ?, arrival_time = NOW(), time_taken = TIMESTAMPDIFF(SECOND, start_time, NOW()) WHERE id = ?',
    [verified, latitude, longitude, visitId]
  );

  res.json({ verified, distance, timeTaken: timeDiff / 1000 });
};
```

### 4. 거리 계산 (utils/distance.js)
```javascript
// Haversine Formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 지구 반지름 (m)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // 미터
}

module.exports = { calculateDistance };
```

---

## 🔧 server.js

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

// Routes
app.use('/api', routes);

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 📦 package.json

```json
{
  "name": "bingbing-subway-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 🔑 .env.example

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/subway_roulette

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

---

## ✅ 개발 순서

1. **프로젝트 초기화**
   - npm init, 패키지 설치
   - 폴더 구조 생성

2. **DB 연결 설정**
   - config/database.js
   - 연결 테스트

3. **역 정보 API**
   - stationController.js
   - 라우트 설정

4. **도전 & 방문 API**
   - challengeController.js
   - visitController.js

5. **GPS 인증 로직**
   - utils/distance.js
   - verify 엔드포인트

6. **에러 핸들링**
   - middleware/errorHandler.js

7. **테스트**
   - Postman/Thunder Client로 API 테스트

---

## 🧪 테스트 시나리오

### 1. 역 정보 조회
```bash
GET http://localhost:3000/api/stations/line/1호선
```

### 2. 도전 시작
```bash
POST http://localhost:3000/api/challenges
Content-Type: application/json

{
  "lineName": "1호선",
  "selectedStations": [1, 5, 10, 15, 20, 25, 30, 35, 40, 45],
  "finalStationId": 25
}
```

### 3. 방문 기록 생성
```bash
POST http://localhost:3000/api/visits
Content-Type: application/json

{
  "challengeId": 1,
  "stationId": 25,
  "latitude": 37.5546,
  "longitude": 126.9708
}
```

### 4. GPS 인증
```bash
POST http://localhost:3000/api/visits/verify
Content-Type: application/json

{
  "visitId": 1,
  "latitude": 37.5546,
  "longitude": 126.9708
}
```

---

## 🚀 배포 (Railway)

1. GitHub 레포지토리 생성
2. Railway 프로젝트 생성
3. GitHub 연동
4. 환경변수 설정
5. 자동 배포

---

**예상 개발 시간**: 4-6시간
