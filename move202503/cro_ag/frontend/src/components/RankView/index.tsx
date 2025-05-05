import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import {
  Flex,
  Input,
  Table,
  ConfigProvider,
  Spin,
  notification,
  Slider,
  InputNumberProps,
} from 'antd';
import { useNftAddPoints, useTabletOrMobile } from '@/hooks';
import {
  CheckCircleOutlined,
  LeftOutlined,
  LoadingOutlined,
  RightOutlined,
} from '@ant-design/icons';
import {
  ConnectModal,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { invalidateGetOwnedNft, useNft } from '@/hooks/useNft';
import { useDebounce } from 'use-debounce';
import stringUtil from '@/utils/stringUtil';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateNftTop, useNftTop } from '@/hooks/useNftTop';
import icon_copy from '@/assets/icon_copy.png';
import icon_share from '@/assets/icon_share.png';
import useCopyToClipboard from '@/hooks/useCopyToClipboard';
import { formatBalance } from '@/utils/formatUtil';
import { invalidateAddPoints } from '@/hooks/useNftAddPoints';
import { invalidateZeroObj } from '@/hooks/useZeroObj';
const cx = classNames.bind(styles);
const RankView: React.FC = () => {
  const isTabletOrMobile = useTabletOrMobile();
  const currentAccount = useCurrentAccount();
  const [currentPage, setCurrentPage] = useState(1);
  const prePagePoints = useRef(1);
  const [selectModule, setSelectModule] = useState('Points');
  const handleClick = (value: string) => {
    setCurrentPage(prePagePoints.current);
    prePagePoints.current = currentPage;
    setSelectModule(value);
  };
  const ntfTopResult = useNftTop(currentPage, selectModule);

  const articles = ntfTopResult.data?.data || [];
  const total = ntfTopResult.data?.total || 0;

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
  };
  const [showModal, setShowModal] = useState(false);
  const [_inputValue, setInputValue] = useState('');
  const [reallyValue] = useDebounce(_inputValue, 500);
  const [addPoints, setAddPoints] = useState<number | undefined>(undefined);
  const [reallyAddPoints] = useDebounce(addPoints, 500);
  const onInputChange = (value: string) => {
    if (stringUtil.isNotEmpty(value)) {
      setInputValue(value as string);
    } else {
      setInputValue('');
    }
  };
  const ntfResult = useNft(currentAccount?.address, reallyValue);
  const addPointsResult = useNftAddPoints(
    currentAccount?.address,
    reallyAddPoints,
    ntfResult.data?.pointsBalance?.decimals,
    ntfResult.data?.nftId
  );
  useEffect(() => {
    setAddPoints(
      Number(
        formatBalance(
          ntfResult.data?.pointsBalance?.balance,
          ntfResult.data?.pointsBalance?.decimals || 0
        ) || ''
      )
    );
    setSlider(100);
  }, [ntfResult.data?.pointsBalance]);
  const client = useSuiClient();
  const mintNftTx = useSignAndExecuteTransaction({
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
  const addPointsTx = useSignAndExecuteTransaction({
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
  const queryClient = useQueryClient();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (title: string, info: string) => {
    api.open({
      message: title,
      description: info,
      duration: 4.5,
    });
  };
  const onSliderValueChange: InputNumberProps['onChange'] = (value) => {
    if (Number.isNaN(value)) {
      return;
    }
    setSlider(value as number);
    const v = Number(
      (
        ((value as number) *
          Number(
            formatBalance(
              ntfResult.data?.pointsBalance?.balance,
              ntfResult.data?.pointsBalance?.decimals || 0
            ) || ''
          )) /
        100
      ).toFixed(0)
    );
    setAddPoints(v);
  };
  const mintNftFn = () => {
    if (
      !currentAccount ||
      ntfResult.data?.type !== 'new' ||
      mintNftTx.isPending
    ) {
      return;
    }
    if (reallyValue != '' && reallyValue.length !== 66) {
      openNotification(
        'Invalid Referral Address!',
        'The inviter address you entered is invalid. Please double-check and try again.'
      );
      return;
    }
    if (reallyValue === currentAccount?.address) {
      openNotification(
        'Invalid Referral Address!',
        'Referral address cannot be your own.'
      );
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!ntfResult.data!.tx) {
      return;
    }
    mintNftTx.mutate(
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transaction: ntfResult.data!.tx!,
      },
      {
        onSuccess: () => {
          invalidateGetOwnedNft(queryClient);
          invalidateNftTop(queryClient);
        },
        onError: (error) => {
          invalidateGetOwnedNft(queryClient);
          invalidateNftTop(queryClient);
          openNotification(error.name, error.message);
        },
      }
    );
  };
  const addPointsFn = () => {
    if (!addPointsResult.data?.txPoints || addPointsTx.isPending) {
      return;
    }
    addPointsTx.mutate(
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transaction: addPointsResult.data?.txPoints,
      },
      {
        onSuccess: () => {
          invalidateGetOwnedNft(queryClient);
          invalidateNftTop(queryClient);
          invalidateAddPoints(queryClient);
          invalidateZeroObj(queryClient);
          onSliderValueChange(0);
        },
        onError: (error) => {
          invalidateGetOwnedNft(queryClient);
          invalidateNftTop(queryClient);
          invalidateAddPoints(queryClient);
          openNotification(error.name, error.message);
        },
      }
    );
  };
  const { copyState, handleCopy } = useCopyToClipboard();
  const [sliderValue, setSliderValue] = useState(100);
  const setSlider = (value: number) => {
    setSliderValue(value);
  };
  return (
    <Flex vertical={isTabletOrMobile} align="center">
      {contextHolder}
      <Flex vertical>
        <Flex vertical={false} justify="flex-start" style={{ width: '100%' }}>
          <div
            className={cx('deposit-tab')}
            onClick={() => handleClick('Points')}
            style={{
              color: `${selectModule === 'Points' ? '#fefefe' : '#8694ff'}`,
              borderBottom: `${
                selectModule === 'Points' ? '3px solid #5356b1' : 'none'
              }`,
              borderRadius: '2px',
            }}
          >
            Points
          </div>
          <div
            className={cx('withdraw-tab')}
            onClick={() => handleClick('Referrals')}
            style={{
              color: `${selectModule === 'Referrals' ? '#fefefe' : '#8694ff'}`,
              borderBottom: `${
                selectModule === 'Referrals' ? '3px solid #5356b1' : 'none'
              }`,
              borderRadius: '2px',
            }}
          >
            Referrals
          </div>
        </Flex>
        <div className={cx('left1')} style={{ marginTop: '12px' }}>
          {ntfTopResult.isError && (
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
          {ntfTopResult.isLoading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
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
                <Spin
                  style={{
                    marginTop: '35px',
                  }}
                  indicator={<LoadingOutlined spin />}
                />
              </ConfigProvider>
            </div>
          )}
          {ntfTopResult.isSuccess && (
            <ConfigProvider
              theme={{
                token: {
                  colorBgContainer: '#252544',
                  colorText: '#ffffff',
                  colorTextHeading: '#ffffff',
                },
                components: {
                  Table: {
                    borderColor: '#5356b1',
                    rowHoverBg: '#6072fd',
                    cellFontSizeMD: 14,
                    cellPaddingBlockMD: 18,
                    lineHeight: 1,
                    headerSplitColor: '#353559',
                    headerColor: '#ffffff',
                    headerBg: '#353559',
                  },
                  Pagination: {
                    itemActiveBg: '#6072fd',
                    colorBgTextHover: '#4869e9',
                    itemBg: '#5356b1',
                    colorPrimary: '#ffffff',
                    colorPrimaryHover: '#ffffff',
                  },
                },
              }}
            >
              <Table
                size={'middle'}
                // rowKey={(record) => record.address}
                bordered={false}
                columns={[
                  { title: 'rank', dataIndex: 'rank', align: 'center' },
                  { title: 'address', dataIndex: 'address', align: 'center' },
                  {
                    title: selectModule.toLowerCase(),
                    dataIndex: 'points',
                    align: 'center',
                  },
                ]}
                dataSource={articles}
                pagination={{
                  showSizeChanger: false,
                  current: currentPage,
                  position: ['bottomCenter'],
                  size: 'default',
                  style: { border: 'none' },
                  pageSize: 10,
                  total: total,
                  itemRender: (current, type, originalElement) => {
                    if (type === 'prev') {
                      return (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#5356b1',
                            border: 'solid 1px #4869e9',
                            borderRadius: '4px',
                          }}
                        >
                          <LeftOutlined />
                        </div>
                      );
                    } else if (type === 'next') {
                      return (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#5356b1',
                            border: 'solid 1px #4869e9',
                            borderRadius: '4px',
                          }}
                        >
                          <RightOutlined />
                        </div>
                      );
                    }
                    return originalElement; // ********、****
                  },
                }}
                onChange={handleTableChange}
              />
            </ConfigProvider>
          )}
        </div>
      </Flex>

      <div style={{ width: '30px', height: '30px' }}></div>
      <Flex
        vertical={!isTabletOrMobile}
        style={{ marginLeft: '36px', alignItems: 'end' }}
      >
        <div className={cx('right')}>
          <div
            style={{
              lineHeight: 1,
              letterSpacing: '2px',
              fontFamily: 'Bold, serif',
              fontSize: '18px',
            }}
          >
            CroNft：
          </div>
          <div style={{ width: '20px', height: '20px' }}></div>
          <Flex vertical={false} align="center">
            <div
              style={{
                marginRight: '8px',
                lineHeight: 1,
                fontSize: '18px',
                fontFamily: 'Bold, serif',
                letterSpacing: '2px',
                color: ntfResult.data?.type === 'old' ? '#fefefe' : '#999999',
              }}
            >
              {!ntfResult.data?.nftId
                ? '------...---'
                : ntfResult.data?.nftId?.substr(0, 6) +
                  '...' +
                  ntfResult.data?.nftId?.substr(-3)}
            </div>
            {copyState ? (
              <CheckCircleOutlined style={{ fontSize: '18px' }} />
            ) : ntfResult.data?.type === 'old' ? (
              <div
                onClick={(event: React.MouseEvent) => {
                  handleCopy(ntfResult.data?.nftId);
                  event.stopPropagation();
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  backgroundImage: `url(${icon_copy})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }}
              ></div>
            ) : (
              ''
            )}
            {ntfResult.data?.nftId && (
              <div
                onClick={() => {
                  window.open(
                    'https://suivision.xyz/object/' + ntfResult.data?.nftId,
                    '_blank'
                  );
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  marginLeft: '12px',
                  backgroundImage: `url(${icon_share})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }}
              ></div>
            )}
          </Flex>
          <div style={{ width: '20px', height: '20px' }}></div>
          <Flex vertical style={{ height: '46px' }} justify="space-between">
            <Flex vertical={false} align="center">
              <div>●</div>
              <div
                style={{
                  marginLeft: '15px',
                  fontSize: '16px',
                  color: '#999999',
                  letterSpacing: '2px',
                  lineHeight: 1,
                  fontFamily: 'Bold, serif',
                }}
              >
                Staked Poinis:
                {ntfResult.data?.rankDetail?.data?.points ?? '--'}
              </div>
            </Flex>
            <Flex vertical={false} align="center">
              <div>●</div>
              <div
                style={{
                  marginLeft: '15px',
                  fontSize: '16px',
                  color: '#999999',
                  letterSpacing: '2px',
                  lineHeight: 1,
                  fontFamily: 'Bold, serif',
                }}
              >
                rank:{ntfResult.data?.rankDetail?.data?.rank || '--'}
              </div>
            </Flex>
          </Flex>
          <div style={{ width: '20px', height: '20px' }}></div>
          <Flex
            vertical={false}
            style={{
              width: '230px',
              height: '40px',
              borderRadius: '10px',
              border: 'solid 1px #111a65',
            }}
          >
            <Flex
              vertical
              align="center"
              justify="center"
              style={{
                width: '50px',
                backgroundColor:
                  !currentAccount ||
                  ntfResult.data?.type !== 'new' ||
                  (reallyValue != '' && reallyValue.length !== 66)
                    ? '#9a94cf'
                    : '#6072fd',
                borderRadius: '10px',
              }}
            >
              @
            </Flex>
            <ConfigProvider
              theme={{
                components: {
                  Input: {
                    hoverBorderColor: '#0d0d2300',
                    colorBorder: '#00000000',
                    hoverBg: '#0d0d2300',
                    activeBg: '#0d0d2300',
                    activeBorderColor: '#0d0d2300',
                    activeShadow: '0 0 0 2px rgba(8, 20, 53, 0)',
                    inputFontSize: 16,
                    fontFamily: 'Regular, serif',
                  },
                },
              }}
            >
              <Input
                disabled={ntfResult.data?.type !== 'new'}
                style={{
                  background: '#00000000',
                  fontSize: '16px',
                  fontFamily: 'Regular, serif',
                  color: '#ffffff',
                }}
                placeholder="Referral Address"
                onChange={(e) => {
                  onInputChange(e.target.value);
                }}
              />
            </ConfigProvider>
          </Flex>
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
                  ntfResult.data?.type !== 'new' ||
                  (reallyValue != '' && reallyValue.length !== 66)
                    ? '#9a94cf'
                    : '#6072fd',
              }}
              onClick={mintNftFn}
            >
              {mintNftTx.isPending ? (
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
                'Mint Nft'
              )}
            </div>
          )}
        </div>
        {ntfResult.data?.type === 'old' ? (
          <>
            <div style={{ width: '40px', height: '40px' }}></div>
            <div className={cx('right1')}>
              <div
                style={{
                  lineHeight: 1,
                  letterSpacing: '2px',
                  fontFamily: 'Bold, serif',
                  color: '#999999',
                  fontSize: '18px',
                }}
              >
                POINTS balance:
              </div>
              <div style={{ width: '10px', height: '10px' }}></div>
              <div
                style={{
                  lineHeight: 1,
                  letterSpacing: '2px',
                  fontFamily: 'Bold, serif',
                  color: '#999999',
                  fontSize: '18px',
                }}
              >
                {formatBalance(
                  ntfResult.data?.pointsBalance?.balance,
                  ntfResult.data?.pointsBalance?.decimals || 0
                ) || '--'}
              </div>
              <div style={{ width: '20px', height: '20px' }}></div>
              <div
                style={{
                  lineHeight: 1,
                  letterSpacing: '2px',
                  fontFamily: 'Bold, serif',
                  fontSize: '18px',
                }}
              >
                {reallyAddPoints}
              </div>
              <div className={cx('slider-box')}>
                <div className={cx('left-percentage')}>{sliderValue}%</div>
                <ConfigProvider
                  theme={{
                    components: {
                      Slider: {
                        handleSize: 15,
                        handleSizeHover: 20,
                        railSize: 10,
                        dotBorderColor: '#2531ca',
                        dotActiveBorderColor: '#2531ca',
                        railBg: '#2531ca55',
                        railHoverBg: '#2531ca55',
                        trackBg: '#2531ca',
                      },
                    },
                  }}
                >
                  <div className={cx('slider-left')}>
                    <Slider
                      tooltip={{ open: false }}
                      min={0}
                      max={100}
                      step={1}
                      defaultValue={100}
                      onChange={onSliderValueChange}
                      value={sliderValue}
                    />
                  </div>
                </ConfigProvider>

                <div className={cx('slider-right')}>
                  <div
                    className={cx('max')}
                    onClick={() => {
                      onSliderValueChange(100);
                    }}
                  >
                    Max
                  </div>
                </div>
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
                    marginTop: '0px',
                    backgroundColor: addPointsResult.data?.txPoints
                      ? '#6072fd'
                      : '#9a94cf',
                  }}
                  onClick={addPointsFn}
                >
                  {addPointsTx.isPending ? (
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
                    'Add Points'
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ width: '40px', height: '40px' }}></div>
            <div className={cx('right1')}></div>
          </>
        )}
      </Flex>
    </Flex>
  );
};

export default RankView;
