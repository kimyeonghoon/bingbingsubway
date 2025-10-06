# 빙빙 지하철 - Android WebView App

수도권 지하철역 룰렛 챌린지 게임의 Android 네이티브 앱

---

## 📱 기능

### WebView 기반
- React 웹앱을 Android WebView로 래핑
- 네이티브 GPS 위치 서비스 통합
- JavaScript Interface로 웹-앱 통신

### 네이티브 기능
- **위치 권한 관리**: GPS 위치 인증
- **오프라인 감지**: 네트워크 오류 처리
- **Pull-to-Refresh**: 새로고침 제스처
- **뒤로가기 처리**: WebView 히스토리 관리
    
---

## 🛠 기술 스택

- **언어**: Kotlin
- **최소 SDK**: 24 (Android 7.0)
- **타겟 SDK**: 34 (Android 14)
- **주요 라이브러리**:
  - AndroidX Core, AppCompat
  - Material Design Components
  - WebKit (WebView)
  - Google Play Services Location
  - SwipeRefreshLayout

---

## 📂 프로젝트 구조

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/bingbing/subway/
│   │   │   ├── MainActivity.kt                  # 메인 액티비티
│   │   │   ├── LocationManager.kt               # GPS 위치 관리
│   │   │   └── LocationJavaScriptInterface.kt   # JS ↔ Native 브릿지
│   │   ├── res/
│   │   │   ├── layout/activity_main.xml         # 레이아웃
│   │   │   ├── values/strings.xml               # 문자열 리소스
│   │   │   ├── values/themes.xml                # 테마
│   │   │   ├── values/colors.xml                # 색상
│   │   │   ├── drawable/splash_background.xml   # 스플래시 화면
│   │   │   └── xml/                             # 백업 규칙
│   │   └── AndroidManifest.xml                  # 앱 매니페스트
│   ├── build.gradle.kts                         # 앱 빌드 설정
│   └── proguard-rules.pro                       # ProGuard 규칙
├── build.gradle.kts                             # 프로젝트 빌드 설정
├── settings.gradle.kts                          # 프로젝트 설정
└── gradle.properties                            # Gradle 속성
```

---

## 🚀 빌드 및 실행

### 1. 개발 환경 요구사항

- **Android Studio**: Hedgehog (2023.1.1) 이상
- **JDK**: 17 이상
- **Gradle**: 8.2 (자동 다운로드)
- **Android SDK**: API 34

### 2. 프로젝트 열기

```bash
# Android Studio에서 프로젝트 열기
File → Open → android 폴더 선택
```

### 3. 개발 서버 설정

**로컬 개발 시** (에뮬레이터):
```kotlin
// MainActivity.kt
private val webUrl = "http://10.0.2.2:5173"  // 에뮬레이터 → localhost
```

**실제 기기** (같은 Wi-Fi):
```kotlin
private val webUrl = "http://192.168.x.x:5173"  // PC IP 주소
```

**프로덕션**:
```kotlin
private val webUrl = "https://your-production-url.com"
```

### 4. 빌드 및 실행

```bash
# Gradle 빌드
./gradlew assembleDebug

# 디바이스/에뮬레이터에 설치
./gradlew installDebug

# 또는 Android Studio에서
Run → Run 'app' (Shift+F10)
```

### 5. APK 생성

**Debug APK**:
```bash
./gradlew assembleDebug
# 출력: app/build/outputs/apk/debug/app-debug.apk
```

**Release APK** (서명 필요):
```bash
./gradlew assembleRelease
# 출력: app/build/outputs/apk/release/app-release.apk
```

---

## 🔐 앱 서명 (Release 빌드)

### 1. Keystore 생성

```bash
keytool -genkey -v -keystore bingbing-subway.keystore \
  -alias bingbing -keyalg RSA -keysize 2048 -validity 10000
```

### 2. keystore.properties 생성

```properties
# android/keystore.properties (Git에 커밋하지 말것!)
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=bingbing
storeFile=../bingbing-subway.keystore
```

### 3. build.gradle.kts 수정

```kotlin
// app/build.gradle.kts에 추가
android {
    signingConfigs {
        create("release") {
            val keystorePropertiesFile = rootProject.file("keystore.properties")
            if (keystorePropertiesFile.exists()) {
                val keystoreProperties = Properties()
                keystoreProperties.load(FileInputStream(keystorePropertiesFile))

                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

---

## 🌐 JavaScript Interface 사용법

Android 앱에서 네이티브 GPS 위치를 JavaScript로 전달합니다.

### JavaScript에서 위치 가져오기

```javascript
// React 컴포넌트에서
function getCurrentPosition() {
  // Android WebView 확인
  if (window.AndroidLocation) {
    const locationJson = window.AndroidLocation.getCurrentLocation();
    const location = JSON.parse(locationJson);

    if (location.error) {
      console.error('위치를 가져올 수 없습니다');
    } else {
      console.log('위도:', location.latitude);
      console.log('경도:', location.longitude);
      console.log('정확도:', location.accuracy);
    }
  } else {
    // 브라우저 Geolocation API 폴백
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(position.coords);
      },
      (error) => {
        console.error(error);
      }
    );
  }
}

// 플랫폼 확인
if (window.AndroidLocation) {
  const platform = window.AndroidLocation.getPlatform(); // "Android"
  const version = window.AndroidLocation.getAppVersion(); // "1.0.0"
}
```

### 사용 가능한 메서드

- `getCurrentLocation()`: GPS 위치 JSON 반환
- `isLocationAvailable()`: 위치 서비스 사용 가능 여부
- `getAppVersion()`: 앱 버전
- `getPlatform()`: "Android" 반환

---

## 🔒 권한

### AndroidManifest.xml

```xml
<!-- 필수 권한 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### 런타임 권한 요청

앱 시작 시 자동으로 위치 권한을 요청합니다.
- 사용자가 거부하면 설정으로 안내하는 메시지 표시
- 권한 설명 다이얼로그 제공

---

## 🎨 UI/UX

### 색상 테마
- **Primary**: `#3B82F6` (파란색)
- **Primary Dark**: `#2563EB`
- **Accent**: `#10B981` (녹색)

### 기능
- **스플래시 화면**: 앱 아이콘 + Primary 색상 배경
- **상태바 색상**: Primary 색상
- **Pull-to-Refresh**: Primary & Accent 색상
- **세로 모드 고정**: `screenOrientation="portrait"`

---

## 🐛 디버깅

### WebView 콘솔 로그 확인

```bash
# Logcat 필터
adb logcat | grep "WebView"
```

### Chrome DevTools

1. Chrome에서 `chrome://inspect` 접속
2. 연결된 디바이스에서 WebView 선택
3. 개발자 도구로 디버깅

---

## 📦 배포 (Google Play Store)

### 1. AAB (Android App Bundle) 생성

```bash
./gradlew bundleRelease
# 출력: app/build/outputs/bundle/release/app-release.aab
```

### 2. Google Play Console 업로드

1. Play Console에서 앱 생성
2. AAB 파일 업로드
3. 스토어 등록 정보 작성:
   - 앱 이름: 빙빙 지하철
   - 카테고리: 여행 및 지역정보
   - 스크린샷 및 아이콘 업로드

### 3. 앱 정보

- **패키지명**: `com.bingbing.subway`
- **버전 코드**: 1
- **버전 이름**: 1.0.0
- **최소 SDK**: 24 (Android 7.0, 약 95% 기기 지원)

---

## 🔧 트러블슈팅

### 문제: WebView가 로컬 서버에 연결 안 됨

**해결**:
```xml
<!-- AndroidManifest.xml -->
<application android:usesCleartextTraffic="true">
```

### 문제: GPS 위치가 null

**해결**:
- 위치 권한 허용 확인
- GPS 활성화 확인
- 에뮬레이터: Extended Controls → Location에서 위치 설정

### 문제: Gradle 빌드 실패

**해결**:
```bash
# Gradle 캐시 정리
./gradlew clean
./gradlew build --refresh-dependencies
```

---

## 📝 TODO

- [ ] 앱 아이콘 디자인 (현재 기본 아이콘 사용)
- [ ] 스플래시 화면 커스터마이징
- [ ] ProGuard 규칙 최적화
- [ ] 백그라운드 위치 추적 (필요 시)
- [ ] 푸시 알림 (FCM)
- [ ] 앱 업데이트 체크

---

## 📄 라이선스

MIT

---

**개발 환경**: Android Studio Hedgehog, Kotlin, Gradle 8.2
**상태**: 개발 완료, 테스트 준비
**다음 작업**: 앱 아이콘 디자인, 실기기 테스트
