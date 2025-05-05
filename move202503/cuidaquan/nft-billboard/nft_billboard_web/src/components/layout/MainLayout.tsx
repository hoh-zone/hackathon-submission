import React from 'react';
import { Layout } from 'antd';
import Header from './Header';
import Footer from './Footer';
import './MainLayout.scss';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Layout className="main-layout">
      <Header />
      <Content className="main-content">
        <div className="content-container">
          {children}
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default MainLayout; 