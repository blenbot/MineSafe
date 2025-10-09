package com.minesafe.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.tensorflow.lite.Interpreter as TFLiteInterpreter
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import kotlin.math.sqrt

class TensorFlowModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), SensorEventListener {

    companion object {
        private const val TAG = "TensorFlowModule"
        private const val WINDOW_SIZE = 50  // 50 timesteps for CNN
        private const val FALL_THRESHOLD = 0.35f  // Optimized threshold
        private const val FALL_COOLDOWN = 5000L  // 5 seconds between detections
    }

    private var interpreter: TFLiteInterpreter? = null
    private var sensorManager: SensorManager? = null
    private var accelerometer: Sensor? = null
    private var gyroscope: Sensor? = null
    
    private var isMonitoring = false
    
    // Current sensor readings
    private val accData = FloatArray(3)
    private val gyroData = FloatArray(3)
    
    // Windowed data buffer: List of [acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z]
    private val dataWindow = mutableListOf<FloatArray>()
    
    private var lastFallTime = 0L
    
    // Flags to track sensor updates
    private var hasAccData = false
    private var hasGyroData = false

    override fun getName(): String = "TensorFlowModule"

    @ReactMethod
    fun loadFallDetectionModel(promise: Promise) {
        try {
            Log.d(TAG, "🔄 Loading CNN fall detection model...")
            
            // Load the new CNN model
            val modelFile = loadModelFile("models/fall_detection_cnn_model.tflite")
            interpreter = TFLiteInterpreter(modelFile)
            
            // Log input/output tensor info
            val inputDetails = interpreter?.getInputTensor(0)
            val outputDetails = interpreter?.getOutputTensor(0)
            Log.d(TAG, "✅ Model input shape: ${inputDetails?.shape()?.contentToString()}")
            Log.d(TAG, "✅ Model output shape: ${outputDetails?.shape()?.contentToString()}")
            
            // Initialize sensor manager
            sensorManager = reactApplicationContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
            accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
            gyroscope = sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
            
            // Check sensor availability
            if (accelerometer == null) {
                Log.e(TAG, "❌ Accelerometer not available!")
                promise.reject("SENSOR_ERROR", "Accelerometer not available")
                return
            }
            if (gyroscope == null) {
                Log.e(TAG, "❌ Gyroscope not available!")
                promise.reject("SENSOR_ERROR", "Gyroscope not available")
                return
            }
            
            Log.d(TAG, "✅ CNN fall detection model loaded successfully")
            promise.resolve("Fall detection model loaded successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Model load error", e)
            promise.reject("MODEL_LOAD_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startFallDetection(promise: Promise) {
        try {
            Log.d(TAG, "▶️ Starting fall detection...")
            
            if (isMonitoring) {
                promise.resolve("Fall detection already running")
                return
            }
            
            if (interpreter == null) {
                promise.reject("MODEL_NOT_LOADED", "Please load model first")
                return
            }
            
            // Clear buffer
            dataWindow.clear()
            hasAccData = false
            hasGyroData = false
            
            // Register sensors at ~50Hz (SENSOR_DELAY_GAME = ~20ms)
            accelerometer?.let { 
                sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
                Log.d(TAG, "✅ Accelerometer registered at ~50Hz")
            }
            
            gyroscope?.let { 
                sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
                Log.d(TAG, "✅ Gyroscope registered at ~50Hz")
            }
            
            isMonitoring = true
            
            Log.d(TAG, "✅ Fall detection started with CNN model")
            promise.resolve("Fall detection started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Detection start error", e)
            promise.reject("DETECTION_START_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopFallDetection(promise: Promise) {
        try {
            Log.d(TAG, "🛑 Stopping fall detection...")
            
            if (!isMonitoring) {
                promise.reject("NOT_RUNNING", "Fall detection is not running")
                return
            }

            sensorManager?.unregisterListener(this)
            
            dataWindow.clear()
            hasAccData = false
            hasGyroData = false
            isMonitoring = false
            lastFallTime = 0L

            Log.d(TAG, "✅ Fall detection stopped")
            
            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putString("message", "Fall detection stopped successfully")
            promise.resolve(result)
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error stopping fall detection", e)
            isMonitoring = false
            promise.reject("STOP_ERROR", "Failed to stop: ${e.message}", e)
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null || !isMonitoring) return
        
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                System.arraycopy(event.values, 0, accData, 0, 3)
                hasAccData = true
            }
            
            Sensor.TYPE_GYROSCOPE -> {
                System.arraycopy(event.values, 0, gyroData, 0, 3)
                hasGyroData = true
            }
        }
        
        // Only add to window when we have both sensor readings
        if (hasAccData && hasGyroData) {
            // Create reading: [acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z]
            val reading = floatArrayOf(
                accData[0], accData[1], accData[2],
                gyroData[0], gyroData[1], gyroData[2]
            )
            
            dataWindow.add(reading)
            
            // Maintain window size (50 readings)
            if (dataWindow.size > WINDOW_SIZE) {
                dataWindow.removeAt(0)
            }
            
            // Run inference when we have exactly 50 readings
            if (dataWindow.size == WINDOW_SIZE) {
                runCNNInference()
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun runCNNInference() {
        try {
            val currentTime = System.currentTimeMillis()
            if (currentTime - lastFallTime < FALL_COOLDOWN) {
                return
            }
            
            // Check buffer size
            if (dataWindow.size != WINDOW_SIZE) {
                Log.w(TAG, "⚠️ Buffer size mismatch: ${dataWindow.size} != $WINDOW_SIZE")
                return
            }
            
            // Step 1: Normalize data (z-score normalization per feature)
            val normalizedData = normalizeData(dataWindow)
            
            // Step 2: Prepare input tensor [1, 50, 6]
            val inputArray = Array(1) { 
                Array(WINDOW_SIZE) { timestep ->
                    normalizedData[timestep]
                }
            }
            
            // Step 3: Prepare output tensor [1, 1]
            val outputArray = Array(1) { FloatArray(1) }
            
            // Step 4: Run CNN inference
            interpreter?.run(inputArray, outputArray)
            
            val fallProbability = outputArray[0][0]
            
            Log.d(TAG, "🧠 CNN Inference - Fall probability: ${(fallProbability * 100).toInt()}%")
            
            // Step 5: Apply threshold (0.35 for fall detection)
            if (fallProbability > FALL_THRESHOLD) {
                Log.w(TAG, "🚨 FALL DETECTED! Probability: ${(fallProbability * 100).toInt()}%")
                lastFallTime = currentTime
                sendFallDetectionEvent(fallProbability)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ CNN inference error", e)
            e.printStackTrace()
        }
    }

    /**
     * Normalize data using z-score normalization per feature column
     * Input: List of [acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z] readings
     * Output: Normalized 2D array [50 timesteps × 6 features]
     */
    private fun normalizeData(data: List<FloatArray>): Array<FloatArray> {
        val numFeatures = 6
        val normalizedData = Array(WINDOW_SIZE) { FloatArray(numFeatures) }
        
        // Normalize each feature column
        for (featureIdx in 0 until numFeatures) {
            // Extract column values
            val columnValues = data.map { it[featureIdx] }
            
            // Calculate mean
            val mean = columnValues.average().toFloat()
            
            // Calculate standard deviation
            val variance = columnValues.map { (it - mean) * (it - mean) }.average()
            val std = sqrt(variance).toFloat()
            
            // Normalize column (handle std = 0 case)
            for (timestep in 0 until WINDOW_SIZE) {
                normalizedData[timestep][featureIdx] = if (std == 0f) {
                    0f
                } else {
                    (data[timestep][featureIdx] - mean) / std
                }
            }
        }
        
        return normalizedData
    }

    private fun sendFallDetectionEvent(probability: Float) {
        val params = Arguments.createMap()
        params.putDouble("probability", probability.toDouble())
        params.putDouble("timestamp", System.currentTimeMillis().toDouble())
        params.putBoolean("fallDetected", true)
        params.putDouble("threshold", FALL_THRESHOLD.toDouble())
        params.putDouble("confidence", (Math.abs(probability - 0.5) * 200).toDouble())
        
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onFallDetected", params)
            
        Log.d(TAG, "📡 Fall detection event sent to React Native")
    }

    private fun loadModelFile(modelPath: String): MappedByteBuffer {
        val assetFileDescriptor = reactApplicationContext.assets.openFd(modelPath)
        val fileChannel = FileInputStream(assetFileDescriptor.fileDescriptor).channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    // ============================================================
    // PLACEHOLDER METHODS (kept for compatibility)
    // ============================================================
    
    @ReactMethod
    fun loadScreamFightDetectionModel(promise: Promise) {
        promise.resolve("Not implemented")
    }

    @ReactMethod
    fun processSensorData(accelerometerData: ReadableArray, gyroscopeData: ReadableArray, promise: Promise) {
        promise.resolve("Not implemented")
    }

    @ReactMethod
    fun startAudioMonitoring(promise: Promise) {
        promise.resolve("Not implemented")
    }

    @ReactMethod
    fun stopAudioMonitoring() {}

    @ReactMethod
    fun processAudioBuffer(audioData: ReadableArray, promise: Promise) {
        promise.resolve("Not implemented")
    }

    @ReactMethod
    fun detectAbnormalBehavior(behaviorData: ReadableMap, promise: Promise) {
        promise.resolve("Not implemented")
    }
}