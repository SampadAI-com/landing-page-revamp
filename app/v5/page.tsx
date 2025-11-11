'use client';

import { useEffect, useRef, useState } from 'react';
import { Playfair_Display, Inter, Allura } from 'next/font/google';

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

const allura = Allura({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-allura',
});

export default function V5Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
      <div className={`${playfairDisplay.variable} ${inter.variable} ${allura.variable}`} style={{ 
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
        padding: '1rem 1.5rem',
        backgroundColor: 'transparent',
        zIndex: 10
      }}>
        <img
          src="/assets/images/sampadai_dark.png"
          alt="Aura Logo"
          style={{
            height: 'clamp(32px, 5vw, 42px)',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
        {!isMobile ? (
          <nav style={{
            display: 'flex',
            gap: 'clamp(1rem, 3vw, 2rem)',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <a href="#" style={{
              color: '#FDF8F5',
              textDecoration: 'none',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontFamily: 'var(--font-inter), "Inter", sans-serif',
              fontWeight: '500',
              transition: 'color 0.3s ease',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#AEE2D9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#FDF8F5'}
            >
              About
            </a>
            <a href="#" style={{
              color: '#FDF8F5',
              textDecoration: 'none',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontFamily: 'var(--font-inter), "Inter", sans-serif',
              fontWeight: '500',
              transition: 'color 0.3s ease',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#AEE2D9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#FDF8F5'}
            >
              Why
            </a>
            <button style={{
              padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
              backgroundColor: 'transparent',
              color: '#FDF8F5',
              border: '1px solid #FDF8F5',
              borderRadius: '50px',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontFamily: 'var(--font-inter), "Inter", sans-serif',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
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
        ) : (
          <>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#FDF8F5',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
                position: 'relative'
              }}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
            {isMobileMenuOpen && (
              <>
                {/* Backdrop overlay */}
                <div
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 999,
                    animation: 'fadeIn 0.3s ease'
                  }}
                />
                {/* Mobile Menu */}
                <nav style={{
                  position: 'fixed',
                  top: '70px',
                  right: '1.5rem',
                  backgroundColor: 'rgba(58, 46, 57, 0.98)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  minWidth: '220px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  zIndex: 1000,
                  animation: 'slideDown 0.3s ease',
                  border: '1px solid rgba(253, 248, 245, 0.1)'
                }}>
                <a href="#" style={{
                  color: '#FDF8F5',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontFamily: 'var(--font-inter), "Inter", sans-serif',
                  fontWeight: '500',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(174, 226, 217, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  About
                </a>
                <a href="#" style={{
                  color: '#FDF8F5',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontFamily: 'var(--font-inter), "Inter", sans-serif',
                  fontWeight: '500',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(174, 226, 217, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Why
                </a>
                  <div style={{
                    height: '1px',
                    backgroundColor: 'rgba(253, 248, 245, 0.2)',
                    margin: '0.5rem 0'
                  }} />
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
                    marginTop: '0.25rem',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#AEE2D9';
                    e.currentTarget.style.borderColor = '#AEE2D9';
                    e.currentTarget.style.color = '#3A2E39';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#FDF8F5';
                    e.currentTarget.style.color = '#FDF8F5';
                  }}
                  >
                    Sign In
                  </button>
                </nav>
              </>
            )}
          </>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '80px',
        paddingBottom: '40px'
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

        {/* Hero Content */}
        <div id="hero-content" style={{
          position: 'relative',
          zIndex: 3,
          width: isMobile ? '90%' : 'clamp(90%, 40vw, 40%)',
          marginLeft: isMobile ? 'auto' : '50%',
          marginRight: isMobile ? 'auto' : 'auto',
          padding: 'clamp(1rem, 3vw, 2rem)',
          marginTop: isMobile ? '2rem' : '0',
          textAlign: isMobile ? 'center' : 'left',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'center' : 'flex-start'
        }}>
          <h1 style={{
            fontSize: isMobile ? 'clamp(67px, 8.4vw, 100px)' : 'clamp(48px, 6vw, 72px)',
            fontFamily: 'var(--font-allura), cursive',
            fontWeight: '400',
            letterSpacing: '2px',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            color: '#FDF8F5',
            textAlign: isMobile ? 'center' : 'left',
            width: '100%'
          }}>
            Discover Your Financial Aura
          </h1>
          <p style={{
            fontSize: isMobile ? 'clamp(25px, 2.8vw, 34px)' : 'clamp(18px, 2vw, 24px)',
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontWeight: '300',
            lineHeight: '1.7',
            marginBottom: '2.5rem',
            color: '#FDF8F5',
            opacity: 0.9,
            textAlign: isMobile ? 'center' : 'left',
            width: '100%'
          }}>
            Her Wealth. Her Data. Her AI.
          </p>
          <button style={{
            padding: isMobile ? 'clamp(1.225rem, 2.8vw, 1.4rem) clamp(2.1rem, 5.6vw, 3.5rem)' : 'clamp(0.875rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2.5rem)',
            backgroundColor: '#E8A0BF',
            color: '#3A2E39',
            border: 'none',
            borderRadius: '50px',
            fontSize: isMobile ? 'clamp(22px, 4.2vw, 25px)' : 'clamp(16px, 3vw, 18px)',
            fontFamily: 'var(--font-inter), "Inter", sans-serif',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            boxShadow: '0 4px 20px rgba(232, 160, 191, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: 'fit-content'
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
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg"
              alt="Apple"
              style={{
                width: isMobile ? '16px' : '14px',
                height: isMobile ? '20px' : '17px',
                display: 'block',
                flexShrink: 0,
                objectFit: 'contain',
                imageRendering: '-webkit-optimize-contrast',
                imageRendering: 'crisp-edges',
                imageRendering: 'pixelated',
                filter: 'brightness(0) saturate(100%) invert(15%) sepia(8%) saturate(1014%) hue-rotate(314deg) brightness(95%) contrast(88%)',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitFontSmoothing: 'antialiased'
              }}
            />
            <span>Try Beta App Now</span>
          </button>
        </div>
      </section>
    </div>
    </>
  );
}

