import React, { useEffect, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { usePortfolios } from '@/hooks';
import { CroPortfolio } from 'cro-sdk';
import { LoadingOutlined } from '@ant-design/icons';
import { ConfigProvider, Spin } from 'antd';
import { useCurrentAccount } from '@mysten/dapp-kit';
import PortfoliosItem from '../PortfoliosItem';
const cx = classNames.bind(styles);
export type PortfolioListProps = {
  portfolioItem: CroPortfolio | null;
  onItemClick: (item: CroPortfolio | undefined) => void;
};
const PortfoliosList: React.FC<PortfolioListProps> = (props) => {
  const currentAccount = useCurrentAccount();
  const protfolios = usePortfolios(currentAccount?.address);
  const position = useRef(0);

  useEffect(() => {
    props.onItemClick(protfolios.data?.[position.current]);
  }, [protfolios.data?.[position.current]?.totalBalance]);
  return (
    <Scrollbars autoHide hideTracksWhenNotNeeded>
      <div className={cx('right-bottom')}>
        {protfolios.isLoading && (
          <ConfigProvider
            theme={{
              components: {
                Spin: {
                  colorPrimary: '#fefefe',
                },
              },
            }}
          >
            <Spin
              style={{ marginTop: '35px' }}
              indicator={<LoadingOutlined spin />}
            />
          </ConfigProvider>
        )}
        {protfolios.isError && (
          <div
            style={{
              color: '#fefefe',
              fontSize: '18px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: '35px',
              fontFamily: 'Regular, serif',
            }}
          >
            error
          </div>
        )}
        {protfolios.isSuccess &&
          protfolios.data &&
          (protfolios.data?.length || 0) > 0 &&
          protfolios.data?.map((item, index) => {
            return (
              <PortfoliosItem
                onItemClick={() => {
                  props.onItemClick(item);
                  position.current = index;
                }}
                item={item}
                portfolioItem={props.portfolioItem}
                key={item.coinType + item.owner + item.platform}
              ></PortfoliosItem>
            );
          })}
      </div>
    </Scrollbars>
  );
};

export default PortfoliosList;
