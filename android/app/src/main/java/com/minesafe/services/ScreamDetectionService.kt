package com.minesafe.services

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.core.app.NotificationCompat
import android.util.Log

class ScreamDetectionService : Service() {
    
    private lateinit var screamDetector: ScreamDetector
    
    companion object {
        private const val TAG = "ScreamDetectionService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "scream_detection_channel"
        const val ACTION_START = "com.minesafe.START_SCREAM_DETECTION"
        const val ACTION_STOP = "com.minesafe.STOP_SCREAM_DETECTION"
    }
    
    override fun onCreate() {
        super.onCreate()
        
        Log.d(TAG, "🔧 Service created")
        
        screamDetector = ScreamDetector(this)
        screamDetector.initialize()
        
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                Log.d(TAG, "▶️ START action received")
                screamDetector.startDetection {
                    handleScreamDetected()
                }
            }
            ACTION_STOP -> {
                Log.d(TAG, "🛑 STOP action received")
                stopSelf()
            }
        }
        
        return START_STICKY
    }
    
    private fun handleScreamDetected() {
        Log.w(TAG, "🚨 SCREAM DETECTED - Broadcasting to React Native")
        
        // Send broadcast to React Native
        val intent = Intent("com.minesafe.SCREAM_DETECTED")
        sendBroadcast(intent)
        
        // Update notification
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, createAlertNotification())
        
        // Reset to normal notification after 3 seconds
        android.os.Handler(mainLooper).postDelayed({
            if (screamDetector.isRunning()) {
                manager.notify(NOTIFICATION_ID, createNotification())
            }
        }, 3000)
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Scream Detection",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors for distress sounds"
            }
            
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): android.app.Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MineSafe - Scream Detection")
            .setContentText("🎤 Monitoring for distress sounds...")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
    
    private fun createAlertNotification(): android.app.Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("⚠️ Distress Sound Detected!")
            .setContentText("Emergency alert triggered")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
    }
    
    override fun onDestroy() {
        Log.d(TAG, "🗑️ Service destroyed")
        screamDetector.release()
        super.onDestroy()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}
