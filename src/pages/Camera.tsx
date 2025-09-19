import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface Face {
  x: number;
  y: number;
  width: number;
  height: number;
  emotion: string;
  emotion_confidence: number;
  smile_probability: number;
  age: string;
  age_confidence: number;
  gender: string;
  gender_confidence: number;
}

interface ApiResponse {
  faces: Face[];
  face_count: number;
  timestamp: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Camera off");
  const [statusType, setStatusType] = useState<'success'|'error'|'scanning'>("scanning");
  const [faces, setFaces] = useState<Face[]>([]);
  const [autoCapture, setAutoCapture] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [fps, setFps] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const lastCapture = useRef(Date.now());
  const lastAnalysis = useRef(Date.now());
  const fpsCounter = useRef(0);
  const lastFpsUpdate = useRef(Date.now());

  // Check if backend is available
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log('Backend health:', data);
        setBackendAvailable(true);
        setStatus("Backend connected");
      } else {
        setBackendAvailable(false);
        setStatus("Backend unavailable - using simulation");
        setStatusType("error");
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendAvailable(false);
      setStatus("Backend offline - using simulation");
      setStatusType("error");
    }
  };

  // Camera control functions
  const startCamera = async () => {
    try {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            startDetection();
          }
        };
        setCameraOn(true);
        setStatus("Camera initialized");
        setStatusType("success");
      }
    } catch (err) {
      setStatus("Camera access denied");
      setStatusType("error");
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setCameraOn(false);
    setStatus("Camera off");
    setStatusType("scanning");
    setFaces([]);
    setFps(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line
  }, []);

  const captureFrameAsBase64 = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const analyzeFrame = async (): Promise<Face[]> => {
    if (!backendAvailable) {
      return generateMockDetection();
    }

    const frameData = captureFrameAsBase64();
    if (!frameData) return [];

    try {
      setIsAnalyzing(true);
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: frameData }),
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        return data.faces;
      } else {
        console.error('Analysis failed:', response.statusText);
        return generateMockDetection();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      return generateMockDetection();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const debugFaceDetection = async (): Promise<void> => {
    if (!backendAvailable || !videoRef.current || !canvasRef.current) return;

    const frameData = captureFrameAsBase64();
    if (!frameData) return;

    try {
      const response = await fetch(`${API_BASE_URL}/debug-faces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: frameData }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Debug response:', data);
        
        // Convert backend faces data to our Face interface format
        const convertedFaces: Face[] = data.faces.map((face: any) => ({
          x: face.bbox[0],
          y: face.bbox[1],
          width: face.bbox[2],
          height: face.bbox[3],
          emotion: face.emotion,
          emotion_confidence: face.emotion_confidence,
          smile_probability: face.smile_probability,
          age: face.age,
          age_confidence: face.age_confidence,
          gender: face.gender,
          gender_confidence: face.gender_confidence
        }));
        
        // Update faces state for live predictions display
        setFaces(convertedFaces);
        
        // Display the debug image in the canvas
        if (data.debug_image && canvasRef.current) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvasRef.current!.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
              ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
            }
          };
          img.src = data.debug_image;
        }
        
        // Update status with debug info
        if (data.face_count > 0) {
          setStatus(`Debug: ${data.face_count} faces detected with live AI predictions`);
          setStatusType("success");
        } else {
          setStatus("Debug: No faces detected");
          setStatusType("scanning");
        }
        
      } else {
        console.error('Debug failed:', response.statusText);
        setStatus("Debug request failed");
        setStatusType("error");
      }
    } catch (error) {
      console.error('Debug error:', error);
      setStatus("Debug error - check console");
      setStatusType("error");
    }
  };

  const generateMockDetection = (): Face[] => {
    if (!canvasRef.current) return [];
    
    const hasFace = Math.random() > 0.3;
    if (!hasFace) return [];
    
    const emotions = ["happiness", "neutral", "surprise", "sadness"];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const confidence = 0.6 + Math.random() * 0.4;
    
    return [{
      x: canvasRef.current.width * 0.2 + Math.random() * canvasRef.current.width * 0.6,
      y: canvasRef.current.height * 0.2 + Math.random() * canvasRef.current.height * 0.6,
      width: canvasRef.current.width * 0.2,
      height: canvasRef.current.height * 0.25,
      emotion,
      emotion_confidence: confidence,
      smile_probability: emotion === "happiness" ? confidence : Math.random() * 0.3,
      age: "(25-32)",
      age_confidence: 0.8 + Math.random() * 0.2,
      gender: Math.random() > 0.5 ? "Female" : "Male",
      gender_confidence: 0.7 + Math.random() * 0.3
    }];
  };

  function startDetection() {
    detectFaces();
  }

  async function detectFaces() {
    if (!videoRef.current || !canvasRef.current || !cameraOn) return;
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Update FPS counter
    fpsCounter.current++;
    const now = Date.now();
    if (now - lastFpsUpdate.current > 1000) {
      setFps(fpsCounter.current);
      fpsCounter.current = 0;
      lastFpsUpdate.current = now;
    }

    // Throttle analysis to every 1000ms (1 second) for stable predictions
    let detectedFaces = faces; // Keep previous faces
    if (now - lastAnalysis.current > 1000 && !isAnalyzing) {
      if (debugMode && backendAvailable) {
        // In debug mode, use debug endpoint to show face detection boxes
        await debugFaceDetection();
        return; // Skip normal drawing in debug mode
      } else {
        // Normal analysis mode
        detectedFaces = await analyzeFrame();
        setFaces(detectedFaces);
        lastAnalysis.current = now;
      }
    }

    // Clear canvas and draw results (only in normal mode)
    if (!debugMode) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      if (detectedFaces.length > 0) {
        setStatus(`${detectedFaces.length} face(s) detected`);
        setStatusType("success");
        
        detectedFaces.forEach((face) => {
          drawFaceBox(ctx, face);
          
          // Auto-capture logic - Match demo exactly: only check smile probability
          if (autoCapture && face.smile_probability > 0.6) {
            if (now - lastCapture.current > 2500) { // 2.5 second cooldown to match demo
              capturePhoto(face);
              lastCapture.current = now;
            }
          }
        });
      } else {
        setStatus("Scanning for faces...");
        setStatusType("scanning");
      }
    }

    animationRef.current = requestAnimationFrame(detectFaces);
  }

  function drawFaceBox(ctx: CanvasRenderingContext2D, face: Face) {
    const isSmiling = face.smile_probability > 0.6; // Match demo threshold
    
    // Draw face rectangle
    ctx.strokeStyle = isSmiling ? "#3b82f6" : "#22c55e";
    ctx.lineWidth = 2;
    ctx.strokeRect(face.x, face.y, face.width, face.height);
    
    // Draw info background (made taller to fit more info)
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(face.x, face.y - 90, 250, 85);
    
    // Draw text info with confidence scores
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`${face.emotion} (${Math.round(face.emotion_confidence * 100)}%)`, face.x + 4, face.y - 75);
    ctx.fillText(`Smile: ${Math.round(face.smile_probability * 100)}%`, face.x + 4, face.y - 60);
    ctx.fillText(`${face.gender} (${Math.round(face.gender_confidence * 100)}%)`, face.x + 4, face.y - 45);
    ctx.fillText(`Age: ${face.age} (${Math.round(face.age_confidence * 100)}%)`, face.x + 4, face.y - 30);
    
    // Highlight smiling faces
    if (isSmiling) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#3b82f6";
      ctx.strokeRect(face.x - 2, face.y - 2, face.width + 4, face.height + 4);
      ctx.shadowBlur = 0;
    }
  }

  const capturePhoto = async (face?: Face) => {
    const frameData = captureFrameAsBase64();
    if (!frameData) return;

    try {
      const metadata = face ? {
        smile_prob: face.smile_probability,
        age_label: face.age,
        age_conf: face.age_confidence,
        gender_label: face.gender,
        gender_conf: face.gender_confidence,
        emotion_label: face.emotion,
        emotion_conf: face.emotion_confidence,
        x: face.x,
        y: face.y,
        w: face.width,
        h: face.height
      } : {};

      if (backendAvailable) {
        const response = await fetch(`${API_BASE_URL}/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            image: frameData,
            metadata 
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Photo captured:', result);
          setStatus("Photo captured!");
        } else {
          console.error('Capture failed:', response.statusText);
        }
      } else {
        console.log('Photo captured (simulation mode)');
        setStatus("Photo captured (simulation)!");
      }
    } catch (error) {
      console.error('Capture error:', error);
    }
  };

  const currentFace = faces.length > 0 ? faces[0] : null;

  return (
    <div className="camera-container mx-auto max-w-7xl"> {/* Increased from max-w-4xl */}
      <div className="camera-header flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Smart Camera</h2> {/* Increased text size */}
        <div className="camera-stats flex gap-4 text-sm">
          <span className="stat">{fps} FPS</span>
          <span className={`stat ${backendAvailable ? 'text-green-400' : 'text-yellow-400'}`}>
            {backendAvailable ? 'AI Active' : 'Simulation'}
          </span>
          {isAnalyzing && <span className="stat text-blue-400">Analyzing...</span>}
        </div>
      </div>
      
      <div className="camera-main flex flex-col xl:flex-row gap-8"> {/* Changed from lg:flex-row and increased gap */}
        <div className="video-container relative flex-1">
          {!cameraOn && (
            <div className="absolute inset-0 bg-slate-800 rounded-lg shadow-xl flex flex-col items-center justify-center text-center z-10" style={{ minHeight: '400px', maxHeight: '600px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 mb-4">
                <path d="M23 7l-7 5 7 5V7z"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Camera is Off</h3>
              <p className="text-slate-500">Click "Turn On Camera" to start the video feed</p>
            </div>
          )}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="rounded-lg shadow-xl w-full h-auto bg-black" 
            style={{ minHeight: '400px', maxHeight: '600px' }} /* Added size constraints */
          />
          <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full pointer-events-none" 
          />
          
          <div className="detection-info absolute left-4 bottom-4 bg-slate-900/90 backdrop-blur rounded-xl px-6 py-4 flex flex-col gap-2 min-w-[250px]">
            <div className="detection-status flex items-center gap-3">
              <span 
                className="status-dot w-4 h-4 rounded-full animate-pulse" 
                style={{
                  background: statusType === 'success' ? '#22c55e' : 
                             statusType === 'error' ? '#ef4444' : '#3b82f6'
                }}
              />
              <span className="text-sm font-medium">{status}</span>
            </div>
            
            {currentFace && (
              <>
                <div className="emotion-display flex items-center justify-between text-sm">
                  <span className="font-semibold text-blue-300">Emotion:</span>
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-medium">{currentFace.emotion}</span>
                    <span className="text-xs bg-blue-600/20 px-2 py-1 rounded">
                      {Math.round(currentFace.emotion_confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div className="smile-display flex items-center justify-between text-sm">
                  <span className="font-semibold text-green-300">Smile:</span>
                  <span className="text-xs bg-green-600/20 px-2 py-1 rounded">
                    {Math.round(currentFace.smile_probability * 100)}%
                  </span>
                </div>
                <div className="gender-display flex items-center justify-between text-sm">
                  <span className="font-semibold text-pink-300">Gender:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currentFace.gender}</span>
                    <span className="text-xs bg-pink-600/20 px-2 py-1 rounded">
                      {Math.round(currentFace.gender_confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div className="age-display flex items-center justify-between text-sm">
                  <span className="font-semibold text-orange-300">Age:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currentFace.age}</span>
                    <span className="text-xs bg-orange-600/20 px-2 py-1 rounded">
                      {Math.round(currentFace.age_confidence * 100)}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="controls flex flex-col gap-6 items-center justify-center min-w-[250px] bg-slate-800/50 rounded-xl p-6">
          <div className="text-center mb-2">
            <h3 className="text-lg font-semibold mb-2">Camera Controls</h3>
            <p className="text-sm text-slate-400">Take photos and adjust settings</p>
          </div>
          
          <button 
            className="capture-btn w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-105 active:scale-95"
            onClick={() => capturePhoto()}
            title="Take photo now"
            disabled={!cameraOn}
          >
            <div className="capture-inner w-14 h-14 rounded-full bg-white flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </button>

          <button
            onClick={cameraOn ? stopCamera : startCamera}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              cameraOn 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {cameraOn ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
                Turn Off Camera
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 7l-7 5 7 5V7z"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                Turn On Camera
              </>
            )}
          </button>
          
          <div className="w-full space-y-4">
            <label className={`flex items-center gap-3 cursor-pointer p-3 bg-slate-700/50 rounded-lg transition-colors ${cameraOn ? 'hover:bg-slate-700/70' : 'opacity-50 cursor-not-allowed'}`}>
              <input 
                type="checkbox" 
                checked={autoCapture} 
                onChange={e => setAutoCapture(e.target.checked)} 
                disabled={!cameraOn}
                className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-400 bg-slate-700 focus:ring-blue-500 focus:ring-2 disabled:opacity-50" 
              />
              <div>
                <span className="text-sm font-medium">Auto capture on smile</span>
                <p className="text-xs text-slate-400">Automatically take photos when smiling</p>
              </div>
            </label>
            
            <label className={`flex items-center gap-3 cursor-pointer p-3 bg-slate-700/50 rounded-lg transition-colors ${cameraOn && backendAvailable ? 'hover:bg-slate-700/70' : 'opacity-50 cursor-not-allowed'}`}>
              <input 
                type="checkbox" 
                checked={debugMode} 
                onChange={e => setDebugMode(e.target.checked)} 
                disabled={!cameraOn || !backendAvailable}
                className="form-checkbox h-4 w-4 text-purple-600 rounded border-slate-400 bg-slate-700 focus:ring-purple-500 focus:ring-2 disabled:opacity-50" 
              />
              <div>
                <span className="text-sm font-medium">Debug Mode</span>
                <p className="text-xs text-slate-400">Show face detection boxes and predictions</p>
              </div>
            </label>

            <button
              onClick={() => {
                console.log('Debug button clicked, camera on:', cameraOn, 'backend available:', backendAvailable, 'debug mode:', debugMode);
                debugFaceDetection();
              }}
              disabled={!cameraOn || !backendAvailable}
              className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                cameraOn && backendAvailable 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
                <path d="m22 2-7 7"/>
              </svg>
              Debug Face Detection
            </button>
            
            <button
              onClick={checkBackendHealth}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              Reconnect Backend
            </button>
            
            <Link
              to="/gallery"
              className="w-full px-4 py-3 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
              </svg>
              View Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}