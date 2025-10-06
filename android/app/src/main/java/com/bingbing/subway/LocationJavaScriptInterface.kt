package com.bingbing.subway

import android.webkit.JavascriptInterface

class LocationJavaScriptInterface(private val locationManager: LocationManager) {

    /**
     * JavaScript에서 호출 가능한 메서드
     *
     * 사용 예시 (JavaScript):
     * ```javascript
     * if (window.AndroidLocation) {
     *   const location = JSON.parse(window.AndroidLocation.getCurrentLocation());
     *   console.log(location.latitude, location.longitude);
     * }
     * ```
     */
    @JavascriptInterface
    fun getCurrentLocation(): String {
        return locationManager.getLocationAsJson()
    }

    /**
     * 위치 서비스 사용 가능 여부 확인
     */
    @JavascriptInterface
    fun isLocationAvailable(): Boolean {
        val json = locationManager.getLocationAsJson()
        return !json.contains("error")
    }

    /**
     * 앱 버전 정보
     */
    @JavascriptInterface
    fun getAppVersion(): String {
        return "1.0.0"
    }

    /**
     * 플랫폼 식별
     */
    @JavascriptInterface
    fun getPlatform(): String {
        return "Android"
    }
}
