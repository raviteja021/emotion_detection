import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Smart Selfie + Smilage</h1>
      <p className="text-lg text-slate-400 dark:text-slate-400 mb-8 max-w-xl mx-auto">AI-powered selfie capture with real-time face detection, smile recognition, and emotion analysis. Capture your best moments automatically!</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <FeatureCard title="Smart Camera" desc="Real-time face detection with automatic smile capture" link="/camera" icon={<CameraIcon />} />
        <FeatureCard title="Gallery" desc="Browse and manage your captured selfies" link="/gallery" icon={<GalleryIcon />} />
        <FeatureCard title="Benchmarks" desc="Performance testing and model comparison" link="/benchmarks" icon={<BenchmarksIcon />} />
        <FeatureCard title="Settings" desc="Configure camera, models, and preferences" link="/settings" icon={<SettingsIcon />} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard icon="🎯" title="Smart Detection" desc="Advanced AI models for face detection, smile recognition, and emotion analysis" />
        <InfoCard icon="⚡" title="Real-time Processing" desc="Live camera feed with instant analysis and automatic capture triggers" />
        <InfoCard icon="📊" title="Performance Insights" desc="Detailed benchmarks and analytics to optimize your selfie experience" />
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, link, icon }: { title: string, desc: string, link: string, icon: React.ReactNode }) {
  return (
    <Link to={link} className="feature-card bg-slate-800 dark:bg-slate-800 bg-white border border-slate-200 dark:border-blue-500/10 rounded-2xl p-8 text-center hover:shadow-lg hover:border-blue-500 transition-all flex flex-col items-center">
      <div className="feature-icon w-16 h-16 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-blue-500 to-blue-800 text-white">{icon}</div>
      <h3 className="feature-title text-xl font-semibold mb-2 text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="feature-description text-slate-600 dark:text-slate-400 mb-4">{desc}</p>
      <span className="feature-button bg-blue-600 dark:bg-blue-700/80 border border-blue-500 dark:border-blue-500/30 text-white dark:text-slate-100 py-2 px-4 rounded-lg font-medium cursor-pointer w-full hover:bg-blue-700 dark:hover:bg-blue-500/20 hover:border-blue-600 dark:hover:border-blue-500 transition">Open</span>
    </Link>
  );
}

function InfoCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="info-card bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-blue-500/10 rounded-xl p-6 flex flex-col items-center text-center">
      <div className="info-icon text-3xl mb-2">{icon}</div>
      <h4 className="font-semibold text-lg mb-1 text-slate-900 dark:text-slate-50">{title}</h4>
      <p className="text-slate-600 dark:text-slate-400">{desc}</p>
    </div>
  );
}

function CameraIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
}
function GalleryIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/></svg>;
}
function BenchmarksIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>;
}
function SettingsIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}
