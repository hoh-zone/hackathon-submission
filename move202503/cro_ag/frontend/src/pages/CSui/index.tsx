import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import './lending.css';
import { Flex } from 'antd';
import { Scrollbars } from 'react-custom-scrollbars';
import { StakeContent, UnStakeContent } from '@/components';
const cx = classNames.bind(styles);

const CSui: React.FC = () => {
  const [selectModule, setSelectModule] = useState('Stake'); //Deposit/Withdraw
  const handleClick = (value: string) => {
    setSelectModule(value);
  };

  return (
    <Scrollbars>
      <Flex
        vertical
        align="center"
        style={{
          marginBottom: '100px',
        }}
      >
        {/* <div className={cx('super-lending')}></div> */}
        <Flex
          // flex="1"
          vertical
          align="center"
          className={cx('content-box', 'bg-first-1')}
        >
          <Flex vertical={false} justify="flex-start" style={{ width: '100%' }}>
            <div
              className={cx('deposit-tab')}
              onClick={() => handleClick('Stake')}
              style={{
                color: `${selectModule === 'Stake' ? '#fefefe' : '#8694ff'}`,
                borderBottom: `${
                  selectModule === 'Stake' ? '3px solid #5356b1' : 'none'
                }`,
                borderRadius: '2px',
              }}
            >
              Stake
            </div>
            <div
              className={cx('withdraw-tab')}
              onClick={() => handleClick('Unstake')}
              style={{
                color: `${selectModule === 'Unstake' ? '#fefefe' : '#8694ff'}`,
                borderBottom: `${
                  selectModule === 'Unstake' ? '3px solid #5356b1' : 'none'
                }`,
                borderRadius: '2px',
              }}
            >
              Unstake
            </div>
          </Flex>
          {selectModule === 'Stake' ? (
            <StakeContent></StakeContent>
          ) : (
            <UnStakeContent></UnStakeContent>
          )}
        </Flex>
      </Flex>
    </Scrollbars>
  );
};

export default CSui;
