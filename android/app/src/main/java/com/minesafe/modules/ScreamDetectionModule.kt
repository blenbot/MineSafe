package com.minesafe.modules

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.minesafe.services.ScreamDetectionService

class ScreamDetectionModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "ScreamDetectionModule"
    }

    private var isServiceRunning = false
    
    private val screamReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == "com.minesafe.SCREAM_DETECTED") {
                Log.d(TAG, "📡 Scream detected broadcast received")
                sendScreamDetectionEvent()
            }
        }
    }

    init {
        // Register broadcast receiver
        val filter = IntentFilter("com.minesafe.SCREAM_DETECTED")
        reactApplicationContext.registerReceiver(screamReceiver, filter)
        Log.d(TAG, "📡 Broadcast receiver registered")
    }

    override fun getName(): String = "ScreamDetectionModule"

    @ReactMethod
    fun startScreamDetection(promise: Promise) {
        try {
            Log.d(TAG, "▶️ Starting scream detection service...")
            
            if (isServiceRunning) {
                promise.resolve("Scream detection already running")
                return
            }
            
            val intent = Intent(reactApplicationContext, ScreamDetectionService::class.java)
            intent.action = ScreamDetectionService.ACTION_START
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            
            isServiceRunning = true
            
            Log.d(TAG, "✅ Scream detection service started")
            promise.resolve("Scream detection started successfully")
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to start service", e)
            promise.reject("START_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopScreamDetection(promise: Promise) {
        try {
            Log.d(TAG, "🛑 Stopping scream detection service...")
            
            if (!isServiceRunning) {
                promise.reject("NOT_RUNNING", "Scream detection is not running")
                return
            }
            
            val intent = Intent(reactApplicationContext, ScreamDetectionService::class.java)
            reactApplicationContext.stopService(intent)
            
            isServiceRunning = false
            
            Log.d(TAG, "✅ Scream detection service stopped")
            
            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putString("message", "Scream detection stopped successfully")
            promise.resolve(result)
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to stop service", e)
            isServiceRunning = false
            promise.reject("STOP_ERROR", "Failed to stop: ${e.message}", e)
        }
    }

    private fun sendScreamDetectionEvent() {
        val params = Arguments.createMap()
        params.putDouble("timestamp", System.currentTimeMillis().toDouble())
        params.putBoolean("screamDetected", true)
        params.putString("type", "scream")
        
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onScreamDetected", params)
            
        Log.d(TAG, "📡 Scream detection event sent to React Native")
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            reactApplicationContext.unregisterReceiver(screamReceiver)
            Log.d(TAG, "📡 Broadcast receiver unregistered")
        } catch (e: Exception) {
            Log.e(TAG, "Error unregistering receiver", e)
        }
    }
}
