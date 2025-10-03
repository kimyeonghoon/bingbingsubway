const StationCard = ({ station, isVerified, onVerify, isVerifying, userLocation }) => {
  const handleKakaoMapRoute = () => {
    // 역 좌표 확인
    if (!station.latitude || !station.longitude) {
      alert('역의 위치 정보가 없습니다.');
      return;
    }

    // 모바일 환경 감지
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // 모바일: 카카오맵 앱/웹에서 도착지만 설정 (출발지는 사용자가 앱에서 설정)
      const ep = `${station.latitude},${station.longitude}`;
      const url = `kakaomap://look?p=${ep}`;
      window.location.href = url;

      setTimeout(() => {
        window.open(`https://map.kakao.com/link/to/${station.station_nm},${station.latitude},${station.longitude}`, '_blank');
      }, 1500);
    } else {
      // 데스크톱: 카카오맵 웹에서 목적지 표시
      window.open(`https://map.kakao.com/link/to/${station.station_nm},${station.latitude},${station.longitude}`, '_blank');
    }
  };

  return (
    <div className={`p-5 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
      isVerified
        ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/40 shadow-lg shadow-green-500/20'
        : 'bg-white/80 border-gray-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {station.station_nm}
          </h3>
          <p className="text-sm text-gray-600 font-semibold">{station.line_num}</p>
          {station.station_cd && (
            <p className="text-xs text-gray-500 mt-1">
              역 코드: {station.station_cd}
            </p>
          )}
        </div>

        <div className="ml-4 flex flex-col gap-2">
          {isVerified ? (
            <div className="flex items-center text-green-300">
              <svg
                className="w-10 h-10"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-2 font-bold">인증 완료</span>
            </div>
          ) : (
            <>
              <button
                onClick={handleKakaoMapRoute}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-bold
                           hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105
                           text-sm whitespace-nowrap"
              >
                🚇 대중교통 검색
              </button>
              <button
                onClick={() => onVerify(station)}
                disabled={isVerifying}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold
                           hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-500 disabled:to-gray-600
                           disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {isVerifying ? '인증 중...' : '방문 인증'}
              </button>
            </>
          )}
        </div>
      </div>

      {station.visited_at && (
        <p className="text-xs text-gray-500 mt-3">
          인증 시각: {new Date(station.visited_at).toLocaleString('ko-KR')}
        </p>
      )}
    </div>
  );
};

export default StationCard;
