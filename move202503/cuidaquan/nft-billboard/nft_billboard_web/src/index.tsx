import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 导入国际化配置
import './i18n/i18n';

// 导入文本亮度优化样式
import './styles/textBrightness.css';

// 创建根节点
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 渲染应用
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 如果你想衡量性能，可以使用reportWebVitals函数
// 了解更多: https://bit.ly/CRA-vitals
reportWebVitals();
