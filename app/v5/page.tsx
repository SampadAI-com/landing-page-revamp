'use client';

import { useEffect, useRef, useState } from 'react';
import { Playfair_Display, Inter } from 'next/font/google';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
});

export default function V5Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;
    }

    const particles: Particle[] = [];
    const maxParticles = 150;

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: Math.random() > 0.5 ? '#E8A0BF' : '#AEE2D9',
        size: Math.random() * 2 + 1,
        life: 1
      });
    }

    // Flow field using Perlin noise-like function
    const noise = (x: number, y: number, time: number) => {
      return Math.sin(x * 0.01 + time) * Math.cos(y * 0.01 + time * 0.7);
    };

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.005; // Slower animation

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Flow field influence - slower and more flowing
        const angle = noise(particle.x, particle.y, time) * Math.PI * 2;
        const flowStrength = 0.2;
        particle.vx += Math.cos(angle) * flowStrength * 0.008;
        particle.vy += Math.sin(angle) * flowStrength * 0.008;

        // Mouse repulsor effect
        const dx = particle.x - mousePos.x;
        const dy = particle.y - mousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const repulseRadius = 150;
        const repulseStrength = 0.5;

        if (distance < repulseRadius && distance > 0) {
          const force = (repulseRadius - distance) / repulseRadius * repulseStrength;
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }

        // Damping - smoother
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with soft glow
        ctx.globalAlpha = 0.7;
        ctx.shadowBlur = 12;
        ctx.shadowColor = particle.color;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connections to nearby particles
        particles.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.globalAlpha = (1 - distance / 100) * 0.3;
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

      // Draw wavy lines - slower and more flowing
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 8; i++) {
        const yOffset = (canvas.height / 8) * i;
        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0 ? '#E8A0BF' : '#AEE2D9';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = i % 2 === 0 ? '#E8A0BF' : '#AEE2D9';

        for (let x = 0; x < canvas.width; x += 5) {
          const y = yOffset + Math.sin(x * 0.008 + time * 0.5 + i) * 25 + 
                    Math.cos(x * 0.012 + time * 0.4) * 18;
          
          // Mouse influence on waves
          const dx = x - mousePos.x;
          const dy = y - mousePos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, (150 - dist) / 150);
          const pushY = (dy / Math.max(dist, 1)) * influence * 50;

          if (x === 0) {
            ctx.moveTo(x, y + pushY);
          } else {
            ctx.lineTo(x, y + pushY);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos]);

  return (
    <div className={`${playfairDisplay.variable} ${inter.variable}`} style={{ 
      minHeight: '100vh', 
      backgroundColor: '#3A2E39', 
      color: '#FDF8F5',
      fontFamily: 'var(--font-inter), "Inter", "system-ui", sans-serif',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        backgroundColor: 'transparent',
        zIndex: 10
      }}>
        <img
          src="/assets/images/sampadai_dark.png"
          alt="Aura Logo"
          style={{
            height: '42px',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
        <nav style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center'
        }}>
          <a href="#" style={{
            color: '#FDF8F5',
            textDecoration: 'none',
            fontSize: '16px',
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontWeight: '500',
            transition: 'color 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#AEE2D9'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#FDF8F5'}
          >
            Solutions
          </a>
          <a href="#" style={{
            color: '#FDF8F5',
            textDecoration: 'none',
            fontSize: '16px',
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontWeight: '500',
            transition: 'color 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#AEE2D9'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#FDF8F5'}
          >
            Learning
          </a>
          <a href="#" style={{
            color: '#FDF8F5',
            textDecoration: 'none',
            fontSize: '16px',
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontWeight: '500',
            transition: 'color 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#AEE2D9'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#FDF8F5'}
          >
            Insights
          </a>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: '#FDF8F5',
            border: '1px solid #FDF8F5',
            borderRadius: '50px',
            fontSize: '16px',
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#AEE2D9';
            e.currentTarget.style.borderColor = '#AEE2D9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#FDF8F5';
          }}
          >
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="hero" style={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Canvas Background */}
        <canvas
          ref={canvasRef}
          id="aura-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        />

        {/* Hero Image */}
        <img
          id="hero-image"
          src="https://via.placeholder.com/600x800.png?text=Elegant+Woman+in+Soft+Lighting"
          alt="Hero"
          style={{
            position: 'absolute',
            bottom: 0,
            left: '5%',
            width: '45%',
            maxWidth: '600px',
            height: 'auto',
            zIndex: 2,
            objectFit: 'contain'
          }}
        />

        {/* Hero Content */}
        <div id="hero-content" style={{
          position: 'relative',
          zIndex: 3,
          width: '40%',
          marginLeft: '55%',
          padding: '2rem'
        }}>
          <h1 style={{
            fontSize: 'clamp(48px, 6vw, 72px)',
            fontFamily: 'var(--font-playfair), "Playfair Display", serif',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            color: '#FDF8F5'
          }}>
            Discover Your Financial Aura
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 2vw, 24px)',
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontWeight: '300',
            lineHeight: '1.7',
            marginBottom: '2.5rem',
            color: '#FDF8F5',
            opacity: 0.9
          }}>
            Her Wealth. Her Data. Her AI.
          </p>
          <button style={{
            padding: '1rem 2.5rem',
            backgroundColor: '#E8A0BF',
            color: '#3A2E39',
            border: 'none',
            borderRadius: '50px',
            fontSize: '18px',
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            boxShadow: '0 4px 20px rgba(232, 160, 191, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(232, 160, 191, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(232, 160, 191, 0.3)';
          }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.96-3.24-1.44-1.32-.52-2.6-1.03-3.95-1.32-2.37-.5-4.4-1.5-6.1-3.28C.93 13.82 0 11.85 0 9.62c0-2.03.67-3.9 2.01-5.61C3.34 2.22 5.18 1.21 7.38.57c.57-.16 1.15-.24 1.72-.24 1.11 0 2.15.23 3.12.7.39.19.7.45 1.01.73.28.25.54.52.88.73.3.19.6.34.95.44.35.1.7.15 1.05.15.35 0 .7-.05 1.05-.15.35-.1.65-.25.95-.44.34-.21.6-.48.88-.73.31-.28.62-.54 1.01-.73.97-.47 2.01-.7 3.12-.7.57 0 1.15.08 1.72.24 2.2.64 4.04 1.65 5.37 3.44C23.33 5.72 24 7.59 24 9.62c0 2.23-.93 4.2-2.68 5.68-1.7 1.78-3.73 2.78-6.1 3.28-1.35.29-2.63.8-3.95 1.32-1.16.48-2.15.94-3.24 1.44-1.03.48-2.1.55-3.08-.4z"/>
            </svg>
            Try Beta App Now
          </button>
        </div>
      </section>
    </div>
  );
}

