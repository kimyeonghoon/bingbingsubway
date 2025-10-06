package com.bingbing.subway

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.os.Looper
import androidx.core.content.ContextCompat
import com.google.android.gms.location.*
import org.json.JSONObject

class LocationManager(private val context: Context) {

    private var fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    private var locationCallback: LocationCallback? = null
    private var currentLocation: Location? = null
    private var locationUpdateListener: ((Location) -> Unit)? = null

    private val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY,
        10000L // 10초마다 업데이트
    ).apply {
        setMinUpdateIntervalMillis(5000L) // 최소 5초
        setMaxUpdateDelayMillis(15000L)
    }.build()

    fun startLocationUpdates() {
        if (!hasLocationPermission()) {
            return
        }

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    currentLocation = location
                    locationUpdateListener?.invoke(location)
                }
            }
        }

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback!!,
                Looper.getMainLooper()
            )
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    fun stopLocationUpdates() {
        locationCallback?.let {
            fusedLocationClient.removeLocationUpdates(it)
        }
    }

    fun getCurrentLocation(callback: (Location?) -> Unit) {
        if (!hasLocationPermission()) {
            callback(null)
            return
        }

        // 캐시된 위치가 있으면 먼저 반환
        if (currentLocation != null) {
            callback(currentLocation)
        }

        // 최신 위치 요청
        try {
            fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                if (location != null) {
                    currentLocation = location
                    callback(location)
                } else {
                    callback(currentLocation)
                }
            }.addOnFailureListener {
                callback(currentLocation)
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
            callback(null)
        }
    }

    fun getLocationAsJson(): String {
        return currentLocation?.let {
            JSONObject().apply {
                put("latitude", it.latitude)
                put("longitude", it.longitude)
                put("accuracy", it.accuracy)
                put("timestamp", it.time)
            }.toString()
        } ?: JSONObject().apply {
            put("error", "Location not available")
        }.toString()
    }

    fun setLocationUpdateListener(listener: (Location) -> Unit) {
        locationUpdateListener = listener
    }

    fun cleanup() {
        stopLocationUpdates()
        locationCallback = null
        locationUpdateListener = null
    }

    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
}
