"""
SCREAM DETECTOR - UNIVERSAL AUDIO TESTER
Supports WAV, MP3, MP4, M4A, OGG, FLAC and more
Can also record live audio from microphone!
"""

import os
import wave
import pickle
import numpy as np
from pathlib import Path
import sys
import subprocess

# Try to import pydub for MP3/MP4 support
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    AudioSegment = None  # type: ignore
    PYDUB_AVAILABLE = False
    print("Note: pydub not installed. Only WAV files supported.")
    print("To support MP3/MP4: pip install pydub")

# Try to import sounddevice for microphone recording
try:
    import sounddevice as sd
    MICROPHONE_AVAILABLE = True
except ImportError:
    sd = None  # type: ignore
    MICROPHONE_AVAILABLE = False


def convert_to_wav(input_file, output_file='temp_converted.wav'):
    """Convert any audio format to WAV using pydub"""
    try:
        if not PYDUB_AVAILABLE or AudioSegment is None:
            return None
        
        print(f"Converting {Path(input_file).suffix} to WAV...")
        audio = AudioSegment.from_file(input_file)
        
        # Convert to mono if stereo
        if audio.channels > 1:
            audio = audio.set_channels(1)
        
        # Export as WAV
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
    """Read any audio format (WAV, MP3, MP4, etc.)"""
    filepath = str(filepath).strip('"').strip("'")
    
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return None, None
    
    # If it's already WAV, read directly
    if filepath.lower().endswith('.wav'):
        return read_wav(filepath)
    
    # For other formats, convert first
    if PYDUB_AVAILABLE:
        temp_wav = 'temp_converted.wav'
        converted = convert_to_wav(filepath, temp_wav)
        if converted:
            audio, sr = read_wav(temp_wav)
            # Clean up temp file
            try:
                os.remove(temp_wav)
            except:
                pass
            return audio, sr
        else:
            print("\n❌ MP3/MP4 conversion failed!")
            print("\nYou need to install ffmpeg:")
            print("  1. Download ffmpeg from: https://www.gyan.dev/ffmpeg/builds/")
            print("  2. Extract the zip file")
            print("  3. Add the 'bin' folder to your PATH")
            print("\nOR convert your file to WAV using an online converter:")
            print("  - https://cloudconvert.com/mp3-to-wav")
            print("  - https://online-audio-converter.com/")
            return None, None
    else:
        print("❌ Cannot read this format without pydub")
        print("   Install it with: pip install pydub")
        print("   Or convert your file to WAV format")
        return None, None


def record_from_microphone(duration=3, sample_rate=22050):
    """Record audio from microphone"""
    if not MICROPHONE_AVAILABLE or sd is None:
        print("ERROR: Microphone recording not available")
        print("Install sounddevice: pip install sounddevice")
        return None, None
    
    try:
        print(f"\nRecording for {duration} seconds...")
        print("Start speaking/screaming now!")
        
        # Record
        audio = sd.rec(int(duration * sample_rate), 
                      samplerate=sample_rate, 
                      channels=1, 
                      dtype='float64')
        sd.wait()
        
        print("Recording complete.")
        
        # Flatten to 1D array
        audio = audio.flatten()
        
        return audio, sample_rate
    except Exception as e:
        print(f"ERROR: Recording failed - {e}")
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
        print(f"Error extracting features: {e}")
        return None


def predict_audio(model, audio, sr, filename="audio"):
    """Predict if audio contains scream"""
    
    if audio is None or sr is None:
        print("ERROR: Invalid audio data")
        return None
    
    # Extract features
    features = extract_features(audio, sr)
    if features is None:
        print("ERROR: Failed to extract features")
        return None
    
    # Normalize
    features_norm = (features - model['mean']) / model['std']
    
    # KNN prediction
    distances = np.sqrt(np.sum((model['X_train'] - features_norm)**2, axis=1))
    k_nearest_idx = np.argsort(distances)[:model['k']]
    k_labels = model['y_train'][k_nearest_idx]
    
    scream_votes = np.sum(k_labels)
    normal_votes = model['k'] - scream_votes
    
    prediction = 1 if scream_votes > model['k']/2 else 0
    confidence = (scream_votes / model['k'] * 100) if prediction == 1 else (normal_votes / model['k'] * 100)
    
    # Display results
    print("\n" + "="*70)
    if prediction == 1:
        print("DANGER: SCREAM DETECTED")
    else:
        print("SAFE: NO SCREAM DETECTED")
    print("="*70)
    print(f"Confidence: {confidence:.1f}%")
    print("="*70 + "\n")
    
    return {
        'prediction': 'SCREAM' if prediction == 1 else 'NORMAL',
        'confidence': float(confidence),
        'scream_votes': int(scream_votes),
        'normal_votes': int(normal_votes)
    }


def predict_from_file(model, filepath):
    """Load audio file and predict"""
    filepath = str(filepath).strip('"').strip("'")
    
    # Read audio (supports any format)
    result = read_any_audio(filepath)
    
    if result is None or result[0] is None or result[1] is None:
        return None
    
    audio, sr = result
    
    return predict_audio(model, audio, sr, Path(filepath).name)


def main():
    """Main interactive testing interface"""
    print("\n" + "="*70)
    print("SCREAM DETECTOR")
    print("="*70)
    
    # Check dependencies
    if not PYDUB_AVAILABLE:
        print("\nWarning: pydub not installed - Only WAV files supported")
        print("To add MP3/MP4 support: pip install pydub")
    
    if not MICROPHONE_AVAILABLE:
        print("\nWarning: sounddevice not installed - Microphone unavailable")
        print("To enable: pip install sounddevice")
    
    # Load model
    model_path = 'scream_model_knn.pkl'
    if not os.path.exists(model_path):
        print(f"\nERROR: Model not found - {model_path}")
        print("Train the model first: python Dataset/main.py")
        return
    
    print(f"\nLoading model: {model_path}")
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    print(f"Model loaded successfully")
    print(f"Training samples: {len(model['X_train'])}")
    print(f"K value: {model['k']}")
    
    # Interactive menu
    while True:
        print("\n" + "="*70)
        print("OPTIONS:")
        print("="*70)
        print("1. Record from microphone")
        print("2. Test an audio file")
        print("3. Test all files in a folder")
        print("4. Exit")
        print("="*70)
        
        choice = input("\nEnter choice (1-4): ").strip()
        
        if choice == '1':
            if not MICROPHONE_AVAILABLE:
                print("\nERROR: Microphone recording not available")
                print("Install sounddevice: pip install sounddevice")
                continue
            
            duration_input = input("\nRecording duration in seconds (default 3): ").strip()
            duration = int(duration_input) if duration_input.isdigit() else 3
            
            audio, sr = record_from_microphone(duration=duration)
            if audio is not None and sr is not None:
                predict_audio(model, audio, sr, "Live Recording")
        
        elif choice == '2':
            filepath = input("\nEnter audio file path: ").strip()
            if filepath:
                predict_from_file(model, filepath)
        
        elif choice == '3':
            folder = input("\nEnter folder path: ").strip()
            if folder:
                folder = folder.strip('"').strip("'")
                folder_path = Path(folder)
                if not folder_path.exists():
                    print(f"ERROR: Folder not found - {folder}")
                    continue
                
                # Get all audio files
                audio_extensions = ['.wav', '.mp3', '.mp4', '.m4a', '.ogg', '.flac']
                files = [f for f in folder_path.iterdir() if f.suffix.lower() in audio_extensions]
                
                if not files:
                    print("ERROR: No audio files found")
                    continue
                
                print(f"\nTesting {len(files)} files...")
                scream_count = 0
                
                for i, filepath in enumerate(files, 1):
                    print(f"\n[{i}/{len(files)}] {filepath.name}")
                    result = predict_from_file(model, filepath)
                    if result and result['prediction'] == 'SCREAM':
                        scream_count += 1
                
                print(f"\n{'='*70}")
                print(f"SUMMARY: {scream_count} screams detected out of {len(files)} files")
                print(f"{'='*70}")
        
        elif choice == '4':
            print("\nGoodbye!")
            break
        
        else:
            print("ERROR: Invalid choice. Enter 1-4.")


if __name__ == "__main__":
    main()