import React from "react";
import TypeWriter from "../components/TypeWriter";
import Loading from "@/components/Loading";
const Home: React.FC = () => {
  return (
    <div className="home-page">
      <div className="gradient-bg-title">
        <h2>知识上链，成就永恒</h2>
        <p>
          <TypeWriter
            text="ChainLearn-X是一个区块链学习平台，通过AI出题和链上证书，让你的每一步学习成果都被永久记录，构建可信的能力档案。"
            delay={100}
          />
        </p>
      </div>
      <Loading onHideComplete={() => console.log("加载动画完成")} />
    </div>
  );
};

export default Home;
