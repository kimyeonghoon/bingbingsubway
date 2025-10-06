package com.bingbing.subway

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebView
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.junit.MockitoJUnitRunner
import org.mockito.kotlin.whenever

/**
 * WebView URL 처리 테스트
 *
 * 테스트 시나리오:
 * 1. 일반 HTTP/HTTPS URL은 WebView에서 직접 로드
 * 2. 카카오맵 스킴(kakaomap://)은 외부 앱으로 실행
 * 3. 카카오맵 앱이 없으면 스토어로 이동
 * 4. tel:, sms: 등 다른 스킴도 외부 앱으로 처리
 */
@RunWith(MockitoJUnitRunner::class)
class WebViewUrlHandlerTest {

    @Mock
    private lateinit var context: Context

    @Mock
    private lateinit var packageManager: PackageManager

    @Mock
    private lateinit var webView: WebView

    @Mock
    private lateinit var request: WebResourceRequest

    private lateinit var urlHandler: WebViewUrlHandler

    @Before
    fun setup() {
        whenever(context.packageManager).thenReturn(packageManager)
        urlHandler = WebViewUrlHandler(context)
    }

    @Test
    fun `HTTP URL은 WebView에서 로드되어야 함`() {
        // Given
        val url = "http://example.com"
        whenever(request.url).thenReturn(Uri.parse(url))

        // When
        val result = urlHandler.shouldOverrideUrlLoading(webView, request)

        // Then
        assert(!result) // false를 반환하면 WebView에서 로드
    }

    @Test
    fun `HTTPS URL은 WebView에서 로드되어야 함`() {
        // Given
        val url = "https://example.com"
        whenever(request.url).thenReturn(Uri.parse(url))

        // When
        val result = urlHandler.shouldOverrideUrlLoading(webView, request)

        // Then
        assert(!result)
    }

    @Test
    fun `카카오맵 스킴은 외부 앱으로 실행되어야 함`() {
        // Given
        val url = "kakaomap://look?p=37.5665,126.9780"
        whenever(request.url).thenReturn(Uri.parse(url))

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        whenever(packageManager.resolveActivity(any(), anyInt())).thenReturn(mock())

        // When
        val result = urlHandler.shouldOverrideUrlLoading(webView, request)

        // Then
        assert(result) // true를 반환하면 WebView에서 로드하지 않음
        verify(context).startActivity(any())
    }

    @Test
    fun `카카오맵 앱이 없으면 스토어로 이동해야 함`() {
        // Given
        val url = "kakaomap://look?p=37.5665,126.9780"
        whenever(request.url).thenReturn(Uri.parse(url))
        whenever(packageManager.resolveActivity(any(), anyInt())).thenReturn(null)

        // When
        val result = urlHandler.shouldOverrideUrlLoading(webView, request)

        // Then
        assert(result)
        // 스토어 URL로 Intent가 실행되어야 함
        verify(context, times(2)).startActivity(any())
    }

    @Test
    fun `tel 스킴은 외부 앱으로 실행되어야 함`() {
        // Given
        val url = "tel:01012345678"
        whenever(request.url).thenReturn(Uri.parse(url))
        whenever(packageManager.resolveActivity(any(), anyInt())).thenReturn(mock())

        // When
        val result = urlHandler.shouldOverrideUrlLoading(webView, request)

        // Then
        assert(result)
        verify(context).startActivity(any())
    }

    @Test
    fun `mailto 스킴은 외부 앱으로 실행되어야 함`() {
        // Given
        val url = "mailto:test@example.com"
        whenever(request.url).thenReturn(Uri.parse(url))
        whenever(packageManager.resolveActivity(any(), anyInt())).thenReturn(mock())

        // When
        val result = urlHandler.shouldOverrideUrlLoading(webView, request)

        // Then
        assert(result)
        verify(context).startActivity(any())
    }
}
