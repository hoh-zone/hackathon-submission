import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { useInView } from 'react-intersection-observer';
import { useSwapRouters, useTabletOrMobile } from '@/hooks';
import { Coin } from 'cro-sdk';
import { Avatar, ConfigProvider, Flex, Spin } from 'antd';
import RouterItem from '../RouterItem';
import { ICON_URL } from '@/config/iconDefaultUrl';
import useUpdateEffect from '@/utils/useUpdateEffect';
import { formatBalance } from '@/utils/formatUtil';
import { Transaction } from '@mysten/sui/transactions';
import { LoadingOutlined } from '@ant-design/icons';
import { useCurrentAccount } from '@mysten/dapp-kit';
const cx = classNames.bind(styles);
export type SwapRoutersProps = {
  from: Coin;
  target: Coin;
  amount: string;
  decimals: number;
  reallyValueBigint: bigint;
  inViewP: boolean;
  refetchInterval: boolean;
  targetIncomeAfterExchange: (value: string, tx?: Transaction) => void;
  onState: (value: 'loading' | 'success' | 'error') => void;
  onItemClick?: (position: number) => void;
};

const SwapRoutersView: React.FC<SwapRoutersProps> = (props) => {
  // console.log('^^^^^^^^^^^^^^^^^ ');
  const [position, setPosition] = useState(0);
  const onItem = (position: number) => {
    props.onItemClick?.(position);
    setPosition(position);
  };
  const isTabletOrMobile = useTabletOrMobile();
  const ratio = useTabletOrMobile() ? 4 / 5 : 1;
  const { ref, inView } = useInView({
    threshold: 0.2, // **** 50% ***，********
    triggerOnce: false, // ************* true
  });
  const currentAccount = useCurrentAccount();
  const swapRouters = useSwapRouters(
    props.from,
    props.target,
    props.amount,
    props.decimals,
    props.reallyValueBigint,
    inView || props.inViewP,
    'swap',
    props.refetchInterval
  );

  useUpdateEffect(() => {
    if (swapRouters.isSuccess) {
      props.onState('success');
      props.targetIncomeAfterExchange(
        formatBalance(
          swapRouters.data[position]?.routerData.target.amount,
          props.target.decimals
        ),
        swapRouters.data[position]?.tx
      );
    } else if (swapRouters.isLoading) {
      props.onState('loading');
    } else if (swapRouters.isError) {
      props.onState('error');
    }
  }, [
    swapRouters.isError,
    swapRouters.isSuccess,
    swapRouters.isLoading,
    swapRouters.data?.[position]?.tx,
    swapRouters.data?.[position]?.routerData.target.amount,
  ]);

  // const targetCion = useCoinByType(props.target.);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: !isTabletOrMobile ? 'row-reverse' : 'row-reverse',
        width: '100%',
      }}
    >
      {currentAccount?.address && (
        <div className={cx('glass-container', 'agg-list')}>
          {swapRouters.isLoading && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                justifySelf: 'center',
              }}
            >
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
            </div>
          )}
          {swapRouters.isError && (
            <div
              style={{
                flex: 1,
                color: '#fefefe',
                fontSize: '18px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Regular, serif',
              }}
            >
              error
            </div>
          )}
          {swapRouters.isSuccess &&
            swapRouters.data.length > 0 &&
            swapRouters.data?.map((croItem, croIndex) => {
              const balance = formatBalance(
                croItem.coinOut,
                props.target.decimals
              );
              return (
                <div
                  onClick={() => {
                    onItem(croIndex);
                  }}
                  className={cx('item')}
                  style={{
                    backgroundColor:
                      position == croIndex ? '#458942' : '#5356b1',
                  }}
                  key={croIndex}
                >
                  <div className={cx('item-left-right')} style={{ flex: 1 }}>
                    <div className={cx('item-left-right-inter')}>
                      <div
                        style={{
                          marginRight: '4px',
                          fontSize:
                            balance.length <= 13
                              ? '16px'
                              : 28 - balance.length + 'px',
                        }}
                      >
                        {balance}
                      </div>
                      <div style={{ width: '3px', height: '3px' }}></div>
                      <div style={{ color: '#a9b2ff' }}>
                        {props.target.name}
                      </div>
                    </div>
                  </div>
                  <div className={cx('item-left-right')} style={{ flex: 1 }}>
                    <div className={cx('item-left-right-inter')}>
                      <Flex vertical={false}>
                        <div
                          style={{
                            fontSize:
                              balance.length <= 13
                                ? '16px'
                                : 28 - balance.length + 'px',
                            color:
                              croItem.amountDiff > 0n
                                ? '#aef5ae'
                                : croItem.amountDiff < 0n
                                ? '#ff0000'
                                : '#fefefe',
                          }}
                        >
                          {croItem.amountDiff >= 0n
                            ? '+' + croItem.amountDiff?.toString()
                            : croItem.amountDiff?.toString()}
                        </div>
                        <div
                          style={{
                            color: '#a9b2ff',
                            fontSize:
                              balance.length <= 13
                                ? '16px'
                                : 28 - balance.length + 'px',
                            fontFamily: 'Bold, serif',
                            marginLeft: '8px',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          e-{props.target.decimals}
                        </div>
                      </Flex>
                      <div style={{ width: '3px', height: '3px' }}></div>
                      <div>{croItem.dex}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          {swapRouters.isSuccess && swapRouters.data.length === 0 && (
            <div
              style={{
                flex: 1,
                color: '#fefefe',
                fontSize: '18px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Regular, serif',
              }}
            >
              No data available
            </div>
          )}
        </div>
      )}

      <div style={{ width: '18px', height: '18px' }}></div>
      <div
        ref={ref}
        className={cx('bottom-box', 'glass-container', {
          'bottom-box-top': true,
        })}
      >
        {swapRouters.isLoading && (
          <div
            style={{
              marginTop: '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}
          >
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
          </div>
        )}
        {swapRouters.isError && (
          <div
            style={{
              color: '#fefefe',
              fontSize: '18px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '35px',
              fontFamily: 'Regular, serif',
            }}
          >
            error
          </div>
        )}
        {swapRouters.isSuccess && swapRouters.data.length > 0 && (
          <div className={cx('bottom')}>
            {swapRouters?.data[position]?.routerData.routes?.map(
              (item, index) => {
                return (
                  <div key={index} className={cx('bottom-item')}>
                    <div
                      className={cx('item-content')}
                      style={{
                        width: `${40 * ratio}px`,
                        height: `${40 * ratio}px`,
                      }}
                    >
                      <Avatar
                        src={item.iconUrl_in || ICON_URL}
                        style={{ width: '100%', height: '100%' }}
                      />
                      <div
                        className={cx('ratio')}
                        style={{
                          fontSize: `${16 * ratio}px`,
                        }}
                      >
                        {parseFloat(item.ratio).toFixed(2)}%
                      </div>
                    </div>
                    <div className={cx('item-split')}></div>
                    {item?.path?.map((itemInter, indexInter) => {
                      return (
                        <React.Fragment key={indexInter}>
                          <div className={cx('item-split')}></div>
                          <RouterItem
                            typeFrom={itemInter.from.type}
                            typeTarget={itemInter.target?.type}
                            provider={itemInter.provider}
                          />
                          <div className={cx('item-split')}></div>
                        </React.Fragment>
                      );
                    })}
                    <div className={cx('item-split')}></div>
                    {item?.path?.length > 0 ? (
                      <div
                        className={cx('item-content')}
                        style={{
                          width: `${40 * ratio}px`,
                          height: `${40 * ratio}px`,
                        }}
                      >
                        <Avatar
                          src={item.iconUrl_out || ICON_URL}
                          style={{ width: '100%', height: '100%' }}
                        />
                        <div
                          className={cx('ratio')}
                          style={{
                            fontSize: `${16 * ratio}px`,
                          }}
                        >
                          {item.name_out}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cx('item-split')}
                        style={{ width: '1%', flex: 'none' }}
                      ></div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
        {swapRouters.isSuccess && swapRouters.data.length === 0 && (
          <div
            style={{
              width: '100%',
              color: '#fefefe',
              fontSize: '18px',
              marginTop: '15px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'center',
              justifySelf: 'center',
              justifyContent: 'center',
              fontFamily: 'Regular, serif',
            }}
          >
            Unable to find valid route
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapRoutersView;
