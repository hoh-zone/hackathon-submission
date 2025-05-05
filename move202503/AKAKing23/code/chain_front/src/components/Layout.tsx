import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ConnectButton } from "@mysten/dapp-kit";
import BackgroundBall from "@/components/BackgroundBall";
import logoImage from "@/assets/images/logo.png";
// 将Layout组件拆分为外层和内层组件
const InnerLayout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "";

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          {/* <Link to="/">LearnChain-X</Link> */}
          <Link to="/dashboard">
            <img width={240} src={logoImage} alt="learnChain-X" />
          </Link>
        </div>
        <nav className="main-nav">
          <Link to="/zkProof">
            {!isHomePage && <div className="lignt-zk-btn">企业、社区认证</div>}
          </Link>
          <ConnectButton style={{ color: "#fff" }} />
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
        <BackgroundBall />
      </main>
    </div>
  );
};

const Layout: React.FC = () => {
  return <InnerLayout />;
};

const changelang = () => {
  const lang = localStorage.setItem("lang", "zhcn");
  console.log(lang);
};
changelang();
export default Layout;
