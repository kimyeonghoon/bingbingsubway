const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');
const challengeController = require('../controllers/challengeController');
const visitController = require('../controllers/visitController');
const userStatsController = require('../controllers/userStatsController');
const achievementController = require('../controllers/achievementController');
const leaderboardController = require('../controllers/leaderboardController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// 인증 관련 라우트
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticateToken, authController.me);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// 역 정보 관련 라우트
router.get('/lines', stationController.getLines);
router.get('/lines/:lineName/stations', stationController.getStationsByLine);
router.get('/stations/:id', stationController.getStationById);
router.get('/lines/:lineName/random', stationController.getRandomStations);

// 도전 관련 라우트 (인증 필수)
router.post('/challenges', authenticateToken, challengeController.createChallenge);
router.get('/challenges/:userId', authenticateToken, challengeController.getChallengesByUser);
router.get('/challenges/:id/stations', authenticateToken, challengeController.getChallengeStations);
router.post('/challenges/:id/complete', authenticateToken, challengeController.completeChallenge);
router.post('/challenges/:id/fail', authenticateToken, challengeController.failChallenge);
router.post('/challenges/:id/cancel', authenticateToken, challengeController.cancelChallenge);

// 방문 인증 라우트 (인증 필수)
router.post('/visits', authenticateToken, visitController.createVisit);
router.get('/visits/:userId', authenticateToken, visitController.getVisitsByUser);

// 사용자 프로필 라우트 (인증 필수)
router.get('/users/:userId', authenticateToken, userController.getUserProfile);
router.put('/users/:userId', authenticateToken, userController.updateUserProfile);
router.put('/users/:userId/password', authenticateToken, userController.changePassword);
router.delete('/users/:userId', authenticateToken, userController.deleteUser);

// 사용자 통계 라우트 (인증 필수)
router.get('/users/:userId/stats', authenticateToken, userStatsController.getUserStats);
router.get('/users/:userId/visited-stations', authenticateToken, userStatsController.getVisitedStations);
router.get('/users/:userId/line-stats', authenticateToken, userStatsController.getLineStats);
router.get('/users/:userId/recent-activities', authenticateToken, userStatsController.getRecentActivities);

// 업적 라우트
router.get('/achievements', achievementController.getAllAchievements); // 공개 (전체 업적 목록)
router.get('/users/:userId/achievements', authenticateToken, achievementController.getUserAchievements); // 인증 필수
router.get('/users/:userId/achievements/progress', authenticateToken, achievementController.getAchievementProgress); // 인증 필수

// 랭킹 라우트
router.get('/leaderboard', leaderboardController.getLeaderboard);
router.get('/leaderboard/weekly', leaderboardController.getWeeklyLeaderboard);
router.get('/users/:userId/rank', leaderboardController.getUserRank);

module.exports = router;
