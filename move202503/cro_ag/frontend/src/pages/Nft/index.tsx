import React from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { Flex } from 'antd';
import { Scrollbars } from 'react-custom-scrollbars';
import { RankView } from '@/components';
const cx = classNames.bind(styles);

const Nft: React.FC = () => {
  return (
    <Scrollbars>
      <Flex
        vertical
        align="center"
        style={{
          marginBottom: '100px',
        }}
      >
        <div className={cx('leader-board')}></div>
        <Flex
          vertical
          align="center"
          className={cx('content-box', 'bg-first-1')}
        >
          <RankView></RankView>
        </Flex>
      </Flex>
    </Scrollbars>
  );
};

export default Nft;
