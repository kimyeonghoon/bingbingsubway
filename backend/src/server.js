const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { testConnection } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// UTF-8 응답 헤더 설정
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API 라우트
app.use('/api', routes);

// 에러 핸들러
app.use(errorHandler);

// 서버 시작 함수
async function startServer() {
  try {
    // 데이터베이스 연결 테스트
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 데이터베이스 연결 실패. 서버를 시작할 수 없습니다.');
      process.exit(1);
    }

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`📍 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

// 서버 시작
if (require.main === module) {
  startServer();
}

module.exports = app;
