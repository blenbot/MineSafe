"""
Improved Scream Detection Testing
Better feature extraction matching the improved training
"""

import numpy as np
import librosa
import sounddevice as sd
import soundfile as sf
import tensorflow as tf
from tensorflow import keras
import os
import time
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Must match training parameters
SAMPLE_RATE = 22050
DURATION = 3
N_MELS = 128
N_FFT = 2048
HOP_LENGTH = 512
N_MFCC = 40
FMAX = 8000

# Adjusted threshold - start conservative
DEFAULT_THRESHOLD = 0.60  # Higher = fewer false positives


class ImprovedScreamDetector:
    """Improved scream detector with better feature extraction"""
    
    def __init__(self, model_path='best_scream_model.h5'):
        print(f"\n🔧 Loading model: {model_path}")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        self.model = keras.models.load_model(model_path)
        self.sr = SAMPLE_RATE
        self.duration = DURATION
        self.samples = self.sr * self.duration
        
        print(f"✓ Model loaded")
        print(f"  Sample rate: {self.sr} Hz")
        print(f"  Duration: {self.duration}s")
        print(f"  Default threshold: {DEFAULT_THRESHOLD}")
        
    def extract_features(self, audio):
        """Extract features exactly as in improved training"""
        # Check energy
        audio_energy = np.sum(audio ** 2) / len(audio)
        if audio_energy < 1e-6:
            print("⚠️  Very low energy (silence)")
            return None
        
        # Ensure fixed length
        if len(audio) < self.samples:
            audio = np.pad(audio, (0, self.samples - len(audio)), mode='constant')
        else:
            audio = audio[:self.samples]
        
        # CRITICAL: Normalize audio amplitude
        audio = audio / (np.max(np.abs(audio)) + 1e-8)
        
        # Extract mel spectrogram
        mel_spec = librosa.feature.melspectrogram(
            y=audio,
            sr=self.sr,
            n_mels=N_MELS,
            n_fft=N_FFT,
            hop_length=HOP_LENGTH,
            fmax=FMAX
        )
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        
        # Extract MFCC
        mfcc = librosa.feature.mfcc(
            y=audio,
            sr=self.sr,
            n_mfcc=N_MFCC,
            n_fft=N_FFT,
            hop_length=HOP_LENGTH
        )
        
        # Extract delta MFCCs
        mfcc_delta = librosa.feature.delta(mfcc)
        
        # Extract spectral contrast
        spectral_contrast = librosa.feature.spectral_contrast(
            y=audio,
            sr=self.sr,
            n_fft=N_FFT,
            hop_length=HOP_LENGTH
        )
        
        # Combine all features
        combined = np.vstack([mel_spec_db, mfcc, mfcc_delta, spectral_contrast])
        
        # Standardize per channel
        combined = (combined - np.mean(combined, axis=1, keepdims=True)) / (np.std(combined, axis=1, keepdims=True) + 1e-8)
        
        # Add batch and channel dimensions
        combined = combined[np.newaxis, ..., np.newaxis]
        
        return combined
    
    def analyze_audio_characteristics(self, audio):
        """Analyze audio to help debug false positives"""
        # Energy
        energy = np.sum(audio ** 2) / len(audio)
        
        # RMS (loudness)
        rms = np.sqrt(np.mean(audio ** 2))
        
        # Zero crossing rate (roughness/noisiness)
        zcr = np.mean(librosa.feature.zero_crossing_rate(audio))
        
        # Spectral centroid (brightness)
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=audio, sr=self.sr))
        
        # Spectral rolloff (frequency content)
        spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=audio, sr=self.sr))
        
        return {
            'energy': energy,
            'rms': rms,
            'zcr': zcr,
            'spectral_centroid': spectral_centroid,
            'spectral_rolloff': spectral_rolloff
        }
    
    def predict_from_audio(self, audio, return_analysis=False):
        """Predict if audio contains a scream"""
        features = self.extract_features(audio)
        
        if features is None:
            return None if not return_analysis else (None, None)
        
        prediction = self.model.predict(features, verbose=0)[0][0]
        
        if return_analysis:
            analysis = self.analyze_audio_characteristics(audio)
            return prediction, analysis
        
        return prediction
    
    def predict_from_file(self, file_path):
        """Predict from audio file"""
        print(f"\n📂 Loading: {file_path}")
        
        try:
            audio, _ = librosa.load(file_path, sr=self.sr, duration=self.duration)
            
            audio_energy = np.sum(audio ** 2) / len(audio)
            print(f"   Energy: {audio_energy:.6f}")
            
            if audio_energy < 1e-6:
                print("⚠️  Audio appears silent")
                return None, None
            
            prediction, analysis = self.predict_from_audio(audio, return_analysis=True)
            return prediction, analysis
        except Exception as e:
            print(f"❌ Error: {e}")
            return None, None
    
    def record_and_predict(self, duration=None, device=None):
        """Record from microphone and predict"""
        if duration is None:
            duration = self.duration
        
        print(f"\n🎤 Recording for {duration}s...")
        
        if device is None:
            try:
                default_device = sd.query_devices(kind='input')
                print(f"   Device: {default_device['name']}")
            except:
                pass
        
        print("   🔴 RECORDING NOW!")
        
        try:
            audio = sd.rec(
                int(duration * self.sr),
                samplerate=self.sr,
                channels=1,
                dtype='float32',
                device=device,
                blocking=True
            )
            
            print("✓ Recording complete!")
            audio = audio.flatten()
            
            if len(audio) == 0:
                print("❌ No audio captured")
                return None, None, None
            
            # Check audio
            audio_energy = np.sum(audio ** 2) / len(audio)
            max_amplitude = np.max(np.abs(audio))
            
            print(f"   Energy: {audio_energy:.6f}")
            print(f"   Max amplitude: {max_amplitude:.6f}")
            
            if audio_energy < 1e-10:
                print("\n⚠️  NO AUDIO DETECTED!")
                print("\n📋 Troubleshooting:")
                print("  1. Check microphone permissions")
                print("  2. Increase microphone volume")
                print("  3. Use option 2 (test with file) instead")
                return None, None, None
            
            if max_amplitude < 0.001:
                print("\n⚠️  Audio too quiet!")
                print("  Increase mic volume or use test file")
                return None, None, None
            
            # Predict
            prediction, analysis = self.predict_from_audio(audio, return_analysis=True)
            
            return prediction, analysis, audio
            
        except Exception as e:
            print(f"\n❌ Recording error: {e}")
            return None, None, None


def print_detailed_prediction(prediction, analysis=None, threshold=DEFAULT_THRESHOLD):
    """Print prediction with detailed analysis"""
    if prediction is None:
        print("\n⚠️  Cannot predict (no audio)")
        return
    
    is_scream = prediction >= threshold
    confidence = prediction * 100
    
    print("\n" + "="*70)
    print("PREDICTION RESULTS")
    print("="*70)
    
    if is_scream:
        print(f"🚨 SCREAM DETECTED!")
        print(f"   Confidence: {confidence:.2f}%")
    else:
        print(f"✓ No scream detected")
        print(f"   Non-scream confidence: {100-confidence:.2f}%")
    
    # Visual bar
    bar_length = int(confidence / 2) if is_scream else int((100-confidence) / 2)
    bar = "█" * bar_length + "░" * (50 - bar_length)
    print(f"   [{bar}]")
    
    print(f"\n   Raw score: {prediction:.4f}")
    print(f"   Threshold: {threshold:.2f}")
    
    # Interpretation
    if prediction < 0.3:
        print(f"   📊 Very unlikely to be a scream")
    elif prediction < threshold:
        print(f"   📊 Probably not a scream")
    elif prediction < 0.8:
        print(f"   📊 Possibly a scream")
    else:
        print(f"   📊 Very likely a scream")
    
    print("="*70 + "\n")


def test_from_microphone(detector, threshold=DEFAULT_THRESHOLD):
    """Test with microphone"""
    print("\n" + "="*70)
    print(" "*20 + "MICROPHONE TEST")
    print("="*70)
    
    prediction, analysis, audio = detector.record_and_predict()
    
    if prediction is not None:
        print_detailed_prediction(prediction, analysis, threshold)
    else:
        print("\n❌ Recording failed")


def test_from_file(detector, file_path, threshold=DEFAULT_THRESHOLD):
    """Test with audio file"""
    print("\n" + "="*70)
    print(" "*20 + "FILE TEST")
    print("="*70)
    
    prediction, analysis = detector.predict_from_file(file_path)
    
    if prediction is not None:
        print_detailed_prediction(prediction, analysis, threshold)
    else:
        print("\n❌ Failed to process file")


def continuous_monitoring(detector, chunk_duration=3, threshold=DEFAULT_THRESHOLD):
    """Continuous monitoring mode"""
    print("\n" + "="*70)
    print(" "*15 + "CONTINUOUS MONITORING")
    print("="*70)
    print(f"\nMonitoring microphone...")
    print(f"Threshold: {threshold}")
    print("\nPress Ctrl+C to stop\n")
    
    consecutive_silence = 0
    
    try:
        while True:
            audio = sd.rec(
                int(chunk_duration * SAMPLE_RATE),
                samplerate=SAMPLE_RATE,
                channels=1,
                dtype='float32'
            )
            sd.wait()
            audio = audio.flatten()
            
            audio_energy = np.sum(audio ** 2) / len(audio)
            timestamp = time.strftime("%H:%M:%S")
            
            if audio_energy < 1e-6:
                consecutive_silence += 1
                if consecutive_silence % 5 == 1:
                    print(f"[{timestamp}] 🔇 Silence", end='\r')
                continue
            
            consecutive_silence = 0
            
            prediction, analysis = detector.predict_from_audio(audio, return_analysis=True)
            
            if prediction is None:
                continue
            
            if prediction >= threshold:
                print(f"\n[{timestamp}] 🚨 SCREAM! Confidence: {prediction*100:.1f}% | Energy: {audio_energy:.6f}")
                print(f"              Characteristics: Brightness={analysis['spectral_centroid']:.0f}Hz, Noisiness={analysis['zcr']:.3f}")
                
                save = input("Save? (y/n/c): ").strip().lower()
                if save == 'y':
                    filename = f"scream_{time.strftime('%Y%m%d_%H%M%S')}_{prediction:.2f}.wav"
                    sf.write(filename, audio, SAMPLE_RATE)
                    print(f"✓ Saved: {filename}\n")
                elif save == 'c':
                    continue
            else:
                print(f"[{timestamp}] ✓ Monitoring... Score: {prediction*100:.1f}% | Energy: {audio_energy:.6f}", end='\r')
            
    except KeyboardInterrupt:
        print("\n\n✓ Stopped")


def main():
    """Main interface"""
    print("\n" + "="*70)
    print(" "*10 + "IMPROVED SCREAM DETECTION - TESTING")
    print("="*70)
    
    # Find model
    model_files = ['best_scream_model.h5', 'scream_model_final.h5']
    model_path = None
    
    for mf in model_files:
        if os.path.exists(mf):
            model_path = mf
            break
    
    if not model_path:
        print("\n❌ No model found!")
        print("Train first: python train_scream_model_improved.py")
        return
    
    # Load detector
    try:
        detector = ImprovedScreamDetector(model_path)
    except Exception as e:
        print(f"\n❌ Error loading model: {e}")
        return
    
    # Fixed threshold
    threshold = DEFAULT_THRESHOLD
    print(f"\n✓ Using threshold: {threshold} (optimized for low false positives)")
    
    # Menu
    print("\n" + "="*70)
    print("SELECT MODE")
    print("="*70)
    print("\n1. Test with microphone")
    print("2. Test with audio file")
    print("3. Continuous monitoring")
    
    choice = input("\nChoice (1-3): ").strip()
    
    if choice == '1':
        test_from_microphone(detector, threshold)
        
    elif choice == '2':
        file_path = input("Audio file path: ").strip()
        if os.path.exists(file_path):
            test_from_file(detector, file_path, threshold)
        else:
            print(f"❌ File not found: {file_path}")
            
    elif choice == '3':
        continuous_monitoring(detector, threshold=threshold)
            
    else:
        print("❌ Invalid choice")
    
    print("\n👋 Done!")


if __name__ == "__main__":
    main()