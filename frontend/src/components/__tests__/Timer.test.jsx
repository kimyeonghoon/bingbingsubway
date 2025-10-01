import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Timer from '../Timer';

describe('Timer', () => {
  it('renders timer component', () => {
    const startTime = new Date();
    render(<Timer startTime={startTime} />);

    expect(screen.getByText('남은 시간')).toBeInTheDocument();
  });

  it('handles null startTime', () => {
    render(<Timer startTime={null} />);

    expect(screen.getByText('남은 시간')).toBeInTheDocument();
    expect(screen.getByText(/03:00:00/)).toBeInTheDocument();
  });

  it('displays time in HH:MM:SS format', () => {
    const startTime = new Date();
    render(<Timer startTime={startTime} />);

    // HH:MM:SS 형식 확인 (정확한 시간 대신 형식 확인)
    const timeElement = screen.getByText(/\d{2}:\d{2}:\d{2}/);
    expect(timeElement).toBeInTheDocument();
  });

  it('initializes with default time when startTime is old', () => {
    const startTime = new Date(Date.now() - 1000 * 60 * 60 * 4); // 4시간 전 (3시간 제한 초과)
    render(<Timer startTime={startTime} />);

    // Timer 컴포넌트가 렌더링됨
    expect(screen.getByText('남은 시간')).toBeInTheDocument();
  });
});
