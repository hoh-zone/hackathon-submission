import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import icon_slippage_setting from '@/assets/icon_slippage_setting.png';
import icon_slippage from '@/assets/icon_slippage.png';
import { Avatar, ConfigProvider, Flex, InputNumber, Modal } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { CloseOutlined } from '@ant-design/icons';
import { CURRENT_COIN_BTN_TYPES, SelectCoinBtnProps } from '@/constants';
import {
  slippage,
  updateSlippageLending,
  updateSlippageSwap,
} from '@/store/feature/slippageSlice';
import stringUtil from '@/utils/stringUtil';
const cx = classNames.bind(styles);
const SelectCoinBtn: React.FC<SelectCoinBtnProps> = ({ btnType }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slippageCustom, setSlippageCustom] = useState('');
  const [slippageValue, setSlippageValue] = useState('');
  const slippageSlice = useAppSelector(slippage);
  const dispatch = useAppDispatch();
  const onSelectCoinClick = () => {
    setIsModalOpen(!isModalOpen);
  };
  useEffect(() => {
    if (btnType === CURRENT_COIN_BTN_TYPES[0]) {
      setSlippageCustom(
        Number((slippageSlice.slippageLending * 100).toFixed(1)) + '%'
      );
      setSlippageValue(
        Number((slippageSlice.slippageLending * 100).toFixed(1)) + '%'
      );
    } else if (btnType === CURRENT_COIN_BTN_TYPES[1]) {
      setSlippageCustom(
        Number((slippageSlice.slippageSwap * 100).toFixed(1)) + '%'
      );
      setSlippageValue(
        Number((slippageSlice.slippageSwap * 100).toFixed(1)) + '%'
      );
    }
  }, [slippageSlice.slippageLending, slippageSlice.slippageSwap]);
  const onClickItem = (apy: string) => {
    setSlippageCustom(apy);
  };
  const cancel = () => {
    setIsModalOpen(false);
  };
  const save = () => {
    const value = Number(
      (Number(slippageCustom.replace('%', '')) / 100).toFixed(3)
    );
    if (btnType === CURRENT_COIN_BTN_TYPES[0]) {
      dispatch(updateSlippageLending(value));
    } else if (btnType === CURRENT_COIN_BTN_TYPES[1]) {
      dispatch(updateSlippageSwap(value));
    }

    setIsModalOpen(false);
  };
  return (
    <>
      <Flex
        onClick={onSelectCoinClick}
        align="center"
        vertical={false}
        className={cx('select-coin')}
      >
        <div
          style={{
            fontFamily: 'Regular, serif',
            flex: '1',
            textAlign: 'right',
          }}
        >
          {slippageValue}
        </div>
        <Avatar
          style={{
            marginLeft: '20px',
            marginRight: '20px',
            width: '25px',
            height: '25px',
          }}
          src={icon_slippage_setting}
        />
      </Flex>
      <ConfigProvider
        theme={{
          components: {
            Modal: {
              contentBg: '#0d0d23',
              padding: 16,
            },
            InputNumber: {
              hoverBorderColor: '#0d0d23',
              hoverBg: '#0d0d23',
              activeBg: '#0d0d23',
              activeBorderColor: '#0d0d23',
              activeShadow: '0 0 0 2px rgba(8, 20, 53, 0.9)',
              inputFontSize: 20,
            },
          },
        }}
      >
        <Modal
          closeIcon={<CloseOutlined style={{ color: '#fefefe' }} />}
          open={isModalOpen}
          footer={null}
          getContainer={false}
          width={630}
          onCancel={() => setIsModalOpen(false)}
          destroyOnClose
          style={{ top: 86, color: '#fefefe', borderRadius: 0 }}
        >
          <div
            style={{
              paddingTop: '10px',
              fontSize: '20px',
              letterSpacing: '2px',
              fontFamily: 'Bold, serif',
              lineHeight: 1,
            }}
          >
            Settings
          </div>

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'row',
              lineHeight: 1,
              fontSize: '20px',
              color: '#a9a9a9',
              marginTop: '31px',
              width: '100%',
              fontFamily: 'Regular, serif',
            }}
          >
            <Avatar
              style={{
                marginRight: '20px',
                width: '25px',
                height: '25px',
              }}
              src={icon_slippage}
            />
            Slippage Tolerance
          </div>
          <Flex vertical={false} style={{ marginTop: '67px', width: '100%' }}>
            <div
              style={{
                alignItems: 'center',
                display: 'inline-flex',
                flexDirection: 'row',
                lineHeight: 1,
                letterSpacing: '1px',
                fontSize: '18px',
                color: '#fefefe',
                fontFamily: 'Bold, serif',
                borderRadius: '5px',
                border: 'solid 1px #5356b1',
                padding: '2px',
              }}
            >
              <div
                className={cx({ 'select-apy-item': slippageCustom !== '0.1%' })}
                onClick={() => {
                  onClickItem('0.1%');
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '97px',
                  height: '34px',
                  backgroundColor:
                    slippageCustom !== '0.1%' ? '#00000000' : '#5356b1',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                0.1%
              </div>
              <div
                className={cx({ 'select-apy-item': slippageCustom !== '0.5%' })}
                onClick={() => {
                  onClickItem('0.5%');
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '97px',
                  height: '34px',
                  backgroundColor:
                    slippageCustom !== '0.5%' ? '#00000000' : '#5356b1',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                0.5%
              </div>
              <div
                onClick={() => {
                  onClickItem('1%');
                }}
                className={cx({ 'select-apy-item': slippageCustom !== '1%' })}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '97px',
                  height: '34px',
                  backgroundColor:
                    slippageCustom !== '1%' ? '#00000000' : '#5356b1',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                1%
              </div>
            </div>
            <div
              style={{
                alignItems: 'center',
                display: 'inline-flex',
                flexDirection: 'row',
                lineHeight: 1,
                letterSpacing: '1px',
                fontSize: '18px',
                color: '#fefefe',
                fontFamily: 'Bold, serif',
                borderRadius: '5px',
                border: 'solid 1px #5356b1',
                padding: '2px',
                width: '200px',
                marginLeft: '32px',
              }}
            >
              <div
                style={{
                  marginLeft: '8px',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '97px',
                  height: '34px',
                  backgroundColor: '#00000000',
                  borderRadius: '5px',
                  flex: 6,
                }}
              >
                Custom
              </div>
              <InputNumber<number>
                style={{
                  background: '#00000000',
                  width: '100%',
                  fontFamily: 'Regular, serif',
                  border: 'none',
                }}
                defaultValue={Number(slippageCustom.replace('%', ''))}
                controls={false}
                min={0.1}
                max={100}
                precision={1}
                formatter={(val) => {
                  if (stringUtil.isEmpty(val)) {
                    return '';
                  }
                  return `${val}%`;
                }}
                parser={(value) => value?.replace('%', '') as unknown as number}
                onChange={(value) => {
                  if (value) {
                    onClickItem(value + '%');
                  }
                }}
              />
            </div>
          </Flex>
          <Flex
            vertical={false}
            align="center"
            justify="center"
            style={{
              marginBottom: '20px',
              marginTop: '43px',
              width: '100%',
              lineHeight: 1,
              letterSpacing: '1px',
              fontSize: '18px',
              color: '#fefefe',
              fontFamily: 'Bold, serif',
            }}
          >
            <div
              onClick={() => {
                cancel();
              }}
              style={{
                textAlign: 'center',
                lineHeight: '35px',
                width: '280px',
                height: '40px',
                borderRadius: '20px',
                border: 'solid 2px #3422d5',
                cursor: 'pointer',
              }}
            >
              Cancel
            </div>
            <div
              onClick={() => {
                save();
              }}
              style={{
                marginLeft: '20px',
                textAlign: 'center',
                lineHeight: '35px',
                width: '280px',
                height: '40px',
                background: '#6072fd',
                borderRadius: '20px',
                border: 'solid 2px #3422d5',
                cursor: 'pointer',
              }}
            >
              Save
            </div>
          </Flex>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default SelectCoinBtn;
