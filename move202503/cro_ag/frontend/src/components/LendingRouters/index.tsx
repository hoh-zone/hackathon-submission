import React from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { useInView } from 'react-intersection-observer';
import { useSwapRouters, useTabletOrMobile } from '@/hooks';
import { ApyData, Coin } from 'cro-sdk';
import { Avatar, ConfigProvider, Spin } from 'antd';
import RouterItem from '../RouterItem';
import { ICON_URL } from '@/config/iconDefaultUrl';
import { translateBase } from '@/utils/dict';
import { platformMapping } from '@/config/dict.mapping';
import { platformItf } from '@/config/dict.interface';
import { formatBalance } from '@/utils/formatUtil';
import useUpdateEffect from '@/utils/useUpdateEffect';
import { Transaction } from '@mysten/sui/transactions';
import { LoadingOutlined } from '@ant-design/icons';
const cx = classNames.bind(styles);
export type LendingRoutersProps = {
  from: Coin;
  target: Coin;
  amount: string;
  decimals: number;
  apyDataItem: ApyData;
  refetchInterval: boolean;
  reallyValueBigint: bigint;
  targetIncomeAfterExchange: (value: string, tx?: Transaction) => void;
  onState: (value: 'loading' | 'success' | 'error') => void;
};

const LendingRouters: React.FC<LendingRoutersProps> = (props) => {
  const ratio = useTabletOrMobile() ? 5 / 6 : 1;
  const { ref, inView } = useInView({
    threshold: 0.2, // **** 50% ***，********
    triggerOnce: false, // ************* true
  });
  const swapRouters = useSwapRouters(
    props.from,
    props.target,
    props.amount,
    props.decimals,
    props.reallyValueBigint,
    inView,
    'lending',
    props.refetchInterval,
    props.apyDataItem
  );
  const targetBalance =
    formatBalance(
      swapRouters.data?.[0].routerData.target.amount,
      props.target.decimals
    ) || '';
  useUpdateEffect(() => {
    if (swapRouters.isSuccess) {
      props.onState('success');
      props.targetIncomeAfterExchange(targetBalance, swapRouters.data[0].tx);
    } else if (swapRouters.isLoading) {
      props.onState('loading');
    } else if (swapRouters.isError) {
      props.onState('error');
    }
  }, [swapRouters.isLoading, swapRouters.data?.[0]?.tx]);
  // const fointSizeVariable = (value: number): string => {

  // }

  return (
    <div ref={ref} className={cx('bottom-box', 'glass-container')}>
      {swapRouters.isLoading && (
        <div
          style={{
            marginTop: '38px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
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
            marginTop: '17px',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center ',
          }}
        >
          error
        </div>
      )}
      {swapRouters.isSuccess && (
        <>
          <div className={cx('bottom')}>
            {swapRouters?.data[0]?.routerData.routes?.map((item, index) => {
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
                      {Math.round(parseFloat(item.ratio))}%
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

                  <div
                    className={cx('item-split')}
                    style={{ width: '8%', flex: 'none' }}
                  ></div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              width: '2px',
              background: '#2836d5',
              marginTop: '38px',
              marginBottom: '38px',
            }}
          ></div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              className={cx('item-split')}
              style={{
                flex: 'none',
                width: '50px',
                height: '2px',
                background: '#2836d5',
              }}
              // translate(apyMapping, props.apyType),
            ></div>
            <div
              className={cx('item-content')}
              style={{
                width: `${40 * ratio}px`,
                height: `${40 * ratio}px`,
              }}
            >
              <Avatar
                src={
                  translateBase<platformItf>(
                    platformMapping,
                    props.apyDataItem.project
                  ) || ICON_URL
                }
                style={{ width: '100%', height: '100%' }}
              />
              <div
                className={cx('ratio')}
                style={{
                  fontSize:
                    28 -
                    ((targetBalance.length || 0) + props.target.name.length) +
                    'px',
                }}
              >
                {targetBalance}
                {props.target.name}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LendingRouters;
