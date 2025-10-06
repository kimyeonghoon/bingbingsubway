# Android 빌드 가이드

## ⚠️ jlink 오류 해결

현재 시스템에 `jlink`가 없어서 Gradle 빌드가 실패할 수 있습니다.

### 해결 방법 1: OpenJDK 21 JDK 설치 (권장)

```bash
sudo apt-get update
sudo apt-get install -y openjdk-21-jdk
```

### 해결 방법 2: Android Studio에서 빌드

1. Android Studio 실행
2. `File → Open` → `android` 폴더 선택
3. `Build → Make Project` 또는 `Run → Run 'app'`

Android Studio는 자체 JDK를 사용하므로 jlink 문제가 발생하지 않습니다.

### 해결 방법 3: 에뮬레이터/실기기에서 직접 실행

```bash
# ADB 연결 확인
adb devices

# 에뮬레이터 실행 후
cd /home/ioniere/projects/bingbingsubway/android
./gradlew installDebug
```

---

## 📱 개발 환경 설정

### 1. 프론트엔드 개발 서버 실행

```bash
cd ../frontend
npm run dev
# http://localhost:5173 에서 실행됨
```

### 2. MainActivity.kt에서 URL 확인

에뮬레이터용:
```kotlin
private val webUrl = "http://10.0.2.2:5173"  // 현재 설정
```

실제 기기용 (같은 Wi-Fi):
```kotlin
private val webUrl = "http://192.168.x.x:5173"  // PC IP로 변경
```

### 3. 앱 실행

Android Studio에서:
- `Run → Run 'app'` (Shift+F10)
- 에뮬레이터 또는 실기기 선택

명령줄에서:
```bash
./gradlew installDebug
adb shell am start -n com.bingbing.subway/.MainActivity
```

---

## 🔍 디버깅

### WebView 콘솔 로그

```bash
adb logcat | grep "WebView"
```

### Chrome DevTools

1. Chrome에서 `chrome://inspect` 접속
2. 연결된 기기에서 WebView 선택
3. JavaScript 디버깅

---

## 📦 APK 빌드

```bash
# Debug APK
./gradlew assembleDebug
# 출력: app/build/outputs/apk/debug/app-debug.apk

# Release APK (서명 필요)
./gradlew assembleRelease
```

---

## ⚡ 빠른 시작

```bash
# 1. JDK 설치 (jlink 오류 해결)
sudo apt-get install -y openjdk-21-jdk

# 2. 프론트엔드 서버 실행
cd ../frontend && npm run dev &

# 3. Android 빌드 및 설치
cd ../android
./gradlew installDebug

# 4. 앱 실행
adb shell am start -n com.bingbing.subway/.MainActivity
```
