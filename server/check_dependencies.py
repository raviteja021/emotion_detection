#!/usr/bin/env python3
"""
Dependency checker for emotion detection backend
"""

import sys
import importlib.util

required_packages = {
    'cv2': 'opencv-python',
    'flask': 'flask',
    'flask_cors': 'flask-cors',
    'numpy': 'numpy',
    'onnxruntime': 'onnxruntime',
    'PIL': 'pillow'
}

def check_package(package_name, pip_name):
    """Check if a package is installed"""
    try:
        spec = importlib.util.find_spec(package_name)
        if spec is not None:
            print(f"✅ {pip_name} - INSTALLED")
            return True
        else:
            print(f"❌ {pip_name} - NOT FOUND")
            return False
    except ImportError:
        print(f"❌ {pip_name} - NOT FOUND")
        return False

def main():
    print("🔍 Checking required dependencies...\n")
    
    missing_packages = []
    
    for package, pip_name in required_packages.items():
        if not check_package(package, pip_name):
            missing_packages.append(pip_name)
    
    if missing_packages:
        print(f"\n⚠️  Missing {len(missing_packages)} packages:")
        print("\nTo install missing packages, run:")
        print(f"pip install {' '.join(missing_packages)}")
        
        print("\nOr install all at once:")
        print("pip install -r server/requirements.txt")
        return False
    else:
        print("\n🎉 All dependencies are installed!")
        print("You can now run: python server/app.py")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)