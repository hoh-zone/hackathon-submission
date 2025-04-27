import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import icon_copy from '@/assets/icon_copy.png';
import { Avatar, ConfigProvider, Flex, Input, Modal, Spin } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  updateCurrentCoinLendingIn,
  updateCurrentCoinSwapIn,
  updateCurrentCoinSwapOut,
  currentCoinType,
  updateCurrentCoinStakeOut,
  updateCurrentCoinStakeIn,
  updateCurrentCoinUnStakeOut,
  updateCurrentCoinUnStakeIn,
} from '@/store/feature/currentCoinTypeSlice';
import {
  CheckCircleOutlined,
  CloseOutlined,
  DownOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { formatBalance } from '@/utils/formatUtil';
import { ICON_URL } from '@/config/iconDefaultUrl';
import { useBalanceByType, useCoinShowByType, useCoinsShow } from '@/hooks';
import { Coin } from 'cro-sdk';
import useCopyToClipboard from '@/hooks/useCopyToClipboard';
import {
  CURRENT_COIN_BTN_TYPES,
  CurrentCoinBtnType,
  SelectCoinBtnProps,
} from '@/constants';
import { coinByCons } from '@/utils/coinByConsUtil';
import { useDebounce } from 'use-debounce';
const cx = classNames.bind(styles);
const SelectCoinBtn: React.FC<SelectCoinBtnProps> = ({
  btnType,
  onComplete,
}) => {
  const [searchCoin, setSearchCoin] = useState('');
  const [reallyValue] = useDebounce(searchCoin, 800);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryCoinShowByType = useCoinShowByType(reallyValue, isModalOpen);
  const currentCoin = useAppSelector(currentCoinType);
  const dispatch = useAppDispatch();
  const queryCoinsShow = useCoinsShow();
  // *******，*****
  const handleRefetch = async () => {
    if (queryCoinsShow.isStale === false && queryCoinsShow.data) {
      // *******，******
    } else {
      // ***，******
      queryCoinsShow.refetch();
    }
  };
  const disableClick = () => {
    if (
      btnType === CURRENT_COIN_BTN_TYPES[3] ||
      btnType === CURRENT_COIN_BTN_TYPES[4] ||
      btnType === CURRENT_COIN_BTN_TYPES[5] ||
      btnType === CURRENT_COIN_BTN_TYPES[6]
    ) {
      return true;
    } else {
      return false;
    }
  };
  const onSelectCoinClick = () => {
    if (disableClick()) {
      return;
    }
    if (!isModalOpen) {
      handleRefetch();
    }
    setIsModalOpen(!isModalOpen);
  };
  const handleSearch = (value: string) => {
    setSearchCoin(value);
  };
  const onCoinItemClick = (item: Coin | undefined) => {
    if (!item) {
      setIsModalOpen(!isModalOpen);
      return;
    }
    if (btnType === CURRENT_COIN_BTN_TYPES[0]) {
      if (item.type === currentCoin.coinLendingIn.type) {
        setIsModalOpen(!isModalOpen);
        return;
      }
      dispatch(updateCurrentCoinLendingIn(item));
    } else if (btnType === CURRENT_COIN_BTN_TYPES[1]) {
      if (item.type === currentCoin.coinSwapIn.type) {
        setIsModalOpen(!isModalOpen);
        return;
      }
      if (item.type === currentCoin.coinSwapOut.type) {
        dispatch(updateCurrentCoinSwapOut(currentCoin.coinSwapIn));
      }
      dispatch(updateCurrentCoinSwapIn(item));
    } else if (btnType === CURRENT_COIN_BTN_TYPES[2]) {
      if (item.type === currentCoin.coinSwapOut.type) {
        setIsModalOpen(!isModalOpen);
        return;
      }
      if (item.type === currentCoin.coinSwapIn.type) {
        dispatch(updateCurrentCoinSwapIn(currentCoin.coinSwapOut));
      }
      dispatch(updateCurrentCoinSwapOut(item));
    } else if (btnType === CURRENT_COIN_BTN_TYPES[3]) {
      if (item.type === currentCoin.coinStakeIn.type) {
        setIsModalOpen(!isModalOpen);
        return;
      }
      if (item.type === currentCoin.coinStakeOut.type) {
        dispatch(updateCurrentCoinStakeOut(currentCoin.coinStakeIn));
      }
      dispatch(updateCurrentCoinStakeIn(item));
    } else if (btnType === CURRENT_COIN_BTN_TYPES[4]) {
      if (item.type === currentCoin.coinStakeOut.type) {
        setIsModalOpen(!isModalOpen);
        return;
      }
      if (item.type === currentCoin.coinStakeIn.type) {
        dispatch(updateCurrentCoinStakeIn(currentCoin.coinStakeOut));
      }
      dispatch(updateCurrentCoinStakeOut(item));
    } else if (btnType === CURRENT_COIN_BTN_TYPES[5]) {
      if (item.type === currentCoin.coinUnStakeIn.type) {
        setIsModalOpen(!isModalOpen);
        return;
      }
      if (item.type === currentCoin.coinUnStakeOut.type) {
        dispatch(updateCurrentCoinUnStakeOut(currentCoin.coinUnStakeIn));
      }
      dispatch(updateCurrentCoinUnStakeIn(item));
    } else if (btnType === CURRENT_COIN_BTN_TYPES[6]) {
      if (item.type === currentCoin.coinUnStakeOut.type) {
        setIsModalOpen(!isModalOpen);
        return;
      }
      if (item.type === currentCoin.coinUnStakeIn.type) {
        dispatch(updateCurrentCoinUnStakeIn(currentCoin.coinUnStakeOut));
      }
      dispatch(updateCurrentCoinUnStakeOut(item));
    }
    onComplete?.();
    setIsModalOpen(!isModalOpen);
  };
  const searchBalance = useBalanceByType(
    //*******balance
    queryCoinShowByType?.data?.data?.[0]?.type
  );
  const { copyState, handleCopy } = useCopyToClipboard();

  const coinUrl = (btnType: CurrentCoinBtnType) => {
    return coinByCons(btnType, currentCoin)?.iconUrl || ICON_URL;
  };
  const coinName = (btnType: CurrentCoinBtnType) => {
    return coinByCons(btnType, currentCoin)?.name || '';
  };
  return (
    <>
      <Flex
        onClick={onSelectCoinClick}
        align="center"
        vertical={false}
        className={cx('select-coin')}
      >
        <Avatar
          style={{
            marginLeft: '7px',
            width: '32px',
            height: '32px',
          }}
          src={coinUrl(btnType)}
        />
        <div
          style={{
            flex: '1',
            textAlign: 'left',
            marginLeft: '8px',
          }}
        >
          {coinName(btnType)}
        </div>
        {!disableClick() ? (
          <DownOutlined style={{ marginRight: '20px', marginLeft: '12px' }} />
        ) : (
          <div style={{ width: '20px' }}></div>
        )}
      </Flex>
      <ConfigProvider
        theme={{
          components: {
            Modal: {
              contentBg: '#0d0d23',
              padding: 16,
            },
            Input: {
              hoverBorderColor: '#0d0d23',
              hoverBg: '#0d0d23',
              activeBg: '#0d0d23',
              activeBorderColor: '#0d0d23',
              activeShadow: '0 0 0 2px rgba(8, 20, 53, 0.9)',
              inputFontSize: 20,
              fontFamily: 'Regular, serif',
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
              fontSize: '20px',
              letterSpacing: '2px',
              fontFamily: 'Bold, serif',
            }}
          >
            Select a coin
          </div>
          <Input
            onChange={(e) => handleSearch(e.currentTarget.value)}
            // onPressEnter={(e) => handleSearch(e.currentTarget.value)}
            placeholder="Search by token or address"
            style={{
              marginTop: '15px',
              height: '70px',
              backgroundColor: '#00000000',
              border: '#00000000',
              color: '#fefefe',
              marginBottom: '10px',
            }}
          />
          {queryCoinShowByType?.data?.data === undefined &&
          !queryCoinShowByType.isLoading ? (
            <></>
          ) : !queryCoinShowByType.isLoading &&
            queryCoinShowByType?.data?.data === null ? (
            <div style={{ color: '#ff4d4f' }}>
              {queryCoinShowByType?.data?.msg}
            </div>
          ) : queryCoinShowByType.isLoading ? (
            <ConfigProvider
              theme={{
                components: {
                  Spin: {
                    colorPrimary: '#fefefe',
                  },
                },
              }}
            >
              <Spin indicator={<LoadingOutlined spin />} />
            </ConfigProvider>
          ) : (
            <Flex
              onClick={() =>
                onCoinItemClick(queryCoinShowByType?.data?.data?.[0])
              }
              vertical={false}
              align={'center'}
              className={cx('select-coin-item')}
              style={{ height: '68px' }}
            >
              <Avatar
                style={{
                  width: '40px',
                  height: '40px',
                  marginRight: '9px',
                }}
                src={queryCoinShowByType?.data?.data?.[0]?.iconUrl || ICON_URL}
              />
              <Flex gap="6px" flex={1} align="flex-start" vertical>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: 'none',
                    fontSize: '18px',
                    fontFamily: 'Bold, serif',
                    color: '#fefefe',
                    lineHeight: '18px',
                    letterSpacing: '1px',
                  }}
                >
                  {queryCoinShowByType?.data?.data?.[0]?.name}
                </div>
                <Flex
                  vertical={false}
                  align="center"
                  style={{ height: '18px' }}
                >
                  <div
                    style={{
                      marginRight: '8px',
                      lineHeight: '14px',
                      fontSize: '14px',
                      fontFamily: 'Bold, serif',
                      letterSpacing: '1px',
                      color: '#999999',
                    }}
                  >
                    {queryCoinShowByType?.data?.data?.[0]?.type?.substr(0, 6)}
                    ...
                    {queryCoinShowByType?.data?.data?.[0]?.type?.substr(-6)}
                  </div>
                  {!copyState ? (
                    <div
                      onClick={(event: React.MouseEvent) => {
                        handleCopy(queryCoinShowByType?.data?.data?.[0]?.type);
                        event.stopPropagation();
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundImage: `url(${icon_copy})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                      }}
                    ></div>
                  ) : (
                    <CheckCircleOutlined style={{ fontSize: '14px' }} />
                  )}
                </Flex>
              </Flex>
              <div
                style={{
                  border: 'none',
                  fontSize: '18px',
                  fontFamily: 'Bold, serif',
                  color: '#fefefe',
                  letterSpacing: '1px',
                  marginLeft: '9px',
                }}
              >
                {formatBalance(
                  searchBalance?.data?.balance,
                  searchBalance?.data?.decimals || 0
                )}
              </div>
            </Flex>
          )}

          <div
            style={{
              fontSize: '18px',
              color: '#fefefe',
              marginTop: '15px',
              width: '100%',
            }}
          >
            <Flex gap="8px 14px" wrap>
              {queryCoinsShow?.data?.data?.map((item) => (
                <Flex
                  key={item.id}
                  onClick={() => onCoinItemClick(item)}
                  align="center"
                  vertical={false}
                  className={cx('select-coin-item')}
                >
                  <Avatar
                    style={{
                      width: '29px',
                      height: '29px',
                    }}
                    src={item.iconUrl || ICON_URL}
                  />
                  <div
                    style={{
                      textAlign: 'left',
                      marginLeft: '9px',
                    }}
                  >
                    {item.name}
                  </div>
                </Flex>
              ))}
            </Flex>
          </div>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default SelectCoinBtn;
