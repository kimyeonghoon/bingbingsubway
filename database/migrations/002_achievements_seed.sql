-- 업적 시드 데이터
-- 실행 방법: mysql -u root -p bingbing_subway < migrations/002_achievements_seed.sql

-- 기존 데이터 삭제 (재실행 시)
DELETE FROM achievements;

-- 업적 데이터 삽입
INSERT INTO achievements (code, name, description, icon, category, condition_type, condition_value, points, tier) VALUES
-- 초보자 업적
('first_step', '첫 발걸음', '첫 번째 도전을 완료하세요', '🚇', 'beginner', 'success_count', 1, 10, 'bronze'),
('rookie', '신입 탐험가', '5번의 도전을 완료하세요', '🎒', 'beginner', 'success_count', 5, 25, 'bronze'),
('explorer', '베테랑 탐험가', '10번의 도전을 완료하세요', '🗺️', 'beginner', 'success_count', 10, 50, 'silver'),
('veteran', '전설의 탐험가', '50번의 도전을 완료하세요', '⭐', 'beginner', 'success_count', 50, 250, 'gold'),
('master', '지하철 마스터', '100번의 도전을 완료하세요', '👑', 'beginner', 'success_count', 100, 500, 'platinum'),

-- 연승 업적
('streak_3', '연승 시작', '3번 연속으로 성공하세요', '🔥', 'streak', 'streak', 3, 30, 'bronze'),
('streak_5', '연승왕', '5번 연속으로 성공하세요', '🔥', 'streak', 'streak', 5, 50, 'silver'),
('streak_10', '불멸의 연승', '10번 연속으로 성공하세요', '🔥', 'streak', 'streak', 10, 100, 'gold'),
('streak_20', '전설의 연승', '20번 연속으로 성공하세요', '🔥', 'streak', 'streak', 20, 300, 'platinum'),

-- 탐험가 업적 (고유 역 방문)
('station_10', '동네 탐험가', '10개의 서로 다른 역을 방문하세요', '📍', 'explorer', 'station_count', 10, 20, 'bronze'),
('station_50', '도시 탐험가', '50개의 서로 다른 역을 방문하세요', '📍', 'explorer', 'station_count', 50, 100, 'silver'),
('station_100', '수도권 탐험가', '100개의 서로 다른 역을 방문하세요', '📍', 'explorer', 'station_count', 100, 200, 'gold'),
('station_200', '지하철 박사', '200개의 서로 다른 역을 방문하세요', '📍', 'explorer', 'station_count', 200, 500, 'platinum'),
('station_all', '완전 정복', '모든 역을 방문하세요 (799개)', '🏆', 'explorer', 'station_count', 799, 2000, 'platinum'),

-- 스피드 업적 (시간 기반)
('speed_30', '스프린터', '30분 이내에 도전 완료', '⏱️', 'speed', 'time', 1800, 30, 'bronze'),
('speed_20', '스피드러너', '20분 이내에 도전 완료', '⏱️', 'speed', 'time', 1200, 50, 'silver'),
('speed_15', '번개', '15분 이내에 도전 완료', '⚡', 'speed', 'time', 900, 100, 'gold'),
('speed_10', '음속돌파', '10분 이내에 도전 완료', '💨', 'speed', 'time', 600, 200, 'platinum'),

-- 노선 마스터 (특정 노선 완료)
('line_1', '1호선 마스터', '1호선의 모든 역을 방문하세요', '🟦', 'master', 'line_complete', 1, 150, 'gold'),
('line_2', '2호선 마스터', '2호선의 모든 역을 방문하세요', '🟩', 'master', 'line_complete', 2, 150, 'gold'),
('line_3', '3호선 마스터', '3호선의 모든 역을 방문하세요', '🟧', 'master', 'line_complete', 3, 150, 'gold'),
('line_4', '4호선 마스터', '4호선의 모든 역을 방문하세요', '🟦', 'master', 'line_complete', 4, 150, 'gold'),
('line_all', '전 노선 마스터', '모든 노선을 완료하세요', '🌈', 'master', 'line_complete', 0, 1000, 'platinum'),

-- 완벽주의자 업적
('perfect_10', '완벽주의자', '10번의 도전을 모두 성공하세요 (100% 성공률)', '💯', 'perfect', 'success_count', 10, 150, 'gold'),
('perfect_50', '완벽의 화신', '50번의 도전을 모두 성공하세요 (100% 성공률)', '💯', 'perfect', 'success_count', 50, 500, 'platinum'),

-- 도전 횟수 업적
('challenge_10', '도전자', '10번 도전하세요', '🎯', 'beginner', 'challenge_count', 10, 20, 'bronze'),
('challenge_50', '열정의 도전자', '50번 도전하세요', '🎯', 'beginner', 'challenge_count', 50, 100, 'silver'),
('challenge_100', '불굴의 도전자', '100번 도전하세요', '🎯', 'beginner', 'challenge_count', 100, 250, 'gold'),
('challenge_500', '전설의 도전자', '500번 도전하세요', '🎯', 'beginner', 'challenge_count', 500, 1000, 'platinum');
