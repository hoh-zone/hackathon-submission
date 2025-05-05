import React from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { ApyData } from 'cro-sdk';
import { Avatar, ConfigProvider, Popover } from 'antd';
import icon_banned from '@/assets/icon_banned.png';
import icon_url from '@/assets/icon_url.png';
import { translateBase } from '@/utils/dict';
import { platformItf } from '@/config/dict.interface';
import { platformMapping } from '@/config/dict.mapping';
import { ICON_URL } from '@/config/iconDefaultUrl';
const cx = classNames.bind(styles);
export type ApyListItemProps = {
  apyDataItem: ApyData | null;
  item: ApyData;
  onClick: () => void;
};
const content = (
  <div>
    <p style={{ color: '#fefefe' }}>Unverified authenticity of APY</p>
  </div>
);
const ApyList: React.FC<ApyListItemProps> = ({
  apyDataItem,
  item,
  onClick,
}) => {
  const clickUrl = () => {
    window.open('https://suivision.xyz/coin/' + item.coin_type, '_blank');
  };
  const onItemClick = () => {
    if (item.banned !== 2) {
      onClick();
    }
  };
  return (
    <div
      onClick={onItemClick}
      className={cx({
        'first-selected': apyDataItem?.id == item.id,
        first: item.banned !== 2,
        'first-disable': item.banned === 2,
      })}
    >
      <div className={cx('label-left')}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <div className={cx('left-top')}>{item.name}</div>
          <Avatar
            style={{
              marginLeft: '10px',
              width: '16px',
              height: '16px',
            }}
            onClick={clickUrl}
            src={icon_url}
          />
        </div>
        <div
          style={{
            marginTop: '3px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <div className={cx('left-bottom')}>
            {Number(item.apy).toFixed(2)}%
          </div>
          <ConfigProvider
            theme={{
              components: {
                Popover: {
                  colorBgElevated: '#557af3ee',
                },
              },
            }}
          >
            {item.banned !== 0 && (
              <Popover content={content}>
                <Avatar
                  style={{
                    marginLeft: '10px',
                    width: '18px',
                    height: '18px',
                  }}
                  src={icon_banned}
                />
              </Popover>
            )}
          </ConfigProvider>
        </div>
      </div>
      <div className={cx('label-left')}>
        <div
          style={{
            marginTop: '19px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <div className={cx('left-bottom')}>
            {(Number(item.tvl_usd) / 1000000).toFixed(2)}M
          </div>
        </div>
      </div>
      <div className={cx('label-right')}>
        <Avatar
          style={{
            marginRight: '7px',
            width: '39px',
            height: '39px',
          }}
          src={
            translateBase<platformItf>(platformMapping, item.project) ||
            ICON_URL
          }
        />
        {item.project}
      </div>
    </div>
  );
};

export default ApyList;
