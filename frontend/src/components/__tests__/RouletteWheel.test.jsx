import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RouletteWheel from '../RouletteWheel';

describe('RouletteWheel', () => {
  const mockStations = [
    { id: 1, station_nm: '서울역', line_num: '1호선' },
    { id: 2, station_nm: '종각', line_num: '1호선' },
    { id: 3, station_nm: '동대문', line_num: '1호선' }
  ];

  it('renders roulette wheel with stations', () => {
    render(
      <RouletteWheel
        stations={mockStations}
        onStationSelect={() => {}}
        isSpinning={false}
        onSpinComplete={() => {}}
      />
    );

    expect(screen.getByText('서울역')).toBeInTheDocument();
    expect(screen.getByText('종각')).toBeInTheDocument();
    expect(screen.getByText('동대문')).toBeInTheDocument();
  });

  it('renders center circle with "빙빙" text', () => {
    render(
      <RouletteWheel
        stations={mockStations}
        onStationSelect={() => {}}
        isSpinning={false}
        onSpinComplete={() => {}}
      />
    );

    expect(screen.getByText('빙빙')).toBeInTheDocument();
  });

  it('handles empty stations array', () => {
    render(
      <RouletteWheel
        stations={[]}
        onStationSelect={() => {}}
        isSpinning={false}
        onSpinComplete={() => {}}
      />
    );

    expect(screen.getByText('빙빙')).toBeInTheDocument();
  });

  it('handles null stations', () => {
    render(
      <RouletteWheel
        stations={null}
        onStationSelect={() => {}}
        isSpinning={false}
        onSpinComplete={() => {}}
      />
    );

    expect(screen.getByText('빙빙')).toBeInTheDocument();
  });
});
