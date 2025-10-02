const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');
const challengeController = require('../controllers/challengeController');
const visitController = require('../controllers/visitController');
const userStatsController = require('../controllers/userStatsController');
const achievementController = require('../controllers/achievementController');
const leaderboardController = require('../controllers/leaderboardController');
const authController = require('../controllers/authController');

// 인증 관련 라우트
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);

// 역 정보 관련 라우트
router.get('/lines', stationController.getLines);
router.get('/lines/:lineName/stations', stationController.getStationsByLine);
router.get('/stations/:id', stationController.getStationById);
router.get('/lines/:lineName/random', stationController.getRandomStations);

// 도전 관련 라우트
router.post('/challenges', challengeController.createChallenge);
router.get('/challenges/:userId', challengeController.getChallengesByUser);
router.get('/challenges/:id/stations', challengeController.getChallengeStations);
router.post('/challenges/:id/complete', challengeController.completeChallenge);
router.post('/challenges/:id/fail', challengeController.failChallenge);

// 방문 인증 라우트
router.post('/visits', visitController.createVisit);
router.get('/visits/:userId', visitController.getVisitsByUser);

// 사용자 통계 라우트
router.get('/users/:userId/stats', userStatsController.getUserStats);
router.get('/users/:userId/visited-stations', userStatsController.getVisitedStations);
router.get('/users/:userId/line-stats', userStatsController.getLineStats);
router.get('/users/:userId/recent-activities', userStatsController.getRecentActivities);

// 업적 라우트
router.get('/achievements', achievementController.getAllAchievements);
router.get('/users/:userId/achievements', achievementController.getUserAchievements);
router.get('/users/:userId/achievements/progress', achievementController.getAchievementProgress);

// 랭킹 라우트
router.get('/leaderboard', leaderboardController.getLeaderboard);
router.get('/leaderboard/weekly', leaderboardController.getWeeklyLeaderboard);
router.get('/users/:userId/rank', leaderboardController.getUserRank);

module.exports = router;
