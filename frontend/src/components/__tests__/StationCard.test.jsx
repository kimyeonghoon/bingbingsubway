import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StationCard from '../StationCard';

describe('StationCard', () => {
  const mockStation = {
    id: 1,
    station_nm: '서울역',
    line_num: '1호선',
    latitude: '37.5546',
    longitude: '126.9707'
  };

  it('renders station information', () => {
    render(
      <StationCard
        station={mockStation}
        isVerified={false}
        onVerify={() => {}}
        isVerifying={false}
      />
    );

    expect(screen.getByText('서울역')).toBeInTheDocument();
    expect(screen.getByText('1호선')).toBeInTheDocument();
  });

  it('shows verified status', () => {
    render(
      <StationCard
        station={mockStation}
        isVerified={true}
        onVerify={() => {}}
        isVerifying={false}
      />
    );

    expect(screen.getByText(/인증 완료/)).toBeInTheDocument();
  });

  it('calls onVerify when verify button is clicked', () => {
    const mockOnVerify = vi.fn();
    render(
      <StationCard
        station={mockStation}
        isVerified={false}
        onVerify={mockOnVerify}
        isVerifying={false}
      />
    );

    const verifyButton = screen.getByRole('button');
    fireEvent.click(verifyButton);

    expect(mockOnVerify).toHaveBeenCalledWith(mockStation);
  });

  it('disables button when verifying', () => {
    render(
      <StationCard
        station={mockStation}
        isVerified={false}
        onVerify={() => {}}
        isVerifying={true}
      />
    );

    const verifyButton = screen.getByRole('button');
    expect(verifyButton).toBeDisabled();
  });

  it('does not show button when already verified', () => {
    render(
      <StationCard
        station={mockStation}
        isVerified={true}
        onVerify={() => {}}
        isVerifying={false}
      />
    );

    // 버튼이 없어야 함 (인증 완료 아이콘과 텍스트만 표시)
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
    expect(screen.getByText('인증 완료')).toBeInTheDocument();
  });
});
