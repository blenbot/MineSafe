"""
Improved Scream Detection CNN Model Training
Focus on better discrimination and reducing false positives
"""

import numpy as np
import librosa
import os
import warnings
from pathlib import Path
warnings.filterwarnings('ignore')

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
print(f"TensorFlow version: {tf.__version__}")

from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import confusion_matrix, classification_report
import matplotlib.pyplot as plt

# Audio processing parameters
SAMPLE_RATE = 22050
DURATION = 3
N_MELS = 128
N_FFT = 2048
HOP_LENGTH = 512
N_MFCC = 40
FMAX = 8000

class ImprovedAudioFeatureExtractor:
    """Extract discriminative audio features for scream detection"""
    
    def __init__(self, sr=SAMPLE_RATE, duration=DURATION):
        self.sr = sr
        self.duration = duration
        self.samples = sr * duration
        
    def load_audio(self, file_path):
        """Load and preprocess audio file"""
        try:
            audio, _ = librosa.load(file_path, sr=self.sr, duration=self.duration)
            
            # Ensure fixed length
            if len(audio) < self.samples:
                audio = np.pad(audio, (0, self.samples - len(audio)), mode='constant')
            else:
                audio = audio[:self.samples]
                
            return audio
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            return None
    
    def extract_all_features(self, file_path):
        """Extract comprehensive features focusing on scream characteristics"""
        audio = self.load_audio(file_path)
        if audio is None:
            return None
        
        # Check if audio has sufficient energy
        audio_energy = np.sum(audio ** 2) / len(audio)
        if audio_energy < 1e-6:
            return None
        
        # Normalize audio to prevent amplitude variations from affecting features
        audio = audio / (np.max(np.abs(audio)) + 1e-8)
        
        # 1. Mel spectrogram (frequency content over time)
        mel_spec = librosa.feature.melspectrogram(
            y=audio,
            sr=self.sr,
            n_mels=N_MELS,
            n_fft=N_FFT,
            hop_length=HOP_LENGTH,
            fmax=FMAX
        )
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        
        # 2. MFCC (timbral texture)
        mfcc = librosa.feature.mfcc(
            y=audio,
            sr=self.sr,
            n_mfcc=N_MFCC,
            n_fft=N_FFT,
            hop_length=HOP_LENGTH
        )
        
        # 3. Delta MFCCs (rate of change - important for screams)
        mfcc_delta = librosa.feature.delta(mfcc)
        
        # 4. Spectral contrast (difference between peaks and valleys)
        # Screams typically have high spectral contrast
        spectral_contrast = librosa.feature.spectral_contrast(
            y=audio,
            sr=self.sr,
            n_fft=N_FFT,
            hop_length=HOP_LENGTH
        )
        
        # Combine all features
        combined = np.vstack([mel_spec_db, mfcc, mfcc_delta, spectral_contrast])
        
        # Standardize each feature channel
        combined = (combined - np.mean(combined, axis=1, keepdims=True)) / (np.std(combined, axis=1, keepdims=True) + 1e-8)
        
        return combined


class ScreamDataset:
    """Load and prepare scream detection dataset with data augmentation"""
    
    def __init__(self, dataset_path):
        self.dataset_path = Path(dataset_path)
        self.feature_extractor = ImprovedAudioFeatureExtractor()
        
    def find_audio_folders(self):
        """Find positive and negative audio folders"""
        print(f"\n🔍 Searching in: {self.dataset_path}")
        
        for root, dirs, files in os.walk(self.dataset_path):
            root_path = Path(root)
            dirs_lower = [d.lower() for d in dirs]
            
            if 'positive' in dirs_lower and 'negative' in dirs_lower:
                pos_folder = [d for d in dirs if d.lower() == 'positive'][0]
                neg_folder = [d for d in dirs if d.lower() == 'negative'][0]
                
                pos_path = root_path / pos_folder
                neg_path = root_path / neg_folder
                
                print(f"✓ Found folders:")
                print(f"  Positive: {pos_path}")
                print(f"  Negative: {neg_path}")
                
                return pos_path, neg_path
        
        return None, None
    
    def load_data(self, augment=True):
        """Load audio data with optional augmentation"""
        pos_path, neg_path = self.find_audio_folders()
        
        if pos_path is None or neg_path is None:
            print("\n❌ Error: Cannot find positive/negative folders")
            return None, None
        
        X = []
        y = []
        
        # Load positive samples
        print(f"\n📂 Loading positive samples...")
        audio_files = list(pos_path.glob('*.*'))
        audio_files = [f for f in audio_files if f.suffix.lower() in ['.wav', '.mp3', '.flac', '.ogg', '.m4a']]
        
        positive_count = 0
        for i, file_path in enumerate(audio_files):
            if i % 10 == 0:
                print(f"  Processing: {i+1}/{len(audio_files)}", end='\r')
            features = self.feature_extractor.extract_all_features(str(file_path))
            if features is not None:
                X.append(features)
                y.append(1)
                positive_count += 1
        
        print(f"  ✓ Loaded {positive_count} positive samples" + " "*20)
        
        # Load negative samples
        print(f"\n📂 Loading negative samples...")
        audio_files = list(neg_path.glob('*.*'))
        audio_files = [f for f in audio_files if f.suffix.lower() in ['.wav', '.mp3', '.flac', '.ogg', '.m4a']]
        
        negative_count = 0
        for i, file_path in enumerate(audio_files):
            if i % 10 == 0:
                print(f"  Processing: {i+1}/{len(audio_files)}", end='\r')
            features = self.feature_extractor.extract_all_features(str(file_path))
            if features is not None:
                X.append(features)
                y.append(0)
                negative_count += 1
        
        print(f"  ✓ Loaded {negative_count} negative samples" + " "*20)
        
        if len(X) == 0:
            return None, None
        
        X = np.array(X)
        y = np.array(y)
        
        # Add channel dimension
        X = X[..., np.newaxis]
        
        print(f"\n✓ Dataset loaded:")
        print(f"  Total: {len(X)} samples")
        print(f"  Positive: {positive_count} ({positive_count/len(X)*100:.1f}%)")
        print(f"  Negative: {negative_count} ({negative_count/len(X)*100:.1f}%)")
        print(f"  Feature shape: {X[0].shape}")
        
        # Check for data imbalance
        if positive_count / negative_count < 0.5 or positive_count / negative_count > 2.0:
            print(f"\n⚠️  WARNING: Significant class imbalance detected!")
            print(f"  Ratio: {positive_count/negative_count:.2f}:1 (positive:negative)")
            print(f"  This can cause bias. Consider balancing your dataset.")
        
        return X, y


def build_improved_model(input_shape):
    """Build a more robust CNN with focus on generalization"""
    
    model = keras.Sequential([
        layers.Input(shape=input_shape),
        
        # Block 1: Initial feature extraction
        layers.Conv2D(32, (3, 3), padding='same', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Block 2: Mid-level features
        layers.Conv2D(64, (3, 3), padding='same', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),
        
        # Block 3: High-level patterns
        layers.Conv2D(128, (3, 3), padding='same', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.4),
        
        # Block 4: Complex patterns
        layers.Conv2D(128, (3, 3), padding='same', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.5),
        
        # Dense layers with strong regularization
        layers.Dense(128, kernel_regularizer=keras.regularizers.l2(0.01)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Dropout(0.6),
        
        layers.Dense(64, kernel_regularizer=keras.regularizers.l2(0.01)),
        layers.BatchNormalization(),
        layers.Activation('relu'),
        layers.Dropout(0.5),
        
        # Output with bias initializer to account for class imbalance
        layers.Dense(1, activation='sigmoid')
    ])
    
    return model


def train_improved_model(X_train, y_train, X_val, y_val, input_shape, epochs=80):
    """Train with focus on reducing false positives"""
    
    print("\n" + "="*70)
    print("Building Improved CNN Model")
    print("="*70)
    
    model = build_improved_model(input_shape)
    
    # Calculate class weights
    class_weights = compute_class_weight(
        'balanced',
        classes=np.unique(y_train),
        y=y_train
    )
    class_weight_dict = {i: weight for i, weight in enumerate(class_weights)}
    
    # Adjust weights to penalize false positives more
    # This makes the model more conservative about predicting screams
    class_weight_dict[1] = class_weight_dict[1] * 0.8  # Reduce weight for positive class
    
    print(f"Adjusted class weights: {class_weight_dict}")
    
    # Use lower learning rate for better convergence
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0001),
        loss='binary_crossentropy',
        metrics=[
            'accuracy',
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall'),
            keras.metrics.AUC(name='auc')
        ]
    )
    
    model.summary()
    
    # Callbacks with focus on precision
    callbacks = [
        keras.callbacks.ModelCheckpoint(
            'best_scream_model.h5',
            monitor='val_precision',  # Focus on precision to reduce false positives
            mode='max',
            save_best_only=True,
            verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        keras.callbacks.CSVLogger('training_log.csv')
    ]
    
    print("\n" + "="*70)
    print("Training Started - Focus on Precision")
    print("="*70 + "\n")
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=16,  # Smaller batch size for better generalization
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1
    )
    
    return model, history


def plot_training_results(history):
    """Plot training results"""
    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    
    metrics = [
        ('accuracy', 'Accuracy'),
        ('loss', 'Loss'),
        ('precision', 'Precision'),
        ('recall', 'Recall'),
        ('auc', 'AUC')
    ]
    
    for idx, (metric, title) in enumerate(metrics):
        row = idx // 3
        col = idx % 3
        
        if metric in history.history:
            axes[row, col].plot(history.history[metric], label='Train', linewidth=2)
            axes[row, col].plot(history.history[f'val_{metric}'], label='Validation', linewidth=2)
            axes[row, col].set_title(f'Model {title}', fontsize=14, fontweight='bold')
            axes[row, col].set_xlabel('Epoch')
            axes[row, col].set_ylabel(title)
            axes[row, col].legend()
            axes[row, col].grid(True, alpha=0.3)
    
    if 'lr' in history.history:
        axes[1, 2].plot(history.history['lr'], linewidth=2, color='orange')
        axes[1, 2].set_title('Learning Rate', fontsize=14, fontweight='bold')
        axes[1, 2].set_xlabel('Epoch')
        axes[1, 2].set_ylabel('LR')
        axes[1, 2].set_yscale('log')
        axes[1, 2].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('training_results.png', dpi=150, bbox_inches='tight')
    print("\n✓ Training plots saved: training_results.png")
    plt.close()


def evaluate_model(model, X_test, y_test):
    """Comprehensive evaluation with focus on false positive rate"""
    print("\n" + "="*70)
    print("Model Evaluation")
    print("="*70)
    
    results = model.evaluate(X_test, y_test, verbose=0)
    
    print(f"\nTest Metrics:")
    print(f"  Loss:      {results[0]:.4f}")
    print(f"  Accuracy:  {results[1]*100:.2f}%")
    print(f"  Precision: {results[2]*100:.2f}%")
    print(f"  Recall:    {results[3]*100:.2f}%")
    print(f"  AUC:       {results[4]:.4f}")
    
    # Predictions
    y_pred_proba = model.predict(X_test, verbose=0)
    
    # Test different thresholds
    print(f"\n📊 Performance at Different Thresholds:")
    print(f"{'Threshold':<12} {'Accuracy':<12} {'Precision':<12} {'Recall':<12} {'FP Rate':<12}")
    print("="*60)
    
    for threshold in [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
        y_pred = (y_pred_proba > threshold).astype(int)
        cm = confusion_matrix(y_test, y_pred)
        
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
        
        accuracy = (tp + tn) / (tp + tn + fp + fn) if (tp + tn + fp + fn) > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        fp_rate = fp / (fp + tn) if (fp + tn) > 0 else 0
        
        print(f"{threshold:<12.2f} {accuracy:<12.2%} {precision:<12.2%} {recall:<12.2%} {fp_rate:<12.2%}")
    
    # Use 0.5 for detailed analysis
    y_pred = (y_pred_proba > 0.5).astype(int)
    cm = confusion_matrix(y_test, y_pred)
    
    print(f"\n📊 Confusion Matrix (threshold=0.5):")
    print(f"  True Negatives:  {cm[0][0]} (correct non-screams)")
    print(f"  False Positives: {cm[0][1]} ⚠️ (normal audio detected as scream)")
    print(f"  False Negatives: {cm[1][0]} ⚠️ (screams missed)")
    print(f"  True Positives:  {cm[1][1]} (correct screams)")
    
    # Calculate rates
    tn, fp, fn, tp = cm.ravel()
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0
    
    print(f"\n  False Positive Rate: {fpr*100:.2f}% (want this LOW)")
    print(f"  False Negative Rate: {fnr*100:.2f}%")
    
    print("\n" + "="*70)
    print("Classification Report:")
    print("="*70)
    print(classification_report(y_test, y_pred, target_names=['Non-Scream', 'Scream']))
    
    # Recommend threshold
    print(f"\n💡 Recommended Threshold:")
    if fpr > 0.15:
        print(f"  Your false positive rate is HIGH ({fpr*100:.1f}%)")
        print(f"  Recommended: Use threshold 0.7-0.8 to reduce false alarms")
    elif fpr > 0.10:
        print(f"  Your false positive rate is moderate ({fpr*100:.1f}%)")
        print(f"  Recommended: Use threshold 0.6-0.7")
    else:
        print(f"  Your false positive rate is good ({fpr*100:.1f}%)")
        print(f"  Recommended: Use threshold 0.5-0.6")
    
    return results


def main():
    """Main training pipeline"""
    print("\n" + "="*70)
    print(" "*10 + "IMPROVED SCREAM DETECTION TRAINING")
    print("="*70)
    
    script_dir = Path(__file__).parent.absolute()
    
    # Find dataset
    dataset_paths = [
        script_dir,
        script_dir.parent,
        script_dir / 'SCREAMDATASET',
        script_dir / 'ScreamDataset',
        script_dir / 'Dataset',
    ]
    
    dataset_path = None
    for path in dataset_paths:
        if not path.exists():
            continue
        for root, dirs, _ in os.walk(path, topdown=True):
            if 'positive' in [d.lower() for d in dirs] and 'negative' in [d.lower() for d in dirs]:
                dataset_path = Path(root)
                break
        if dataset_path:
            break
    
    if not dataset_path:
        print("\n❌ Dataset not found!")
        return
    
    print(f"\n📂 Dataset: {dataset_path}")
    
    # Load data
    dataset = ScreamDataset(dataset_path)
    X, y = dataset.load_data()
    
    if X is None or len(X) == 0:
        print("\n❌ Failed to load dataset")
        return
    
    # Split data
    print("\n" + "="*70)
    print("Splitting Dataset")
    print("="*70)
    
    indices = np.arange(len(X))
    np.random.seed(42)
    np.random.shuffle(indices)
    X, y = X[indices], y[indices]
    
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
    )
    
    print(f"\nData split:")
    print(f"  Train: {len(X_train)} ({sum(y_train)} screams)")
    print(f"  Val:   {len(X_val)} ({sum(y_val)} screams)")
    print(f"  Test:  {len(X_test)} ({sum(y_test)} screams)")
    
    # Train
    model, history = train_improved_model(
        X_train, y_train,
        X_val, y_val,
        input_shape=X_train[0].shape,
        epochs=80
    )
    
    # Plot and evaluate
    plot_training_results(history)
    evaluate_model(model, X_test, y_test)
    
    # Save
    model.save('scream_model_final.h5')
    print("\n✓ Model saved: scream_model_final.h5")
    
    print("\n" + "="*70)
    print(" "*20 + "TRAINING COMPLETE!")
    print("="*70)
    print("\n💡 Next steps:")
    print("  1. Check training_results.png for training curves")
    print("  2. Use recommended threshold when testing")
    print("  3. If still getting false positives, try:")
    print("     - Adding more diverse negative samples")
    print("     - Using threshold 0.75-0.85")
    print("     - Re-training with more epochs")


if __name__ == "__main__":
    main()