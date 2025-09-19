#!/usr/bin/env python3
"""
Test script to verify all AI models are working correctly
"""
import os
import sys

# Add the server directory to Python path
sys.path.append(os.path.dirname(__file__))

from app import *

def test_models():
    print("🧪 Testing AI Models...")
    print("=" * 50)
    
    # Test model loading
    models_status = {
        'Emotion (FER+)': fer_sess is not None,
        'Age Prediction': age_net is not None,
        'Gender Classification': gender_net is not None,
        'Face Detection': face_cascade is not None
    }
    
    print("Model Loading Status:")
    for model, status in models_status.items():
        status_icon = "✅" if status else "❌"
        print(f"  {status_icon} {model}: {'Loaded' if status else 'Failed'}")
    
    print(f"\nModels Directory: {MODELS_DIR}")
    print(f"Captures Directory: {CAPTURE_DIR}")
    
    # Check if model files exist
    print("\nModel Files:")
    model_files = [
        ("emotion-ferplus-8.onnx", FER_ONNX),
        ("age_deploy.prototxt", AGE_PROTO),
        ("age_net.caffemodel", AGE_MODEL),
        ("gender_deploy.prototxt", GENDER_PROTO),
        ("gender_net.caffemodel", GENDER_MODEL),
        ("haarcascade_frontalface_default.xml", os.path.join(MODELS_DIR, "haarcascade_frontalface_default.xml"))
    ]
    
    for name, path in model_files:
        exists = os.path.exists(path)
        status_icon = "✅" if exists else "❌"
        print(f"  {status_icon} {name}: {'Found' if exists else 'Missing'}")
        if not exists:
            print(f"      Expected at: {path}")
    
    print("=" * 50)
    
    all_models_ready = all(models_status.values())
    if all_models_ready:
        print("🎉 All models loaded successfully! Ready to start the server.")
        return True
    else:
        print("⚠️  Some models failed to load. Please check the model files.")
        return False

if __name__ == "__main__":
    success = test_models()
    if success:
        print("\n🚀 Starting Flask server...")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("\n❌ Cannot start server due to missing models.")
        sys.exit(1)