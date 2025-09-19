import React from "react";

export default function Benchmarks() {
  return (
    <div className="benchmarks-container max-w-4xl mx-auto py-8 px-4">
      <div className="benchmarks-header flex items-center gap-4 mb-8">
        <button className="back-button p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold">Performance Benchmarks</h2>
      </div>

      <div className="benchmarks-grid grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="benchmark-card bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Face Detection</h3>
          <div className="benchmark-metric flex items-end gap-1 mb-2">
            <span className="metric-value text-3xl font-bold text-blue-600">28.5</span>
            <span className="metric-unit text-base text-slate-500">FPS</span>
          </div>
          <div className="benchmark-bar w-full h-3 bg-slate-200 dark:bg-slate-700 rounded mb-2">
            <div className="benchmark-fill h-3 bg-blue-500 rounded" style={{ width: '85%' }}></div>
          </div>
          <p className="text-slate-500 text-sm">Real-time face detection performance</p>
        </div>

        <div className="benchmark-card bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Emotion Analysis</h3>
          <div className="benchmark-metric flex items-end gap-1 mb-2">
            <span className="metric-value text-3xl font-bold text-green-600">92.3</span>
            <span className="metric-unit text-base text-slate-500">%</span>
          </div>
          <div className="benchmark-bar w-full h-3 bg-slate-200 dark:bg-slate-700 rounded mb-2">
            <div className="benchmark-fill h-3 bg-green-500 rounded" style={{ width: '92%' }}></div>
          </div>
          <p className="text-slate-500 text-sm">Emotion recognition accuracy</p>
        </div>

        <div className="benchmark-card bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Processing Latency</h3>
          <div className="benchmark-metric flex items-end gap-1 mb-2">
            <span className="metric-value text-3xl font-bold text-yellow-600">45</span>
            <span className="metric-unit text-base text-slate-500">ms</span>
          </div>
          <div className="benchmark-bar w-full h-3 bg-slate-200 dark:bg-slate-700 rounded mb-2">
            <div className="benchmark-fill h-3 bg-yellow-500 rounded" style={{ width: '78%' }}></div>
          </div>
          <p className="text-slate-500 text-sm">Average processing time per frame</p>
        </div>

        <div className="benchmark-card bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Memory Usage</h3>
          <div className="benchmark-metric flex items-end gap-1 mb-2">
            <span className="metric-value text-3xl font-bold text-purple-600">156</span>
            <span className="metric-unit text-base text-slate-500">MB</span>
          </div>
          <div className="benchmark-bar w-full h-3 bg-slate-200 dark:bg-slate-700 rounded mb-2">
            <div className="benchmark-fill h-3 bg-purple-500 rounded" style={{ width: '60%' }}></div>
          </div>
          <p className="text-slate-500 text-sm">AI model memory consumption</p>
        </div>
      </div>

      <div className="performance-chart bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Real-time Performance</h3>
        <div className="w-full h-48 flex items-center justify-center text-slate-400">
          {/* Chart placeholder */}
          <span>Chart coming soon...</span>
        </div>
      </div>
    </div>
  );
}
