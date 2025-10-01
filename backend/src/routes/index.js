const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');
const challengeController = require('../controllers/challengeController');
const visitController = require('../controllers/visitController');

// 역 정보 관련 라우트
router.get('/lines', stationController.getLines);
router.get('/lines/:lineName/stations', stationController.getStationsByLine);
router.get('/stations/:id', stationController.getStationById);
router.get('/lines/:lineName/random', stationController.getRandomStations);

// 도전 관련 라우트
router.post('/challenges', challengeController.createChallenge);
router.get('/challenges/:userId', challengeController.getChallengesByUser);
router.get('/challenges/:id/stations', challengeController.getChallengeStations);

// 방문 인증 라우트
router.post('/visits', visitController.createVisit);
router.get('/visits/:userId', visitController.getVisitsByUser);

module.exports = router;
