import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LeaderboardPage from '../LeaderboardPage';
import { leaderboardApi } from '../../services/api';

vi.mock('../../services/api', () => ({
  leaderboardApi: {
    getLeaderboard: vi.fn(),
    getWeeklyLeaderboard: vi.fn(),
    getUserRank: vi.fn()
  }
}));

describe('LeaderboardPage', () => {
  const mockRankings = {
    rankings: [
      {
        user_id: 1,
        rank: 1,
        total_score: 5000,
        total_challenges: 50,
        completed_challenges: 40,
        achievement_count: 10
      },
      {
        user_id: 2,
        rank: 2,
        total_score: 4500,
        total_challenges: 45,
        completed_challenges: 35,
        achievement_count: 8
      }
    ],
    total: 100
  };

  const mockUserRank = {
    user_id: 123,
    ranks: {
      score: 5,
      streak: 10,
      stations: 15,
      success_rate: 3
    },
    stats: {
      total_score: 1000
    }
  };

  it('랭킹 목록을 표시해야 함', async () => {
    leaderboardApi.getLeaderboard.mockResolvedValue(mockRankings);
    leaderboardApi.getUserRank.mockResolvedValue(mockUserRank);

    render(<LeaderboardPage userId={123} />);

    await waitFor(() => {
      expect(screen.getByText('사용자 1')).toBeInTheDocument();
      expect(screen.getByText('사용자 2')).toBeInTheDocument();
    });
  });

  it('내 랭킹을 표시해야 함', async () => {
    leaderboardApi.getLeaderboard.mockResolvedValue(mockRankings);
    leaderboardApi.getUserRank.mockResolvedValue(mockUserRank);

    render(<LeaderboardPage userId={123} />);

    await waitFor(() => {
      expect(screen.getByText('내 순위')).toBeInTheDocument();
      expect(screen.getByText('#5')).toBeInTheDocument();
    });
  });

  it('로딩 상태를 표시해야 함', () => {
    leaderboardApi.getLeaderboard.mockReturnValue(new Promise(() => {}));
    leaderboardApi.getUserRank.mockReturnValue(new Promise(() => {}));

    render(<LeaderboardPage userId={123} />);

    expect(screen.getByText(/랭킹 불러오는 중/i)).toBeInTheDocument();
  });
});
