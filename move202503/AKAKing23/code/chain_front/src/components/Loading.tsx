import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./Loading.css";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";

// 为window添加自定义属性声明
declare global {
  interface Window {
    hideLoading?: (immediate?: () => void, next?: () => void) => void;
  }
}

const Loading = ({ onHideComplete }: { onHideComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);
  const currentAccount = useCurrentAccount();
  const [open, setOpen] = useState(false);

  const iconRef = useRef(null);
  const path1Ref = useRef(null);
  const path2Ref = useRef(null);
  const tipRef = useRef(null);
  const circleRef = useRef(null);
  const maskRef = useRef(null);
  const navigate = useNavigate();
  // 使用gsap.core.Timeline类型
  let animater: gsap.core.Timeline | null = null;

  // 初始化动画
  const initAnimation = () => {
    // loading初始动画：小蛇循环划8
    animater = gsap.timeline().fromTo(
      [path1Ref.current, path2Ref.current],
      // 间隔开两端线条的描边偏移：使虚线线段呈现一个小蛇的样子
      {
        strokeDashoffset: (i) => {
          if (i === 0) return 0;
          else return 480;
        },
      },
      {
        strokeDashoffset: (i) => {
          if (i === 0) return -275;
          else return 205;
        },
        duration: 2,
        ease: "linear",
        onComplete: () => {
          // 每播放完一次，检查一下加载状态，加载完成则执行完成动画，反之继续循环播放等待加载
          if (document.readyState === "complete") finishAnimation();
          else animater?.restart();
        },
      }
    );
  };

  // 加载完成：小蛇变成一个球
  const finishAnimation = () => {
    animater = gsap
      .timeline()
      // 动画的第一部分：蛇头缩放消失，蛇身虚线偏移成圆形，并汇聚成实线，整体缩小以适应一会儿出现的文字
      .to(path2Ref.current, {
        strokeWidth: 0,
        duration: 0.4,
        ease: "power3.out",
      })
      .to(
        path1Ref.current,
        {
          strokeDashoffset: -300,
          duration: 0.4,
          ease: "power3.out",
        },
        "<"
      )
      .to(
        path1Ref.current,
        {
          strokeDasharray: "138 0 0 0 0 0 0 0 0 500",
          duration: 0.7,
          ease: "power3.out",
        },
        "<"
      )
      .to(
        iconRef.current,
        {
          scale: 0.6,
          duration: 0.7,
          ease: "power3.out",
        },
        "<"
      )
      // 动画的第二部分：提示文字显示
      .to(
        tipRef.current,
        {
          clipPath: "circle(100%)",
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        },
        "<0.3"
      )
      .to(
        circleRef.current,
        {
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
        },
        "<"
      );
  };

  // 隐藏loading动画
  const hideLoading = (immediate?: () => void, next?: () => void) => {
    // 动画播放器播放完后：才可以执行函数播放后续动画，否则会因为动画冲突导致BUG
    if (animater && animater.isActive()) return;
    if (immediate) immediate(); //存在立即执行函数，则立即执行

    // 隐藏loading
    animater = gsap
      .timeline()
      .to(tipRef.current, {
        cursor: "auto",
        scale: 0,
        duration: 1,
        ease: "power3.out",
      })
      .to(
        maskRef.current,
        {
          scale: 1,
          duration: 2.5,
          ease: "power3.out",
          onComplete: () => {
            setIsVisible(false); // 动画完成后，隐藏loading
            if (next) next(); //如果有后续函数，则执行
            if (onHideComplete) onHideComplete();
          },
        },
        "<"
      );
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
  };

  useEffect(() => {
    initAnimation();

    // 提供一个全局访问点
    window.hideLoading = hideLoading;

    return () => {
      // 清理
      if (animater) animater.kill();
      window.hideLoading = undefined;
    };
  }, []);

  // 监听钱包连接状态，连接成功后调用hideLoading
  useEffect(() => {
    // 当currentAccount存在时，表示钱包已连接成功
    if (currentAccount) {
      // 适当延迟一下执行，保证连接界面关闭
      setTimeout(() => {
        hideLoading();
      }, 300);
    }
  }, [currentAccount]);

  if (!isVisible) return null;

  return (
    <div className="loading _fullscreen">
      <svg viewBox="0 0 100 50" className="loading_icon" ref={iconRef}>
        <path
          ref={path1Ref}
          d="M50,25c0-12.14,9.84-21.99,21.99-21.99S93.98,12.86,93.98,25s-9.84,21.99-21.99,21.99S50,37.21,50,25.06
          S40.16,3.01,28.01,3.01S6.02,12.86,6.02,25s9.84,21.99,21.99,21.99S50,37.14,50,25c0-8.14,4.42-15.24,10.99-19.05
          C67.57,9.76,71.99,16.86,71.99,25c0,8.14-4.42,15.24-10.99,19.04c0,0,0,0,0,0c-3.23,1.87-6.99,2.94-10.99,2.94
          c-4.01,0-7.76-1.07-10.99-2.94h0C32.43,40.24,28.01,33.14,28.01,25c0-8.14,4.42-15.24,10.99-19.05l0,0
          C42.24,4.08,45.99,3.01,50,3.01s7.76,1.07,10.99,2.94l0,0"
        />
        <path
          ref={path2Ref}
          d="M50,25c0-12.14,9.84-21.99,21.99-21.99S93.98,12.86,93.98,25s-9.84,21.99-21.99,21.99S50,37.21,50,25.06
          S40.16,3.01,28.01,3.01S6.02,12.86,6.02,25s9.84,21.99,21.99,21.99S50,37.14,50,25c0-8.14,4.42-15.24,10.99-19.05
          C67.57,9.76,71.99,16.86,71.99,25c0,8.14-4.42,15.24-10.99,19.04c0,0,0,0,0,0c-3.23,1.87-6.99,2.94-10.99,2.94
          c-4.01,0-7.76-1.07-10.99-2.94h0C32.43,40.24,28.01,33.14,28.01,25c0-8.14,4.42-15.24,10.99-19.05l0,0
          C42.24,4.08,45.99,3.01,50,3.01s7.76,1.07,10.99,2.94l0,0"
        />
      </svg>
      <div className="loading_mask" ref={maskRef}></div>
      <div className="loading_container">
        <div className="loading_circle" ref={circleRef}></div>
        <ConnectModal
          trigger={
            <p
              style={{
                zIndex: 999,
                color: "#fff",
                fontSize: "1.2rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {" "}
              {currentAccount ? "Connected" : "Connect Wallet"}
            </p>
          }
          open={open}
          onOpenChange={(isOpen) => setOpen(isOpen)}
        />
        {/* <p
          className="loading_tip _font_2"
          ref={tipRef}
          onClick={() => hideLoading()}
        >
          START
        </p> */}
      </div>
    </div>
  );
};

export default Loading;
