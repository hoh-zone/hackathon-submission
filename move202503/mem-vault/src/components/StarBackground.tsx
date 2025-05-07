import React, { useEffect, useState } from 'react';

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDuration: number;
  fadeOut: boolean;
}

const StarBackground: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // 创建初始星星
    const initialStars = Array.from({ length: 100 }, (_, i) => ({
      id: `initial-${i}`,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 8 + 4,
      opacity: Math.random() * 0.8 + 0.2,
      animationDuration: Math.random() * 3 + 2,
      fadeOut: false,
    }));
    setStars(initialStars);

    // 监听鼠标移动
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // 在鼠标位置创建新星星
      const newStar: Star = {
        id: `mouse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 8 + 4,
        opacity: Math.random() * 0.8 + 0.2,
        animationDuration: Math.random() * 3 + 2,
        fadeOut: false,
      };
      
      setStars(prev => [...prev, newStar].slice(-150));
    };

    // 定期检查并移除已经淡出的星星
    const fadeOutInterval = setInterval(() => {
      setStars(prev => {
        const updatedStars = prev.map(star => {
          if (star.fadeOut) {
            return {
              ...star,
              opacity: Math.max(0, star.opacity - 0.05),
            };
          }
          return star;
        }).filter(star => star.opacity > 0);
        return updatedStars;
      });
    }, 100);

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(fadeOutInterval);
    };
  }, []);

  // 处理鼠标离开事件
  const handleMouseLeave = () => {
    setStars(prev => prev.map(star => ({ ...star, fadeOut: true })));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
      }}
      onMouseLeave={handleMouseLeave}
    >
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: `${star.x}px`,
            top: `${star.y}px`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `twinkle ${star.animationDuration}s infinite alternate`,
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.5s ease-out',
          }}
        >
          <svg
            width={star.size}
            height={star.size}
            viewBox="0 0 24 24"
            fill="white"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))',
            }}
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
      ))}
      <style>
        {`
          @keyframes twinkle {
            0% {
              transform: translate(-50%, -50%) scale(1) rotate(0deg);
              opacity: 0.4;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
              opacity: 0.9;
            }
            100% {
              transform: translate(-50%, -50%) scale(1) rotate(360deg);
              opacity: 0.4;
            }
          }
        `}
      </style>
    </div>
  );
};

export default StarBackground; 