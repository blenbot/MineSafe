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
        private const val WINDOW_SIZE = 50
        private const val WINDOW_STRIDE = 25
        private const val FALL_THRESHOLD = 0.35f
        private const val FALL_COOLDOWN = 5000L
        
        // Fall pattern detection thresholds
        private const val FREE_FALL_THRESHOLD = 5.0f  // Total acc < 5 m/s² (near weightlessness)
        private const val IMPACT_THRESHOLD = 20.0f    // Total acc > 20 m/s² (hard impact)
        private const val POST_IMPACT_STILLNESS = 12.0f // Low movement after fall
        private const val MIN_FREE_FALL_DURATION = 3  // At least 3 samples in free fall
        private const val GYRO_ROTATION_THRESHOLD = 3.0f  // rad/s - significant rotation during fall
    }

    private var interpreter: TFLiteInterpreter? = null
    private var sensorManager: SensorManager? = null
    private var accelerometer: Sensor? = null
    private var gyroscope: Sensor? = null
    
    private var isMonitoring = false
    
    private val accData = FloatArray(3)
    private val gyroData = FloatArray(3)
    private val dataWindow = mutableListOf<FloatArray>()
    
    private var lastFallTime = 0L
    private var lastInferenceTime = 0L
    private var sampleCounter = 0
    
    private var hasAccData = false
    private var hasGyroData = false

    override fun getName(): String = "TensorFlowModule"

    @ReactMethod
    fun loadFallDetectionModel(promise: Promise) {
        try {
            Log.d(TAG, "🔄 Loading CNN fall detection model...")
            
            val modelFile = loadModelFile("models/fall_detection_cnn_model.tflite")
            interpreter = TFLiteInterpreter(modelFile)
            
            val inputDetails = interpreter?.getInputTensor(0)
            val outputDetails = interpreter?.getOutputTensor(0)
            Log.d(TAG, "✅ Model input shape: ${inputDetails?.shape()?.contentToString()}")
            Log.d(TAG, "✅ Model output shape: ${outputDetails?.shape()?.contentToString()}")
            
            sensorManager = reactApplicationContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
            accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
            gyroscope = sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
            
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
            
            dataWindow.clear()
            hasAccData = false
            hasGyroData = false
            sampleCounter = 0
            lastInferenceTime = 0L
            
            accelerometer?.let { 
                sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
                Log.d(TAG, "✅ Accelerometer registered at ~50Hz")
            }
            
            gyroscope?.let { 
                sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
                Log.d(TAG, "✅ Gyroscope registered at ~50Hz")
            }
            
            isMonitoring = true
            
            Log.d(TAG, "✅ Fall detection started with pattern validation")
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
            sampleCounter = 0

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
        
        if (hasAccData && hasGyroData) {
            val reading = floatArrayOf(
                accData[0], accData[1], accData[2],
                gyroData[0], gyroData[1], gyroData[2]
            )
            
            dataWindow.add(reading)
            sampleCounter++
            
            if (dataWindow.size > WINDOW_SIZE) {
                dataWindow.removeAt(0)
            }
            
            if (dataWindow.size == WINDOW_SIZE && sampleCounter >= WINDOW_STRIDE) {
                if (hasFallPattern()) {
                    runCNNInference()
                } else {
                    Log.d(TAG, "⏸️ No fall pattern detected, skipping inference")
                }
                sampleCounter = 0
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    /**
     * Enhanced fall pattern detection with multi-stage validation
     * Returns true only if the window contains a realistic fall signature
     */
    private fun hasFallPattern(): Boolean {
        if (dataWindow.size < WINDOW_SIZE) return false
        
        // Calculate acceleration magnitudes
        val accMagnitudes = dataWindow.map { 
            sqrt(it[0] * it[0] + it[1] * it[1] + it[2] * it[2])
        }
        
        // Calculate gyroscope magnitudes (rotation rate)
        val gyroMagnitudes = dataWindow.map {
            sqrt(it[3] * it[3] + it[4] * it[4] + it[5] * it[5])
        }
        
        // Stage 1: Check for free fall phase (low acceleration)
        val freeFallSamples = accMagnitudes.count { it < FREE_FALL_THRESHOLD }
        val hasFreeFall = freeFallSamples >= MIN_FREE_FALL_DURATION
        
        // Stage 2: Check for impact phase (high acceleration spike)
        val maxAcceleration = accMagnitudes.maxOrNull() ?: 0f
        val hasImpact = maxAcceleration > IMPACT_THRESHOLD
        
        // Stage 3: Check for significant rotation (body orientation change)
        val maxRotation = gyroMagnitudes.maxOrNull() ?: 0f
        val hasRotation = maxRotation > GYRO_ROTATION_THRESHOLD
        
        // Stage 4: Check temporal sequence (free fall should come before impact)
        val freeFallIndex = accMagnitudes.indexOfFirst { it < FREE_FALL_THRESHOLD }
        val impactIndex = accMagnitudes.indexOfLast { it == maxAcceleration }
        val validSequence = freeFallIndex >= 0 && impactIndex > freeFallIndex
        
        // Stage 5: Check for post-impact stillness (person lying down)
        val lastQuarter = accMagnitudes.takeLast(WINDOW_SIZE / 4)
        val postImpactMean = lastQuarter.average().toFloat()
        val postImpactVariance = lastQuarter.map { (it - postImpactMean) * (it - postImpactMean) }.average().toFloat()
        val hasStillness = postImpactVariance < 5.0f && postImpactMean < POST_IMPACT_STILLNESS
        
        // Calculate acceleration range to filter out simple jerks
        val accRange = maxAcceleration - (accMagnitudes.minOrNull() ?: 0f)
        val significantChange = accRange > 15.0f
        
        // Log detailed pattern analysis
        Log.d(TAG, """
            📊 Fall Pattern Analysis:
            ├─ Free fall samples: $freeFallSamples/${MIN_FREE_FALL_DURATION} ✓${if (hasFreeFall) "YES" else "NO"}
            ├─ Max acceleration: ${maxAcceleration.toInt()} m/s² (>${IMPACT_THRESHOLD.toInt()}) ✓${if (hasImpact) "YES" else "NO"}
            ├─ Max rotation: ${maxRotation.toInt()} rad/s (>${GYRO_ROTATION_THRESHOLD.toInt()}) ✓${if (hasRotation) "YES" else "NO"}
            ├─ Valid sequence: ✓${if (validSequence) "YES" else "NO"} (FF@$freeFallIndex → Impact@$impactIndex)
            ├─ Post-impact stillness: ${postImpactVariance.toInt()} variance ✓${if (hasStillness) "YES" else "NO"}
            └─ Significant change: ${accRange.toInt()} m/s² ✓${if (significantChange) "YES" else "NO"}
        """.trimIndent())
        
        // Require at least 4 out of 6 conditions to pass (you can adjust this)
        val passedConditions = listOf(
            hasFreeFall,
            hasImpact,
            hasRotation,
            validSequence,
            hasStillness,
            significantChange
        ).count { it }
        
        val isFallPattern = passedConditions >= 4
        
        if (isFallPattern) {
            Log.w(TAG, "🎯 Fall pattern detected! ($passedConditions/6 conditions met)")
        } else {
            Log.d(TAG, "❌ Not a fall pattern ($passedConditions/6 conditions met)")
        }
        
        return isFallPattern
    }

    private fun runCNNInference() {
        try {
            val currentTime = System.currentTimeMillis()
            
            if (currentTime - lastFallTime < FALL_COOLDOWN) {
                Log.d(TAG, "⏳ Cooldown active, skipping inference")
                return
            }
            
            if (dataWindow.size != WINDOW_SIZE) {
                Log.w(TAG, "⚠️ Buffer size mismatch: ${dataWindow.size} != $WINDOW_SIZE")
                return
            }
            
            lastInferenceTime = currentTime
            
            val normalizedData = normalizeData(dataWindow)
            
            val inputArray = Array(1) { 
                Array(WINDOW_SIZE) { timestep ->
                    normalizedData[timestep]
                }
            }
            
            val outputArray = Array(1) { FloatArray(1) }
            
            interpreter?.run(inputArray, outputArray)
            
            val fallProbability = outputArray[0][0]
            
            Log.d(TAG, "🧠 CNN Inference - Fall probability: ${(fallProbability * 100).toInt()}%")
            
            if (fallProbability > FALL_THRESHOLD) {
                Log.w(TAG, "🚨 FALL DETECTED! Probability: ${(fallProbability * 100).toInt()}%")
                lastFallTime = currentTime
                sendFallDetectionEvent(fallProbability)
            } else {
                Log.d(TAG, "✅ Pattern validated but probability too low (${(fallProbability * 100).toInt()}%)")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ CNN inference error", e)
            e.printStackTrace()
        }
    }

    private fun normalizeData(data: List<FloatArray>): Array<FloatArray> {
        val numFeatures = 6
        val normalizedData = Array(WINDOW_SIZE) { FloatArray(numFeatures) }
        
        for (featureIdx in 0 until numFeatures) {
            val columnValues = data.map { it[featureIdx] }
            val mean = columnValues.average().toFloat()
            val variance = columnValues.map { (it - mean) * (it - mean) }.average()
            val std = sqrt(variance).toFloat()
            
            for (timestep in 0 until WINDOW_SIZE) {
                normalizedData[timestep][featureIdx] = if (std < 0.001f) {
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