package com.minesafe.native

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.util.Log
import com.minesafe.mesh.EmergencyPayload
import com.minesafe.services.MineSafeMeshService

/**
 * A clean bridge for the main application to interact with the BLE mesh service.
 * This is a Singleton object, making it easy to access from anywhere.
 */
object BLEMeshBridge {
    private val TAG = "BLEMeshBridge"
    private var isInitialized = false

    /**
     * Starts the mesh service. Call this after permissions are granted.
     * @param context The application context.
     * @param minerId The ID of the current user.
     * @param onDataReadyForServer The callback function to execute when a packet is ready for server upload.
     */
    fun start(
        context: Context,
        minerId: String,
        onDataReadyForServer: (payloadJson: String) -> Unit
    ) {
        if (isInitialized) {
            Log.w(TAG, "Bridge is already initialized.")
            return
        }
        
        // Register a broadcast receiver to get data from the service
        val gatewayReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action == MineSafeMeshService.ACTION_GATEWAY_DATA_READY) {
                    intent.getStringExtra(MineSafeMeshService.EXTRA_PAYLOAD_JSON)?.let {
                        onDataReadyForServer(it)
                    }
                }
            }
        }
        val filter = IntentFilter(MineSafeMeshService.ACTION_GATEWAY_DATA_READY)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(gatewayReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            context.registerReceiver(gatewayReceiver, filter)
        }


        // Start the background service
        val intent = Intent(context, MineSafeMeshService::class.java).apply {
            action = MineSafeMeshService.ACTION_START
            putExtra(MineSafeMeshService.EXTRA_MINER_ID, minerId)
        }
        context.startService(intent)
        isInitialized = true
        Log.i(TAG, "BLE Mesh Bridge started.")
    }

    /**
     * Stops the mesh service.
     */
    fun stop(context: Context) {
        if (!isInitialized) return
        val intent = Intent(context, MineSafeMeshService::class.java).apply {
            action = MineSafeMeshService.ACTION_STOP
        }
        context.startService(intent)
        isInitialized = false
        Log.i(TAG, "BLE Mesh Bridge stopped.")
    }

    /**
     * The main function your app calls when an emergency is detected.
     */
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
        val intent = Intent(context, MineSafeMeshService::class.java).apply {
            action = MineSafeMeshService.ACTION_TRIGGER_EMERGENCY
            putExtra(MineSafeMeshService.EXTRA_EMERGENCY_PAYLOAD, payload as java.io.Serializable)
        }
        context.startService(intent)
    }
}