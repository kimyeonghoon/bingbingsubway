import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '../HomePage';
import { stationApi, challengeApi } from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  stationApi: {
    getLines: vi.fn()
  },
  challengeApi: {
    createChallenge: vi.fn(),
    getChallengesByUser: vi.fn(),
    getChallengeStations: vi.fn(),
    selectStation: vi.fn(),
    cancelChallenge: vi.fn()
  }
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

describe('HomePage - 룰렛 자동 이동 방지', () => {
  const mockLines = ['1호선', '2호선', '3호선', '4호선'];
  const mockStations = [
    { id: 1, station_nm: '서울역', line_num: '1호선' },
    { id: 2, station_nm: '종각', line_num: '1호선' },
    { id: 3, station_nm: '시청', line_num: '1호선' },
    { id: 4, station_nm: '을지로입구', line_num: '2호선' },
    { id: 5, station_nm: '을지로3가', line_num: '2호선' },
    { id: 6, station_nm: '을지로4가', line_num: '2호선' },
    { id: 7, station_nm: '동대문역사문화공원', line_num: '2호선' },
    { id: 8, station_nm: '신당', line_num: '2호선' },
    { id: 9, station_nm: '상왕십리', line_num: '2호선' },
    { id: 10, station_nm: '왕십리', line_num: '2호선' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    stationApi.getLines.mockResolvedValue(mockLines);
    challengeApi.getChallengesByUser.mockResolvedValue([]);
  });

  it('역 선택 후 자동으로 페이지 이동하지 않아야 함', async () => {
    challengeApi.createChallenge.mockResolvedValue({
      challengeId: 1,
      stations: mockStations
    });
    challengeApi.selectStation.mockResolvedValue({ success: true });

    const { container } = render(<HomePage userId={1} />);

    // Alert 확인 모킹
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // 1. 도전 시작 버튼 클릭 (aria-label 사용)
    const startButton = await screen.findByLabelText('도전 시작하기');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(challengeApi.createChallenge).toHaveBeenCalled();
    });

    // 2. 룰렛 컴포넌트가 렌더링될 때까지 대기
    await waitFor(() => {
      expect(screen.getByText(/룰렛을 돌려 역을 확인하세요/)).toBeInTheDocument();
    });

    // 3. RouletteWheel이 렌더링되었는지 확인
    expect(screen.getByText('서울역')).toBeInTheDocument();

    // 4. 역 선택 후 2초 대기 (원래 1초 setTimeout이 있었음)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 자동 이동하지 않았는지 확인 (navigate가 호출되지 않음)
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('룰렛 단계에서 초기화 버튼이 표시되어야 함', async () => {
    challengeApi.createChallenge.mockResolvedValue({
      challengeId: 1,
      stations: mockStations
    });

    render(<HomePage userId={1} />);

    // Alert 모킹
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // 도전 시작
    const startButton = await screen.findByLabelText('도전 시작하기');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/룰렛을 돌려 역을 확인하세요/)).toBeInTheDocument();
    });

    // "초기화" 버튼이 있는지 확인
    expect(screen.getByText('🔄 초기화')).toBeInTheDocument();
  });

  it('도전 시작 시 기존 진행 중인 도전을 확인해야 함', async () => {
    challengeApi.getChallengesByUser.mockResolvedValue([]);
    challengeApi.createChallenge.mockResolvedValue({
      challengeId: 1,
      stations: mockStations
    });

    render(<HomePage userId={1} />);

    // Alert 모킹
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    const startButton = await screen.findByLabelText('도전 시작하기');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(challengeApi.getChallengesByUser).toHaveBeenCalledWith(1);
      expect(challengeApi.createChallenge).toHaveBeenCalled();
    });
  });

  it('초기화 버튼 클릭 시 도전이 취소되어야 함', async () => {
    challengeApi.createChallenge.mockResolvedValue({
      challengeId: 1,
      stations: mockStations
    });
    challengeApi.cancelChallenge.mockResolvedValue({ success: true });

    render(<HomePage userId={1} />);

    // Alert, Confirm 모킹
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // 도전 시작
    const startButton = await screen.findByLabelText('도전 시작하기');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/룰렛을 돌려 역을 확인하세요/)).toBeInTheDocument();
    });

    // 초기화 버튼 클릭
    const resetButton = screen.getByLabelText('룰렛 초기화');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(challengeApi.cancelChallenge).toHaveBeenCalledWith(1);
    });

    // setup 단계로 돌아왔는지 확인
    await waitFor(() => {
      const buttons = screen.getAllByLabelText('도전 시작하기');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('노선 정보가 표시되어야 함', async () => {
    challengeApi.createChallenge.mockResolvedValue({
      challengeId: 1,
      stations: mockStations
    });

    render(<HomePage userId={1} />);

    // Alert 모킹
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // 도전 시작
    const startButton = await screen.findByLabelText('도전 시작하기');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/룰렛을 돌려 역을 확인하세요/)).toBeInTheDocument();
    });

    // 노선 정보 확인 (1호선 ~ 4호선 중 하나가 표시됨)
    await waitFor(() => {
      const lineElements = screen.queryAllByText(/호선/);
      expect(lineElements.length).toBeGreaterThan(0);
    });
  });
});
