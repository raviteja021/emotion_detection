
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Camera from './pages/Camera';
import Gallery from './pages/Gallery';
import Benchmarks from './pages/Benchmarks';
import Settings from './pages/Settings';
import Docs from './pages/Docs';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    // Apply theme class to document body
    if (isDarkMode) {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <Router>
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100' 
          : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900'
      }`}>
        <nav className={`backdrop-blur border-b sticky top-0 z-50 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/95 border-blue-500/10' 
            : 'bg-white/95 border-slate-200'
        }`}>
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
            <div className="flex items-center gap-3 font-semibold text-lg">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-blue-800 text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </span>
              <span>Smilage Pro</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Home</NavLink>
                <NavLink to="/camera" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Camera</NavLink>
                <NavLink to="/gallery" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Gallery</NavLink>
                <NavLink to="/benchmarks" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Benchmarks</NavLink>
                <NavLink to="/settings" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Settings</NavLink>
                <NavLink to="/docs" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Docs</NavLink>
              </div>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/camera" element={<Camera />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/benchmarks" element={<Benchmarks />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/docs" element={<Docs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}


export default App;
