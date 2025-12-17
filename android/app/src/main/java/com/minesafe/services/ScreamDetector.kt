package com.minesafe.services

import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.ln
import kotlin.math.sin
import kotlin.math.sqrt

class ScreamDetector(private val context: Context) {
    
    private var interpreter: Interpreter? = null
    private var audioRecord: AudioRecord? = null
    private var isDetecting = false
    private var recordingThread: Thread? = null
    private var onScreamDetectedCallback: (() -> Unit)? = null
    
    companion object {
        private const val TAG = "ScreamDetector"
        private const val SAMPLE_RATE = 22050
        private const val N_MFCC = 40
        private const val BUFFER_SIZE = 2048
        private const val THRESHOLD = 0.5f
        private const val SCREAM_COOLDOWN = 5000L
    }
    
    private var lastScreamTime = 0L
    
    fun initialize() {
        try {
            Log.d(TAG, "🔄 Loading scream detection model...")
            interpreter = Interpreter(loadModelFile())
            Log.d(TAG, "✅ Scream detection model loaded successfully")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to load model", e)
            throw e
        }
    }
    
    private fun loadModelFile(): MappedByteBuffer {
        val fileDescriptor = context.assets.openFd("models/scream_classifier.tflite")
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }
    
    fun startDetection(onScreamDetected: () -> Unit) {
        if (isDetecting) {
            Log.w(TAG, "⚠️ Detection already running")
            return
        }
        
        Log.d(TAG, "▶️ Starting scream detection...")
        isDetecting = true
        onScreamDetectedCallback = onScreamDetected
        
        try {
            val minBufferSize = AudioRecord.getMinBufferSize(
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            )
            
            val bufferSize = maxOf(minBufferSize, BUFFER_SIZE * 2)
            
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize
            )
            
            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                throw IllegalStateException("AudioRecord initialization failed")
            }
            
            audioRecord?.startRecording()
            
            recordingThread = Thread({
                processAudio()
            }, "ScreamDetector-Thread")
            recordingThread?.start()
            
            Log.d(TAG, "✅ Scream detection started successfully")
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to start detection", e)
            isDetecting = false
            audioRecord?.release()
            audioRecord = null
            throw e
        }
    }
    
    private fun processAudio() {
        val audioBuffer = ShortArray(BUFFER_SIZE)
        
        try {
            while (isDetecting) {
                val readSize = audioRecord?.read(audioBuffer, 0, BUFFER_SIZE) ?: 0
                
                if (readSize > 0) {
                    val floatBuffer = FloatArray(readSize) { 
                        audioBuffer[it].toFloat() / 32768f 
                    }
                    
                    val mfccFeatures = extractMFCC(floatBuffer)
                    
                    if (mfccFeatures.size == N_MFCC) {
                        val prediction = predict(mfccFeatures)
                        
                        Log.d(TAG, "🧠 Scream probability: ${(prediction * 100).toInt()}%")
                        
                        val currentTime = System.currentTimeMillis()
                        if (prediction > THRESHOLD && currentTime - lastScreamTime > SCREAM_COOLDOWN) {
                            Log.w(TAG, "🚨 SCREAM DETECTED! Probability: ${(prediction * 100).toInt()}%")
                            lastScreamTime = currentTime
                            onScreamDetectedCallback?.invoke()
                        }
                    }
                }
                
                Thread.sleep(20)
            }
        } catch (e: InterruptedException) {
            Log.d(TAG, "⚠️ Audio processing interrupted")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error processing audio", e)
        }
    }
    
    private fun extractMFCC(audioData: FloatArray): FloatArray {
        return try {
            val preEmphasized = preEmphasis(audioData)
            val powerSpectrum = computePowerSpectrum(preEmphasized)
            val melSpectrum = applyMelFilterbank(powerSpectrum)
            val logMelSpectrum = melSpectrum.map { ln((it + 1e-10).toDouble()).toFloat() }
            return dct(logMelSpectrum.toFloatArray()).take(N_MFCC).toFloatArray()
        } catch (e: Exception) {
            Log.e(TAG, "❌ MFCC extraction failed", e)
            FloatArray(N_MFCC) { 0f }
        }
    }
    
    private fun preEmphasis(signal: FloatArray, coefficient: Float = 0.97f): FloatArray {
        val result = FloatArray(signal.size)
        result[0] = signal[0]
        for (i in 1 until signal.size) {
            result[i] = signal[i] - coefficient * signal[i - 1]
        }
        return result
    }
    
    private fun computePowerSpectrum(signal: FloatArray): FloatArray {
        val n = BUFFER_SIZE
        val result = FloatArray(n / 2 + 1)
        
        for (k in result.indices) {
            var real = 0.0
            var imag = 0.0
            val signalSize = minOf(signal.size, n)
            
            for (i in 0 until signalSize) {
                val angle = 2.0 * PI * k * i / n
                real += signal[i] * cos(angle)
                imag += signal[i] * sin(angle)
            }
            
            result[k] = (real * real + imag * imag).toFloat()
        }
        
        return result
    }
    
    private fun applyMelFilterbank(powerSpectrum: FloatArray): FloatArray {
        val melBins = 128
        val result = FloatArray(melBins)
        val binSize = powerSpectrum.size / melBins
        
        for (i in 0 until melBins) {
            val startBin = i * binSize
            val endBin = minOf((i + 1) * binSize, powerSpectrum.size)
            
            var sum = 0f
            for (j in startBin until endBin) {
                sum += powerSpectrum[j]
            }
            result[i] = sum / (endBin - startBin)
        }
        
        return result
    }
    
    private fun dct(input: FloatArray): FloatArray {
        val n = input.size
        val result = FloatArray(n)
        
        for (k in result.indices) {
            var sum = 0.0
            for (i in input.indices) {
                sum += input[i] * cos(PI * k * (2 * i + 1) / (2 * n))
            }
            result[k] = (sum * sqrt(2.0 / n)).toFloat()
        }
        
        return result
    }
    
    private fun predict(features: FloatArray): Float {
        return try {
            val inputArray = Array(1) { features }
            val outputArray = Array(1) { FloatArray(1) }
            
            interpreter?.run(inputArray, outputArray)
            
            outputArray[0][0]
        } catch (e: Exception) {
            Log.e(TAG, "❌ Prediction error", e)
            0f
        }
    }
    
    fun stopDetection() {
        if (!isDetecting) return
        
        Log.d(TAG, "🛑 Stopping scream detection...")
        isDetecting = false
        
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            Log.e(TAG, "⚠️ Error stopping AudioRecord", e)
        } finally {
            audioRecord = null
        }
        
        try {
            recordingThread?.interrupt()
            recordingThread?.join(1000)
        } catch (e: Exception) {
            Log.e(TAG, "⚠️ Error stopping recording thread", e)
        } finally {
            recordingThread = null
        }
        
        onScreamDetectedCallback = null
        lastScreamTime = 0L
    }
    
    fun release() {
        stopDetection()
        interpreter?.close()
        interpreter = null
    }
    
    fun isRunning(): Boolean = isDetecting
}
