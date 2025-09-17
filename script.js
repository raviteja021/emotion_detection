class SmartSelfieApp {
    constructor() {
        this.currentView = 'dashboard';
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.stream = null;
        this.photos = [];
        this.isDetecting = false;
        this.autoCapture = true;
        this.lastEmotionCheck = 0;
        this.performanceData = [];
        this.animationId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStoredPhotos();
        this.startPerformanceMonitoring();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Feature buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleAction(action);
            });
        });

        // Camera controls
        const captureBtn = document.getElementById('capture-btn');
        const autoCapture = document.getElementById('auto-capture');
        
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.capturePhoto());
        }

        if (autoCapture) {
            autoCapture.addEventListener('change', (e) => {
                this.autoCapture = e.target.checked;
            });
        }

        // Settings
        this.setupSettingsListeners();

        // Modal
        this.setupModalListeners();
    }

    setupSettingsListeners() {
        const emotionSensitivity = document.getElementById('emotion-sensitivity');
        const smileThreshold = document.getElementById('smile-threshold');

        if (emotionSensitivity) {
            emotionSensitivity.addEventListener('input', (e) => {
                const value = Math.round(e.target.value * 100);
                e.target.nextElementSibling.textContent = `${value}%`;
            });
        }

        if (smileThreshold) {
            smileThreshold.addEventListener('input', (e) => {
                const value = Math.round(e.target.value * 100);
                e.target.nextElementSibling.textContent = `${value}%`;
            });
        }
    }

    setupModalListeners() {
        const modal = document.getElementById('photo-modal');
        const closeBtn = modal.querySelector('.modal-close');
        const downloadBtn = document.getElementById('download-photo');

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        downloadBtn.addEventListener('click', () => {
            const img = document.getElementById('modal-image');
            const link = document.createElement('a');
            link.download = `selfie-${Date.now()}.jpg`;
            link.href = img.src;
            link.click();
        });
    }

    handleAction(action) {
        switch(action) {
            case 'camera':
                this.switchView('camera');
                break;
            case 'gallery':
                this.switchView('gallery');
                break;
            case 'benchmarks':
                this.switchView('benchmarks');
                break;
            case 'settings':
                this.switchView('settings');
                break;
            case 'back':
                this.switchView('dashboard');
                break;
        }
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === viewName) {
                item.classList.add('active');
            }
        });

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show target view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }

        this.currentView = viewName;

        // Handle view-specific logic
        if (viewName === 'camera') {
            this.initCamera();
        } else if (viewName === 'gallery') {
            this.updateGallery();
        } else if (viewName === 'benchmarks') {
            this.updateBenchmarks();
        } else {
            this.stopCamera();
        }
    }

    async initCamera() {
        try {
            this.video = document.getElementById('video');
            this.canvas = document.getElementById('overlay-canvas');
            this.context = this.canvas.getContext('2d');

            // Stop any existing stream
            this.stopCamera();

            // Get camera stream
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: 1280, 
                    height: 720,
                    facingMode: 'user'
                },
                audio: false
            });

            this.video.srcObject = this.stream;
            
            this.video.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.startDetection();
            });

            this.updateDetectionStatus('Camera initialized', 'success');
        } catch (error) {
            console.error('Camera initialization failed:', error);
            this.updateDetectionStatus('Camera access denied', 'error');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.isDetecting = false;
    }

    startDetection() {
        this.isDetecting = true;
        this.detectFaces();
    }

    detectFaces() {
        if (!this.isDetecting || !this.video.videoWidth) {
            return;
        }

        // Simulate face detection and emotion analysis
        const now = Date.now();
        
        // Mock detection results
        const mockResults = this.generateMockDetection();
        
        // Clear previous overlays
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (mockResults.faces.length > 0) {
            this.updateDetectionStatus(`${mockResults.faces.length} face(s) detected`, 'success');
            
            // Draw face boxes and emotions
            mockResults.faces.forEach(face => {
                this.drawFaceBox(face);
                this.updateEmotionDisplay(face.emotion, face.confidence);
                
                // Auto capture on smile
                if (this.autoCapture && face.emotion === 'happy' && face.confidence > 0.8) {
                    if (now - this.lastEmotionCheck > 2000) { // Prevent rapid captures
                        this.capturePhoto();
                        this.lastEmotionCheck = now;
                    }
                }
            });
        } else {
            this.updateDetectionStatus('Scanning for faces...', 'scanning');
            this.updateEmotionDisplay('-', 0);
        }

        // Update performance metrics
        this.updatePerformanceMetrics();

        this.animationId = requestAnimationFrame(() => this.detectFaces());
    }

    generateMockDetection() {
        // Simulate realistic face detection
        const hasFace = Math.random() > 0.3; // 70% chance of detecting a face
        
        if (!hasFace) {
            return { faces: [] };
        }

        const emotions = ['happy', 'neutral', 'surprised', 'sad'];
        const emotion = emotions[Math.floor(Math.random() * emotions.length)];
        const confidence = 0.6 + Math.random() * 0.4; // 60-100% confidence

        const face = {
            x: this.canvas.width * 0.2 + Math.random() * this.canvas.width * 0.6,
            y: this.canvas.height * 0.2 + Math.random() * this.canvas.height * 0.6,
            width: this.canvas.width * 0.2,
            height: this.canvas.height * 0.25,
            emotion: emotion,
            confidence: confidence
        };

        return { faces: [face] };
    }

    drawFaceBox(face) {
        const isSmiling = face.emotion === 'happy' && face.confidence > 0.7;
        
        this.context.strokeStyle = isSmiling ? '#3b82f6' : '#22c55e';
        this.context.lineWidth = 2;
        this.context.strokeRect(face.x, face.y, face.width, face.height);

        // Draw emotion label
        this.context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.context.fillRect(face.x, face.y - 24, 120, 20);
        
        this.context.fillStyle = 'white';
        this.context.font = '12px Arial';
        this.context.fillText(
            `${face.emotion} (${Math.round(face.confidence * 100)}%)`,
            face.x + 4,
            face.y - 8
        );

        if (isSmiling) {
            // Add glow effect for smiling
            this.context.shadowBlur = 10;
            this.context.shadowColor = '#3b82f6';
            this.context.strokeRect(face.x - 2, face.y - 2, face.width + 4, face.height + 4);
            this.context.shadowBlur = 0;
        }
    }

    updateDetectionStatus(message, type) {
        const statusElement = document.getElementById('detection-status');
        if (statusElement) {
            const span = statusElement.querySelector('span:last-child');
            const dot = statusElement.querySelector('.status-dot');
            
            span.textContent = message;
            
            dot.style.background = type === 'success' ? '#22c55e' : 
                                  type === 'error' ? '#ef4444' : '#3b82f6';
        }
    }

    updateEmotionDisplay(emotion, confidence) {
        const emotionValue = document.getElementById('emotion-value');
        const confidenceElement = document.getElementById('confidence');
        
        if (emotionValue) {
            emotionValue.textContent = emotion.charAt(0).toUpperCase() + emotion.slice(1);
        }
        
        if (confidenceElement) {
            confidenceElement.textContent = `${Math.round(confidence * 100)}%`;
        }
    }

    updatePerformanceMetrics() {
        // Simulate realistic FPS
        const fps = 28 + Math.random() * 4;
        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter) {
            fpsCounter.textContent = `${Math.round(fps)} FPS`;
        }

        // Store performance data
        this.performanceData.push({
            timestamp: Date.now(),
            fps: fps,
            latency: 40 + Math.random() * 20,
            memory: 150 + Math.random() * 20
        });

        // Keep only last 100 data points
        if (this.performanceData.length > 100) {
            this.performanceData.shift();
        }
    }

    capturePhoto() {
        if (!this.video || !this.video.videoWidth) return;

        // Create capture canvas
        const captureCanvas = document.createElement('canvas');
        const captureContext = captureCanvas.getContext('2d');
        
        captureCanvas.width = this.video.videoWidth;
        captureCanvas.height = this.video.videoHeight;
        
        // Draw video frame
        captureContext.drawImage(this.video, 0, 0);
        
        // Convert to blob and store
        captureCanvas.toBlob((blob) => {
            const photo = {
                id: Date.now(),
                blob: blob,
                url: URL.createObjectURL(blob),
                timestamp: new Date(),
                emotion: document.getElementById('emotion-value')?.textContent || 'Unknown',
                confidence: document.getElementById('confidence')?.textContent || '0%'
            };
            
            this.photos.unshift(photo);
            this.savePhotos();
            this.showCaptureEffect();
            
            // Update gallery if visible
            if (this.currentView === 'gallery') {
                this.updateGallery();
            }
        }, 'image/jpeg', 0.9);
    }

    showCaptureEffect() {
        // Flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 9999;
            opacity: 0.8;
            pointer-events: none;
        `;
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.style.opacity = '0';
            flash.style.transition = 'opacity 0.2s';
            setTimeout(() => document.body.removeChild(flash), 200);
        }, 100);

        // Capture button animation
        const captureBtn = document.getElementById('capture-btn');
        captureBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            captureBtn.style.transform = 'scale(1)';
        }, 150);
    }

    updateGallery() {
        const galleryGrid = document.getElementById('gallery-grid');
        const photoCount = document.getElementById('photo-count');
        
        if (photoCount) {
            photoCount.textContent = `${this.photos.length} photo${this.photos.length !== 1 ? 's' : ''}`;
        }

        if (this.photos.length === 0) {
            galleryGrid.innerHTML = `
                <div class="gallery-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
                    </svg>
                    <h3>No photos yet</h3>
                    <p>Start taking selfies to see them here</p>
                    <button class="btn-primary" data-action="camera">Open Camera</button>
                </div>
            `;
            
            // Re-attach event listener
            const cameraBtn = galleryGrid.querySelector('[data-action="camera"]');
            if (cameraBtn) {
                cameraBtn.addEventListener('click', () => this.switchView('camera'));
            }
            return;
        }

        galleryGrid.innerHTML = this.photos.map(photo => `
            <div class="gallery-item" data-photo-id="${photo.id}">
                <img src="${photo.url}" alt="Selfie" loading="lazy">
                <div class="gallery-item-overlay">
                    <div>${photo.emotion}</div>
                    <div>${photo.timestamp.toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');

        // Add click listeners for gallery items
        galleryGrid.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const photoId = parseInt(item.dataset.photoId);
                this.showPhotoModal(photoId);
            });
        });
    }

    showPhotoModal(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        const modal = document.getElementById('photo-modal');
        const modalImage = document.getElementById('modal-image');
        const emotionSpan = modal.querySelector('.photo-emotion');
        const timestampSpan = modal.querySelector('.photo-timestamp');

        modalImage.src = photo.url;
        emotionSpan.textContent = `${photo.emotion} (${photo.confidence})`;
        timestampSpan.textContent = photo.timestamp.toLocaleString();

        modal.classList.add('active');
    }

    updateBenchmarks() {
        // Animate benchmark values
        this.animateBenchmarkValue('face-detection-fps', 28.5, 'fps');
        this.animateBenchmarkValue('emotion-accuracy', 92.3, 'percent');
        this.animateBenchmarkValue('processing-latency', 45, 'ms');
        this.animateBenchmarkValue('memory-usage', 156, 'mb');

        this.drawPerformanceChart();
    }

    animateBenchmarkValue(elementId, targetValue, type) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let currentValue = 0;
        const increment = targetValue / 50;
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            
            const displayValue = type === 'percent' || type === 'fps' ? 
                currentValue.toFixed(1) : Math.round(currentValue);
            element.textContent = displayValue;
        }, 20);
    }

    drawPerformanceChart() {
        const canvas = document.getElementById('performance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, 0, width, height);

        // Generate sample data if empty
        if (this.performanceData.length === 0) {
            for (let i = 0; i < 50; i++) {
                this.performanceData.push({
                    timestamp: Date.now() - (50 - i) * 1000,
                    fps: 25 + Math.random() * 10,
                    latency: 30 + Math.random() * 30,
                    memory: 140 + Math.random() * 40
                });
            }
        }

        // Draw FPS line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.performanceData.forEach((point, index) => {
            const x = (index / (this.performanceData.length - 1)) * width;
            const y = height - (point.fps / 40) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Arial';
        ctx.fillText('FPS Performance', 16, 20);
        ctx.fillText('0', 10, height - 5);
        ctx.fillText('40', 10, 15);
    }

    savePhotos() {
        // In a real app, you'd save to a database
        // For demo purposes, we'll use localStorage for photo metadata
        const photoData = this.photos.map(photo => ({
            id: photo.id,
            timestamp: photo.timestamp,
            emotion: photo.emotion,
            confidence: photo.confidence
        }));
        
        localStorage.setItem('smart-selfie-photos', JSON.stringify(photoData));
    }

    loadStoredPhotos() {
        try {
            const stored = localStorage.getItem('smart-selfie-photos');
            if (stored) {
                const photoData = JSON.parse(stored);
                // Note: In a real app, you'd load the actual image data
                // For demo, we'll start fresh each session
                this.photos = [];
            }
        } catch (error) {
            console.error('Failed to load stored photos:', error);
        }
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            if (this.currentView === 'benchmarks') {
                this.updateBenchmarks();
            }
        }, 1000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SmartSelfieApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause camera when tab is hidden
        if (window.app && window.app.currentView === 'camera') {
            window.app.stopCamera();
        }
    }
});

// Export for global access
window.SmartSelfieApp = SmartSelfieApp;