import { useState } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return {
          message: 'GPS 권한이 거부되었습니다.',
          detail: '브라우저 설정에서 위치 권한을 허용해주세요.',
          action: 'settings'
        };
      case error.POSITION_UNAVAILABLE:
        return {
          message: '위치 정보를 사용할 수 없습니다.',
          detail: 'GPS 신호를 확인해주세요.',
          action: 'retry'
        };
      case error.TIMEOUT:
        return {
          message: '위치 확인 시간이 초과되었습니다.',
          detail: '다시 시도해주세요.',
          action: 'retry'
        };
      default:
        return {
          message: '위치 확인 중 오류가 발생했습니다.',
          detail: error.message,
          action: 'retry'
        };
    }
  };

  const getCurrentPosition = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError({
        message: '이 브라우저는 GPS를 지원하지 않습니다.',
        detail: '최신 브라우저를 사용해주세요.',
        action: 'unsupported'
      });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy;

        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy
        });

        // 정확도가 낮으면 경고
        if (accuracy > 50) {
          console.warn(`GPS 정확도가 낮습니다: ${accuracy}m`);
        }

        setLoading(false);
      },
      (error) => {
        setError(getErrorMessage(error));
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return { location, error, loading, getCurrentPosition };
};
