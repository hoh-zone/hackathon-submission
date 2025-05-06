import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import "./Dashbord.css";
// import BackgroundBall from "@/components/BackgroundBall";
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false); // 添加移动设备检测状态
  const containerRef = useRef<HTMLDivElement>(null);
  const middleRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const bigballRef = useRef<HTMLDivElement>(null);
  const smallballsRefs = useRef<HTMLDivElement[]>([]);
  const lineRef = useRef<SVGSVGElement>(null);
  const ballsRef = useRef<HTMLDivElement>(null);
  const titleLettersRefs = useRef<HTMLParagraphElement[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLParagraphElement>(null);
  const animaterRef = useRef<gsap.core.Timeline | null>(null);
  const maxDistanceRef = useRef<number>(0);

  const isSafari =
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
    !navigator.userAgent.includes("CriOS");

  // 重置welcome动画样式
  const reset = () => {
    gsap
      .timeline()
      .set(lineRef.current, {
        scale: 1,
        opacity: 1,
      })
      .set(ballsRef.current, {
        scale: 1,
        opacity: 1,
      })
      .set(titleLettersRefs.current, {
        clipPath: "circle(100%)",
        y: 0,
      })
      .set([navRef.current, infoRef.current], {
        opacity: 1,
      });

    if (navRef.current) {
      navRef.current.classList.add("welcome_nav_show");
    }
  };

  // 显示welcome
  const show = () => {
    // 动画播放器存在且正在播放动画：不执行函数，否则会因为动画冲突导致BUG
    if (animaterRef.current && animaterRef.current.isActive()) return;

    reset(); // 重置为最终状态
    setIsVisible(true); // 显示welcome

    // 不再播放从小到大的动画
    animaterRef.current = gsap.timeline();
  };

  // 隐藏welcome
  const hidden = (immediate?: () => void, next?: () => void) => {
    // 动画播放器存在且正在播放动画：不执行函数，否则会因为动画冲突导致BUG
    if (animaterRef.current && animaterRef.current.isActive()) return;

    if (immediate) immediate(); // 存在立即执行代码，则立即执行

    // 播放动画
    animaterRef.current = gsap
      .timeline()
      .to(lineRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      })
      .to(
        ballsRef.current,
        {
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "<"
      )
      .to(
        titleLettersRefs.current,
        {
          clipPath: "circle(0%)",
          y: "-50%",
          duration: 0.5,
          ease: "power3.out",
          stagger: {
            each: 0.03,
            from: "random",
          },
        },
        "<"
      )
      .to(
        [navRef.current, infoRef.current],
        {
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          onComplete: () => {
            setIsVisible(false); // 隐藏welcome
            if (next) next(); // 如果有后续函数，则执行
          },
        },
        "<"
      );
  };

  // 移动标题文字，移动端和桌面端使用不同的移动距离
  const moveTitle = (x: number, y: number) => {
    // 为移动设备调整移动距离
    const factor = isMobile ? 20 : 40;

    // 更新距离:以屏幕中心为基准。将距离与屏幕尺寸绑定：避免不同尺寸下移动距离差异过大
    // const distanceX = ((x - window.innerWidth / 2) / window.innerWidth) * factor;
    const distanceX =
      ((x - window.innerWidth / 3) / window.innerWidth) * factor;
    // const distanceY = ((y - window.innerHeight / 2) / window.innerHeight) * factor;
    const distanceY =
      ((y - window.innerHeight / 3) / window.innerHeight) * factor;

    // 移动标题
    gsap.to(titleRef.current, {
      x: `${distanceX}px`,
      y: `${distanceY}px`,
      duration: isMobile ? 2 : 3, // 移动设备上使用更短的动画时间
      ease: "power3.out",
    });
  };

  // 移动小球，也根据设备类型调整
  const moveSmallballs = (x: number, y: number) => {
    // 更新距离:以屏幕中心为基准
    let distanceX = x - window.innerWidth / 2;
    let distanceY = y - window.innerHeight / 2;

    // 移动设备上缩小移动距离
    if (isMobile) {
      distanceX *= 0.5;
      distanceY *= 0.5;
    }

    // 限制移动边界
    distanceX = Math.min(
      maxDistanceRef.current,
      Math.max(-maxDistanceRef.current, distanceX)
    );
    distanceY = Math.min(
      maxDistanceRef.current,
      Math.max(-maxDistanceRef.current, distanceY)
    );

    // 移动小球
    gsap.to(smallballsRefs.current, {
      x: `${distanceX}px`,
      y: `${distanceY}px`,
      duration: isMobile ? 0.7 : 1, // 移动设备上使用更短的动画时间
      ease: "power3.out",
      stagger: 0.1,
    });
  };

  // 导航函数替代全局存储的方法
  const startNewGame = (difficulty: string) => {
    hidden(undefined, () => navigate(`/quiz?difficulty=${difficulty}`));
  };

  // const continueGame = () => {
  //   if (playerActive) {
  //     hidden(undefined, () => navigate("/game/continue"));
  //   }
  // };

  // const showRank = () => {
  //   hidden(undefined, () => navigate("/rank"));
  // };

  // const showInstructions = () => {
  //   hidden(undefined, () => navigate("/instructions"));
  // };

  // 检查是否是移动设备
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  // 调整尺寸
  const handleResize = () => {
    if (bigballRef.current) {
      // 小球的移动范围局限在大球的周围
      maxDistanceRef.current = bigballRef.current.offsetWidth / 2.5;
    }

    // 检查设备类型
    checkMobile();
  };

  useEffect(() => {
    // 检查是否有活跃玩家存档
    // 这里可以添加从localStorage或API获取玩家状态的逻辑
    // const checkPlayerActive = async () => {
    //   // 示例：检查localStorage中是否有玩家数据
    //   const playerData = localStorage.getItem("playerData");
    //   setPlayerActive(!!playerData);
    // };

    // checkPlayerActive();

    // 初始化检查设备类型
    checkMobile();

    // 绑定相关事件
    const bindEvents = () => {
      const container = containerRef.current;
      const middle = middleRef.current;

      if (container) {
        // 在界面范围内：标题文字跟随鼠标/手指偏移
        container.onmousemove = (e: MouseEvent) => {
          moveTitle(e.x, e.y);
        };
        container.ontouchmove = (e: TouchEvent) => {
          moveTitle(e.touches[0].clientX, e.touches[0].clientY);
        };
        // 移动结束后，让标题回到原位，即屏幕中心点
        container.onmouseout = () => {
          moveTitle(window.innerWidth / 2, window.innerHeight / 2);
        };
        container.ontouchend = () => {
          moveTitle(window.innerWidth / 2, window.innerHeight / 2);
        };
      }

      if (middle) {
        // 在靠近中间内容的范围内：小球跟随鼠标/手指偏移，形成融球效果
        middle.onmousemove = (e: MouseEvent) => {
          moveSmallballs(e.x, e.y);
        };
        middle.ontouchmove = (e: TouchEvent) => {
          moveSmallballs(e.touches[0].clientX, e.touches[0].clientY);
        };
        // 移动结束后，让小球回到原位，即屏幕中心点
        middle.onmouseout = () => {
          moveSmallballs(window.innerWidth / 2, window.innerHeight / 2);
        };
        middle.ontouchend = () => {
          moveSmallballs(window.innerWidth / 2, window.innerHeight / 2);
        };
      }
    };

    // 初始化
    handleResize();
    bindEvents();

    // 显示欢迎界面
    show();

    // 添加window的resize事件监听
    window.addEventListener("resize", handleResize);

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className={`welcome _fullscreen ${!isVisible ? "_hidden" : ""}`}
      ref={containerRef}
    >
      <div className="welcome_middle" ref={middleRef}>
        <div className="welcome_middle_title" ref={titleRef}>
          <div>
            {"MOVE".split("").map((letter, index) => (
              <p
                className="_font_6"
                key={letter + index}
                ref={(el) => {
                  if (el && !titleLettersRefs.current.includes(el)) {
                    titleLettersRefs.current.push(el);
                  }
                }}
              >
                {letter}
              </p>
            ))}
          </div>
          <div>
            {"START".split("").map((letter, index) => (
              <p
                className="_font_6"
                key={letter + index}
                ref={(el) => {
                  if (el && !titleLettersRefs.current.includes(el)) {
                    titleLettersRefs.current.push(el);
                  }
                }}
              >
                {letter}
              </p>
            ))}
          </div>
        </div>
        <p className="welcome_middle_info _font_3" ref={infoRef}>
          The beloved technology growth platform of global geeks
        </p>
        {/* safari浏览器对css的filter适配不友好，这里检测到如果是safari浏览器，则取消滤镜融球效果 */}
        <div
          className={`welcome_middle_balls ${
            !isSafari ? "welcome_middle_balls_filter" : ""
          }`}
          ref={ballsRef}
        >
          <div
            className="welcome_middle_balls_big _middle_ball"
            ref={bigballRef}
          ></div>
          {[1, 1.5, 1.2].map((scale, index) => (
            <div
              className="welcome_middle_balls_small"
              style={{ "--s": scale } as React.CSSProperties}
              key={index}
              ref={(el) => {
                if (el && !smallballsRefs.current.includes(el)) {
                  smallballsRefs.current.push(el);
                }
              }}
            ></div>
          ))}
        </div>
        <svg className="welcome_middle_line" viewBox="0 0 50 50" ref={lineRef}>
          <circle
            className="_dashed"
            cx="25"
            cy="25"
            r="25"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="welcome_nav" ref={navRef}>
        <div
          className="welcome_nav_selection"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          <div className="wns_node" onClick={() => startNewGame('primary')}>
            <div></div>
            <p className="_font_2">Primary</p>
          </div>
        </div>
        <div
          className="welcome_nav_selection"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <div className="wns_node" onClick={() => startNewGame('intermediate')}>
            <div></div>
            <p className="_font_2">Intermediate</p>
          </div>
        </div>
        <div
          className="welcome_nav_selection"
          style={{ "--i": 4 } as React.CSSProperties}
        >
          <div className="wns_node" onClick={() => startNewGame('advanced')}>
            <div></div>
            <p className="_font_2">Advanced</p>
          </div>
        </div>
        {/* <div
          className="welcome_nav_selection"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <div className="wns_node" onClick={showInstructions}>
            <div></div>
            <p className="_font_2">INSTRUTION</p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
