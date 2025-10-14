package com.minesafe.services

import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import org.tensorflow.lite.Interpreter
import com.jlibrosa.audio.JLibrosa
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

class ScreamDetector(private val context: Context) {
    
    private var interpreter: Interpreter? = null
    private var audioRecord: AudioRecord? = null
    private var isDetecting = false
    private var recordingThread: Thread? = null
    private var onScreamDetectedCallback: (() -> Unit)? = null
    private val jLibrosa = JLibrosa()
    
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
        val audioBuffer = ShortArray(SAMPLE_RATE) // 1 second buffer
        var samplesCollected = 0
        
        try {
            while (isDetecting) {
                val readSize = audioRecord?.read(
                    audioBuffer, 
                    samplesCollected, 
                    audioBuffer.size - samplesCollected
                ) ?: 0
                
                if (readSize > 0) {
                    samplesCollected += readSize
                    
                    // Process every 1 second of audio
                    if (samplesCollected >= audioBuffer.size) {
                        // Convert to float array
                        val floatBuffer = FloatArray(audioBuffer.size) { 
                            audioBuffer[it].toFloat() / 32768f 
                        }
                        
                        // Save to temporary WAV file for JLibrosa
                        val tempFile = saveTempWav(floatBuffer)
                        
                        // Extract MFCC using JLibrosa
                        val mfccFeatures = extractMFCC(tempFile.absolutePath)
                        
                        // Clean up temp file
                        tempFile.delete()
                        
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
                        
                        // Reset buffer
                        samplesCollected = 0
                    }
                }
                
                Thread.sleep(10)
            }
        } catch (e: InterruptedException) {
            Log.d(TAG, "⚠️ Audio processing interrupted")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error processing audio", e)
        }
    }
    
    private fun saveTempWav(audioData: FloatArray): File {
        val tempFile = File.createTempFile("audio", ".wav", context.cacheDir)
        
        FileOutputStream(tempFile).use { fos ->
            // Write WAV header (simplified)
            val header = createWavHeader(audioData.size)
            fos.write(header)
            
            // Write audio data
            for (sample in audioData) {
                val intSample = (sample * 32767).toInt().coerceIn(-32768, 32767).toShort()
                fos.write(intSample.toInt() and 0xFF)
                fos.write((intSample.toInt() shr 8) and 0xFF)
            }
        }
        
        return tempFile
    }
    
    private fun createWavHeader(dataSize: Int): ByteArray {
        val header = ByteArray(44)
        val byteRate = SAMPLE_RATE * 2 // 16-bit mono
        val dataLength = dataSize * 2
        
        // RIFF header
        header[0] = 'R'.code.toByte()
        header[1] = 'I'.code.toByte()
        header[2] = 'F'.code.toByte()
        header[3] = 'F'.code.toByte()
        
        // File size
        val fileSize = 36 + dataLength
        header[4] = (fileSize and 0xFF).toByte()
        header[5] = ((fileSize shr 8) and 0xFF).toByte()
        header[6] = ((fileSize shr 16) and 0xFF).toByte()
        header[7] = ((fileSize shr 24) and 0xFF).toByte()
        
        // WAVE header
        header[8] = 'W'.code.toByte()
        header[9] = 'A'.code.toByte()
        header[10] = 'V'.code.toByte()
        header[11] = 'E'.code.toByte()
        
        // fmt subchunk
        header[12] = 'f'.code.toByte()
        header[13] = 'm'.code.toByte()
        header[14] = 't'.code.toByte()
        header[15] = ' '.code.toByte()
        header[16] = 16 // Subchunk1Size (16 for PCM)
        header[18] = 1 // AudioFormat (1 for PCM)
        header[22] = 1 // NumChannels (1 for mono)
        
        // SampleRate
        header[24] = (SAMPLE_RATE and 0xFF).toByte()
        header[25] = ((SAMPLE_RATE shr 8) and 0xFF).toByte()
        header[26] = ((SAMPLE_RATE shr 16) and 0xFF).toByte()
        header[27] = ((SAMPLE_RATE shr 24) and 0xFF).toByte()
        
        // ByteRate
        header[28] = (byteRate and 0xFF).toByte()
        header[29] = ((byteRate shr 8) and 0xFF).toByte()
        header[30] = ((byteRate shr 16) and 0xFF).toByte()
        header[31] = ((byteRate shr 24) and 0xFF).toByte()
        
        header[32] = 2 // BlockAlign
        header[34] = 16 // BitsPerSample
        
        // data subchunk
        header[36] = 'd'.code.toByte()
        header[37] = 'a'.code.toByte()
        header[38] = 't'.code.toByte()
        header[39] = 'a'.code.toByte()
        
        // Data size
        header[40] = (dataLength and 0xFF).toByte()
        header[41] = ((dataLength shr 8) and 0xFF).toByte()
        header[42] = ((dataLength shr 16) and 0xFF).toByte()
        header[43] = ((dataLength shr 24) and 0xFF).toByte()
        
        return header
    }
    
    private fun extractMFCC(audioPath: String): FloatArray {
        return try {
            // Load audio and extract MFCC using JLibrosa
            val audioFeatureValues = jLibrosa.loadAndRead(audioPath, SAMPLE_RATE, -1)
            
            // Extract MFCC (n_mfcc=40)
            val mfccValues = jLibrosa.generateMFCCFeatures(audioFeatureValues, SAMPLE_RATE, N_MFCC)
            
            // Average across time frames (same as Python: np.mean(mfccs.T, axis=0))
            val meanMFCC = FloatArray(N_MFCC)
            for (i in 0 until N_MFCC) {
                var sum = 0f
                var count = 0
                for (j in mfccValues[i].indices) {
                    sum += mfccValues[i][j]
                    count++
                }
                meanMFCC[i] = if (count > 0) sum / count else 0f
            }
            
            meanMFCC
        } catch (e: Exception) {
            Log.e(TAG, "❌ MFCC extraction failed", e)
            FloatArray(N_MFCC) { 0f }
        }
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
