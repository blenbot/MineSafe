package com.minesafe.mesh

import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.ParcelUuid
import android.util.Log
import kotlinx.coroutines.*
import java.util.*
import java.util.concurrent.ConcurrentHashMap

@SuppressLint("MissingPermission")
class BleManager(
    private val context: Context,
    private val onPacketReceived: (packet: MineSafePacket, fromDeviceAddress: String) -> Unit
) {
    private val TAG = "MineSafeBleManager"
    private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager.adapter

    private var gattServer: BluetoothGattServer? = null
    private var advertiser: BluetoothLeAdvertiser? = bluetoothAdapter?.bluetoothLeAdvertiser
    private var scanner: BluetoothLeScanner? = bluetoothAdapter?.bluetoothLeScanner
    private var meshCharacteristic: BluetoothGattCharacteristic? = null

    private val job = SupervisorJob()
    private val scope = CoroutineScope(Dispatchers.IO + job)

    private val connectedGatts = ConcurrentHashMap<String, BluetoothGatt>()
    private val serverConnectedDevices = ConcurrentHashMap<String, BluetoothDevice>()
    private val clientWriteCharacteristics = ConcurrentHashMap<String, BluetoothGattCharacteristic>()

    fun start() {
        Log.i(TAG, "Starting BLE Manager...")
        scope.launch {
            startServer()
            delay(500)
            startScanning()
        }
    }

    fun stop() {
        Log.i(TAG, "Stopping BLE Manager.")
        job.cancel()
        try {
            scanner?.stopScan(scanCallback)
            advertiser?.stopAdvertising(advertiseCallback)
            gattServer?.close()
            connectedGatts.values.forEach { it.close() }
        } catch (e: Exception) {
            Log.e(TAG, "Error during BLE stop: ${e.message}")
        } finally {
            connectedGatts.clear()
            serverConnectedDevices.clear()
            clientWriteCharacteristics.clear()
        }
    }

    fun broadcast(packet: MineSafePacket) {
        val data = packet.toByteArray()
        // Client-side broadcast
        connectedGatts.values.forEach { gatt ->
            clientWriteCharacteristics[gatt.device.address]?.let { char ->
                char.value = data
                char.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
                gatt.writeCharacteristic(char)
            }
        }
        // Server-side broadcast
        meshCharacteristic?.let { char ->
            char.value = data
            serverConnectedDevices.values.forEach { device ->
                gattServer?.notifyCharacteristicChanged(device, char, false)
            }
        }
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) { Log.i(TAG, "✅ BLE Advertising started.") }
        override fun onStartFailure(errorCode: Int) { Log.e(TAG, "❌ BLE Advertising failed: $errorCode") }
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult?) {
            result?.device?.let { device ->
                if (device.address != null && !connectedGatts.containsKey(device.address)) {
                    device.connectGatt(context, false, gattClientCallback, BluetoothDevice.TRANSPORT_LE)
                }
            }
        }
        override fun onScanFailed(errorCode: Int) { Log.e(TAG, "❌ BLE Scan failed: $errorCode") }
    }

    private val gattServerCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) serverConnectedDevices[device.address] = device
            else serverConnectedDevices.remove(device.address)
        }

        override fun onCharacteristicWriteRequest(device: BluetoothDevice, requestId: Int, c: BluetoothGattCharacteristic, p: Boolean, r: Boolean, o: Int, v: ByteArray) {
            MineSafePacket.fromByteArray(v)?.let { onPacketReceived(it, device.address) }
            if (r) gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
        }
    }

    private val gattClientCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            val address = gatt.device.address
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                connectedGatts[address] = gatt
                gatt.discoverServices()
            } else {
                gatt.close()
                connectedGatts.remove(address)
                clientWriteCharacteristics.remove(address)
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            gatt.getService(MineSafeProtocol.SERVICE_UUID)?.getCharacteristic(MineSafeProtocol.CHARACTERISTIC_UUID)?.let {
                clientWriteCharacteristics[gatt.device.address] = it
            } ?: gatt.disconnect()
        }
    }

    private fun startServer() {
        gattServer = bluetoothManager.openGattServer(context, gattServerCallback)
        val service = BluetoothGattService(MineSafeProtocol.SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        meshCharacteristic = BluetoothGattCharacteristic(
            MineSafeProtocol.CHARACTERISTIC_UUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )
        service.addCharacteristic(meshCharacteristic)
        gattServer?.addService(service)
        startAdvertising()
    }

    private fun startAdvertising() {
        val settings = AdvertiseSettings.Builder().setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY).setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH).setConnectable(true).build()
        val data = AdvertiseData.Builder().addServiceUuid(ParcelUuid(MineSafeProtocol.SERVICE_UUID)).setIncludeDeviceName(false).build()
        advertiser?.startAdvertising(settings, data, advertiseCallback)
    }

    private fun startScanning() {
        val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(MineSafeProtocol.SERVICE_UUID)).build()
        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
        scanner?.startScan(listOf(filter), settings, scanCallback)
        Log.i(TAG, "📡 BLE Scanning started.")
    }
}