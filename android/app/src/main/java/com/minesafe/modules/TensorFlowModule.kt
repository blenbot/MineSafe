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
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import kotlin.math.sqrt

class TensorFlowModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), SensorEventListener {

    companion object {
        private const val TAG = "TensorFlowModule"
    }

    private var interpreter: TFLiteInterpreter? = null
    private var sensorManager: SensorManager? = null
    private var accelerometer: Sensor? = null
    private var gyroscope: Sensor? = null
    private var magnetometer: Sensor? = null
    
    private var isMonitoring = false
    
    // Current sensor readings
    private val accData = FloatArray(3)
    private val gyroData = FloatArray(3)
    private val magData = FloatArray(3)
    
    // For computing orientation
    private val rotationMatrix = FloatArray(9)
    private val orientationAngles = FloatArray(3)
    
    // Windowed data for feature extraction
    private val accWindow = mutableListOf<FloatArray>()
    private val gyroWindow = mutableListOf<FloatArray>()
    private val oriWindow = mutableListOf<FloatArray>()
    
    // Window size: 100 samples for 2 seconds at 50Hz
    private val windowSize = 100
    
    // Model metadata
    private var featureMeans: FloatArray? = null
    private var featureScales: FloatArray? = null
    
    private var lastFallTime = 0L
    private val fallCooldown = 5000L
    
    // Flags to track sensor updates
    private var hasAccData = false
    private var hasMagData = false

    override fun getName(): String = "TensorFlowModule"

    @ReactMethod
    fun loadFallDetectionModel(promise: Promise) {
        try {
            Log.d(TAG, "Loading fall detection model...")
            
            val modelFile = loadModelFile("models/sk_mlp_converted.tflite")
            interpreter = TFLiteInterpreter(modelFile)
            
            // Log input/output tensor info
            val inputDetails = interpreter?.getInputTensor(0)
            val outputDetails = interpreter?.getOutputTensor(0)
            Log.d(TAG, "Model input shape: ${inputDetails?.shape()?.contentToString()}")
            Log.d(TAG, "Model output shape: ${outputDetails?.shape()?.contentToString()}")
            
            loadModelMetadata()
            
            sensorManager = reactApplicationContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
            accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
            gyroscope = sensorManager?.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
            magnetometer = sensorManager?.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
            
            // Check sensor availability
            if (accelerometer == null) Log.w(TAG, "⚠️ Accelerometer not available!")
            if (gyroscope == null) Log.w(TAG, "⚠️ Gyroscope not available!")
            if (magnetometer == null) Log.w(TAG, "⚠️ Magnetometer not available!")
            
            Log.d(TAG, "✅ Fall detection model loaded successfully")
            promise.resolve("Fall detection model loaded successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Model load error", e)
            promise.reject("MODEL_LOAD_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startFallDetection(promise: Promise) {
        try {
            Log.d(TAG, "Starting fall detection...")
            
            if (isMonitoring) {
                promise.resolve("Fall detection already running")
                return
            }
            
            if (interpreter == null) {
                promise.reject("MODEL_NOT_LOADED", "Please load model first")
                return
            }
            
            // Register sensors at 50Hz (SENSOR_DELAY_GAME = ~20ms)
            accelerometer?.let { 
                sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
                Log.d(TAG, "✅ Accelerometer registered")
            }
            
            gyroscope?.let { 
                sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
                Log.d(TAG, "✅ Gyroscope registered")
            }
            
            magnetometer?.let { 
                sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
                Log.d(TAG, "✅ Magnetometer registered")
            }
            
            isMonitoring = true
            hasAccData = false
            hasMagData = false
            
            Log.d(TAG, "✅ Fall detection started")
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
            
            accWindow.clear()
            gyroWindow.clear()
            oriWindow.clear()

            isMonitoring = false
            hasAccData = false
            hasMagData = false
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
                accWindow.add(accData.clone())
                hasAccData = true
            }
            
            Sensor.TYPE_GYROSCOPE -> {
                System.arraycopy(event.values, 0, gyroData, 0, 3)
                gyroWindow.add(gyroData.clone())
            }
            
            Sensor.TYPE_MAGNETIC_FIELD -> {
                System.arraycopy(event.values, 0, magData, 0, 3)
                hasMagData = true
            }
        }
        
        // Compute orientation when we have both acc and mag data
        if (hasAccData && hasMagData) {
            // Compute rotation matrix from accelerometer and magnetometer
            val success = SensorManager.getRotationMatrix(
                rotationMatrix, null, accData, magData
            )
            
            if (success) {
                // Get orientation angles (azimuth, pitch, roll)
                SensorManager.getOrientation(rotationMatrix, orientationAngles)
                oriWindow.add(orientationAngles.clone())
            }
        }
        
        // Maintain window size
        if (accWindow.size > windowSize) accWindow.removeAt(0)
        if (gyroWindow.size > windowSize) gyroWindow.removeAt(0)
        if (oriWindow.size > windowSize) oriWindow.removeAt(0)
        
        // Run inference when we have enough data for all sensors
        if (accWindow.size >= windowSize && 
            gyroWindow.size >= windowSize && 
            oriWindow.size >= windowSize) {
            runFallDetectionInference()
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun runFallDetectionInference() {
        try {
            val currentTime = System.currentTimeMillis()
            if (currentTime - lastFallTime < fallCooldown) {
                return
            }
            
            // Extract exactly 100 features matching your model
            val features = extractFeatures()
            
            if (features.size != 100) {
                Log.e(TAG, "❌ Feature count mismatch: ${features.size} != 100")
                return
            }
            
            // Scale features
            val scaledFeatures = scaleFeatures(features)
            
            // Prepare input: [1, 100]
            val inputArray = Array(1) { scaledFeatures }
            
            // Prepare output: [1, 1] for binary classification
            val outputArray = Array(1) { FloatArray(1) }
            
            // Run inference
            interpreter?.run(inputArray, outputArray)
            
            val fallProb = outputArray[0][0]
            
            Log.d(TAG, "Inference - Fall probability: ${(fallProb * 100).toInt()}%")
            
            // Fall detected if probability > 50%
            if (fallProb > 0.5f) {
                Log.w(TAG, "🚨 FALL DETECTED! Probability: ${(fallProb * 100).toInt()}%")
                lastFallTime = currentTime
                sendFallDetectionEvent(fallProb)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Inference error", e)
            e.printStackTrace()
        }
    }

    private fun extractFeatures(): FloatArray {
        val features = mutableListOf<Float>()
        for (axis in 0..2) {
            val values = accWindow.map { it[axis] }
            features.addAll(calculate11Features(values))
        }
        val gyroX = gyroWindow.map { it[0] }
        features.addAll(calculate11Features(gyroX))
        
        // gyro_y: 11 features (complete)
        val gyroY = gyroWindow.map { it[1] }
        features.addAll(calculate11Features(gyroY))
        
        // gyro_z: 8 features (missing: mean, median, var)
        val gyroZ = gyroWindow.map { it[2] }
        val sortedGyroZ = gyroZ.sorted()
        features.add(calculateStd(gyroZ))                              // std
        features.add(sortedGyroZ.first())                              // min
        features.add(sortedGyroZ.last())                               // max
        features.add(sortedGyroZ.last() - sortedGyroZ.first())         // range
        features.add(calculateRMS(gyroZ))                              // rms
        features.add(calculatePercentile(sortedGyroZ, 0.25f))          // q25
        features.add(calculatePercentile(sortedGyroZ, 0.75f))          // q75
        features.add(calculatePercentile(sortedGyroZ, 0.75f) - 
                    calculatePercentile(sortedGyroZ, 0.25f))           // iqr
        
        // ori_x: 9 features (missing: range, iqr)
        val oriX = oriWindow.map { it[0] }
        val sortedOriX = oriX.sorted()
        features.add(oriX.average().toFloat())                         // mean
        features.add(calculateStd(oriX))                               // std
        features.add(sortedOriX.first())                               // min
        features.add(sortedOriX.last())                                // max
        features.add(calculateMedian(sortedOriX))                      // median
        features.add(calculateVariance(oriX))                          // var
        features.add(calculateRMS(oriX))                               // rms
        features.add(calculatePercentile(sortedOriX, 0.25f))           // q25
        features.add(calculatePercentile(sortedOriX, 0.75f))           // q75
        
        // ori_y: 11 features (complete)
        val oriY = oriWindow.map { it[1] }
        features.addAll(calculate11Features(oriY))
        
        // ori_z: 11 features (complete)
        val oriZ = oriWindow.map { it[2] }
        features.addAll(calculate11Features(oriZ))
        
        // ============================================================
        // MAGNITUDE FEATURES (6 features)
        // ============================================================
        
        // Accelerometer magnitudes (3 features)
        val accMag = accWindow.map { sqrt(it[0]*it[0] + it[1]*it[1] + it[2]*it[2]) }
        features.add(accMag.average().toFloat())                       // acc_magnitude_mean
        features.add(calculateStd(accMag))                             // acc_magnitude_std
        features.add(accMag.maxOrNull() ?: 0f)                         // acc_magnitude_max
        
        // Gyroscope magnitudes (3 features)
        val gyroMag = gyroWindow.map { sqrt(it[0]*it[0] + it[1]*it[1] + it[2]*it[2]) }
        features.add(gyroMag.average().toFloat())                      // gyro_magnitude_mean
        features.add(calculateStd(gyroMag))                            // gyro_magnitude_std
        features.add(gyroMag.maxOrNull() ?: 0f)                        // gyro_magnitude_max
        
        Log.d(TAG, "Extracted ${features.size} features (expected 100)")
        
        return features.toFloatArray()
    }

    /**
     * Calculate all 11 features for an axis (complete feature set)
     * Order: mean, std, min, max, median, range, var, rms, q25, q75, iqr
     */
    private fun calculate11Features(values: List<Float>): List<Float> {
        val sorted = values.sorted()
        val q25 = calculatePercentile(sorted, 0.25f)
        val q75 = calculatePercentile(sorted, 0.75f)
        
        return listOf(
            values.average().toFloat(),                // mean
            calculateStd(values),                      // std
            sorted.first(),                            // min
            sorted.last(),                             // max
            calculateMedian(sorted),                   // median
            sorted.last() - sorted.first(),            // range
            calculateVariance(values),                 // var
            calculateRMS(values),                      // rms
            q25,                                       // q25
            q75,                                       // q75
            q75 - q25                                  // iqr
        )
    }

    private fun scaleFeatures(features: FloatArray): FloatArray {
        val means = featureMeans
        val scales = featureScales
        
        if (means == null || scales == null || means.isEmpty() || scales.isEmpty()) {
            Log.w(TAG, "⚠️ Feature scaling not available, using raw features")
            return features
        }
        
        if (means.size != 100 || scales.size != 100) {
            Log.e(TAG, "❌ Metadata size mismatch: means=${means.size}, scales=${scales.size}")
            return features
        }
        
        val scaled = FloatArray(features.size)
        for (i in features.indices) {
            if (scales[i] != 0f) {
                scaled[i] = (features[i] - means[i]) / scales[i]
            } else {
                Log.w(TAG, "⚠️ Scale is 0 for feature $i, using raw value")
                scaled[i] = features[i]
            }
        }
        return scaled
    }

    private fun loadModelFile(modelPath: String): MappedByteBuffer {
        val assetFileDescriptor = reactApplicationContext.assets.openFd(modelPath)
        val fileChannel = FileInputStream(assetFileDescriptor.fileDescriptor).channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    private fun loadModelMetadata() {
        try {
            val inputStream = reactApplicationContext.assets.open("models/model_metadata_trimmed.json")
            val reader = BufferedReader(InputStreamReader(inputStream))
            val json = reader.readText()
            reader.close()
            
            val jsonObject = JSONObject(json)
            val meanArray = jsonObject.getJSONArray("mean")
            val scaleArray = jsonObject.getJSONArray("scale")
            
            if (meanArray.length() != 100 || scaleArray.length() != 100) {
                Log.e(TAG, "❌ Metadata has wrong size: mean=${meanArray.length()}, scale=${scaleArray.length()}")
                return
            }
            
            featureMeans = FloatArray(meanArray.length()) { meanArray.getDouble(it).toFloat() }
            featureScales = FloatArray(scaleArray.length()) { scaleArray.getDouble(it).toFloat() }
            
            Log.d(TAG, "✅ Metadata loaded: ${meanArray.length()} means, ${scaleArray.length()} scales")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error loading metadata", e)
        }
    }

    private fun sendFallDetectionEvent(probability: Float) {
        val params = Arguments.createMap()
        params.putDouble("probability", probability.toDouble())
        params.putDouble("timestamp", System.currentTimeMillis().toDouble())
        params.putBoolean("fallDetected", true)
        
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onFallDetected", params)
    }

    // ============================================================
    // STATISTICAL HELPER FUNCTIONS
    // ============================================================
    
    private fun calculateStd(values: List<Float>): Float {
        val mean = values.average()
        val variance = values.map { (it - mean) * (it - mean) }.average()
        return sqrt(variance).toFloat()
    }

    private fun calculateVariance(values: List<Float>): Float {
        val mean = values.average()
        return values.map { (it - mean) * (it - mean) }.average().toFloat()
    }

    private fun calculateRMS(values: List<Float>): Float {
        return sqrt(values.map { it * it }.average()).toFloat()
    }

    private fun calculateMedian(sortedValues: List<Float>): Float {
        return if (sortedValues.size % 2 == 0) {
            (sortedValues[sortedValues.size / 2 - 1] + sortedValues[sortedValues.size / 2]) / 2f
        } else {
            sortedValues[sortedValues.size / 2]
        }
    }

    private fun calculatePercentile(sortedValues: List<Float>, percentile: Float): Float {
        val index = (percentile * (sortedValues.size - 1)).toInt()
        return sortedValues[index.coerceIn(0, sortedValues.size - 1)]
    }

    // ============================================================
    // PLACEHOLDER METHODS
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