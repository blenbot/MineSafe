package com.minesafe

import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.*

class ScreamDetectionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var interpreter: Interpreter? = null
    private var audioRecord: AudioRecord? = null
    private var isRecording = false
    private var recordingThread: Thread? = null

    companion object {
        private const val TAG = "ScreamDetection"
        private const val SAMPLE_RATE = 22050
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        private const val BUFFER_SIZE_MULTIPLIER = 2
        private const val RECORDING_CHUNK_DURATION_MS = 1000
        private const val N_MFCC = 40
        private const val N_FFT = 2048
        private const val HOP_LENGTH = 512
        private const val N_MELS = 128
    }

    private val melFilterBank: Array<FloatArray> by lazy {
        createMelFilterBank(N_MELS, N_FFT, SAMPLE_RATE)
    }

    override fun getName(): String = "ScreamDetectionModule"

    init {
        loadModel()
    }

    private fun loadModel() {
        try {
            val modelBuffer = FileUtil.loadMappedFile(
                reactApplicationContext, 
                "scream_detection_model.tflite"
            )
            
            val options = Interpreter.Options().apply {
                setNumThreads(2)
            }
            
            interpreter = Interpreter(modelBuffer, options)
            Log.d(TAG, "Model loaded successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error loading model: ${e.message}", e)
        }
    }

    @ReactMethod
    fun startDetection(promise: Promise) {
        if (isRecording) {
            promise.reject("ALREADY_RECORDING", "Detection is already running")
            return
        }

        try {
            val bufferSize = AudioRecord.getMinBufferSize(
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT
            ) * BUFFER_SIZE_MULTIPLIER

            if (bufferSize == AudioRecord.ERROR || bufferSize == AudioRecord.ERROR_BAD_VALUE) {
                promise.reject("AUDIO_ERROR", "Failed to get buffer size")
                return
            }

            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                promise.reject("AUDIO_ERROR", "AudioRecord not initialized")
                return
            }

            audioRecord?.startRecording()
            isRecording = true

            recordingThread = Thread {
                processAudio()
            }
            recordingThread?.start()

            promise.resolve("Detection started")
            Log.d(TAG, "Audio detection started")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting detection: ${e.message}", e)
            promise.reject("START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopDetection(promise: Promise) {
        try {
            isRecording = false
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
            recordingThread?.join()
            recordingThread = null
            promise.resolve("Detection stopped")
            Log.d(TAG, "Audio detection stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping detection: ${e.message}", e)
            promise.reject("STOP_ERROR", e.message)
        }
    }

    private fun processAudio() {
        val chunkSize = (SAMPLE_RATE * RECORDING_CHUNK_DURATION_MS / 1000)
        val buffer = ShortArray(chunkSize)

        while (isRecording) {
            try {
                val readResult = audioRecord?.read(buffer, 0, chunkSize) ?: 0

                if (readResult > 0) {
                    val audioData = FloatArray(readResult) { i -> buffer[i] / 32768.0f }
                    val mfccFeatures = extractMFCC(audioData)
                    val prediction = runInference(mfccFeatures)
                    sendEvent("onScreamDetected", prediction)
                    Log.d(TAG, "Prediction: ${prediction.getString("label")}, Confidence: ${prediction.getDouble("confidence")}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Processing error: ${e.message}")
            }
        }
    }

    private fun extractMFCC(audioData: FloatArray): FloatArray {
        val preEmphasized = preEmphasis(audioData)
        val frames = frameSignal(preEmphasized, N_FFT, HOP_LENGTH)

        if (frames.isEmpty()) {
            return FloatArray(N_MFCC)
        }

        val powerSpectrum = frames.map { frame ->
            val windowed = applyHammingWindow(frame)
            val fft = computeFFT(windowed)
            computePowerSpectrum(fft)
        }

        val melSpectrum = powerSpectrum.map { spectrum ->
            applyMelFilterBank(spectrum, melFilterBank)
        }

        val mfccs = melSpectrum.map { melFrame ->
            val logMel = melFrame.map { 
                val logVal = ln(it + 1e-10f)
                if (logVal.isNaN() || logVal.isInfinite()) -50f else logVal
            }.toFloatArray()
            dct(logMel).take(N_MFCC).toFloatArray()
        }

        val mfccMean = FloatArray(N_MFCC)
        for (i in 0 until N_MFCC) {
            var sum = 0f
            for (frame in mfccs) {
                if (i < frame.size) sum += frame[i]
            }
            mfccMean[i] = if (mfccs.isNotEmpty()) sum / mfccs.size else 0f
        }

        return mfccMean
    }

    private fun preEmphasis(signal: FloatArray, coefficient: Float = 0.97f): FloatArray {
        val result = FloatArray(signal.size)
        result[0] = signal[0]
        for (i in 1 until signal.size) {
            result[i] = signal[i] - coefficient * signal[i - 1]
        }
        return result
    }

    private fun frameSignal(signal: FloatArray, frameSize: Int, hopLength: Int): List<FloatArray> {
        val frames = mutableListOf<FloatArray>()
        var i = 0
        while (i + frameSize <= signal.size) {
            frames.add(signal.copyOfRange(i, i + frameSize))
            i += hopLength
        }
        return frames
    }

    private fun applyHammingWindow(frame: FloatArray): FloatArray {
        val n = frame.size
        return FloatArray(n) { i ->
            frame[i] * (0.54f - 0.46f * cos(2.0 * PI * i / (n - 1))).toFloat()
        }
    }

    private fun computeFFT(signal: FloatArray): Array<Complex> {
        val n = signal.size
        val result = Array(n) { Complex(0f, 0f) }
        
        for (k in 0 until n) {
            var real = 0f
            var imag = 0f
            val angleMultiplier = -2.0 * PI * k / n
            
            for (t in 0 until n) {
                val angle = angleMultiplier * t
                real += signal[t] * cos(angle).toFloat()
                imag += signal[t] * sin(angle).toFloat()
            }
            result[k] = Complex(real, imag)
        }
        return result
    }

    private fun computePowerSpectrum(fft: Array<Complex>): FloatArray {
        val halfSize = fft.size / 2 + 1
        return FloatArray(halfSize) { i ->
            fft[i].real * fft[i].real + fft[i].imag * fft[i].imag
        }
    }

    private fun createMelFilterBank(numFilters: Int, fftSize: Int, sampleRate: Int): Array<FloatArray> {
        val melFilterBank = Array(numFilters) { FloatArray(fftSize / 2 + 1) }
        val lowFreqMel = 0f
        val highFreqMel = hzToMel(sampleRate / 2f)
        val melPoints = FloatArray(numFilters + 2) { i ->
            lowFreqMel + (highFreqMel - lowFreqMel) * i / (numFilters + 1)
        }
        val hzPoints = melPoints.map { melToHz(it) }
        val bin = hzPoints.map { ((it / sampleRate) * fftSize).toInt() }

        for (i in 0 until numFilters) {
            val currentFilter = melFilterBank[i]
            
            for (j in bin[i] until bin[i + 1]) {
                if (j < currentFilter.size && bin[i + 1] > bin[i]) {
                    currentFilter[j] = (j - bin[i]).toFloat() / (bin[i + 1] - bin[i])
                }
            }
            
            for (j in bin[i + 1] until bin[i + 2]) {
                if (j < currentFilter.size && bin[i + 2] > bin[i + 1]) {
                    currentFilter[j] = (bin[i + 2] - j).toFloat() / (bin[i + 2] - bin[i + 1])
                }
            }
        }
        return melFilterBank
    }

    private fun hzToMel(hz: Float): Float = 2595f * log10(1 + hz / 700f)
    private fun melToHz(mel: Float): Float = 700f * (10f.pow(mel / 2595f) - 1)

    private fun applyMelFilterBank(powerSpectrum: FloatArray, melFilterBank: Array<FloatArray>): FloatArray {
        return FloatArray(melFilterBank.size) { i ->
            val melFilter = melFilterBank[i]
            var sum = 0f
            for (j in powerSpectrum.indices) {
                if (j < melFilter.size) {
                    sum += powerSpectrum[j] * melFilter[j]
                }
            }
            sum
        }
    }

    private fun dct(signal: FloatArray): FloatArray {
        val n = signal.size
        val result = FloatArray(n)
        for (k in 0 until n) {
            var sum = 0f
            for (i in 0 until n) {
                sum += signal[i] * cos(PI * k * (i + 0.5) / n).toFloat()
            }
            result[k] = sum
        }
        return result
    }

    private fun runInference(features: FloatArray): WritableMap {
        val result = WritableNativeMap()

        try {
            val inputBuffer = ByteBuffer.allocateDirect(features.size * 4).apply {
                order(ByteOrder.nativeOrder())
                features.forEach { putFloat(it) }
                rewind()
            }

            val outputBuffer = ByteBuffer.allocateDirect(4).apply {
                order(ByteOrder.nativeOrder())
            }

            interpreter?.run(inputBuffer, outputBuffer)
            outputBuffer.rewind()

            val confidence = outputBuffer.float
            val isScream = confidence > 0.5f

            result.putBoolean("isScream", isScream)
            result.putDouble("confidence", confidence.toDouble())
            result.putString("label", if (isScream) "Danger" else "No Danger")
        } catch (e: Exception) {
            Log.e(TAG, "Inference error: ${e.message}", e)
            result.putBoolean("isScream", false)
            result.putDouble("confidence", 0.0)
            result.putString("error", e.message)
        }

        return result
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    data class Complex(val real: Float, val imag: Float)
}