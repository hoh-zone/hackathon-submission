import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <h1>关于我们</h1>
      <p>LearnChain-X是一个专注于区块链技术教育的平台，我们致力于帮助更多人了解和掌握区块链技术。</p>
      <p>我们提供从入门到精通的系列课程，涵盖区块链基础知识、智能合约开发、DApp开发等多个方面。</p>
      
      <h2>我们的使命</h2>
      <p>普及区块链知识，培养区块链技术人才，推动区块链技术在各行业的应用。</p>
      
      <div className="back-link">
        <Link to="/">返回首页</Link>
      </div>
    </div>
  );
};

export default About; 