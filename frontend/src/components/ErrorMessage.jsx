// Standardized error message component

export default function ErrorMessage({
  title = '오류가 발생했습니다',
  message,
  onRetry,
  type = 'error' // error, warning, info
}) {
  const styles = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: '❌',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: '⚠️',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'ℹ️',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const style = styles[type] || styles.error;

  return (
    <div
      className={`${style.container} border-2 rounded-2xl p-6 shadow-lg`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl" aria-hidden="true">{style.icon}</span>
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${style.titleColor} mb-2`}>
            {title}
          </h3>
          {message && (
            <p className={`${style.messageColor} mb-4`}>
              {message}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              aria-label="다시 시도하기"
              className={`${style.buttonColor} text-white px-6 py-2 rounded-lg font-semibold
                         transition-all duration-200 shadow-md hover:shadow-lg
                         focus:ring-4 focus:ring-opacity-50 focus:outline-none
                         transform hover:scale-105 active:scale-95`}
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Common error messages
export const ERROR_MESSAGES = {
  NETWORK: {
    title: '네트워크 오류',
    message: '인터넷 연결을 확인하고 다시 시도해주세요.'
  },
  SERVER: {
    title: '서버 오류',
    message: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
  },
  NOT_FOUND: {
    title: '찾을 수 없음',
    message: '요청하신 정보를 찾을 수 없습니다.'
  },
  UNAUTHORIZED: {
    title: '권한 없음',
    message: '접근 권한이 없습니다.'
  },
  GPS_DENIED: {
    title: 'GPS 권한 거부',
    message: 'GPS 권한을 허용해야 게임을 진행할 수 있습니다.'
  },
  GPS_UNAVAILABLE: {
    title: 'GPS 사용 불가',
    message: '기기에서 GPS를 사용할 수 없습니다.'
  },
  GPS_TIMEOUT: {
    title: 'GPS 시간 초과',
    message: '위치 정보를 가져오는데 시간이 너무 오래 걸렸습니다.'
  },
  TOO_FAR: {
    title: '거리가 너무 멉니다',
    message: '목표 역에서 100m 이내에 있어야 합니다.'
  },
  ALREADY_VISITED: {
    title: '이미 방문한 역',
    message: '이 역은 이미 방문하셨습니다.'
  },
  CHALLENGE_EXPIRED: {
    title: '도전 시간 만료',
    message: '3시간 제한 시간이 만료되었습니다.'
  },
  LOAD_FAILED: {
    title: '불러오기 실패',
    message: '데이터를 불러오는데 실패했습니다.'
  }
};
