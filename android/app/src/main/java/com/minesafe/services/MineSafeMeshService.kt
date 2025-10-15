package com.minesafe.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.IBinder
import android.util.Log
import com.minesafe.mesh.BleManager
import com.minesafe.mesh.EmergencyPayload
import com.minesafe.mesh.MineSafePacket
import com.minesafe.mesh.MineSafeProtocol
import java.util.*
import java.util.concurrent.ConcurrentHashMap

class MineSafeMeshService : Service() {

    private val TAG = "MineSafeMeshService"
    private var bleManager: BleManager? = null
    private val seenPacketIds = Collections.newSetFromMap(ConcurrentHashMap<String, Boolean>())
    private lateinit var myMinerId: String

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "MineSafeMeshService created.")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                myMinerId = intent.getStringExtra(EXTRA_MINER_ID) ?: "UNKNOWN_MINER"
                bleManager = BleManager(applicationContext) { packet, fromDeviceAddress ->
                    handleReceivedPacket(packet, fromDeviceAddress)
                }
                bleManager?.start()
                Log.i(TAG, "Service started for Miner ID: $myMinerId")
            }
            ACTION_STOP -> {
                bleManager?.stop()
                stopSelf()
            }
            ACTION_TRIGGER_EMERGENCY -> {
                intent.getSerializableExtra(EXTRA_EMERGENCY_PAYLOAD)?.let {
                    val payload = it as EmergencyPayload
                    Log.i(TAG, "!!! Service received trigger for emergency: ${payload.issue} !!!")
                    val packet = MineSafePacket(
                        packetId = UUID.randomUUID().toString(),
                        originalSenderMinerId = payload.user_id,
                        ttl = MineSafeProtocol.MAX_TTL,
                        payload = payload.toJsonByteArray()
                    )
                    handleReceivedPacket(packet, "localhost")
                }
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        bleManager?.stop()
        Log.i(TAG, "MineSafeMeshService destroyed.")
        super.onDestroy()
    }

    private fun handleReceivedPacket(packet: MineSafePacket, fromDeviceAddress: String) {
        if (!seenPacketIds.add(packet.packetId)) {
            Log.d(TAG, "Ignoring duplicate packet: ${packet.packetId.take(8)}")
            return
        }

        Log.i(TAG, "Processing packet ${packet.packetId.take(8)} from ${packet.originalSenderMinerId}")

        if (hasInternetConnection()) {
            Log.i(TAG, "✅ Internet found! Broadcasting payload to the app.")
            val payloadJson = String(packet.payload, Charsets.UTF_8)
            val intent = Intent(ACTION_GATEWAY_DATA_READY).apply {
                putExtra(EXTRA_PAYLOAD_JSON, payloadJson)
                setPackage(packageName)
            }
            sendBroadcast(intent)
        } else {
            if (packet.ttl > 0) {
                val newPacket = packet.copy(ttl = packet.ttl - 1)
                Log.i(TAG, "📡 No internet. Forwarding packet with new TTL: ${newPacket.ttl}")
                bleManager?.broadcast(newPacket)
            } else {
                Log.w(TAG, "Packet TTL expired. Dropping packet ${packet.packetId.take(8)}")
            }
        }
    }

    private fun hasInternetConnection(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    companion object {
        const val ACTION_START = "com.minesafe.services.START"
        const val ACTION_STOP = "com.minesafe.services.STOP"
        const val ACTION_TRIGGER_EMERGENCY = "com.minesafe.services.TRIGGER_EMERGENCY"
        const val ACTION_GATEWAY_DATA_READY = "com.minesafe.services.GATEWAY_DATA_READY"
        const val EXTRA_MINER_ID = "EXTRA_MINER_ID"
        const val EXTRA_EMERGENCY_PAYLOAD = "EXTRA_EMERGENCY_PAYLOAD"
        const val EXTRA_PAYLOAD_JSON = "EXTRA_PAYLOAD_JSON"
    }
}