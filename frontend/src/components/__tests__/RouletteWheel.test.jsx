import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
        selectedStation={null}
      />
    );

    expect(screen.getByText('서울역')).toBeInTheDocument();
    expect(screen.getByText('종각')).toBeInTheDocument();
    expect(screen.getByText('동대문')).toBeInTheDocument();
  });

  it('renders center button with "빙빙" text when not spinning', () => {
    render(
      <RouletteWheel
        stations={mockStations}
        onStationSelect={() => {}}
        isSpinning={false}
        onSpinComplete={() => {}}
        selectedStation={null}
      />
    );

    expect(screen.getByText('빙빙')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows spinning emoji when spinning', () => {
    render(
      <RouletteWheel
        stations={mockStations}
        onStationSelect={() => {}}
        isSpinning={true}
        onSpinComplete={() => {}}
        selectedStation={null}
      />
    );

    expect(screen.getByText('🌀')).toBeInTheDocument();
  });

  it('shows instruction text when not spinning and no station selected', () => {
    render(
      <RouletteWheel
        stations={mockStations}
        onStationSelect={() => {}}
        isSpinning={false}
        onSpinComplete={() => {}}
        selectedStation={null}
      />
    );

    expect(screen.getByText(/중앙의 "빙빙"을 클릭하세요!/)).toBeInTheDocument();
  });

  it('center button is disabled when spinning', () => {
    render(
      <RouletteWheel
        stations={mockStations}
        onStationSelect={() => {}}
        isSpinning={true}
        onSpinComplete={() => {}}
        selectedStation={null}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('center button is disabled when no stations', () => {
    render(
      <RouletteWheel
        stations={[]}
        onStationSelect={() => {}}
        isSpinning={false}
        onSpinComplete={() => {}}
        selectedStation={null}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('handles empty stations array', () => {
    render(
      <RouletteWheel
        stations={[]}
        onStationSelect={() => {}}
        isSpinning={false}
        onSpinComplete={() => {}}
        selectedStation={null}
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
        selectedStation={null}
      />
    );

    expect(screen.getByText('빙빙')).toBeInTheDocument();
  });
});
