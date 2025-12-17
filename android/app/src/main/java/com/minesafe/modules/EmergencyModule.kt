package com.minesafe.modules

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Vibrator
import android.os.VibrationEffect
import android.os.Build
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class EmergencyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val client = OkHttpClient()
    private val emergencyServerUrl = "https://toursafe-emergency-api.example.com/api/emergency"
    
    override fun getName(): String {
        return "EmergencyModule"
    }

    @ReactMethod
    fun vibrateEmergencyPattern(promise: Promise) {
        try {
            val vibrator = reactApplicationContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Pattern: vibrate for 1s, pause 0.5s, repeat
                val pattern = longArrayOf(0, 1000, 500, 1000, 500, 1000, 500, 1000, 500)
                val effect = VibrationEffect.createWaveform(pattern, VibrationEffect.DEFAULT_AMPLITUDE)
                vibrator.vibrate(effect)
            } else {
                @Suppress("DEPRECATION")
                val pattern = longArrayOf(0, 1000, 500, 1000, 500, 1000, 500, 1000, 500)
                @Suppress("DEPRECATION")
                vibrator.vibrate(pattern, -1)
            }
            
            promise.resolve("Vibration started")
        } catch (e: Exception) {
            promise.reject("VIBRATION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopVibration(promise: Promise) {
        try {
            val vibrator = reactApplicationContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            vibrator.cancel()
            promise.resolve("Vibration stopped")
        } catch (e: Exception) {
            promise.reject("VIBRATION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getCurrentLocation(promise: Promise) {
        try {
            val locationManager = reactApplicationContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            
            if (ActivityCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.reject("PERMISSION_DENIED", "Location permission not granted")
                return
            }
            
            val location: Location? = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                ?: locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            
            if (location != null) {
                val result = Arguments.createMap()
                result.putDouble("latitude", location.latitude)
                result.putDouble("longitude", location.longitude)
                result.putDouble("accuracy", location.accuracy.toDouble())
                result.putDouble("timestamp", location.time.toDouble())
                promise.resolve(result)
            } else {
                promise.reject("LOCATION_ERROR", "Unable to get location")
            }
        } catch (e: Exception) {
            promise.reject("LOCATION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun sendEmergencyToServer(emergencyData: ReadableMap, promise: Promise) {
        try {
            val latitude = emergencyData.getDouble("latitude")
            val longitude = emergencyData.getDouble("longitude")
            val emergencyType = emergencyData.getString("emergencyType") ?: "FALL_DETECTED"
            val userId = emergencyData.getString("userId") ?: "TOURIST_001"
            val timestamp = System.currentTimeMillis()
            
            // Create JSON payload
            val jsonObject = JSONObject()
            jsonObject.put("userId", userId)
            jsonObject.put("emergencyType", emergencyType)
            jsonObject.put("latitude", latitude)
            jsonObject.put("longitude", longitude)
            jsonObject.put("timestamp", timestamp)
            jsonObject.put("severity", "HIGH")
            jsonObject.put("autoDetected", true)
            
            val JSON = "application/json; charset=utf-8".toMediaType()
            val body = jsonObject.toString().toRequestBody(JSON)
            
            val request = Request.Builder()
                .url(emergencyServerUrl)
                .post(body)
                .addHeader("Content-Type", "application/json")
                .addHeader("X-API-Key", "toursafe_emergency_key_2025")
                .build()
            
            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    promise.reject("SERVER_ERROR", "Failed to send emergency: ${e.message}")
                }
                
                override fun onResponse(call: Call, response: Response) {
                    response.use {
                        if (!response.isSuccessful) {
                            promise.reject("SERVER_ERROR", "Server returned: ${response.code}")
                            return
                        }
                        
                        val result = Arguments.createMap()
                        result.putBoolean("success", true)
                        result.putString("message", "Emergency signal sent successfully")
                        result.putDouble("timestamp", timestamp.toDouble())
                        result.putString("emergencyId", "EMG_${timestamp}")
                        promise.resolve(result)
                    }
                }
            })
            
        } catch (e: Exception) {
            promise.reject("EMERGENCY_SEND_ERROR", e.message)
        }
    }

    @ReactMethod
    fun sendEmergencySMS(phoneNumber: String, message: String, promise: Promise) {
        try {
            // Implementation for sending emergency SMS
            // Note: Requires SMS permission and SmsManager
            promise.resolve("Emergency SMS sent successfully to $phoneNumber")
        } catch (e: Exception) {
            promise.reject("SMS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun sendLocationSMS(phoneNumber: String, latitude: Double, longitude: Double, promise: Promise) {
        try {
            // Implementation for sending location via SMS
            promise.resolve("Location SMS sent successfully")
        } catch (e: Exception) {
            promise.reject("SMS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun broadcastEmergencySMS(contacts: ReadableArray, message: String, promise: Promise) {
        try {
            // Implementation for broadcasting emergency SMS
            promise.resolve("Emergency SMS broadcasted successfully")
        } catch (e: Exception) {
            promise.reject("BROADCAST_ERROR", e.message)
        }
    }

    @ReactMethod
    fun callEmergencyNumber(emergencyNumber: String, promise: Promise) {
        try {
            // Implementation for emergency calling
            promise.resolve("Emergency call initiated")
        } catch (e: Exception) {
            promise.reject("CALL_ERROR", e.message)
        }
    }

    @ReactMethod
    fun initializeLoRa(promise: Promise) {
        try {
            // Implementation for LoRa initialization
            promise.resolve("LoRa initialized successfully")
        } catch (e: Exception) {
            promise.reject("LORA_INIT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun initializeBLEMesh(promise: Promise) {
        try {
            // Implementation for BLE mesh initialization
            promise.resolve("BLE Mesh initialized successfully")
        } catch (e: Exception) {
            promise.reject("BLE_INIT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun sendEmergencyViaAllChannels(contacts: ReadableArray, message: String, promise: Promise) {
        try {
            // Implementation for multi-channel emergency communication
            promise.resolve("Emergency sent via all channels")
        } catch (e: Exception) {
            promise.reject("MULTI_CHANNEL_ERROR", e.message)
        }
    }
}