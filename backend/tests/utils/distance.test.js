const { calculateDistance } = require('../../src/utils/distance');

describe('Distance Calculation', () => {
  test('서울역과 시청역 간의 거리 계산', () => {
    // 서울역: 37.5546, 126.9706
    // 시청역: 37.5641, 126.9768
    const distance = calculateDistance(37.5546, 126.9706, 37.5641, 126.9768);

    // 실제 거리는 약 1.1km
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(1300);
  });

  test('같은 위치의 거리는 0에 가까워야 함', () => {
    const distance = calculateDistance(37.5546, 126.9706, 37.5546, 126.9706);
    expect(distance).toBeLessThan(1); // 1미터 미만
  });

  test('100미터 이내의 거리 판별', () => {
    // 37.5546, 126.9706 기준 약 50미터 거리
    const distance = calculateDistance(37.5546, 126.9706, 37.5551, 126.9706);
    expect(distance).toBeLessThan(100);
  });

  test('위도와 경도가 반대로 입력되어도 정상 계산', () => {
    const distance1 = calculateDistance(37.5546, 126.9706, 37.5641, 126.9768);
    const distance2 = calculateDistance(37.5641, 126.9768, 37.5546, 126.9706);
    expect(distance1).toBeCloseTo(distance2, 0);
  });

  test('음수 좌표도 정상 처리', () => {
    // 남반구, 서반구 좌표
    const distance = calculateDistance(-33.8688, -151.2093, -33.8650, -151.2094);
    expect(distance).toBeGreaterThan(0);
  });
});
