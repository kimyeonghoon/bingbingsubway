import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AchievementsPage from '../AchievementsPage';
import { achievementApi } from '../../services/api';

vi.mock('../../services/api', () => ({
  achievementApi: {
    getUserAchievements: vi.fn()
  }
}));

describe('AchievementsPage', () => {
  const mockAchievements = {
    achievements: [
      {
        id: 1,
        name: '첫 발걸음',
        description: '첫 번째 도전 완료',
        icon: '🚇',
        category: 'beginner',
        tier: 'bronze',
        points: 10,
        is_achieved: true,
        achieved_at: new Date().toISOString()
      },
      {
        id: 2,
        name: '연승왕',
        description: '5연승 달성',
        icon: '🔥',
        category: 'streak',
        tier: 'silver',
        points: 50,
        is_achieved: false
      }
    ],
    grouped: {
      beginner: [
        {
          id: 1,
          name: '첫 발걸음',
          is_achieved: true
        }
      ]
    },
    total: 2,
    achieved: 1
  };

  it('업적 목록을 표시해야 함', async () => {
    achievementApi.getUserAchievements.mockResolvedValue(mockAchievements);

    render(<AchievementsPage userId={123} />);

    await waitFor(() => {
      expect(screen.getByText('첫 발걸음')).toBeInTheDocument();
      expect(screen.getByText('연승왕')).toBeInTheDocument();
      expect(screen.getByText(/1 \/ 2 달성/i)).toBeInTheDocument();
    });
  });

  it('달성 통계를 표시해야 함', async () => {
    achievementApi.getUserAchievements.mockResolvedValue(mockAchievements);

    render(<AchievementsPage userId={123} />);

    await waitFor(() => {
      expect(screen.getByText('달성한 업적')).toBeInTheDocument();
    });
  });

  it('로딩 상태를 표시해야 함', () => {
    achievementApi.getUserAchievements.mockReturnValue(new Promise(() => {}));

    render(<AchievementsPage userId={123} />);

    expect(screen.getByText(/업적 불러오는 중/i)).toBeInTheDocument();
  });
});
