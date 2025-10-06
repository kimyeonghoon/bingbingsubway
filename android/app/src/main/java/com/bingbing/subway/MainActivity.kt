package com.bingbing.subway

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import android.widget.ProgressBar
import com.google.android.gms.location.*

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var locationManager: LocationManager

    // 프로덕션 URL
    private val webUrl = "https://bing2.yeonghoon.kim" // 프로덕션
    // private val webUrl = "http://10.0.2.2:5173" // 개발: 에뮬레이터용

    private val locationPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        when {
            permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true -> {
                locationManager.startLocationUpdates()
            }
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true -> {
                locationManager.startLocationUpdates()
            }
            else -> {
                Toast.makeText(
                    this,
                    getString(R.string.permission_denied),
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        progressBar = findViewById(R.id.progressBar)

        locationManager = LocationManager(this)

        setupWebView()
        setupSwipeRefresh()
        checkLocationPermission()

        webView.loadUrl(webUrl)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

                // 줌 설정
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false

                // 기타 설정
                loadWithOverviewMode = true
                useWideViewPort = true
                javaScriptCanOpenWindowsAutomatically = true
                mediaPlaybackRequiresUserGesture = false
            }

            // JavaScript Interface 추가
            addJavascriptInterface(
                LocationJavaScriptInterface(locationManager),
                "AndroidLocation"
            )

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
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

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    swipeRefreshLayout.isRefreshing = false
                    progressBar.visibility = android.view.View.GONE
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    swipeRefreshLayout.isRefreshing = false
                    progressBar.visibility = android.view.View.GONE

                    Toast.makeText(
                        this@MainActivity,
                        getString(R.string.error_no_internet),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onGeolocationPermissionsShowPrompt(
                    origin: String?,
                    callback: GeolocationPermissions.Callback?
                ) {
                    callback?.invoke(origin, true, false)
                }

                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    consoleMessage?.let {
                        android.util.Log.d(
                            "WebView",
                            "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}"
                        )
                    }
                    return true
                }
            }
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }
        swipeRefreshLayout.setColorSchemeResources(
            R.color.primary,
            R.color.accent
        )
    }

    private fun checkLocationPermission() {
        when {
            hasLocationPermission() -> {
                locationManager.startLocationUpdates()
            }
            shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_FINE_LOCATION) -> {
                showPermissionRationale()
            }
            else -> {
                requestLocationPermission()
            }
        }
    }

    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestLocationPermission() {
        locationPermissionRequest.launch(
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
        )
    }

    private fun showPermissionRationale() {
        AlertDialog.Builder(this)
            .setTitle("위치 권한 필요")
            .setMessage(getString(R.string.permission_location_rationale))
            .setPositiveButton("확인") { _, _ ->
                requestLocationPermission()
            }
            .setNegativeButton("취소", null)
            .show()
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        if (hasLocationPermission()) {
            locationManager.startLocationUpdates()
        }
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
        locationManager.stopLocationUpdates()
    }

    override fun onDestroy() {
        super.onDestroy()
        locationManager.cleanup()
        webView.destroy()
    }

    /**
     * 카카오맵 스킴 처리
     */
    private fun handleKakaoMapScheme(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            // 카카오맵 앱이 설치되어 있는지 확인
            val resolveInfo = packageManager.resolveActivity(intent, 0)

            if (resolveInfo != null) {
                startActivity(intent)
            } else {
                openPlayStore()
            }
        } catch (e: ActivityNotFoundException) {
            openPlayStore()
        } catch (e: Exception) {
            Toast.makeText(this, "카카오맵을 실행할 수 없습니다", Toast.LENGTH_SHORT).show()
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
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            val intent = Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://play.google.com/store/apps/details?id=net.daum.android.map")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
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
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "해당 기능을 실행할 수 있는 앱이 없습니다", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, "링크를 실행할 수 없습니다", Toast.LENGTH_SHORT).show()
        }
    }
}
