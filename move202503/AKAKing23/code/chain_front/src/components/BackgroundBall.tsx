import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import blurballImage from "@/assets/images/blurball.png";
import "./Background.css";

const BackgroundBall: React.FC = () => {
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let balls: NodeListOf<Element> | null = null;
    let mouse_x = 0;
    let mouse_y = 0;
    let distance_x = 0;
    let distance_y = 0;

    const init = () => {
      if (!backgroundRef.current) return;
      balls = backgroundRef.current.querySelectorAll(".ball");

      // 绑定监听事件
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("mouseleave", resetBalls);
      document.addEventListener("touchend", resetBalls);
    };

    const handleMouseMove = (e: MouseEvent) => {
      moveBalls(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      moveBalls(e.touches[0].clientX, e.touches[0].clientY);
    };

    // 移动背景模糊小球
    const moveBalls = (x: number, y: number) => {
      // 防止大幅度抖动：例如在鼠标离开界面后再回来
      if (Math.abs(x - mouse_x) >= window.innerWidth / 10) mouse_x = x;
      if (Math.abs(y - mouse_y) >= window.innerHeight / 10) mouse_y = y;

      // 更新距离:将距离与屏幕尺寸绑定：避免不同尺寸下移动距离差异过大
      distance_x += ((x - mouse_x) / window.innerWidth) * 80;
      distance_y += ((y - mouse_y) / window.innerHeight) * 80;

      // 移动小球
      if (balls) {
        gsap.to(balls, {
          x: `${-distance_x}px`,
          y: `${-distance_y}px`,
          duration: 3,
          ease: "power3.out",
        });
      }

      // 更新坐标
      mouse_x = x;
      mouse_y = y;
    };

    // 复位所有背景模糊小球
    const resetBalls = () => {
      if (balls) {
        gsap.to(balls, {
          x: 0,
          y: 0,
          duration: 5,
          ease: "power3.out",
        });
      }
      distance_x = distance_y = 0;
    };

    init();

    // 清理事件监听
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseleave", resetBalls);
      document.removeEventListener("touchend", resetBalls);
    };
  }, []);

  return (
    <div className="background fullscreen" ref={backgroundRef}>
      {/* 这里的模糊小球用图片代替滤镜是为了适配safari浏览器，safari对于滤镜不太友好，大范围模糊容易卡顿 */}
      <div
        className="ball"
        style={{ 
          "--s": "1.1", 
          "--x": "-0.1", 
          "--y": "-0.1", 
          "--o": "0.6" 
        } as React.CSSProperties}
      >
        <img src={blurballImage} alt="blurball" />
      </div>
      <div
        className="ball"
        style={{ 
          "--s": "1.3", 
          "--x": "-0.05", 
          "--y": "0.5", 
          "--o": "1" 
        } as React.CSSProperties}
      >
        <img src={blurballImage} alt="blurball" />
      </div>
      <div
        className="ball"
        style={{ 
          "--s": "0.9", 
          "--x": "0.7", 
          "--y": "0", 
          "--o": "0.8" 
        } as React.CSSProperties}
      >
        <img src={blurballImage} alt="blurball" />
      </div>
      <div
        className="ball"
        style={{ 
          "--s": "0.4", 
          "--x": "0.88", 
          "--y": "0.45", 
          "--o": "0.6" 
        } as React.CSSProperties}
      >
        <img src={blurballImage} alt="blurball" />
      </div>
      <div
        className="ball"
        style={{ 
          "--s": "0.5", 
          "--x": "0.6", 
          "--y": "0.75", 
          "--o": "0.7" 
        } as React.CSSProperties}
      >
        <img src={blurballImage} alt="blurball" />
      </div>
    </div>
  );
};

export default BackgroundBall;
