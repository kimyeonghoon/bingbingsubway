const StationCard = ({ station, isVerified, onVerify, isVerifying }) => {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      isVerified
        ? 'bg-green-50 border-green-500'
        : 'bg-white border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">
            {station.station_nm}
          </h3>
          <p className="text-sm text-gray-600">{station.line_num}</p>
          {station.station_cd && (
            <p className="text-xs text-gray-500 mt-1">
              역 코드: {station.station_cd}
            </p>
          )}
        </div>

        <div className="ml-4">
          {isVerified ? (
            <div className="flex items-center text-green-600">
              <svg
                className="w-8 h-8"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-2 font-semibold">인증 완료</span>
            </div>
          ) : (
            <button
              onClick={() => onVerify(station)}
              disabled={isVerifying}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold
                         hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                         transition-colors"
            >
              {isVerifying ? '인증 중...' : '방문 인증'}
            </button>
          )}
        </div>
      </div>

      {station.visited_at && (
        <p className="text-xs text-gray-500 mt-2">
          인증 시각: {new Date(station.visited_at).toLocaleString('ko-KR')}
        </p>
      )}
    </div>
  );
};

export default StationCard;
