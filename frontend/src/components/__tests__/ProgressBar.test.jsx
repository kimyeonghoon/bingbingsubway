import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct percentage', () => {
    render(<ProgressBar completed={5} total={10} />);
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  it('shows 0% when completed is 0', () => {
    render(<ProgressBar completed={0} total={10} />);
    expect(screen.getByText('0 / 10')).toBeInTheDocument();
  });

  it('shows 100% when all completed', () => {
    render(<ProgressBar completed={10} total={10} />);
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
  });

  it('handles empty total', () => {
    render(<ProgressBar completed={0} total={0} />);
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
  });
});
