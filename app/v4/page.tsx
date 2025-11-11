'use client';

import { useState, useEffect, useRef } from 'react';

export default function V4Page() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [followerPos, setFollowerPos] = useState({ x: 0, y: 0 });
  const [hoverState, setHoverState] = useState('default');
  const [hoverTarget, setHoverTarget] = useState<HTMLElement | null>(null);
  const [hoverTargetRect, setHoverTargetRect] = useState<DOMRect | null>(null);
  const [isInAura, setIsInAura] = useState(false);
  const [auraCursorPos, setAuraCursorPos] = useState({ x: 0, y: 0 });
  
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Lerp function for smooth following
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      if (isInAura && auraRef.current) {
        const rect = auraRef.current.getBoundingClientRect();
        setAuraCursorPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isInAura]);

  // Smooth cursor animation
  useEffect(() => {
    const animate = () => {
      // Small dot follows mouse with slight delay
      setCursorPos(prev => ({
        x: lerp(prev.x, mousePos.x, 0.15),
        y: lerp(prev.y, mousePos.y, 0.15)
      }));

      // Large ring follows small dot with more delay
      setFollowerPos(prev => {
        const newCursorPos = {
          x: lerp(prev.x, mousePos.x, 0.15),
          y: lerp(prev.y, mousePos.y, 0.15)
        };
        return {
          x: lerp(prev.x, newCursorPos.x, 0.08),
          y: lerp(prev.y, newCursorPos.y, 0.08)
        };
      });

      // Magnetic pull effect on links
      if (hoverState === 'link' && hoverTarget) {
        const rect = hoverTarget.getBoundingClientRect();
        setHoverTargetRect(rect);
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = mousePos.x - centerX;
        const dy = mousePos.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const pullStrength = Math.min(1, 50 / Math.max(distance, 1)) * 5;
        
        hoverTarget.style.transform = `translate(${dx * pullStrength * 0.01}px, ${dy * pullStrength * 0.01}px)`;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos, hoverState, hoverTarget]);

  // Update cursor position styles
  useEffect(() => {
    if (cursorRef.current && hoverState !== 'link') {
      const cursorStyles = getCursorStyles();
      const size = parseInt(cursorStyles.width as string) || 12;
      cursorRef.current.style.transform = `translate(${cursorPos.x - size / 2}px, ${cursorPos.y - size / 2}px)`;
    }
    if (followerRef.current && hoverState !== 'link') {
      const followerStyles = getFollowerStyles();
      if (!followerStyles.transform) {
        const size = 40;
        followerRef.current.style.transform = `translate(${followerPos.x - size / 2}px, ${followerPos.y - size / 2}px)`;
      }
    }
  }, [cursorPos, followerPos, hoverState]);

  // Hover handlers
  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('magnetic-link')) {
        setHoverState('link');
        setHoverTarget(target);
        setHoverTargetRect(target.getBoundingClientRect());
      } else if (target.classList.contains('cta-button')) {
        setHoverState('button');
      } else if (target.tagName === 'P' || target.tagName === 'SPAN' || target.tagName === 'H1' || target.tagName === 'H2') {
        if (!target.classList.contains('magnetic-link') && !target.classList.contains('cta-button')) {
          setHoverState('text');
        }
      }
    };

    const handleMouseLeave = () => {
      setHoverState('default');
      setHoverTarget(null);
      setHoverTargetRect(null);
      // Reset magnetic links
      document.querySelectorAll('.magnetic-link').forEach(link => {
        (link as HTMLElement).style.transform = '';
      });
    };

    const handleClick = () => {
      if (hoverState === 'link' && cursorRef.current) {
        cursorRef.current.style.transform += ' scale(1.5)';
        setTimeout(() => {
          if (cursorRef.current) {
            cursorRef.current.style.transform = cursorRef.current.style.transform.replace(' scale(1.5)', '');
          }
        }, 150);
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.removeEventListener('click', handleClick);
    };
  }, [hoverState]);

  // Aura container handlers
  useEffect(() => {
    const auraContainer = auraRef.current;
    if (!auraContainer) return;

    const handleAuraEnter = () => setIsInAura(true);
    const handleAuraLeave = () => setIsInAura(false);

    auraContainer.addEventListener('mouseenter', handleAuraEnter);
    auraContainer.addEventListener('mouseleave', handleAuraLeave);

    return () => {
      auraContainer.removeEventListener('mouseenter', handleAuraEnter);
      auraContainer.removeEventListener('mouseleave', handleAuraLeave);
    };
  }, []);

  // Aura canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isInAura) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (auraRef.current) {
        canvas.width = auraRef.current.offsetWidth;
        canvas.height = auraRef.current.offsetHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      life: number;
    }> = [];

    const lines: Array<{
      points: Array<{ x: number; y: number }>;
      color: string;
    }> = [];

    // Initialize wavy lines
    for (let i = 0; i < 8; i++) {
      const points = [];
      for (let j = 0; j < 50; j++) {
        points.push({
          x: (canvas.width / 50) * j,
          y: canvas.height / 2 + Math.sin(j * 0.2 + i) * 30
        });
      }
      lines.push({
        points,
        color: i % 2 === 0 ? '#FF6F61' : '#6ECDBE'
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw lines with repulsor effect
      lines.forEach(line => {
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;

        line.points.forEach((point, idx) => {
          const dx = point.x - auraCursorPos.x;
          const dy = point.y - auraCursorPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const repulseStrength = Math.max(0, 100 - dist) / 100;
          const repulseForce = repulseStrength * 50;

          if (dist < 100 && dist > 0) {
            point.x += (dx / dist) * repulseForce * 0.1;
            point.y += (dy / dist) * repulseForce * 0.1;
          }

          // Elastic return
          const targetX = (canvas.width / 50) * idx;
          const targetY = canvas.height / 2 + Math.sin(idx * 0.2) * 30;
          point.x += (targetX - point.x) * 0.05;
          point.y += (targetY - point.y) * 0.05;

          if (idx === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });

        ctx.stroke();
      });

      // Generate particles
      if (Math.random() < 0.3) {
        particles.push({
          x: auraCursorPos.x,
          y: auraCursorPos.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          color: Math.random() > 0.5 ? '#FF6F61' : '#6ECDBE',
          life: 1
        });
      }

      // Update and draw particles
      ctx.globalAlpha = 1;
      particles.forEach((particle, idx) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        particle.vx *= 0.95;
        particle.vy *= 0.95;

        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3 * particle.life, 0, Math.PI * 2);
        ctx.fill();

        if (particle.life <= 0) {
          particles.splice(idx, 1);
        }
      });

      // Draw cursor glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#FFFFFF';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(auraCursorPos.x, auraCursorPos.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isInAura, auraCursorPos]);

  // Get cursor styles based on hover state
  const getCursorStyles = () => {
    switch (hoverState) {
      case 'text':
        return {
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(110, 205, 190, 0.1)',
          border: 'none'
        };
      case 'link':
        return {
          width: '12px',
          height: '12px',
          backgroundColor: '#FF6F61',
          border: 'none'
        };
      case 'button':
        return {
          width: '12px',
          height: '12px',
          backgroundColor: '#191938',
          border: 'none'
        };
      default:
        return {
          width: '12px',
          height: '12px',
          backgroundColor: 'rgba(110, 205, 190, 0.8)',
          border: 'none'
        };
    }
  };

  const getFollowerStyles = () => {
    if (hoverState === 'text') {
      return { opacity: 0, transform: '' };
    }
    if (hoverState === 'link' && hoverTargetRect) {
      return {
        width: `${hoverTargetRect.width + 20}px`,
        height: `${hoverTargetRect.height + 10}px`,
        borderRadius: '8px',
        border: '2px solid #6ECDBE',
        opacity: 0.5,
        transform: `translate(${hoverTargetRect.left - 10}px, ${hoverTargetRect.top - 5}px)`
      };
    }
    if (hoverState === 'button') {
      return {
        width: '40px',
        height: '40px',
        border: '2px solid #191938',
        opacity: 0.5,
        transform: ''
      };
    }
    return {
      width: '40px',
      height: '40px',
      border: '2px solid #6ECDBE',
      opacity: 0.5,
      transform: ''
    };
  };

  return (
      <div style={{ cursor: 'none', minHeight: '100vh', backgroundColor: '#191938', color: '#FFFFFF' }}>
      {/* SVG Filter for Gooey Effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop"/>
          </filter>
        </defs>
      </svg>

      {/* Custom Cursor */}
      {!isInAura && (
        <div style={{ filter: 'url(#gooey)' }}>
          <div
            ref={cursorRef}
            style={{
              position: 'fixed',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 9999,
              transition: 'width 0.3s ease, height 0.3s ease, background-color 0.3s ease',
              ...getCursorStyles()
            }}
          />
          <div
            ref={followerRef}
            style={{
              position: 'fixed',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid #6ECDBE',
              pointerEvents: 'none',
              zIndex: 9998,
              transition: 'width 0.3s ease, height 0.3s ease, border-color 0.3s ease, opacity 0.3s ease, border-radius 0.3s ease',
              ...getFollowerStyles()
            }}
          />
        </div>
      )}

      {/* Aura Cursor */}
      {isInAura && (
        <div
          style={{
            position: 'fixed',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            filter: 'blur(10px)',
            pointerEvents: 'none',
            zIndex: 9999,
            transform: `translate(${auraCursorPos.x - 15}px, ${auraCursorPos.y - 15}px)`,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Content */}
      <div style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <nav style={{ display: 'flex', gap: '40px', marginBottom: '80px', alignItems: 'center' }}>
          <div className="magnetic-link" style={{ fontSize: '24px', fontWeight: 'bold', cursor: 'none' }}>
            Aura
          </div>
          <div className="magnetic-link" style={{ fontSize: '18px', cursor: 'none' }}>
            Solutions
          </div>
          <div className="magnetic-link" style={{ fontSize: '18px', cursor: 'none' }}>
            Learning
          </div>
          <div className="magnetic-link" style={{ fontSize: '18px', cursor: 'none' }}>
            Insights
          </div>
        </nav>

        <h1 style={{ fontSize: '64px', marginBottom: '30px', fontWeight: '300', lineHeight: '1.2' }}>
          Financial Energy,<br />
          Reimagined
        </h1>

        <p style={{ fontSize: '20px', marginBottom: '40px', lineHeight: '1.6', maxWidth: '600px', opacity: 0.8 }}>
          Experience the future of financial intelligence with Aura. Our platform transforms how you interact with your financial data, making complex information intuitive and actionable.
        </p>

        <button 
          className="cta-button"
          style={{
            padding: '16px 40px',
            fontSize: '18px',
            backgroundColor: '#FF6F61',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'none',
            fontWeight: '500',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 111, 97, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Get Started
        </button>

        {/* Aura Visualization Container */}
        <div
          ref={auraRef}
          style={{
            marginTop: '100px',
            height: '500px',
            width: '100%',
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'rgba(30, 30, 50, 0.5)',
            cursor: 'none'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />
        </div>
      </div>
    </div>
  );
}

