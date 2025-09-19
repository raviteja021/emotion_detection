import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Photo {
  filename: string;
  timestamp: string;
  image: string;
  metadata: {
    smile_prob: number;
    age_label: string;
    age_conf: number;
    gender_label: string;
    gender_conf: number;
    emotion_label: string;
    emotion_conf: number;
  };
}

const API_BASE_URL = 'http://localhost:5000/api';

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    checkBackendAndLoadGallery();
  }, []);

  const checkBackendAndLoadGallery = async () => {
    try {
      // First check if backend is available
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      if (healthResponse.ok) {
        setBackendAvailable(true);
        await loadGallery();
      } else {
        setBackendAvailable(false);
        setError('Backend is not available. Please start the Python server.');
        setLoading(false);
      }
    } catch (err) {
      setBackendAvailable(false);
      setError('Cannot connect to backend. Please start the Python server at http://localhost:5000');
      setLoading(false);
    }
  };

  const loadGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/gallery`);
      
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
        setError(null);
      } else {
        throw new Error('Failed to load gallery');
      }
    } catch (err) {
      console.error('Gallery error:', err);
      setError('Could not load gallery. Backend may be offline.');
    } finally {
      setLoading(false);
    }
  };

  const clearGallery = async () => {
    if (!window.confirm('Are you sure you want to delete all photos? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/gallery/clear`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPhotos([]);
        setError(null);
        alert('Gallery cleared successfully!');
      } else {
        throw new Error('Failed to clear gallery');
      }
    } catch (err) {
      console.error('Clear gallery error:', err);
      setError('Could not clear gallery. Backend may be offline.');
    }
  };

  const deletePhoto = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/gallery/${filename}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove the photo from local state
        setPhotos(photos.filter(photo => photo.filename !== filename));
        setError(null);
      } else {
        throw new Error('Failed to delete photo');
      }
    } catch (err) {
      console.error('Delete photo error:', err);
      setError('Could not delete photo. Backend may be offline.');
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="gallery-container max-w-6xl mx-auto py-8 px-4">
        <div className="gallery-header flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold">Gallery</h2>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading gallery...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container max-w-6xl mx-auto py-8 px-4">
      <div className="gallery-header flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Gallery</h2>
        <div className="gallery-controls flex items-center gap-4">
          <div className="gallery-stats text-slate-400 text-sm">
            <span>{photos.length} photos</span>
          </div>
          <button 
            onClick={loadGallery}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="M23 9l-4-4-5 5-4-4-4 4"/>
            </svg>
            Refresh
          </button>
          {photos.length > 0 && (
            <button 
              onClick={clearGallery}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6V20a2,2 0 01-2,2H7a2,2 0 01-2-2V6M8,6V4a2,2 0 012-2h4a2,2 0 012,2V6"/>
              </svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={loadGallery}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {photos.length === 0 && !error ? (
        <div className="gallery-empty flex flex-col items-center justify-center py-16 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-slate-400">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21" />
          </svg>
          <h3 className="text-lg font-semibold mb-1">No photos yet</h3>
          <p className="text-slate-500 mb-4">Start taking selfies to see them here</p>
          <Link 
            to="/camera"
            className="btn-primary bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors"
          >
            Open Camera
          </Link>
        </div>
      ) : (
        <div className="gallery-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo, index) => (
            <div key={index} className="photo-card bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative group">
              <div className="photo-image aspect-square overflow-hidden relative">
                <img 
                  src={photo.image} 
                  alt={`Captured ${photo.filename}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => deletePhoto(photo.filename)}
                  className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  title={`Delete ${photo.filename}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6V20a2,2 0 01-2,2H7a2,2 0 01-2-2V6M8,6V4a2,2 0 012-2h4a2,2 0 012,2V6"/>
                  </svg>
                </button>
              </div>
              <div className="photo-info p-4">
                <div className="photo-date text-xs text-slate-500 mb-2">
                  {formatDate(photo.timestamp)}
                </div>
                <div className="photo-metadata space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Emotion:</span>
                    <span className="font-medium capitalize">{photo.metadata.emotion_label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Smile:</span>
                    <span className="font-medium">{Math.round(photo.metadata.smile_prob * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Age:</span>
                    <span className="font-medium">{photo.metadata.age_label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Gender:</span>
                    <span className="font-medium">{photo.metadata.gender_label}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
