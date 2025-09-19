import React from "react";

export default function Settings() {
  return (
    <div className="settings-container max-w-2xl mx-auto py-8 px-4">
      <div className="settings-header flex items-center gap-4 mb-8">
        <button className="back-button p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h2>
      </div>

      <div className="settings-sections flex flex-col gap-8">
        <div className="settings-section bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Camera Settings</h3>
          <div className="setting-item mb-4 flex flex-col gap-1">
            <label htmlFor="resolution" className="font-medium text-slate-700 dark:text-slate-300">Video Resolution</label>
            <select id="resolution" className="form-select rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="1280x720">HD (1280x720)</option>
              <option value="1920x1080" defaultValue="1920x1080">Full HD (1920x1080)</option>
              <option value="640x480">SD (640x480)</option>
            </select>
          </div>
          <div className="setting-item flex flex-col gap-1">
            <label htmlFor="fps" className="font-medium text-slate-700 dark:text-slate-300">Frame Rate</label>
            <select id="fps" className="form-select rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="15">15 FPS</option>
              <option value="30" defaultValue="30">30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>
        </div>

        <div className="settings-section bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">AI Model Settings</h3>
          <div className="setting-item mb-4 flex flex-col gap-1">
            <label htmlFor="detection-model" className="font-medium text-slate-700 dark:text-slate-300">Face Detection Model</label>
            <select id="detection-model" className="form-select rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="lightweight" defaultValue="lightweight">Lightweight (Fast)</option>
              <option value="standard">Standard (Balanced)</option>
              <option value="premium">Premium (Accurate)</option>
            </select>
          </div>
          <div className="setting-item flex flex-col gap-1">
            <label htmlFor="emotion-sensitivity" className="font-medium text-slate-700 dark:text-slate-300">Emotion Sensitivity</label>
            <input 
              type="range" 
              id="emotion-sensitivity" 
              min="0.1" 
              max="1" 
              step="0.1" 
              defaultValue="0.7" 
              className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer slider" 
            />
            <span className="range-value text-xs text-slate-500 dark:text-slate-400">70%</span>
          </div>
        </div>

        <div className="settings-section bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Auto Capture</h3>
          <div className="setting-item toggle-item flex items-center justify-between mb-4">
            <label htmlFor="smile-detection" className="font-medium text-slate-700 dark:text-slate-300">Smile Detection</label>
            <label className="toggle-switch relative inline-block w-12 h-6">
              <input type="checkbox" id="smile-detection" defaultChecked className="sr-only peer" />
              <span className="toggle-slider absolute left-0 top-0 w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition peer-checked:bg-blue-500"></span>
              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-6"></span>
            </label>
          </div>
          <div className="setting-item flex flex-col gap-1">
            <label htmlFor="smile-threshold" className="font-medium text-slate-700 dark:text-slate-300">Smile Threshold</label>
            <input 
              type="range" 
              id="smile-threshold" 
              min="0.1" 
              max="1" 
              step="0.1" 
              defaultValue="0.8" 
              className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer slider" 
            />
            <span className="range-value text-xs text-slate-500 dark:text-slate-400">80%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
