# Frontend 개발 계획

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── LineSelector.jsx        # 노선 선택
│   │   ├── RouletteWheel.jsx       # 돌림판
│   │   ├── Timer.jsx               # 3시간 타이머
│   │   ├── LocationVerify.jsx      # GPS 인증
│   │   ├── VisitList.jsx           # 방문 목록
│   │   └── ProgressBar.jsx         # 진행률
│   ├── services/
│   │   └── api.js                  # Backend API 호출
│   ├── hooks/
│   │   ├── useGeolocation.js       # GPS 훅
│   │   ├── useTimer.js             # 타이머 훅
│   │   └── useChallenge.js         # 도전 상태 관리
│   ├── utils/
│   │   └── distance.js             # 거리 계산
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
└── package.json
```

---

## 🎨 화면 구성

### 1. 메인 화면
- 노선 선택 버튼 (1~9호선, 경의선 등)
- 진행률 표시
- 방문 목록 버튼

### 2. 도전 화면
- 돌림판 (10개 역)
- 타이머 (3시간 카운트다운)
- "인증하기" 버튼
- 현재 위치 거리 표시

### 3. 방문 목록 화면
- 방문한 역 목록
- 인증 성공/실패 표시
- 개별 삭제 버튼

---

## 🔌 API 서비스 (services/api.js)

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// 역 정보
export const getStationsByLine = (lineName) =>
  api.get(`/stations/line/${lineName}`);

export const getLines = () =>
  api.get('/stations/lines');

// 도전
export const startChallenge = (data) =>
  api.post('/challenges', data);

export const getChallenge = (id) =>
  api.get(`/challenges/${id}`);

// 방문
export const createVisit = (data) =>
  api.post('/visits', data);

export const verifyVisit = (data) =>
  api.post('/visits/verify', data);

export const getVisits = () =>
  api.get('/visits');

// 통계
export const getProgress = (lineName) =>
  api.get(`/stats/progress/${lineName}`);

export default api;
```

---

## 🎯 주요 컴포넌트

### 1. LineSelector.jsx
```javascript
import { useState, useEffect } from 'react';
import { getLines } from '../services/api';

export default function LineSelector({ onSelect }) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    getLines().then(res => setLines(res.data));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {lines.map(line => (
        <button
          key={line}
          onClick={() => onSelect(line)}
          className="bg-blue-500 text-white p-4 rounded"
        >
          {line}
        </button>
      ))}
    </div>
  );
}
```

### 2. RouletteWheel.jsx
```javascript
import { useState } from 'react';

export default function RouletteWheel({ stations, onSelect }) {
  const [spinning, setSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const spin = () => {
    setSpinning(true);
    const finalIndex = Math.floor(Math.random() * stations.length);

    // 애니메이션
    setTimeout(() => {
      setSelectedIndex(finalIndex);
      setSpinning(false);
      onSelect(stations[finalIndex]);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`w-80 h-80 rounded-full border-4 border-blue-500 relative ${spinning ? 'animate-spin' : ''}`}>
        {stations.map((station, i) => {
          const angle = (360 / stations.length) * i;
          return (
            <div
              key={station.id}
              className={`absolute top-1/2 left-1/2 ${i === selectedIndex ? 'font-bold text-red-500' : ''}`}
              style={{
                transform: `rotate(${angle}deg) translateY(-120px)`
              }}
            >
              {station.station_nm}
            </div>
          );
        })}
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="mt-4 bg-blue-500 text-white px-8 py-3 rounded disabled:bg-gray-400"
      >
        {spinning ? '돌리는 중...' : '돌림판 돌리기'}
      </button>
    </div>
  );
}
```

### 3. Timer.jsx (hooks/useTimer.js)
```javascript
import { useState, useEffect, useRef } from 'react';

export function useTimer(startTime, duration = 3 * 60 * 60 * 1000) {
  const [remaining, setRemaining] = useState(duration);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef();

  useEffect(() => {
    if (!startTime) return;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - new Date(startTime).getTime();
      const left = duration - elapsed;

      if (left <= 0) {
        setRemaining(0);
        setIsExpired(true);
        clearInterval(intervalRef.current);
      } else {
        setRemaining(left);
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [startTime, duration]);

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return { hours, minutes, seconds, isExpired };
}

// Component
export default function Timer({ startTime }) {
  const { hours, minutes, seconds, isExpired } = useTimer(startTime);

  return (
    <div className={`text-4xl font-bold ${isExpired ? 'text-red-500' : 'text-blue-500'}`}>
      {String(hours).padStart(2, '0')}:
      {String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </div>
  );
}
```

### 4. LocationVerify.jsx (hooks/useGeolocation.js)
```javascript
import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('GPS를 지원하지 않는 브라우저입니다.');
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos.coords.accuracy <= 50) {
          setPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { position, error, loading };
}

// Component
import { verifyVisit } from '../services/api';
import { calculateDistance } from '../utils/distance';

export default function LocationVerify({ visit, station }) {
  const { position, error, loading } = useGeolocation();
  const [verifying, setVerifying] = useState(false);

  const distance = position
    ? calculateDistance(
        position.latitude,
        position.longitude,
        station.latitude,
        station.longitude
      )
    : null;

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await verifyVisit({
        visitId: visit.id,
        latitude: position.latitude,
        longitude: position.longitude
      });
      alert(result.data.verified ? '인증 성공!' : '인증 실패');
    } catch (err) {
      alert('인증 오류: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <div>GPS 위치 확인 중...</div>;
  if (error) return <div className="text-red-500">GPS 오류: {error}</div>;

  return (
    <div className="space-y-4">
      <div>
        <p>현재 위치에서 역까지 거리: <strong>{distance?.toFixed(0)}m</strong></p>
        <p>GPS 정확도: {position.accuracy.toFixed(0)}m</p>
      </div>

      <button
        onClick={handleVerify}
        disabled={verifying || distance > 100}
        className="w-full bg-green-500 text-white py-3 rounded disabled:bg-gray-400"
      >
        {distance > 100 ? '너무 멀어요 (100m 이내 필요)' : '인증하기'}
      </button>
    </div>
  );
}
```

### 5. VisitList.jsx
```javascript
import { useState, useEffect } from 'react';
import { getVisits } from '../services/api';

export default function VisitList() {
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    getVisits().then(res => setVisits(res.data));
  }, []);

  return (
    <div className="space-y-2">
      {visits.map(visit => (
        <div
          key={visit.id}
          className={`p-4 rounded border ${visit.verified ? 'border-green-500' : 'border-red-500'}`}
        >
          <h3 className="font-bold">{visit.station_nm}</h3>
          <p className="text-sm text-gray-600">
            {visit.verified ? '✅ 인증 성공' : '❌ 인증 실패'}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(visit.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 TailwindCSS 설정

### tailwind.config.js
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        success: '#10B981',
        danger: '#EF4444'
      }
    }
  },
  plugins: []
};
```

---

## 📱 반응형 디자인

```javascript
// 모바일 우선
<div className="container mx-auto max-w-screen-sm px-4">
  {/* 콘텐츠 */}
</div>

// 버튼 터치 영역
<button className="min-h-[44px] min-w-[44px] touch-manipulation">
  버튼
</button>
```

---

## 🧪 개발 순서

1. **프로젝트 초기화**
   - Vite + React 생성
   - TailwindCSS 설정

2. **API 서비스 작성**
   - services/api.js

3. **노선 선택 화면**
   - LineSelector 컴포넌트

4. **돌림판 구현**
   - RouletteWheel 컴포넌트
   - 애니메이션

5. **타이머 구현**
   - useTimer 훅
   - Timer 컴포넌트

6. **GPS 인증**
   - useGeolocation 훅
   - LocationVerify 컴포넌트

7. **방문 목록**
   - VisitList 컴포넌트

8. **반응형 & 최적화**

---

## 🚀 배포 (Vercel)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod

# 환경변수 설정
vercel env add VITE_API_URL
```

---

**예상 개발 시간**: 6-8시간
