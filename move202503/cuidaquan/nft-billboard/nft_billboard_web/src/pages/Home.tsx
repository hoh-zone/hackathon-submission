import React from 'react';
import { Typography, Card, Button, Row, Col, Space, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingOutlined,
  UserOutlined,
  GlobalOutlined,
  BlockOutlined,
  PictureOutlined,
  CalendarOutlined,
  WalletOutlined,
  AppstoreOutlined,
  EditOutlined,
  SettingOutlined
} from '@ant-design/icons';
import logo from '../assets/logo.svg';
import './Home.scss';

const { Title, Paragraph } = Typography;

// 科技动画组件
const TechAnimation: React.FC = () => (
  <div className="tech-animation">
    <div className="tech-grid"></div>
    <div className="tech-particles"></div>
  </div>
);

const HomePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <div className="hero-section">
        <TechAnimation />
        <div className="hero-logo">
          <img src={logo} alt="Billboard NFT Logo" className="hero-logo-image" />
        </div>
        <div className="hero-badge">
          {t('app.slogan')}
        </div>
        <Title>{t('app.name')}</Title>
        <Paragraph className="subtitle">
          {t('home.hero.subtitle')}
        </Paragraph>

        <Space size="large" className="hero-buttons">
          <Link to="/ad-spaces">
            <Button type="primary" size="large" icon={<ShoppingOutlined />}>
              {t('home.hero.browseButton')}
            </Button>
          </Link>
          <Link to="/my-nfts">
            <Button size="large" icon={<UserOutlined />}>
              {t('home.hero.myNFTsButton')}
            </Button>
          </Link>
        </Space>

        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-value">100+</div>
            <div className="stat-label">{t('home.stats.adSpaces')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">50K+</div>
            <div className="stat-label">{t('home.stats.dailyViews')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">5K+</div>
            <div className="stat-label">{t('home.stats.uniqueUsers')}</div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <Title level={2} className="section-title">{t('home.features.title')}</Title>

        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={8}>
            <Card className="feature-card">
              <div className="feature-icon">
                <BlockOutlined />
              </div>
              <Title level={3}>{t('home.features.decentralized.title')}</Title>
              <Paragraph>
                {t('home.features.decentralized.description')}
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card className="feature-card">
              <div className="feature-icon">
                <PictureOutlined />
              </div>
              <Title level={3}>{t('home.features.nftFormat.title')}</Title>
              <Paragraph>
                {t('home.features.nftFormat.description')}
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card className="feature-card">
              <div className="feature-icon">
                <CalendarOutlined />
              </div>
              <Title level={3}>{t('home.features.flexibleLease.title')}</Title>
              <Paragraph>
                {t('home.features.flexibleLease.description')}
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      <Divider className="tech-divider">
        <BlockOutlined /> {t('home.tech.features.smart')}
      </Divider>

      <div className="tech-section">
        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} md={12}>
            <div className="tech-content">
              <Title level={2}>{t('home.tech.title')}</Title>
              <Paragraph>
                {t('home.tech.description')}
              </Paragraph>
              <ul className="tech-list">
                <li><BlockOutlined /> {t('home.tech.features.throughput')}</li>
                <li><GlobalOutlined /> {t('home.tech.features.global')}</li>
                <li><ShoppingOutlined /> {t('home.tech.features.settlement')}</li>
                <li><SettingOutlined /> {t('home.tech.features.smart')}</li>
              </ul>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="tech-visual">
              <div className="blockchain-visual"></div>
            </div>
          </Col>
        </Row>
      </div>

      <div className="how-it-works">
        <Title level={2} className="section-title">{t('home.howItWorks.title')}</Title>

        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <Title level={4}><WalletOutlined /> {t('home.howItWorks.steps.connectWallet.title')}</Title>
            <Paragraph>
              {t('home.howItWorks.steps.connectWallet.description')}
            </Paragraph>
          </div>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <Title level={4}><AppstoreOutlined /> {t('home.howItWorks.steps.browseAdSpaces.title')}</Title>
            <Paragraph>
              {t('home.howItWorks.steps.browseAdSpaces.description')}
            </Paragraph>
          </div>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <Title level={4}><ShoppingOutlined /> {t('home.howItWorks.steps.purchaseNFT.title')}</Title>
            <Paragraph>
              {t('home.howItWorks.steps.purchaseNFT.description')}
            </Paragraph>
          </div>
        </div>

        <div className="step">
          <div className="step-number">4</div>
          <div className="step-content">
            <Title level={4}><EditOutlined /> {t('home.howItWorks.steps.manageAds.title')}</Title>
            <Paragraph>
              {t('home.howItWorks.steps.manageAds.description')}
            </Paragraph>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <Title level={2}>{t('home.cta.title')}</Title>
        <Paragraph className="cta-subtitle">{t('home.cta.subtitle')}</Paragraph>
        <div className="cta-button-container">
          <Link to="/ad-spaces">
            <Button type="primary" size="large" icon={<ShoppingOutlined />}>
              {t('home.cta.button')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;