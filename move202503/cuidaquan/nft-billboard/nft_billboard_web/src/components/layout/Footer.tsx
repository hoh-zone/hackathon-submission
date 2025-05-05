import React from 'react';
import { Layout, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import './Footer.scss';

const { Footer } = Layout;
const { Text, Link } = Typography;

const AppFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Footer className="app-footer">
      <Text className="footer-copyright">{t('footer.copyright', { year: new Date().getFullYear() })}</Text>
      <div className="footer-links">
        <Link href="https://sui.io/" target="_blank">{t('footer.links.sui')}</Link>
        <Link href="https://www.walrus.xyz/" target="_blank">{t('footer.links.walrus')}</Link>
        <Link href="https://github.com/cuidaquan/nft-billboard/" target="_blank">{t('footer.links.github')}</Link>
        <Link href="https://x.com/NFTBillboardsio/" target="_blank">{t('footer.links.about')}</Link>
      </div>
    </Footer>
  );
};

export default AppFooter;