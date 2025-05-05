import React from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import './index.css';
import { Flex } from 'antd';
import { Scrollbars } from 'react-custom-scrollbars';
import { SwapContent } from '@/components';
const cx = classNames.bind(styles);

const Swap: React.FC = () => {
  return (
    <Scrollbars>
      <Flex
        vertical
        align="center"
        style={{
          marginBottom: '100px',
        }}
      >
        <div className={cx('super-lending')}></div>
        <Flex
          vertical
          align="center"
          className={cx('content-box', 'bg-first-1')}
        >
          <SwapContent></SwapContent>
        </Flex>
      </Flex>
    </Scrollbars>
  );
};

export default Swap;
