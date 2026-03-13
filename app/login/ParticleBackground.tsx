"use client";

import React, { useEffect, useRef } from 'react';

// Defines the colors based on polar angle to loosely match the Antigravity theme's radial gradient
const getColorForAngle = (angle: number) => {
  let normalized = angle;
  if (normalized < 0) normalized += Math.PI * 2;

  const degree = (normalized * 180) / Math.PI;

  if (degree >= 315 || degree < 45) {
    // Right: Blues
    return ['#3279F9', '#00C2FF'][Math.floor(Math.random() * 2)];
  } else if (degree >= 45 && degree < 135) {
    // Bottom: Reds and Oranges
    return ['#FF4E00', '#FF0000', '#FF8C00'][Math.floor(Math.random() * 3)];
  } else if (degree >= 135 && degree < 225) {
    // Left: Yellows and Pinks
    return ['#FFD700', '#FF91A4', '#FF00FF'][Math.floor(Math.random() * 3)];
  } else {
    // Top: Purples and dark Blues
    return ['#A020F0', '#8A2BE2', '#3279F9'][Math.floor(Math.random() * 3)];
  }
};

class Particle {
  x: number = 0;
  y: number = 0;
  angle: number = 0;
  speed: number = 0;
  color: string = '';
  length: number = 0;
  distance: number = 0;
  maxDistance: number = 0;
  opacity: number = 0;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.init(true);
  }

  init(initialSpawn: boolean = false) {
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;

    // Distribute randomly across the screen initially, else spawn near center
    const spawnRadius = initialSpawn
      ? Math.random() * Math.max(this.canvasWidth, this.canvasHeight)
      : Math.random() * 100 + 50;

    this.angle = Math.random() * Math.PI * 2;
    this.x = centerX + Math.cos(this.angle) * spawnRadius;
    this.y = centerY + Math.sin(this.angle) * spawnRadius;

    this.speed = Math.random() * 1.5 + 0.2;

    // Calculate angle relative to center for color mapping
    const angleFromCenter = Math.atan2(this.y - centerY, this.x - centerX);
    this.color = getColorForAngle(angleFromCenter);

    this.length = Math.random() * 12 + 4;
    this.distance = initialSpawn ? spawnRadius : 0;
    this.maxDistance = Math.max(this.canvasWidth, this.canvasHeight);
    this.opacity = initialSpawn ? Math.random() : 0;
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.distance += this.speed;

    // Accelerate as it moves outward imitating perspective warp
    this.speed *= 1.015;

    // Smooth fade in and out curve based on distance
    if (this.distance < 100) {
      this.opacity = this.distance / 100;
    } else if (this.distance > this.maxDistance * 0.7) {
      this.opacity = Math.max(0, 1 - (this.distance - this.maxDistance * 0.7) / (this.maxDistance * 0.3));
    } else {
      this.opacity = 1;
    }

    // Reset if off screen or fully faded out at edge
    if (
      this.distance > this.maxDistance ||
      this.x < 0 ||
      this.x > this.canvasWidth ||
      this.y < 0 ||
      this.y > this.canvasHeight ||
      (this.distance > this.maxDistance * 0.7 && this.opacity === 0)
    ) {
      this.init();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    // Dynamic streak length elongates based on speed
    const currentLength = this.length + (this.speed * 2);
    const startX = this.x - Math.cos(this.angle) * currentLength;
    const startY = this.y - Math.sin(this.angle) * currentLength;

    ctx.moveTo(startX, startY);
    ctx.lineTo(this.x, this.y);

    ctx.strokeStyle = this.color;
    ctx.globalAlpha = this.opacity * 0.85;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const numParticles = window.innerWidth > 768 ? 450 : 200;
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      // Clear canvas with subtle trail fade
      ctx.fillStyle = 'rgba(249, 250, 251, 0.4)'; // Matches bg-gray-50 from tailwind but fading
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ backgroundColor: '#f9fafb' }} // bg-gray-50
      />
      {/* Subtle vignette blue glow at top and bottom */}
      <div className="fixed inset-0 pointer-events-none z-0 shadow-[inset_0_80px_100px_rgba(50,121,249,0.08),inset_0_-80px_100px_rgba(50,121,249,0.12)]" />
    </>
  );
}
