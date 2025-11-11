'use client';

import { useState, useEffect } from 'react';

export default function V2Page() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference or saved preference
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(savedMode ? savedMode === 'true' : prefersDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  const baseTextStyle = {
    fontFamily: 'var(--font-la-luxes-script), Georgia, serif',
    fontWeight: 'normal',
    letterSpacing: '0.02em',
    color: '#A46F50',
    WebkitTextStroke: '6px #000000',
    WebkitTextFillColor: '#A46F50',
    textStroke: '6px #000000',
    paintOrder: 'stroke fill',
  };

  // Colors: blood red and deep green
  const scaryBorderColor = isDarkMode ? '#0F5132' : '#8B0000'; // Deep green in dark, blood red in light
  const plannedBorderColor = isDarkMode ? '#8B0000' : '#0F5132'; // Blood red in dark, deep green in light

  return (
    <div 
      className="min-h-screen flex items-center justify-center transition-colors duration-300"
      style={{ 
        backgroundColor: isDarkMode ? '#1A1A1A' : '#FCF7F3'
      }}
    >
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 text-2xl transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '0',
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(48, 43, 39, 0.8) 0%, rgba(30, 27, 25, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(164, 111, 80, 0.8) 0%, rgba(139, 95, 70, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: `
            0 8px 32px 0 rgba(0, 0, 0, 0.37),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1)
          `,
          color: isDarkMode ? '#FCF7F3' : '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glass reflection effect */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%)',
            pointerEvents: 'none',
          }}
        />
        <span style={{ position: 'relative', zIndex: 1 }}>
          {isDarkMode ? '☀️' : '🌙'}
        </span>
      </button>
      
      <div className="text-center max-w-4xl mx-auto px-6">
        {/* Main Heading */}
        <h1 
          className="text-6xl md:text-8xl mb-6"
          style={baseTextStyle}
        >
          Big dreams shouldn't be <span style={{
            WebkitTextStroke: `6px ${scaryBorderColor}`,
            WebkitTextFillColor: '#A46F50',
            textStroke: `6px ${scaryBorderColor}`,
            paintOrder: 'stroke fill',
          }}>scary</span>. They should be <span style={{
            WebkitTextStroke: `6px ${plannedBorderColor}`,
            WebkitTextFillColor: '#A46F50',
            textStroke: `6px ${plannedBorderColor}`,
            paintOrder: 'stroke fill',
          }}>planned</span>.
        </h1>
      </div>
    </div>
  );
}
