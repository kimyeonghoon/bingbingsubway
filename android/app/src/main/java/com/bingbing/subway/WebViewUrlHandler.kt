package com.bingbing.subway

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast

/**
 * WebView URL 처리를 담당하는 클래스
 *
 * HTTP/HTTPS는 WebView에서 로드하고,
 * 카카오맵 등 외부 스킴은 외부 앱으로 처리합니다.
 */
class WebViewUrlHandler(private val context: Context) {

    /**
     * URL 로딩을 가로채서 처리할지 결정
     *
     * @return true - WebView에서 로드하지 않음 (외부 처리)
     *         false - WebView에서 로드
     */
    fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url?.toString() ?: return false

        return when {
            // HTTP/HTTPS는 WebView에서 처리
            url.startsWith("http://") || url.startsWith("https://") -> false

            // 카카오맵 스킴 처리
            url.startsWith("kakaomap://") -> {
                handleKakaoMapScheme(url)
                true
            }

            // 기타 외부 스킴 처리 (tel:, mailto:, sms: 등)
            else -> {
                handleExternalScheme(url)
                true
            }
        }
    }

    /**
     * 카카오맵 스킴 처리
     */
    private fun handleKakaoMapScheme(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            // 카카오맵 앱이 설치되어 있는지 확인 (Android 11+ 호환)
            val canHandle = try {
                val activities = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    context.packageManager.queryIntentActivities(
                        intent,
                        PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY.toLong())
                    )
                } else {
                    @Suppress("DEPRECATION")
                    context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
                }
                activities.isNotEmpty()
            } catch (e: Exception) {
                false
            }

            if (canHandle) {
                context.startActivity(intent)
            } else {
                // 카카오맵이 설치되지 않았으면 Play Store로 이동
                openPlayStore()
            }
        } catch (e: ActivityNotFoundException) {
            openPlayStore()
        } catch (e: Exception) {
            Toast.makeText(context, "카카오맵을 실행할 수 없습니다", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Play Store 열기
     */
    private fun openPlayStore() {
        try {
            val intent = Intent(
                Intent.ACTION_VIEW,
                Uri.parse("market://details?id=net.daum.android.map")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            val intent = Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://play.google.com/store/apps/details?id=net.daum.android.map")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }

    /**
     * 기타 외부 스킴 처리
     */
    private fun handleExternalScheme(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(context, "해당 기능을 실행할 수 있는 앱이 없습니다", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(context, "링크를 실행할 수 없습니다", Toast.LENGTH_SHORT).show()
        }
    }
}
