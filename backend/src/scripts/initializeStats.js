/**
 * 기존 완료된 챌린지 데이터로 user_stats 초기화
 * 사용법: node src/scripts/initializeStats.js
 */

const { pool } = require('../config/database');

async function initializeStats() {
  const connection = await pool.getConnection();

  try {
    console.log('[initializeStats] 통계 초기화 시작...');

    // 1. 모든 사용자 조회
    const [users] = await connection.execute('SELECT id FROM users');

    console.log(`[initializeStats] 총 ${users.length}명의 사용자 발견`);

    for (const user of users) {
      const userId = user.id;
      console.log(`\n[initializeStats] 사용자 ID ${userId} 처리 중...`);

      await connection.beginTransaction();

      try {
        // 2. user_stats 레코드 존재 확인 및 삭제 (재초기화)
        await connection.execute('DELETE FROM user_stats WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM user_visited_stations WHERE user_id = ?', [userId]);

        // 3. 사용자의 모든 챌린지 조회
        const [challenges] = await connection.execute(
          `SELECT id, status, started_at, completed_at
           FROM challenges
           WHERE user_id = ?
           ORDER BY started_at ASC`,
          [userId]
        );

        if (challenges.length === 0) {
          console.log(`  → 챌린지 없음, 스킵`);
          await connection.commit();
          continue;
        }

        // 4. 통계 계산
        let totalChallenges = 0;
        let completedChallenges = 0;
        let failedChallenges = 0;
        let totalVisitedStations = 0;
        let totalPlayTime = 0;
        let bestTime = null;
        let firstChallengeAt = null;
        let lastPlayAt = null;
        const visitedStationsSet = new Set();

        for (const challenge of challenges) {
          if (challenge.status === 'completed' || challenge.status === 'failed') {
            totalChallenges++;

            if (!firstChallengeAt) {
              firstChallengeAt = challenge.started_at;
            }
            lastPlayAt = challenge.completed_at || challenge.started_at;

            if (challenge.status === 'completed') {
              completedChallenges++;

              // 플레이 시간 계산
              if (challenge.completed_at) {
                const playTime = Math.floor(
                  (new Date(challenge.completed_at) - new Date(challenge.started_at)) / 1000
                );
                totalPlayTime += playTime;

                if (bestTime === null || playTime < bestTime) {
                  bestTime = playTime;
                }
              }

              // 방문한 역 조회
              const [visits] = await connection.execute(
                'SELECT station_id FROM visits WHERE challenge_id = ? AND is_verified = true',
                [challenge.id]
              );

              totalVisitedStations += visits.length;

              for (const visit of visits) {
                visitedStationsSet.add(visit.station_id);

                // user_visited_stations에 추가
                const [existing] = await connection.execute(
                  'SELECT id, visit_count FROM user_visited_stations WHERE user_id = ? AND station_id = ?',
                  [userId, visit.station_id]
                );

                if (existing.length === 0) {
                  await connection.execute(
                    'INSERT INTO user_visited_stations (user_id, station_id, first_visit_at, visit_count) VALUES (?, ?, ?, 1)',
                    [userId, visit.station_id, challenge.completed_at || challenge.started_at]
                  );
                } else {
                  await connection.execute(
                    'UPDATE user_visited_stations SET visit_count = visit_count + 1 WHERE id = ?',
                    [existing[0].id]
                  );
                }
              }
            } else if (challenge.status === 'failed') {
              failedChallenges++;
            }
          }
        }

        const uniqueVisitedStations = visitedStationsSet.size;
        const successRate = totalChallenges > 0 ? (completedChallenges * 100.0) / totalChallenges : 0;
        const totalScore = completedChallenges * 100;

        // 5. user_stats 생성
        await connection.execute(
          `INSERT INTO user_stats
           (user_id, total_challenges, completed_challenges, failed_challenges, success_rate,
            total_visited_stations, unique_visited_stations, total_play_time, best_time,
            current_streak, max_streak, total_score, first_challenge_at, last_play_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
          [
            userId,
            totalChallenges,
            completedChallenges,
            failedChallenges,
            successRate,
            totalVisitedStations,
            uniqueVisitedStations,
            totalPlayTime,
            bestTime || 0,
            totalScore,
            firstChallengeAt,
            lastPlayAt
          ]
        );

        await connection.commit();

        console.log(`  → 완료: ${completedChallenges}개 완료, ${failedChallenges}개 실패, 고유 역 ${uniqueVisitedStations}개`);
      } catch (error) {
        await connection.rollback();
        console.error(`  → 에러:`, error.message);
      }
    }

    console.log('\n[initializeStats] 통계 초기화 완료!');
  } catch (error) {
    console.error('[initializeStats] 에러:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

initializeStats();
