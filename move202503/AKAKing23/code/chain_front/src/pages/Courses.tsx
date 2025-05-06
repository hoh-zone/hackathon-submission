import React from 'react';
import { Link } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
}

const Courses: React.FC = () => {
  // 模拟课程数据
  const coursesList: Course[] = [
    {
      id: '1',
      title: '区块链基础入门',
      description: '了解区块链的基本概念、原理和应用场景',
      level: '初级'
    },
    {
      id: '2',
      title: '以太坊与智能合约开发',
      description: '学习以太坊平台和Solidity智能合约开发',
      level: '中级'
    },
    {
      id: '3',
      title: 'DApp全栈开发实战',
      description: '从前端到后端，完整开发去中心化应用',
      level: '高级'
    },
  ];

  return (
    <div className="courses-page">
      <h1>课程列表</h1>
      <div className="courses-grid">
        {coursesList.map(course => (
          <div key={course.id} className="course-card">
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <span className="course-level">难度: {course.level}</span>
            <Link to={`/course/${course.id}`} className="course-link">查看详情</Link>
          </div>
        ))}
      </div>
      
      <div className="quiz-banner">
        <h2>测试你的区块链知识</h2>
        <p>完成我们的区块链选择题测验，检验你的学习成果！</p>
        <Link to="/quiz" className="quiz-link">开始测验</Link>
      </div>
      
      <div className="back-link">
        <Link to="/dashboard">返回</Link>
      </div>
    </div>
  );
};

export default Courses; 