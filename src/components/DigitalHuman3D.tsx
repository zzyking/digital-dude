import { useRef, useEffect, useState } from 'react';
import type { DigitalHuman3DProps, CanvasDimensions, EmotionType, GestureType } from '../types';

// 3D数字人组件（简化版本）
const DigitalHuman3D = ({ emotion, gesture, isAnimating }: DigitalHuman3DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(null);
  const [dimensions, setDimensions] = useState<CanvasDimensions>({ width: 400, height: 400 });

  // 响应式尺寸调整
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        // 使用容器的完整尺寸
        const newWidth = containerWidth;
        const newHeight = containerHeight;
        
        setDimensions({ width: newWidth, height: newHeight });
      }
    };

    // 初始化尺寸
    handleResize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    // 使用ResizeObserver监听容器大小变化
    let resizeObserver: ResizeObserver | undefined;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // 绘制数字人的函数
  const drawDigitalHuman = (ctx: CanvasRenderingContext2D, frame: number) => {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // 中心点
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // 根据canvas尺寸计算比例因子，使用较小的维度来确保完整显示
    const scale = Math.min(dimensions.width / 400, dimensions.height / 500); // 基于400x500的基准尺寸
    
    // 背景
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, centerX);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    // 调整数字人的垂直偏移，让它在画布中更好地居中
    const offsetY = -20 * scale; // 稍微向上偏移
    
    // 头部 - 使用相对位置和缩放
    ctx.fillStyle = '#fdbcb4';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 50 * scale + offsetY, 80 * scale, 100 * scale, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // 根据情绪绘制眼睛
    drawEyes(ctx, centerX, centerY + offsetY, scale, emotion);
    
    // 根据情绪绘制嘴巴
    drawMouth(ctx, centerX, centerY + offsetY, scale, emotion);
    
    // 身体
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(centerX - 40 * scale, centerY + 50 * scale + offsetY, 80 * scale, 120 * scale);
    
    // 根据手势和动画状态绘制手臂
    drawArms(ctx, centerX, centerY + offsetY, scale, gesture, isAnimating, frame);
  };

  // 绘制眼睛
  const drawEyes = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number, emotion: EmotionType) => {
    const eyeOffset = emotion === 'happy' ? -5 * scale : emotion === 'sad' ? 5 * scale : 0;
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(centerX - 20 * scale, centerY - 70 * scale + eyeOffset, 8 * scale, 12 * scale, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 20 * scale, centerY - 70 * scale + eyeOffset, 8 * scale, 12 * scale, 0, 0, 2 * Math.PI);
    ctx.fill();
  };

  // 绘制嘴巴
  const drawMouth = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number, emotion: EmotionType) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    if (emotion === 'happy') {
      ctx.arc(centerX, centerY - 30 * scale, 20 * scale, 0, Math.PI);
    } else if (emotion === 'sad') {
      ctx.arc(centerX, centerY - 10 * scale, 20 * scale, Math.PI, 2 * Math.PI);
    } else {
      ctx.moveTo(centerX - 15 * scale, centerY - 20 * scale);
      ctx.lineTo(centerX + 15 * scale, centerY - 20 * scale);
    }
    ctx.stroke();
  };

  // 绘制手臂
  const drawArms = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number, gesture: GestureType, isAnimating: boolean, frame: number) => {
    // 手臂动画
    const armAngle = isAnimating ? Math.sin(frame * 0.1) * 0.3 : 0;
    ctx.strokeStyle = '#fdbcb4';
    ctx.lineWidth = 15 * scale;
    ctx.beginPath();
    
    if (gesture === 'wave') {
      const waveOffset = Math.sin(frame * 0.3) * 20 * scale;
      ctx.moveTo(centerX - 40 * scale, centerY + 80 * scale);
      ctx.lineTo(centerX - 80 * scale, centerY + 60 * scale + waveOffset);
      ctx.moveTo(centerX + 40 * scale, centerY + 80 * scale);
      ctx.lineTo(centerX + 80 * scale, centerY + 60 * scale - waveOffset);
    } else if (gesture === 'thinking') {
      ctx.moveTo(centerX - 40 * scale, centerY + 80 * scale);
      ctx.lineTo(centerX - 60 * scale, centerY + 100 * scale);
      ctx.moveTo(centerX + 40 * scale, centerY + 80 * scale);
      ctx.lineTo(centerX - 20 * scale, centerY + 40 * scale);
    } else {
      ctx.moveTo(centerX - 40 * scale, centerY + 80 * scale);
      ctx.lineTo(centerX - 70 * scale, centerY + 120 * scale + armAngle * 10 * scale);
      ctx.moveTo(centerX + 40 * scale, centerY + 80 * scale);
      ctx.lineTo(centerX + 70 * scale, centerY + 120 * scale - armAngle * 10 * scale);
    }
    ctx.stroke();
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置canvas尺寸和设备像素比
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * devicePixelRatio;
    canvas.height = dimensions.height * devicePixelRatio;
    canvas.style.width = dimensions.width + 'px';
    canvas.style.height = dimensions.height + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // 动画循环
    let frame = 0;
    const animate = () => {
      drawDigitalHuman(ctx, frame);
      frame++;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [emotion, gesture, isAnimating, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas 
        ref={canvasRef}
        className="border-2 border-gray-300 rounded-lg shadow-lg w-full h-full object-cover"
      />
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        情绪: {emotion} | 手势: {gesture}
      </div>
    </div>
  );
};

export default DigitalHuman3D;