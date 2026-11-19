import React from 'react';
import { Wrench, Settings, Cog, Hammer, Shield, Gauge, Fan, Zap, CircleDot, Bolt } from 'lucide-react';

const iconComponents = [Wrench, Settings, Cog, Hammer, Shield, Gauge, Fan, Zap, CircleDot, Bolt];

// Layer 1: Large slow background icons (deep layer)
const bgIcons = Array.from({ length: 8 }, (_, i) => ({
  iconIndex: i % iconComponents.length,
  left: `${(i * 12.5)}%`,
  top: `${(i * 25 + 10) % 100}%`,
  delay: `${i * 2.5}s`,
  duration: `${25 + (i % 3) * 5}s`,
  size: 48 + (i % 3) * 16,
  opacity: 0.03,
  layer: 'bg' as const,
}));

// Layer 2: Medium floating icons (mid layer)
const midIcons = Array.from({ length: 14 }, (_, i) => ({
  iconIndex: (i + 3) % iconComponents.length,
  left: `${(i * 7.1 + 2) % 100}%`,
  top: `${(i * 14.3 + 8) % 100}%`,
  delay: `${i * 1.1}s`,
  duration: `${14 + (i % 4) * 3}s`,
  size: 22 + (i % 4) * 6,
  opacity: 0.055,
  layer: 'mid' as const,
}));

// Layer 3: Small fast particles (foreground sparkles)
const fgParticles = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 5 + 1) % 100}%`,
  top: `${(i * 10 + 3) % 100}%`,
  delay: `${i * 0.7}s`,
  duration: `${8 + (i % 5) * 2}s`,
  size: 3 + (i % 4) * 2,
  opacity: 0.08 + (i % 3) * 0.03,
}));

// Glowing orbs
const glowOrbs = Array.from({ length: 5 }, (_, i) => ({
  left: `${(i * 20 + 5)}%`,
  top: `${(i * 30 + 15) % 100}%`,
  delay: `${i * 3}s`,
  duration: `${20 + i * 4}s`,
  size: 120 + i * 40,
  opacity: 0.04,
}));

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Glowing orbs - cinematic light leaks */}
      {glowOrbs.map((orb, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full animate-maintenance-drift"
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, hsl(0 72% 51% / ${orb.opacity}) 0%, transparent 70%)`,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
            filter: 'blur(30px)',
          }}
        />
      ))}

      {/* Background layer - large slow icons */}
      {bgIcons.map((item, i) => {
        const Icon = iconComponents[item.iconIndex];
        return (
          <div
            key={`bg-${i}`}
            className="absolute animate-maintenance-float-slow text-primary"
            style={{
              left: item.left,
              top: item.top,
              animationDelay: item.delay,
              animationDuration: item.duration,
              opacity: item.opacity,
              filter: 'blur(1px)',
            }}
          >
            <Icon style={{ width: item.size, height: item.size }} />
          </div>
        );
      })}

      {/* Mid layer - medium floating icons */}
      {midIcons.map((item, i) => {
        const Icon = iconComponents[item.iconIndex];
        return (
          <div
            key={`mid-${i}`}
            className="absolute animate-maintenance-float text-primary"
            style={{
              left: item.left,
              top: item.top,
              animationDelay: item.delay,
              animationDuration: item.duration,
              opacity: item.opacity,
            }}
          >
            <Icon style={{ width: item.size, height: item.size }} />
          </div>
        );
      })}

      {/* Foreground particles - tiny glowing dots */}
      {fgParticles.map((p, i) => (
        <div
          key={`fg-${i}`}
          className="absolute rounded-full animate-maintenance-sparkle bg-primary"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${p.size}px hsl(0 72% 51% / 0.15)`,
          }}
        />
      ))}

      {/* Diagonal light streak */}
      <div
        className="absolute animate-maintenance-streak"
        style={{
          width: '200%',
          height: '2px',
          top: '30%',
          left: '-50%',
          background: 'linear-gradient(90deg, transparent 0%, hsl(0 72% 51% / 0.06) 30%, hsl(0 72% 51% / 0.12) 50%, hsl(0 72% 51% / 0.06) 70%, transparent 100%)',
          transform: 'rotate(-15deg)',
          transformOrigin: 'center',
        }}
      />
      <div
        className="absolute animate-maintenance-streak"
        style={{
          width: '200%',
          height: '1px',
          top: '65%',
          left: '-50%',
          background: 'linear-gradient(90deg, transparent 0%, hsl(0 72% 51% / 0.04) 40%, hsl(0 72% 51% / 0.08) 50%, hsl(0 72% 51% / 0.04) 60%, transparent 100%)',
          transform: 'rotate(10deg)',
          transformOrigin: 'center',
          animationDelay: '5s',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
