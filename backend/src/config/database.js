const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: process.env.DATABASE_PORT || 3306,
  charset: 'utf8mb4',
  connectAttributes: {
    program_name: 'bingbing_subway_backend'
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 풀에서 연결을 가져올 때 UTF-8 설정 적용
pool.on('connection', (connection) => {
  connection.query("SET NAMES 'utf8mb4'");
  connection.query("SET CHARACTER SET utf8mb4");
});

// 연결 테스트 함수
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL 데이터베이스 연결 성공');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL 연결 실패:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
