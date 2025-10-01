import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import StatsDashboard from '../StatsDashboard';
import { userStatsApi } from '../../services/api';

vi.mock('../../services/api', () => ({
  userStatsApi: {
    getUserStats: vi.fn(),
    getLineStats: vi.fn(),
    getRecentActivities: vi.fn()
  }
}));

describe('StatsDashboard', () => {
  const mockStats = {
    total_challenges: 10,
    success_rate: 75.5,
    max_streak: 5,
    unique_visited_stations: 42,
    total_score: 1500,
    average_time: 1200
  };

  const mockLineStats = [
    { line_num: '1호선', visited_count: 10, total_count: 98 }
  ];

  const mockActivities = [
    {
      line_num: '2호선',
      visited_count: 1,
      total_count: 1,
      status: 'completed',
      created_at: new Date().toISOString()
    }
  ];

  it('통계 카드를 표시해야 함', async () => {
    userStatsApi.getUserStats.mockResolvedValue(mockStats);
    userStatsApi.getLineStats.mockResolvedValue(mockLineStats);
    userStatsApi.getRecentActivities.mockResolvedValue(mockActivities);

    render(<StatsDashboard userId={123} />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('75.5%')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  it('로딩 상태를 표시해야 함', () => {
    userStatsApi.getUserStats.mockReturnValue(new Promise(() => {}));
    userStatsApi.getLineStats.mockReturnValue(new Promise(() => {}));
    userStatsApi.getRecentActivities.mockReturnValue(new Promise(() => {}));

    render(<StatsDashboard userId={123} />);

    expect(screen.getByText(/통계 불러오는 중/i)).toBeInTheDocument();
  });

  it('에러 상태를 표시해야 함', async () => {
    userStatsApi.getUserStats.mockRejectedValue(new Error('Failed'));
    userStatsApi.getLineStats.mockRejectedValue(new Error('Failed'));
    userStatsApi.getRecentActivities.mockRejectedValue(new Error('Failed'));

    render(<StatsDashboard userId={123} />);

    await waitFor(() => {
      expect(screen.getByText(/통계를 불러오는데 실패했습니다/i)).toBeInTheDocument();
    });
  });

  it('노선별 통계를 표시해야 함', async () => {
    userStatsApi.getUserStats.mockResolvedValue(mockStats);
    userStatsApi.getLineStats.mockResolvedValue(mockLineStats);
    userStatsApi.getRecentActivities.mockResolvedValue([]);

    render(<StatsDashboard userId={123} />);

    await waitFor(() => {
      expect(screen.getByText('1호선')).toBeInTheDocument();
      expect(screen.getByText('10 / 98')).toBeInTheDocument();
    });
  });
});
