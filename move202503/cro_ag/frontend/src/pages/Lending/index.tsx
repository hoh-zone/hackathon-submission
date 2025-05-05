import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import './lending.css';
import { Flex } from 'antd';
import { Scrollbars } from 'react-custom-scrollbars';
import { DepositView } from '@/components';
import { WithdrawView } from '@/components';
const cx = classNames.bind(styles);

const Lending: React.FC = () => {
  const [selectModule, setSelectModule] = useState('Deposit');
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
        <div className={cx('super-lending')}></div>
        <Flex
          // flex="1"
          vertical
          align="center"
          className={cx('content-box', 'bg-first-1')}
        >
          <Flex vertical={false} justify="flex-start" style={{ width: '100%' }}>
            <div
              className={cx('deposit-tab')}
              onClick={() => handleClick('Deposit')}
              style={{
                color: `${selectModule === 'Deposit' ? '#fefefe' : '#8694ff'}`,
                borderBottom: `${
                  selectModule === 'Deposit' ? '3px solid #5356b1' : 'none'
                }`,
                borderRadius: '2px',
              }}
            >
              Deposit
            </div>
            <div
              className={cx('withdraw-tab')}
              onClick={() => handleClick('Withdraw')}
              style={{
                color: `${selectModule === 'Withdraw' ? '#fefefe' : '#8694ff'}`,
                borderBottom: `${
                  selectModule === 'Withdraw' ? '3px solid #5356b1' : 'none'
                }`,
                borderRadius: '2px',
              }}
            >
              Withdraw
            </div>
          </Flex>
          {selectModule === 'Deposit' ? (
            <DepositView></DepositView>
          ) : (
            <WithdrawView></WithdrawView>
          )}
        </Flex>
      </Flex>
    </Scrollbars>
  );
};

export default Lending;
