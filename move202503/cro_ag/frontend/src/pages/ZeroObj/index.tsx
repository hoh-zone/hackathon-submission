import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { ConfigProvider, Flex, notification, Spin } from 'antd';
import { useTabletOrMobile, useZeroObj } from '@/hooks';
import { Scrollbars } from 'react-custom-scrollbars';
import {
  ConnectModal,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { LoadingOutlined } from '@ant-design/icons';
import { Transaction } from '@mysten/sui/transactions';
import { invalidateZeroObj } from '@/hooks/useZeroObj';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateGetOwnedNft } from '@/hooks/useNft';
const cx = classNames.bind(styles);
const Obj: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const [showModal, setShowModal] = useState(false);
  const isTabletOrMobile = useTabletOrMobile();
  const objListData = useZeroObj(currentAccount?.address);
  const depositFn = () => {
    if (
      !currentAccount ||
      !objListData.data?.tx ||
      signTx.isPending ||
      arr == 0
    ) {
      return;
    }
    deposit(objListData.data?.tx);
  };
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (title: string, info: string) => {
    api.open({
      message: title,
      description: info,
      duration: 4.5,
    });
  };
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const signTx = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showRawEffects: true,
          // Select additional data to return
          showObjectChanges: true,
        },
      }),
  });
  const deposit = (tx: Transaction | null | undefined) => {
    if (!tx) {
      return;
    }
    signTx.mutate(
      {
        transaction: tx,
      },
      {
        onSuccess: () => {
          setArr(0);
          invalidateZeroObj(queryClient);
          invalidateGetOwnedNft(queryClient);
        },
        onError: (error) => {
          invalidateZeroObj(queryClient);
          openNotification(error.name, error.message);
        },
      }
    );
  };
  const [arr, setArr] = useState(0);
  useEffect(() => {
    setArr(objListData?.data?.dataList.length || 0);
  }, [objListData?.data?.dataList.length]);
  return (
    <Scrollbars>
      <Flex vertical>
        {contextHolder}
        <div className={cx('obj')}></div>
        <Flex
          vertical
          align="center"
          className={cx('content-box', 'bg-first-1')}
        >
          <div style={{ width: isTabletOrMobile ? '750px' : '1300px' }}></div>
          <div className={cx('text')}>
            {`This tool helps you clean up objects with a 0 balance in your
            wallet.
            During the clean up, you will receive Points.`}
          </div>
          <div className={cx('list')}>
            <div className={cx('title')}>0-obj List</div>
            {objListData.isLoading && (
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
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  indicator={
                    <LoadingOutlined style={{ marginTop: '-40px' }} spin />
                  }
                />
              </ConfigProvider>
            )}
            {objListData.isSuccess &&
              ((objListData?.data?.dataList.length || 0) > 0 && arr !== 0 ? (
                objListData?.data?.dataList.map((item: any, index: number) => (
                  <div key={index}>
                    {item.coinObjectId
                      ? `${item.coinObjectId.substring(
                          0,
                          8
                        )}...${item.coinObjectId.slice(-8)}`
                      : 'N/A'}
                  </div>
                ))
              ) : (
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
                  No data available
                </div>
              ))}
            {objListData.isError && (
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
          </div>
          {!currentAccount ? (
            <ConnectModal
              trigger={<div className={cx('left2')}>Connect</div>}
              open={showModal}
              onOpenChange={(isOpen) => setShowModal(isOpen)}
            />
          ) : (
            <div
              className={cx('left2')}
              style={{
                backgroundColor:
                  !currentAccount ||
                  !objListData.data?.dataList.length ||
                  arr == 0 ||
                  !objListData.isSuccess
                    ? '#9a94cf'
                    : '#6072fd',
              }}
              onClick={depositFn}
            >
              {signTx.isPending ? (
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
                    style={{ marginTop: '0px' }}
                    indicator={<LoadingOutlined spin />}
                  />
                </ConfigProvider>
              ) : (
                'Clear Trash'
              )}
            </div>
          )}
        </Flex>
      </Flex>
    </Scrollbars>
  );
};

export default Obj;
