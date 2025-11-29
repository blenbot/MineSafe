package com.minesafe.native

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import com.minesafe.mesh.EmergencyPayload
import com.minesafe.services.MineSafeMeshService

object BLEMeshBridge {
    private const val TAG = "BLEMeshBridge"
    private var isInitialized = false

    // Keep references so we can unregister later
    private var gatewayReceiver: BroadcastReceiver? = null
    private var isReceiverRegistered: Boolean = false

    fun start(
        context: Context,
        minerId: String,
        onDataReadyForServer: (payloadJson: String) -> Unit
    ) {
        if (isInitialized) {
            Log.w(TAG, "Bridge is already initialized.")
            return
        }

        // Create receiver once and hold reference
        gatewayReceiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context?, intent: Intent?) {
                if (intent?.action == MineSafeMeshService.ACTION_GATEWAY_DATA_READY) {
                    intent.getStringExtra(MineSafeMeshService.EXTRA_PAYLOAD_JSON)?.let {
                        onDataReadyForServer(it)
                    }
                }
            }
        }

        val filter = IntentFilter(MineSafeMeshService.ACTION_GATEWAY_DATA_READY)

        try {
            // Register receiver with Android 13+ flags
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // Use NOT_EXPORTED for internal-only broadcasts (safer)
                context.applicationContext.registerReceiver(
                    gatewayReceiver,
                    filter,
                    Context.RECEIVER_NOT_EXPORTED
                )
            } else {
                context.applicationContext.registerReceiver(gatewayReceiver, filter)
            }
            isReceiverRegistered = true
            Log.d(TAG, "📡 Broadcast receiver registered")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to register gateway receiver", e)
            // continue — we might still want to start the service even if receiver failed
        }

        // Start the background service (use startForegroundService on O+ if needed)
        val intent = Intent(context.applicationContext, MineSafeMeshService::class.java).apply {
            action = MineSafeMeshService.ACTION_START
            putExtra(MineSafeMeshService.EXTRA_MINER_ID, minerId)
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.applicationContext.startForegroundService(intent)
            } else {
                context.applicationContext.startService(intent)
            }
            isInitialized = true
            Log.i(TAG, "BLE Mesh Bridge started.")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to start MeshService", e)
            // If service failed to start, unregister receiver to keep consistent state
            cleanupReceiver(context)
        }
    }

    fun stop(context: Context) {
        // Stop the service
        val intent = Intent(context.applicationContext, MineSafeMeshService::class.java).apply {
            action = MineSafeMeshService.ACTION_STOP
        }
        try {
            context.applicationContext.startService(intent) // Stop usually uses stopService but using startService for intent-driven service is OK if service handles ACTION_STOP
        } catch (e: Exception) {
            Log.w(TAG, "Warning: failed to send stop intent", e)
        }

        // Unregister the receiver
        cleanupReceiver(context)

        isInitialized = false
        Log.i(TAG, "BLE Mesh Bridge stopped.")
    }

    private fun cleanupReceiver(context: Context) {
        try {
            if (isReceiverRegistered && gatewayReceiver != null) {
                context.applicationContext.unregisterReceiver(gatewayReceiver)
                Log.d(TAG, "📡 Broadcast receiver unregistered")
            }
        } catch (e: IllegalArgumentException) {
            // Already unregistered
            Log.w(TAG, "Receiver already unregistered or never registered", e)
        } catch (e: Exception) {
            Log.e(TAG, "Error while unregistering receiver", e)
        } finally {
            gatewayReceiver = null
            isReceiverRegistered = false
        }
    }

    fun triggerEmergency(
        context: Context,
        minerId: String,
        severity: String,
        issue: String,
        latitude: Double,
        longitude: Double
    ) {
        if (!isInitialized) {
            Log.e(TAG, "Bridge not initialized. Cannot trigger emergency.")
            return
        }
        val payload = EmergencyPayload(
            user_id = minerId,
            severity = severity,
            latitude = latitude,
            longitude = longitude,
            issue = issue,
            incident_time = EmergencyPayload.createTimestamp()
        )
        val intent = Intent(context.applicationContext, MineSafeMeshService::class.java).apply {
            action = MineSafeMeshService.ACTION_TRIGGER_EMERGENCY
            putExtra(MineSafeMeshService.EXTRA_EMERGENCY_PAYLOAD, payload as java.io.Serializable)
        }
        try {
            context.applicationContext.startService(intent)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to send emergency intent", e)
        }
    }
}
