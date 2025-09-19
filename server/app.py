import os
import cv2
import numpy as np
import onnxruntime as ort
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import time
from datetime import datetime
import csv

app = Flask(__name__)
CORS(app) 

# ---------------- Paths & Models ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "demo", "models"))
CAPTURE_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "demo", "captures"))
os.makedirs(CAPTURE_DIR, exist_ok=True)
METADATA_CSV = os.path.join(CAPTURE_DIR, "captures_metadata.csv")

FER_ONNX = os.path.join(MODELS_DIR, "emotion-ferplus-8.onnx")
AGE_PROTO = os.path.join(MODELS_DIR, "age_deploy.prototxt")
AGE_MODEL = os.path.join(MODELS_DIR, "age_net.caffemodel")
GENDER_PROTO = os.path.join(MODELS_DIR, "gender_deploy.prototxt")
GENDER_MODEL = os.path.join(MODELS_DIR, "gender_net.caffemodel")

AGE_BUCKETS = ['(0-2)','(4-6)','(8-12)','(15-20)',
               '(25-32)','(38-43)','(48-53)','(60-100)']
MODEL_MEAN_VALUES = (78.4, 87.7, 114.9)

GENDER_CLASSES = ["Male", "Female"]

FER_CLASSES = ['neutral','happiness','surprise',
               'sadness','anger','disgust','fear','contempt']
SMILE_IDX = FER_CLASSES.index('happiness')

# ---------------- Load Models ----------------
print("Loading AI models...")
try:
    fer_sess = ort.InferenceSession(FER_ONNX, providers=["CPUExecutionProvider"])
    fer_input_name = fer_sess.get_inputs()[0].name
    print("[OK] Emotion model loaded")
except Exception as e:
    print(f"[ERROR] Failed to load emotion model: {e}")
    fer_sess = None

try:
    age_net = cv2.dnn.readNetFromCaffe(AGE_PROTO, AGE_MODEL)
    print("[OK] Age model loaded")
except Exception as e:
    print(f"[ERROR] Failed to load age model: {e}")
    age_net = None

try:
    gender_net = cv2.dnn.readNetFromCaffe(GENDER_PROTO, GENDER_MODEL)
    print("[OK] Gender model loaded")
except Exception as e:
    print(f"[ERROR] Failed to load gender model: {e}")
    gender_net = None

try:
    face_cascade = cv2.CascadeClassifier(os.path.join(MODELS_DIR, "haarcascade_frontalface_default.xml"))
    print("[OK] Face detection model loaded")
except Exception as e:
    print(f"[ERROR] Failed to load face detection: {e}")
    face_cascade = None

# ---------------- Utils ----------------
def softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum(axis=-1, keepdims=True)

def save_metadata(row):
    header = ["timestamp","filename","smile_prob","age_label","age_conf",
              "gender_label","gender_conf","emotion_label","emotion_conf","x","y","w","h"]
    write_header = not os.path.exists(METADATA_CSV)
    with open(METADATA_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if write_header: 
            writer.writerow(header)
        writer.writerow(row)

def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 to bytes
        img_bytes = base64.b64decode(base64_string)
        
        # Convert to numpy array
        nparr = np.frombuffer(img_bytes, np.uint8)
        
        # Decode to OpenCV image
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return img
    except Exception as e:
        print(f"Error converting base64 to image: {e}")
        return None

def image_to_base64(img):
    """Convert OpenCV image to base64 string"""
    try:
        _, buffer = cv2.imencode('.jpg', img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        print(f"Error converting image to base64: {e}")
        return None

# ---------------- API Routes ----------------

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models': {
            'emotion': fer_sess is not None,
            'age': age_net is not None,
            'gender': gender_net is not None,
            'face_detection': face_cascade is not None
        }
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_frame():
    """Analyze a single frame for face detection and AI predictions"""
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Convert base64 to image
        img = base64_to_image(data['image'])
        if img is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        print(f"Image shape: {img.shape}, Gray shape: {gray.shape}")
        
        # Detect faces
        faces = []
        if face_cascade is not None:
            detected_faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(80, 80))
            print(f"Detected {len(detected_faces)} faces: {detected_faces}")
            
            for (x, y, w, h) in detected_faces:
                print(f"Processing face at ({x}, {y}, {w}, {h})")
                face_bgr = img[y:y+h, x:x+w]
                
                # Initialize default values
                smile_prob = 0.0
                age_label, age_conf = "Unknown", 0.0
                gender_label, gender_conf = "Unknown", 0.0
                emotion_label, emotion_conf = "neutral", 0.0
                
                # Emotion analysis
                if fer_sess is not None:
                    try:
                        face_gray = cv2.resize(cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY), (64, 64))
                        fer_in = np.expand_dims(np.expand_dims(face_gray.astype(np.float32)/255.0, 0), 0)
                        logits = fer_sess.run(None, {fer_input_name: fer_in})[0].squeeze()
                        probs = softmax(logits)
                        emotion_idx = np.argmax(probs)
                        emotion_label = FER_CLASSES[emotion_idx]
                        emotion_conf = float(probs[emotion_idx])
                        smile_prob = float(probs[SMILE_IDX])
                        print(f"Emotion analysis: {emotion_label} ({emotion_conf:.3f}), Smile: {smile_prob:.3f}")
                    except Exception as e:
                        print(f"Emotion analysis error: {e}")
                
                # Age prediction
                if age_net is not None:
                    try:
                        blob = cv2.dnn.blobFromImage(face_bgr, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False)
                        age_net.setInput(blob)
                        age_preds = age_net.forward()
                        age_idx = age_preds[0].argmax()
                        age_label = AGE_BUCKETS[age_idx]
                        age_conf = float(age_preds[0][age_idx])
                        print(f"Age prediction: {age_label} ({age_conf:.3f})")
                    except Exception as e:
                        print(f"Age prediction error: {e}")
                
                # Gender prediction
                if gender_net is not None:
                    try:
                        blob = cv2.dnn.blobFromImage(face_bgr, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False)
                        gender_net.setInput(blob)
                        gender_preds = gender_net.forward()
                        gender_idx = gender_preds[0].argmax()
                        gender_label = GENDER_CLASSES[gender_idx]
                        gender_conf = float(gender_preds[0][gender_idx])
                        print(f"Gender prediction: {gender_label} ({gender_conf:.3f})")
                    except Exception as e:
                        print(f"Gender prediction error: {e}")
                
                faces.append({
                    'x': int(x),
                    'y': int(y),
                    'width': int(w),
                    'height': int(h),
                    'emotion': emotion_label,
                    'emotion_confidence': round(emotion_conf, 3),
                    'smile_probability': round(smile_prob, 3),
                    'age': age_label,
                    'age_confidence': round(age_conf, 3),
                    'gender': gender_label,
                    'gender_confidence': round(gender_conf, 3)
                })
        
        return jsonify({
            'faces': faces,
            'face_count': len(faces),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/api/debug-test', methods=['POST'])
def debug_test():
    """Simple test endpoint to verify debug functionality"""
    try:
        print("=== DEBUG TEST ENDPOINT CALLED ===")
        data = request.get_json()
        print(f"Received data keys: {list(data.keys()) if data else 'None'}")
        
        return jsonify({
            'status': 'success',
            'message': 'Debug test endpoint working',
            'received_keys': list(data.keys()) if data else []
        })
    except Exception as e:
        print(f"Debug test error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug-faces', methods=['POST'])
def debug_faces():
    """Debug endpoint that returns image with face detection boxes"""
    print("=== DEBUG FACES ENDPOINT CALLED ===")
    print(f"Request method: {request.method}")
    print(f"Request content type: {request.content_type}")
    
    try:
        data = request.get_json()
        print(f"Data received: {data is not None}")
        
        if not data or 'image' not in data:
            print("ERROR: No image data provided")
            return jsonify({'error': 'No image data provided'}), 400
        
        print(f"Image data length: {len(data['image']) if data['image'] else 0}")
        
        # Convert base64 to image
        img = base64_to_image(data['image'])
        if img is None:
            print("ERROR: Failed to convert base64 to image")
            return jsonify({'error': 'Invalid image data'}), 400
        
        print(f"Image converted successfully, shape: {img.shape}")
        
        # Make a copy for drawing
        debug_img = img.copy()
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        print(f"Grayscale conversion done, shape: {gray.shape}")
        
        # Detect faces and draw boxes
        faces_info = []
        if face_cascade is not None:
            print("Running face detection...")
            detected_faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(80, 80))
            print(f"Face detection complete: Found {len(detected_faces)} faces")
            
            for i, (x, y, w, h) in enumerate(detected_faces):
                print(f"Processing face {i+1} at ({x}, {y}, {w}, {h})")
                
                # Draw face rectangle
                cv2.rectangle(debug_img, (x, y), (x+w, y+h), (0, 255, 0), 2)
                
                # Add face number label
                cv2.putText(debug_img, f"Face {i+1}", (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
                faces_info.append({
                    'id': i+1,
                    'bbox': [x, y, w, h]
                })
        
        print("Converting debug image to base64...")
        # Convert debug image to base64
        debug_img_base64 = image_to_base64(debug_img)
        
        if debug_img_base64 is None:
            print("ERROR: Failed to convert debug image to base64")
            return jsonify({'error': 'Failed to convert debug image'}), 500
        
        print(f"Debug processing complete. Returning {len(faces_info)} faces")
        return jsonify({
            'debug_image': debug_img_base64,
            'faces': faces_info,
            'face_count': len(faces_info),
            'models_loaded': {
                'emotion': fer_sess is not None,
                'age': age_net is not None,
                'gender': gender_net is not None,
                'face_detection': face_cascade is not None
            }
        })
        
    except Exception as e:
        print(f"=== DEBUG ERROR ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        print("===================")
        return jsonify({'error': f'Debug failed: {str(e)}'}), 500

@app.route('/api/capture', methods=['POST'])
def capture_photo():
    """Capture and save a photo with metadata"""
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Convert base64 to image
        img = base64_to_image(data['image'])
        if img is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # ANALYZE THE IMAGE FIRST to get real AI predictions
        # Reuse the analysis logic from analyze_frame
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces_data = []
        
        if face_cascade is not None:
            detected_faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(80, 80))
            
            for (x, y, w, h) in detected_faces:
                face_bgr = img[y:y+h, x:x+w]
                
                # Initialize default values
                smile_prob = 0.0
                age_label, age_conf = "Unknown", 0.0
                gender_label, gender_conf = "Unknown", 0.0
                emotion_label, emotion_conf = "neutral", 0.0
                
                # Emotion analysis
                if fer_sess is not None:
                    try:
                        face_gray = cv2.resize(cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY), (64, 64))
                        fer_in = np.expand_dims(np.expand_dims(face_gray.astype(np.float32)/255.0, 0), 0)
                        logits = fer_sess.run(None, {fer_input_name: fer_in})[0].squeeze()
                        probs = softmax(logits)
                        emotion_idx = np.argmax(probs)
                        emotion_label = FER_CLASSES[emotion_idx]
                        emotion_conf = float(probs[emotion_idx])
                        smile_prob = float(probs[SMILE_IDX])
                    except Exception as e:
                        print(f"Emotion analysis error: {e}")
                
                # Age prediction
                if age_net is not None:
                    try:
                        blob = cv2.dnn.blobFromImage(face_bgr, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False)
                        age_net.setInput(blob)
                        age_preds = age_net.forward()
                        age_idx = age_preds[0].argmax()
                        age_label = AGE_BUCKETS[age_idx]
                        age_conf = float(age_preds[0][age_idx])
                    except Exception as e:
                        print(f"Age prediction error: {e}")
                
                # Gender prediction
                if gender_net is not None:
                    try:
                        blob = cv2.dnn.blobFromImage(face_bgr, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False)
                        gender_net.setInput(blob)
                        gender_preds = gender_net.forward()
                        gender_idx = gender_preds[0].argmax()
                        gender_label = GENDER_CLASSES[gender_idx]
                        gender_conf = float(gender_preds[0][gender_idx])
                    except Exception as e:
                        print(f"Gender prediction error: {e}")
                
                faces_data.append({
                    'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h),
                    'emotion': emotion_label, 'emotion_confidence': emotion_conf,
                    'smile_probability': smile_prob,
                    'age': age_label, 'age_confidence': age_conf,
                    'gender': gender_label, 'gender_confidence': gender_conf
                })
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}.jpg"
        filepath = os.path.join(CAPTURE_DIR, filename)
        
        # Save image
        cv2.imwrite(filepath, img)
        
        # Use AI analysis results or fallback to provided metadata
        if faces_data and len(faces_data) > 0:
            # Use the first detected face
            face = faces_data[0]
            metadata = {
                'smile_prob': face.get('smile_probability', 0),
                'age_label': face.get('age', 'Unknown'),
                'age_conf': face.get('age_confidence', 0),
                'gender_label': face.get('gender', 'Unknown'),
                'gender_conf': face.get('gender_confidence', 0),
                'emotion_label': face.get('emotion', 'Unknown'),
                'emotion_conf': face.get('emotion_confidence', 0),
                'x': face.get('x', 0),
                'y': face.get('y', 0),
                'w': face.get('width', 0),
                'h': face.get('height', 0)
            }
        else:
            # Fallback to provided metadata if no face detected
            provided_metadata = data.get('metadata', {})
            metadata = {
                'smile_prob': provided_metadata.get('smile_prob', 0),
                'age_label': provided_metadata.get('age_label', 'No face detected'),
                'age_conf': provided_metadata.get('age_conf', 0),
                'gender_label': provided_metadata.get('gender_label', 'No face detected'),
                'gender_conf': provided_metadata.get('gender_conf', 0),
                'emotion_label': provided_metadata.get('emotion_label', 'No face detected'),
                'emotion_conf': provided_metadata.get('emotion_conf', 0),
                'x': provided_metadata.get('x', 0),
                'y': provided_metadata.get('y', 0),
                'w': provided_metadata.get('w', 0),
                'h': provided_metadata.get('h', 0)
            }
        
        # Save metadata to CSV
        row = [
            datetime.now().isoformat(),
            filename,
            metadata['smile_prob'],
            metadata['age_label'],
            metadata['age_conf'],
            metadata['gender_label'],
            metadata['gender_conf'],
            metadata['emotion_label'],
            metadata['emotion_conf'],
            metadata['x'],
            metadata['y'],
            metadata['w'],
            metadata['h']
        ]
        save_metadata(row)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'timestamp': timestamp,
            'analysis': metadata
        })
        
    except Exception as e:
        print(f"Capture error: {e}")
        return jsonify({'error': f'Capture failed: {str(e)}'}), 500

@app.route('/api/gallery', methods=['GET'])
def get_gallery():
    """Get list of captured photos with metadata"""
    try:
        photos = []
        
        # Read metadata CSV
        if os.path.exists(METADATA_CSV):
            with open(METADATA_CSV, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    photo_path = os.path.join(CAPTURE_DIR, row['filename'])
                    if os.path.exists(photo_path):
                        # Convert image to base64 for frontend
                        img = cv2.imread(photo_path)
                        if img is not None:
                            img_base64 = image_to_base64(img)
                            photos.append({
                                'filename': row['filename'],
                                'timestamp': row['timestamp'],
                                'image': img_base64,
                                'metadata': {
                                    'smile_prob': float(row['smile_prob']) if row['smile_prob'] != '--' else 0,
                                    'age_label': row['age_label'],
                                    'age_conf': float(row['age_conf']) if row['age_conf'] != '--' else 0,
                                    'gender_label': row['gender_label'],
                                    'gender_conf': float(row['gender_conf']) if row['gender_conf'] != '--' else 0,
                                    'emotion_label': row['emotion_label'],
                                    'emotion_conf': float(row['emotion_conf']) if row['emotion_conf'] != '--' else 0
                                }
                            })
        
        return jsonify({
            'photos': photos,
            'count': len(photos)
        })
        
    except Exception as e:
        print(f"Gallery error: {e}")
        return jsonify({'error': f'Gallery failed: {str(e)}'}), 500

@app.route('/api/gallery/clear', methods=['DELETE'])
def clear_gallery():
    """Delete all captured photos and metadata"""
    try:
        import shutil
        
        # Delete all files in captures directory except .gitkeep
        if os.path.exists(CAPTURE_DIR):
            for filename in os.listdir(CAPTURE_DIR):
                if filename != '.gitkeep':
                    file_path = os.path.join(CAPTURE_DIR, filename)
                    if os.path.isfile(file_path):
                        os.remove(file_path)
        
        # Clear metadata CSV by recreating it with just headers
        with open(METADATA_CSV, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'filename', 'smile_prob', 'age_label', 'age_conf', 
                           'gender_label', 'gender_conf', 'emotion_label', 'emotion_conf',
                           'x', 'y', 'w', 'h'])
        
        return jsonify({
            'success': True,
            'message': 'Gallery cleared successfully'
        })
        
    except Exception as e:
        print(f"Clear gallery error: {e}")
        return jsonify({'error': f'Clear failed: {str(e)}'}), 500

@app.route('/api/gallery/<filename>', methods=['DELETE'])
def delete_photo(filename):
    """Delete a specific photo"""
    try:
        # Delete image file
        file_path = os.path.join(CAPTURE_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Remove from metadata CSV (recreate CSV without this entry)
        if os.path.exists(METADATA_CSV):
            # Read all entries except the one to delete
            rows_to_keep = []
            with open(METADATA_CSV, 'r', newline='') as f:
                reader = csv.reader(f)
                header = next(reader, None)
                if header:
                    rows_to_keep.append(header)
                for row in reader:
                    if len(row) > 1 and row[1] != filename:  # filename is in column 1
                        rows_to_keep.append(row)
            
            # Write back the filtered data
            with open(METADATA_CSV, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerows(rows_to_keep)
        
        return jsonify({
            'success': True,
            'message': f'Photo {filename} deleted successfully'
        })
        
    except Exception as e:
        print(f"Delete photo error: {e}")
        return jsonify({'error': f'Delete failed: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting Emotion Detection API Server...")
    print("Available endpoints:")
    print("  GET  /api/health - Health check")
    print("  POST /api/analyze - Analyze frame for faces and emotions")
    print("  POST /api/debug-faces - Debug face detection with visualization")
    print("  POST /api/capture - Capture and save photo")
    print("  GET  /api/gallery - Get captured photos")
    print("\nServer running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)