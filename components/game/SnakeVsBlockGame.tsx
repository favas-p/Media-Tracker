'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Music, 
  Music2, 
  Pause, 
  Trophy, 
  Zap, 
  Sparkles,
  ChevronLeft,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { gameAudio } from '@/lib/game-audio';

interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  maxVal: number;
  hitFlash: number;
}

interface Divider {
  id: string;
  x: number;
  y: number;
  height: number;
}

interface Collectible {
  id: string;
  x: number;
  y: number;
  radius: number;
  value: number;
  type: 'normal' | 'super' | 'star';
  floatOffset: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface Segment {
  x: number;
  y: number;
}

export function SnakeVsBlockGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game States
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [snakeLength, setSnakeLength] = useState<number>(5);
  const [combo, setCombo] = useState<number>(1);
  const [comboText, setComboText] = useState<string>('');
  
  // Settings
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isMusicOn, setIsMusicOn] = useState<boolean>(true);

  // References for mutable game loop state
  const loopRef = useRef<number | null>(null);
  const touchXRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Physics engine mutable state
  const engineRef = useRef<{
    width: number;
    height: number;
    headX: number;
    headY: number;
    targetX: number;
    speed: number;
    distanceScrolled: number;
    snakeLength: number;
    body: Segment[];
    blocks: Block[];
    dividers: Divider[];
    collectibles: Collectible[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    shakeTime: number;
    shakeMag: number;
    headScale: number;
    comboTimer: number;
    comboCount: number;
    hitCooldown: number;
    lastBlockSpawnY: number;
  }>({
    width: 420,
    height: 680,
    headX: 210,
    headY: 500,
    targetX: 210,
    speed: 3.2,
    distanceScrolled: 0,
    snakeLength: 5,
    body: [],
    blocks: [],
    dividers: [],
    collectibles: [],
    particles: [],
    floatingTexts: [],
    shakeTime: 0,
    shakeMag: 0,
    headScale: 1.0,
    comboTimer: 0,
    comboCount: 0,
    hitCooldown: 0,
    lastBlockSpawnY: 0,
  });

  const queryClient = useQueryClient();

  // Submit high score to backend API & invalidate leaderboard cache
  const submitScoreToBackend = useCallback(async (finalScore: number) => {
    if (finalScore <= 0) return;
    try {
      const res = await fetch('/api/game/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore }),
      });
      const data = await res.json();
      if (data.success && data.highScore) {
        setHighScore(data.highScore);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nusa_snake_highscore', data.highScore.toString());
        }
      }
      queryClient.invalidateQueries({ queryKey: ['game-leaderboard'] });
    } catch {
      // Ignore API errors
    }
  }, [queryClient]);

  // Sync high score on mount from both localStorage and server DB
  useEffect(() => {
    const syncScores = async () => {
      let localScore = 0;
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('nusa_snake_highscore');
        if (saved) localScore = parseInt(saved, 10);
      }

      try {
        const res = await fetch('/api/game/score');
        const data = await res.json();
        const serverScore = data.success ? (data.highScore || 0) : 0;

        const bestScore = Math.max(localScore, serverScore);
        if (bestScore > 0) {
          setHighScore(bestScore);
          if (typeof window !== 'undefined') {
            localStorage.setItem('nusa_snake_highscore', bestScore.toString());
          }
          // Ensure server database holds bestScore
          if (bestScore > serverScore || serverScore === 0) {
            submitScoreToBackend(bestScore);
          }
        }
      } catch {
        if (localScore > 0) setHighScore(localScore);
      }
    };

    syncScores();
  }, [submitScoreToBackend]);

  // Save High Score
  const updateHighScore = useCallback((newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nusa_snake_highscore', newScore.toString());
      }
      submitScoreToBackend(newScore);
    }
  }, [highScore, submitScoreToBackend]);

  // Haptic feedback helper
  const triggerHaptic = (ms: number = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch { /* ignore */ }
    }
  };

  // Spawn initial/procedural blocks and collectibles
  const spawnRow = useCallback((yPos: number) => {
    const engine = engineRef.current;
    const colCount = 5;
    const blockW = engine.width / colCount;
    const blockH = blockW * 0.9;
    
    const currentScore = engine.distanceScrolled;

    // Difficulty scaling
    const minVal = Math.min(1 + Math.floor(currentScore / 25), 15);
    const maxVal = Math.min(5 + Math.floor(currentScore / 10), 60);

    // Number of blocks in this row (leave at least 1-2 open gaps)
    const blockIndices: number[] = [];
    for (let c = 0; c < colCount; c++) {
      if (Math.random() > 0.3) {
        blockIndices.push(c);
      }
    }

    blockIndices.forEach((colIdx) => {
      let val = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      if (Math.random() < 0.15) val = Math.floor(val * 1.5) + 5;

      engine.blocks.push({
        id: Math.random().toString(),
        x: colIdx * blockW,
        y: yPos,
        width: blockW,
        height: blockH,
        value: val,
        maxVal: val,
        hitFlash: 0,
      });

      // Spawn vertical divider wall between columns
      if (colIdx > 0 && Math.random() < 0.5) {
        engine.dividers.push({
          id: Math.random().toString(),
          x: colIdx * blockW,
          y: yPos - 60,
          height: blockH + 80,
        });
      }
    });

    // Spawn collectibles in open areas below blocks
    const colChoice = Math.floor(Math.random() * colCount);
    const collectibleY = yPos + blockH + 60;
    
    let colVal = 1;
    let type: 'normal' | 'super' | 'star' = 'normal';
    const cRand = Math.random();
    if (cRand < 0.25) {
      colVal = Math.floor(Math.random() * 4) + 2; // +2 to +5
      type = 'super';
    } else if (cRand < 0.32) {
      colVal = 10;
      type = 'star';
    } else {
      colVal = Math.floor(Math.random() * 3) + 1; // +1 to +3
    }

    engine.collectibles.push({
      id: Math.random().toString(),
      x: colChoice * blockW + blockW / 2,
      y: collectibleY,
      radius: type === 'star' ? 14 : 11,
      value: colVal,
      type,
      floatOffset: Math.random() * Math.PI * 2,
    });
  }, []);

  // Initialize/Reset Game Engine
  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : 420;
    const h = canvas ? canvas.height : 680;

    const startLength = 5;

    // Reset Engine State
    engineRef.current = {
      width: w,
      height: h,
      headX: w / 2,
      headY: h * 0.72,
      targetX: w / 2,
      speed: 3.2,
      distanceScrolled: 0,
      snakeLength: startLength,
      body: Array.from({ length: startLength * 6 }).map(() => ({ x: w / 2, y: h * 0.72 })),
      blocks: [],
      dividers: [],
      collectibles: [],
      particles: [],
      floatingTexts: [],
      shakeTime: 0,
      shakeMag: 0,
      headScale: 1.0,
      comboTimer: 0,
      comboCount: 0,
      hitCooldown: 0,
      lastBlockSpawnY: -100,
    };

    // Pre-populate obstacles ahead
    for (let y = 100; y > -1400; y -= 240) {
      spawnRow(y);
    }
    engineRef.current.lastBlockSpawnY = -1400;

    setScore(0);
    setSnakeLength(startLength);
    setCombo(1);
    setComboText('');
  }, [spawnRow]);

  // Start game handler
  const handleStartGame = () => {
    gameAudio.unlock();
    resetGame();
    setGameState('PLAYING');
    if (isMusicOn) {
      gameAudio.startMusic();
    }
  };

  // Toggle Sound Effects
  const handleToggleSound = () => {
    const newState = gameAudio.toggleSound();
    setIsSoundOn(newState);
  };

  // Toggle Music
  const handleToggleMusic = () => {
    const newState = gameAudio.toggleMusic();
    setIsMusicOn(newState);
  };

  // Particle Explosions
  const spawnParticles = (x: number, y: number, color: string, count: number = 12) => {
    const engine = engineRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
      engine.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 2,
        color,
        life: 1,
        maxLife: Math.random() * 20 + 20,
      });
    }
  };

  // Floating text popup (+5, Combo, etc)
  const spawnFloatingText = (x: number, y: number, text: string, color: string = '#FFE600') => {
    engineRef.current.floatingTexts.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      life: 1,
    });
  };

  // Main Render & Physics Update Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = (timestamp: number) => {
      if (gameState === 'PLAYING') {
        const engine = engineRef.current;

        // 1. INPUT HANDLING (Keyboard A/D & Arrow Keys)
        const keys = keysPressedRef.current;
        const keySpeed = 9.5;
        if (keys['ArrowLeft'] || keys['KeyA']) {
          engine.targetX -= keySpeed;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
          engine.targetX += keySpeed;
        }

        // Clamp targetX inside canvas walls
        const radius = 12;
        engine.targetX = Math.max(radius + 4, Math.min(engine.width - radius - 4, engine.targetX));

        // Smooth Lerp horizontal movement
        const prevHeadX = engine.headX;
        engine.headX += (engine.targetX - engine.headX) * 0.28;

        // 2. CHECK VERTICAL DIVIDER BARRIERS
        engine.dividers.forEach((div) => {
          if (engine.headY >= div.y && engine.headY <= div.y + div.height) {
            // Cannot cross divider horizontally
            if (prevHeadX < div.x && engine.headX >= div.x - radius) {
              engine.headX = div.x - radius - 0.5;
              engine.targetX = engine.headX;
            } else if (prevHeadX > div.x && engine.headX <= div.x + radius) {
              engine.headX = div.x + radius + 0.5;
              engine.targetX = engine.headX;
            }
          }
        });

        // 3. SCROLL WORLD UPWARDS
        const speed = 3.0 + Math.min(engine.distanceScrolled * 0.003, 4.5);
        engine.speed = speed;

        // Check block collision (if hitting a block, vertical movement slows/pauses)
        let isCollidingWithBlock = false;
        let collidingBlock: Block | null = null;

        for (let i = 0; i < engine.blocks.length; i++) {
          const b = engine.blocks[i];
          const closestX = Math.max(b.x, Math.min(engine.headX, b.x + b.width));
          const closestY = Math.max(b.y, Math.min(engine.headY, b.y + b.height));
          const distX = engine.headX - closestX;
          const distY = engine.headY - closestY;
          const distance = Math.sqrt(distX * distX + distY * distY);

          if (distance < radius + 2 && b.y + b.height >= engine.headY - radius) {
            isCollidingWithBlock = true;
            collidingBlock = b;
            break;
          }
        }

        // Advance world scrolling if not blocked
        const scrollDelta = isCollidingWithBlock ? 0.3 : speed;
        engine.distanceScrolled += scrollDelta * 0.1;
        setScore(Math.floor(engine.distanceScrolled));
        updateHighScore(Math.floor(engine.distanceScrolled));

        // Move blocks, dividers, collectibles downward
        engine.blocks.forEach((b) => (b.y += scrollDelta));
        engine.dividers.forEach((d) => (d.y += scrollDelta));
        engine.collectibles.forEach((c) => (c.y += scrollDelta));

        // Procedurally spawn new rows
        engine.lastBlockSpawnY += scrollDelta;
        if (engine.lastBlockSpawnY > -200) {
          const newY = engine.lastBlockSpawnY - 240;
          spawnRow(newY);
          engine.lastBlockSpawnY = newY;
        }

        // Cleanup offscreen objects
        engine.blocks = engine.blocks.filter((b) => b.y < engine.height + 100);
        engine.dividers = engine.dividers.filter((d) => d.y < engine.height + 100);
        engine.collectibles = engine.collectibles.filter((c) => c.y < engine.height + 100);

        // 4. BLOCK IMPACT & DESTRUCTION PHYSICS
        if (collidingBlock) {
          engine.hitCooldown += 1;
          if (engine.hitCooldown >= 4) { // Tick hit every 4 frames (~65ms)
            engine.hitCooldown = 0;

            // Reduce snake length & block value
            engine.snakeLength -= 1;
            collidingBlock.value -= 1;
            collidingBlock.hitFlash = 5; // Flash effect
            setSnakeLength(engine.snakeLength);

            // Screen shake & haptics
            engine.shakeTime = 6;
            engine.shakeMag = 4;
            triggerHaptic(12);

            // Sound
            gameAudio.playHit();

            // Hit particles
            spawnParticles(engine.headX, collidingBlock.y + collidingBlock.height, '#FFE600', 4);

            // If block destroyed
            if (collidingBlock.value <= 0) {
              spawnParticles(
                collidingBlock.x + collidingBlock.width / 2,
                collidingBlock.y + collidingBlock.height / 2,
                getBlockColor(collidingBlock.maxVal),
                25
              );
              gameAudio.playBreak();
              engine.blocks = engine.blocks.filter((b) => b.id !== collidingBlock!.id);

              // Combo logic
              engine.comboCount += 1;
              engine.comboTimer = 120; // 2 sec combo window
              const currentCombo = Math.min(Math.floor(engine.comboCount / 2) + 1, 5);
              setCombo(currentCombo);
              if (currentCombo > 1) {
                setComboText(`COMBO x${currentCombo}!`);
                gameAudio.playCombo(currentCombo);
                spawnFloatingText(engine.headX, engine.headY - 40, `x${currentCombo} BONUS!`, '#2511F7');
              }
            }

            // Game Over check
            if (engine.snakeLength <= 0) {
              setGameState('GAMEOVER');
              gameAudio.playGameOver();
              gameAudio.stopMusic();
              const finalMatchScore = Math.floor(engine.distanceScrolled);
              submitScoreToBackend(finalMatchScore);
            }
          }
        } else {
          engine.hitCooldown = 0;
        }

        // Combo decay timer
        if (engine.comboTimer > 0) {
          engine.comboTimer -= 1;
          if (engine.comboTimer <= 0) {
            engine.comboCount = 0;
            setCombo(1);
            setComboText('');
          }
        }

        // 5. COLLECTIBLE PICKUP PHYSICS
        engine.collectibles.forEach((c) => {
          const dx = engine.headX - c.x;
          const dy = engine.headY - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius + c.radius) {
            // Collect item!
            engine.snakeLength += c.value;
            setSnakeLength(engine.snakeLength);
            engine.headScale = 1.4; // Growth animation

            // Audio & VFX
            gameAudio.playCollect(c.type === 'super', c.type === 'star');
            triggerHaptic(20);
            spawnParticles(c.x, c.y, c.type === 'star' ? '#FFE600' : '#00F0FF', 15);
            spawnFloatingText(c.x, c.y - 20, `+${c.value}`, c.type === 'star' ? '#FFE600' : '#00FF99');

            // Remove collectible
            engine.collectibles = engine.collectibles.filter((item) => item.id !== c.id);
          }
        });

        // 6. UPDATE SNAKE BODY TRAIL
        const spacing = 12;
        const totalSegments = engine.snakeLength * 5;

        while (engine.body.length < totalSegments) {
          const lastSeg = engine.body[engine.body.length - 1] || { x: engine.headX, y: engine.headY };
          engine.body.push({ x: lastSeg.x, y: lastSeg.y + spacing });
        }
        if (engine.body.length > totalSegments) {
          engine.body = engine.body.slice(0, totalSegments);
        }

        if (engine.body.length > 0) {
          engine.body[0].x += (engine.headX - engine.body[0].x) * 0.45;
          engine.body[0].y = engine.headY + spacing;

          for (let s = 1; s < engine.body.length; s++) {
            const prev = engine.body[s - 1];
            const curr = engine.body[s];
            curr.x += (prev.x - curr.x) * 0.45;
            curr.y = prev.y + spacing * 0.4;
          }
        }

        if (engine.headScale > 1.0) {
          engine.headScale -= 0.03;
        }

        if (engine.shakeTime > 0) {
          engine.shakeTime -= 1;
        }

        engine.particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life += 1;
        });
        engine.particles = engine.particles.filter((p) => p.life < p.maxLife);

        engine.floatingTexts.forEach((ft) => {
          ft.y -= 1.2;
          ft.life -= 0.02;
        });
        engine.floatingTexts = engine.floatingTexts.filter((ft) => ft.life > 0);
      }

      // 7. CANVAS RENDERING
      const engine = engineRef.current;
      ctx.clearRect(0, 0, engine.width, engine.height);

      ctx.save();
      if (engine.shakeTime > 0) {
        const shakeX = (Math.random() - 0.5) * engine.shakeMag;
        const shakeY = (Math.random() - 0.5) * engine.shakeMag;
        ctx.translate(shakeX, shakeY);
      }

      // Background Gradient Grid
      const isDark = document.documentElement.classList.contains('dark');
      const bgGrad = ctx.createLinearGradient(0, 0, 0, engine.height);
      if (isDark) {
        bgGrad.addColorStop(0, '#07022E');
        bgGrad.addColorStop(1, '#0C0448');
      } else {
        bgGrad.addColorStop(0, '#F4F5FA');
        bgGrad.addColorStop(1, '#E2E8F0');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, engine.width, engine.height);

      // Draw subtle background grid pattern
      ctx.strokeStyle = isDark ? 'rgba(37, 17, 247, 0.08)' : 'rgba(37, 17, 247, 0.04)';
      ctx.lineWidth = 1;
      const gridStep = 40;
      const offsetGrid = (engine.distanceScrolled * 10) % gridStep;
      for (let y = offsetGrid; y < engine.height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(engine.width, y);
        ctx.stroke();
      }

      // Draw Vertical Dividers
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.5)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      engine.dividers.forEach((d) => {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y + d.height);
        ctx.stroke();
      });

      // Draw Blocks
      engine.blocks.forEach((b) => {
        const color = getBlockColor(b.maxVal);
        ctx.save();
        ctx.translate(b.x + 2, b.y + 2);

        ctx.fillStyle = b.hitFlash > 0 ? '#FFFFFF' : color;
        if (b.hitFlash > 0) b.hitFlash -= 1;

        const radius = 14;
        const bw = b.width - 4;
        const bh = b.height - 4;

        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.roundRect(0, 0, bw, bh, radius);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.roundRect(2, 2, bw - 4, bh * 0.35, [12, 12, 4, 4]);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(b.value.toString(), bw / 2, bh / 2 + 1);

        ctx.restore();
      });

      // Draw Collectibles (+1, +5, Stars)
      engine.collectibles.forEach((c) => {
        ctx.save();
        const floatY = c.y + Math.sin(timestamp * 0.005 + c.floatOffset) * 4;

        ctx.shadowColor = c.type === 'star' ? '#FFE600' : '#00F0FF';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(c.x, floatY, c.radius, 0, Math.PI * 2);
        ctx.fillStyle = c.type === 'star' ? '#FFE600' : '#2511F7';
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = c.type === 'star' ? '#0A043D' : '#FFFFFF';
        ctx.font = '800 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${c.value}`, c.x, floatY + 0.5);

        ctx.restore();
      });

      // Draw Snake Body Trail
      ctx.save();
      for (let i = engine.body.length - 1; i >= 0; i -= 3) {
        const seg = engine.body[i];
        if (!seg) continue;
        const progress = 1 - i / engine.body.length;
        const segR = 7 + progress * 3;

        ctx.shadowColor = '#FFE600';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, segR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFE600';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      }
      ctx.restore();

      // Draw Snake Head
      ctx.save();
      const headR = 13 * engine.headScale;
      ctx.shadowColor = '#2511F7';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.arc(engine.headX, engine.headY, headR, 0, Math.PI * 2);
      ctx.fillStyle = '#FFE600';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2511F7';
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0A043D';
      ctx.beginPath();
      ctx.arc(engine.headX - 4, engine.headY - 3, 2.5, 0, Math.PI * 2);
      ctx.arc(engine.headX + 4, engine.headY - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDark ? '#FFFFFF' : '#0A043D';
      ctx.font = '900 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(engine.snakeLength.toString(), engine.headX, engine.headY - headR - 4);

      ctx.restore();

      // Draw Particles
      engine.particles.forEach((p) => {
        ctx.save();
        const alpha = 1 - p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Floating Text Popups
      engine.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = '900 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    loopRef.current = animId;

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [gameState, spawnRow, updateHighScore]);

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (!container) return;

      const displayW = Math.min(container.clientWidth, 480);
      const displayH = Math.min(window.innerHeight - 200, 700);

      canvas.width = displayW;
      canvas.height = displayH;
      engineRef.current.width = displayW;
      engineRef.current.height = displayH;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard Control Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = true;
      if (e.code === 'Escape' && gameState === 'PLAYING') {
        setGameState('PAUSED');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Pointer / Drag Controls (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    isDraggingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    engineRef.current.targetX = x;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || gameState !== 'PLAYING') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    engineRef.current.targetX = x;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0D0647] border border-slate-200 dark:border-blue-900/40 p-4 sm:p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-full border border-slate-200 dark:border-blue-900/40 bg-slate-50 dark:bg-[#12095C] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A0D85] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D0647] dark:text-white tracking-tight">
                Team Relax Zone
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#2511F7] text-[#FFE600] shadow-sm">
                Snake vs Blocks
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Relax, take a quick break & challenge your high score!
            </p>
          </div>
        </div>

        {/* Audio & Pause Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className={`p-2.5 rounded-full border transition-all ${
              isSoundOn 
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40 text-[#2511F7] dark:text-blue-400' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
            title={isSoundOn ? 'Mute SFX' : 'Enable SFX'}
          >
            {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleMusic}
            className={`p-2.5 rounded-full border transition-all ${
              isMusicOn 
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40 text-purple-600 dark:text-purple-400' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
            title={isMusicOn ? 'Mute Ambient Music' : 'Enable Music'}
          >
            {isMusicOn ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
          </button>

          {gameState === 'PLAYING' && (
            <button
              onClick={() => setGameState('PAUSED')}
              className="px-3.5 py-2 rounded-full bg-slate-100 dark:bg-[#12095C] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1A0D85] font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-blue-900/40"
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          )}
        </div>
      </div>

      {/* Main Game Container */}
      <div className="relative flex justify-center items-center">
        <div className="relative w-full max-w-[480px] rounded-[32px] overflow-hidden border-2 border-slate-200 dark:border-blue-900/50 shadow-2xl bg-slate-900 select-none touch-none">
          
          {/* Top Score HUD overlay */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
            <div className="flex items-center gap-2 bg-white/90 dark:bg-[#0D0647]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-blue-900/40 shadow-lg">
              <Trophy className="w-4 h-4 text-[#2511F7] dark:text-[#FFE600]" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
                  Score
                </span>
                <span className="text-lg font-black text-[#0D0647] dark:text-white leading-tight">
                  {score}
                </span>
              </div>
            </div>

            {/* High Score Badge */}
            <div className="flex items-center gap-2 bg-white/90 dark:bg-[#0D0647]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-blue-900/40 shadow-lg">
              <Zap className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
                  Best
                </span>
                <span className="text-lg font-black text-amber-500 leading-tight">
                  {highScore}
                </span>
              </div>
            </div>
          </div>

          {/* Combo Banner Animation */}
          {comboText && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="px-4 py-1.5 rounded-full bg-[#2511F7] text-[#FFE600] font-black text-sm tracking-wider shadow-lg animate-bounce border border-yellow-300/40">
                {comboText}
              </div>
            </div>
          )}

          {/* Canvas Viewport */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-[640px] block cursor-grab active:cursor-grabbing"
          />

          {/* OVERLAY 1: START / IDLE SCREEN */}
          {gameState === 'IDLE' && (
            <div className="absolute inset-0 z-30 bg-[#07022E]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-6">
              <div className="h-16 w-16 rounded-3xl bg-[#2511F7] text-[#FFE600] flex items-center justify-center shadow-xl shadow-blue-600/40 border border-blue-400/30 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Snake vs Block
                </h2>
                <p className="text-xs text-blue-200 font-medium max-w-xs mx-auto mt-2">
                  Drag left & right to collect balls, increase snake length and break through numbered blocks!
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 max-w-xs text-left space-y-2 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#FFE600]" />
                  <span><strong>Drag / Swipe</strong> or <strong>A/D Keys</strong> to move</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>Collect <strong>+1, +5 balls</strong> to grow length</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span>Avoid blocks with higher numbers than your length!</span>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                className="w-full max-w-xs py-3.5 px-6 rounded-full bg-[#FFE600] hover:bg-[#ebd500] text-[#0A043D] font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" /> Start Playing
              </button>

              {highScore > 0 && (
                <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> High Score: {highScore} pts
                </div>
              )}
            </div>
          )}

          {/* OVERLAY 2: PAUSED SCREEN */}
          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 z-30 bg-[#07022E]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5">
              <h3 className="text-3xl font-black text-white tracking-tight">Game Paused</h3>
              <div className="space-y-3 w-full max-w-xs">
                <button
                  onClick={() => setGameState('PLAYING')}
                  className="w-full py-3 px-6 rounded-full bg-[#2511F7] hover:bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Play className="w-4 h-4 fill-current" /> Resume Game
                </button>

                <button
                  onClick={handleStartGame}
                  className="w-full py-3 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-white/20"
                >
                  <RotateCcw className="w-4 h-4" /> Restart
                </button>
              </div>
            </div>
          )}

          {/* OVERLAY 3: GAME OVER SCREEN */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 z-30 bg-[#07022E]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                <RotateCcw className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-widest text-rose-400 block">
                  Game Over
                </span>
                <h3 className="text-4xl font-black text-white tracking-tight mt-1">
                  {score} <span className="text-lg font-bold text-slate-400">pts</span>
                </h3>
                {score >= highScore && score > 0 && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs">
                    🎉 NEW HIGH SCORE!
                  </span>
                )}
              </div>

              <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Distance Traveled:</span>
                  <span className="font-bold text-white">{score}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Personal Best:</span>
                  <span className="font-bold text-amber-400">{highScore} pts</span>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                className="w-full max-w-xs py-3.5 px-6 rounded-full bg-[#FFE600] hover:bg-[#ebd500] text-[#0A043D] font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Footer Info & Controls Tip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-2 font-medium">
        <div className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-[#2511F7] dark:text-[#FFE600]" />
          <span>Desktop: Drag with mouse or press <strong>A / D / Arrow Keys</strong></span>
        </div>
        <div>
          <span>Mobile: Touch & drag left/right</span>
        </div>
      </div>
    </div>
  );
}

function getBlockColor(value: number): string {
  if (value <= 4) return '#10B981';
  if (value <= 9) return '#00F0FF';
  if (value <= 19) return '#F59E0B';
  if (value <= 34) return '#F97316';
  if (value <= 49) return '#EF4444';
  return '#8B5CF6';
}
