-- 업적 초기 데이터
-- MySQL 8.0

INSERT INTO achievements (name, description, icon, category, tier, condition_type, condition_value, points) VALUES
('🚇 첫 발걸음', '첫 도전을 시작하세요', '🚇', 'challenge', 'bronze', 'challenge_count', 1, 100),
('🎯 도전자', '5번의 도전을 완료하세요', '🎯', 'challenge', 'silver', 'success_count', 5, 250),
('🏆 챌린저', '10번의 도전을 완료하세요', '🏆', 'challenge', 'gold', 'success_count', 10, 500),
('👑 마스터', '50번의 도전을 완료하세요', '👑', 'challenge', 'platinum', 'success_count', 50, 2000),

('🔥 연승왕', '3연승을 달성하세요', '🔥', 'streak', 'bronze', 'streak', 3, 150),
('⚡ 연승 전설', '5연승을 달성하세요', '⚡', 'streak', 'silver', 'streak', 5, 300),
('💫 무패신화', '10연승을 달성하세요', '💫', 'streak', 'gold', 'streak', 10, 1000),

('🗺️ 탐험가', '10개의 다른 역을 방문하세요', '🗺️', 'exploration', 'bronze', 'station_count', 10, 100),
('🌍 여행자', '50개의 다른 역을 방문하세요', '🌍', 'exploration', 'silver', 'station_count', 50, 500),
('🌏 세계일주', '100개의 다른 역을 방문하세요', '🌏', 'exploration', 'gold', 'station_count', 100, 1500),

('⏱️ 스피드러너', '10분 이내에 도전을 완료하세요', '⏱️', 'speed', 'bronze', 'time', 600, 200),
('🚀 번개', '5분 이내에 도전을 완료하세요', '🚀', 'speed', 'silver', 'time', 300, 500),
('⚡ 광속', '3분 이내에 도전을 완료하세요', '⚡', 'speed', 'gold', 'time', 180, 1000),

('💯 완벽주의자', '성공률 90% 이상 달성 (10회 이상)', '💯', 'challenge', 'gold', 'success_rate', 90, 1000)
ON DUPLICATE KEY UPDATE name=name;
