"""
SCREAM DETECTOR - SIMPLIFIED TESTER
Quick test and exit
"""

import os
import wave
import pickle
import numpy as np
from pathlib import Path
import sys

# Try to import pydub for MP3/MP4 support
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    AudioSegment = None
    PYDUB_AVAILABLE = False

# Try to import sounddevice for microphone recording
try:
    import sounddevice as sd
    MICROPHONE_AVAILABLE = True
except ImportError:
    sd = None
    MICROPHONE_AVAILABLE = False


def convert_to_wav(input_file, output_file='temp_converted.wav'):
    """Convert any audio format to WAV using pydub"""
    try:
        if not PYDUB_AVAILABLE or AudioSegment is None:
            return None
        
        print(f"Converting {Path(input_file).suffix} to WAV...")
        audio = AudioSegment.from_file(input_file)
        
        if audio.channels > 1:
            audio = audio.set_channels(1)
        
        audio.export(output_file, format='wav')
        print("✓ Conversion successful")
        return output_file
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        return None


def read_wav(filepath):
    """Read WAV file"""
    try:
        with wave.open(str(filepath), 'rb') as w:
            channels = w.getnchannels()
            width = w.getsampwidth()
            rate = w.getframerate()
            frames = w.getnframes()
            
            if rate <= 0 or frames <= 0:
                return None, None
            
            raw = w.readframes(frames)
            
            if width == 1:
                data = np.frombuffer(raw, dtype=np.uint8).astype(np.float64)
                data = (data - 128.0) / 128.0
            elif width == 2:
                data = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
            else:
                return None, None
            
            if channels == 2:
                data = data.reshape(-1, 2).mean(axis=1)
            
            return data, int(rate)
    except Exception as e:
        return None, None


def read_any_audio(filepath):
    """Read any audio format"""
    filepath = str(filepath).strip('"').strip("'")
    
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return None, None
    
    if filepath.lower().endswith('.wav'):
        return read_wav(filepath)
    
    if PYDUB_AVAILABLE:
        temp_wav = 'temp_converted.wav'
        converted = convert_to_wav(filepath, temp_wav)
        if converted:
            audio, sr = read_wav(temp_wav)
            try:
                os.remove(temp_wav)
            except:
                pass
            return audio, sr
    
    return None, None


def record_from_microphone(duration=3, sample_rate=22050):
    """Record audio from microphone"""
    if not MICROPHONE_AVAILABLE or sd is None:
        print("❌ Microphone recording not available")
        return None, None
    
    try:
        print(f"\n🎤 Recording for {duration} seconds...")
        print("   SCREAM NOW!")
        
        audio = sd.rec(int(duration * sample_rate), 
                      samplerate=sample_rate, 
                      channels=1, 
                      dtype='float64')
        sd.wait()
        
        print("✓ Recording complete!")
        audio = audio.flatten()
        return audio, sample_rate
    except Exception as e:
        print(f"❌ Recording failed: {e}")
        return None, None


def extract_features(audio, sr):
    """Extract features from audio"""
    if audio is None or sr is None or len(audio) == 0:
        return None
    
    try:
        sr = int(sr)
        audio = audio.astype(np.float64)
        features = []
        
        # Time domain features
        features.extend([
            float(np.mean(audio)),
            float(np.std(audio)),
            float(np.max(np.abs(audio))),
            float(np.min(audio)),
            float(np.median(audio)),
            float(np.sqrt(np.mean(audio**2)))
        ])
        
        # Zero crossing rate
        zcr = np.sum(np.abs(np.diff(np.sign(audio)))) / (2.0 * len(audio))
        features.append(float(zcr))
        
        # Spectral features
        fft = np.abs(np.fft.rfft(audio))
        freqs = np.fft.rfftfreq(len(audio), 1.0/sr)
        
        if np.sum(fft) > 0:
            centroid = np.sum(freqs * fft) / np.sum(fft)
            spread = np.sqrt(np.sum(((freqs - centroid)**2) * fft) / np.sum(fft))
        else:
            centroid, spread = 0.0, 0.0
        
        features.extend([float(centroid), float(spread)])
        
        # Spectral rolloff
        cumsum = np.cumsum(fft)
        if cumsum[-1] > 0:
            rolloff_idx = np.where(cumsum >= 0.85 * cumsum[-1])[0]
            rolloff = float(freqs[rolloff_idx[0]]) if len(rolloff_idx) > 0 else 0.0
        else:
            rolloff = 0.0
        features.append(rolloff)
        
        features.extend([
            float(np.mean(fft)),
            float(np.std(fft)),
            float(np.max(fft))
        ])
        
        # Frame-based features
        frame_size = min(2048, len(audio)//4)
        hop = max(1, frame_size//4)
        
        energies = []
        for i in range(0, len(audio)-frame_size, hop):
            frame = audio[i:i+frame_size]
            energies.append(np.sum(frame**2))
        
        if energies:
            features.extend([
                float(np.mean(energies)),
                float(np.std(energies)),
                float(np.max(energies))
            ])
        else:
            features.extend([0.0, 0.0, 0.0])
        
        result = np.array(features, dtype=np.float64)
        
        if np.any(np.isnan(result)) or np.any(np.isinf(result)):
            return None
        
        return result
    except Exception as e:
        return None


def predict_audio(model, audio, sr, filename="audio"):
    """Predict if audio contains scream"""
    if audio is None or sr is None:
        print("\n❌ NO SCREAM DETECTED (Invalid audio)")
        return None
    
    features = extract_features(audio, sr)
    if features is None:
        print("\n❌ NO SCREAM DETECTED (Feature extraction failed)")
        return None
    
    # Normalize
    features_norm = (features - model['mean']) / model['std']
    
    # KNN prediction
    distances = np.sqrt(np.sum((model['X_train'] - features_norm)**2, axis=1))
    k_nearest_idx = np.argsort(distances)[:model['k']]
    k_labels = model['y_train'][k_nearest_idx]
    
    scream_votes = np.sum(k_labels)
    prediction = 1 if scream_votes > model['k']/2 else 0
    confidence = (scream_votes / model['k'] * 100) if prediction == 1 else ((model['k'] - scream_votes) / model['k'] * 100)
    
    # Simple result output
    print("\n" + "="*70)
    if prediction == 1:
        print(f"🟥SCREAM DETECTED! (Confidence: {confidence:.1f}%)")
    else:
        print(f"🟩NO SCREAM DETECTED (Confidence: {confidence:.1f}%)")
    print("="*70)
    
    return prediction


def predict_from_file(model, filepath):
    """Load audio file and predict"""
    filepath = str(filepath).strip('"').strip("'")
    
    print(f"\nAnalyzing: {Path(filepath).name}")
    result = read_any_audio(filepath)
    
    if result is None or result[0] is None or result[1] is None:
        print("\nNO SCREAM DETECTED (Failed to read audio)")
        return None
    
    audio, sr = result
    return predict_audio(model, audio, sr, Path(filepath).name)


def main():
    """Main testing interface"""
    print("\n" + "="*70)
    print("SCREAM DETECTOR - QUICK TEST")
    print("="*70)
    
    # Load model
    model_path = 'scream_model_knn.pkl'
    if not os.path.exists(model_path):
        print(f"\nModel not found: {model_path}")
        sys.exit(1)
    
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    print(f"✓ Model loaded (K={model['k']}, Samples={len(model['X_train'])})")
    
    # Show options
    print("\n" + "="*70)
    print("TESTING OPTIONS:")
    print("="*70)
    print("1. Record from microphone and test")
    print("2. Test a single audio file")
    print("3. Test all files in a folder")
    print("="*70)
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == '1':
        if not MICROPHONE_AVAILABLE:
            print("\n❌ NO SCREAM DETECTED (Microphone not available)")
            sys.exit(1)
        
        duration_input = input("Recording duration in seconds (default 3): ").strip()
        duration = int(duration_input) if duration_input.isdigit() else 3
        
        audio, sr = record_from_microphone(duration=duration)
        predict_audio(model, audio, sr, "Live Recording")
    
    elif choice == '2':
        filepath = input("\nEnter audio file path: ").strip()
        if filepath:
            predict_from_file(model, filepath)
        else:
            print("\n❌ NO SCREAM DETECTED (No file provided)")
    
    elif choice == '3':
        folder = input("\nEnter folder path: ").strip()
        if folder:
            folder = folder.strip('"').strip("'")
            folder_path = Path(folder)
            if not folder_path.exists():
                print(f"\n❌ NO SCREAM DETECTED (Folder not found)")
                sys.exit(1)
            
            audio_extensions = ['.wav', '.mp3', '.mp4', '.m4a', '.ogg', '.flac']
            files = [f for f in folder_path.iterdir() if f.suffix.lower() in audio_extensions]
            
            if not files:
                print("\n❌ NO SCREAM DETECTED (No audio files found)")
                sys.exit(1)
            
            print(f"\nFound {len(files)} audio files\n")
            scream_count = 0
            
            for i, filepath in enumerate(files, 1):
                print(f"[{i}/{len(files)}] {filepath.name}...", end=" ")
                result = predict_from_file(model, filepath)
                if result == 1:
                    scream_count += 1
            
            print("\n" + "="*70)
            print(f"FINAL RESULT: {scream_count}/{len(files)} files contained screams")
            print("="*70)
        else:
            print("\n❌ NO SCREAM DETECTED (No folder provided)")
    
    else:
        print("\n❌ Invalid choice")
        sys.exit(1)
    
    print("\nTest complete. Exiting...")
    sys.exit(0)


if __name__ == "__main__":
    main()