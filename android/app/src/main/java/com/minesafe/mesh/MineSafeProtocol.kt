package com.minesafe.mesh

import android.util.Log
import com.google.gson.Gson
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream
import java.text.SimpleDateFormat
import java.util.*

/**
 * Defines the core constants and data structures for the MineSafe BLE mesh.
 */
object MineSafeProtocol {
    // This is your app's unique "frequency". All devices will advertise and scan for this.
    val SERVICE_UUID: UUID = UUID.fromString("e2a8a945-3362-429c-a81a-9a0255f8782e")
    val CHARACTERISTIC_UUID: UUID = UUID.fromString("e2a8a945-3362-429c-a81a-9a0255f8782f")
    const val MAX_TTL = 25
}

/**
 * The data packet that is passed from phone to phone.
 */
data class MineSafePacket(
    val packetId: String,
    val originalSenderMinerId: String,
    var ttl: Int,
    val payload: ByteArray
) {
    fun toByteArray(): ByteArray {
        return ByteArrayOutputStream().use { stream ->
            DataOutputStream(stream).use {
                it.writeUTF(packetId)
                it.writeUTF(originalSenderMinerId)
                it.writeInt(ttl)
                it.writeInt(payload.size)
                it.write(payload)
            }
            stream.toByteArray()
        }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        return packetId == (other as MineSafePacket).packetId
    }

    override fun hashCode(): Int = packetId.hashCode()

    companion object {
        fun fromByteArray(data: ByteArray): MineSafePacket? {
            return try {
                DataInputStream(ByteArrayInputStream(data)).use {
                    val packetId = it.readUTF()
                    val senderId = it.readUTF()
                    val ttl = it.readInt()
                    val payloadSize = it.readInt()
                    val payload = ByteArray(payloadSize).apply { it.readFully(this) }
                    MineSafePacket(packetId, senderId, ttl, payload)
                }
            } catch (e: Exception) {
                Log.w("MineSafePacket", "Failed to decode packet from byte array.", e)
                null
            }
        }
    }
}

/**
 * A data class representing the exact JSON payload your Go backend expects.
 */
data class EmergencyPayload(
    val user_id: String,
    val severity: String,
    val latitude: Double,
    val longitude: Double,
    val issue: String,
    val incident_time: String
) {
    fun toJsonByteArray(): ByteArray = Gson().toJson(this).toByteArray(Charsets.UTF_8)

    companion object {
        fun createTimestamp(): String {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
            sdf.timeZone = TimeZone.getTimeZone("UTC")
            return sdf.format(Date())
        }
    }
}