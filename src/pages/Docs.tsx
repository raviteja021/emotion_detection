import React from "react";

export default function Docs() {
  return (
    <div className="docs-container max-w-3xl mx-auto py-8 px-4">
      <div className="docs-header flex items-center gap-4 mb-8">
        <button className="back-button p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold">Documentation</h2>
      </div>

      <div className="docs-content flex flex-col gap-8">
        <div className="docs-section bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
          <p>Welcome to Smart Selfie + Smilage! This AI-powered application uses advanced machine learning models to detect faces, recognize emotions, and automatically capture your best selfies.</p>
        </div>

        <div className="docs-section bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Features</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Real-time Face Detection:</strong> Advanced algorithms detect and track faces in real-time</li>
            <li><strong>Emotion Recognition:</strong> AI analyzes facial expressions to determine emotions</li>
            <li><strong>Smart Auto-Capture:</strong> Automatically takes photos when you smile</li>
            <li><strong>Performance Analytics:</strong> Monitor system performance and accuracy metrics</li>
          </ul>
        </div>

        <div className="docs-section bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">How to Use</h3>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Click "Open Camera" to start the smart camera</li>
            <li>Allow camera permissions when prompted</li>
            <li>Position yourself in front of the camera</li>
            <li>Smile to trigger automatic capture (if enabled)</li>
            <li>View your photos in the Gallery section</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
