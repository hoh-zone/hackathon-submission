import React from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { CroPortfolio } from 'cro-sdk';
import { fetchApyByPlatformAndCoinType, useCoinByType } from '@/hooks';
import { formatBalance } from '@/utils/formatUtil';
import { ICON_URL } from '@/config/iconDefaultUrl';
import { translateBase } from '@/utils/dict';
import { platformItf } from '@/config/dict.interface';
import { platformMapping } from '@/config/dict.mapping';
import { Avatar } from 'antd';
const cx = classNames.bind(styles);
export type PortfolioListProps = {
  portfolioItem: CroPortfolio | null;
  item: CroPortfolio;
  onItemClick: () => void;
};
const PortfoliosItem: React.FC<PortfolioListProps> = (props) => {
  const cion = useCoinByType(props.item.coinType);
  const balance = formatBalance(props.item.totalBalance, cion?.decimals) || '';
  const apy = fetchApyByPlatformAndCoinType(
    props.item.platform,
    props.item.coinType
  );
  return (
    <div
      onClick={props.onItemClick}
      className={cx('first', {
        'first-selected':
          props.portfolioItem?.coinType == props.item.coinType &&
          props.portfolioItem?.platform == props.item.platform,
      })}
    >
      <div className={cx('label-left')}>
        <div className={cx('left-top')}>
          {(props.portfolioItem?.coinType == props.item.coinType &&
          props.portfolioItem?.platform == props.item.platform
            ? formatBalance(props.portfolioItem.totalBalance, cion?.decimals) ||
              ''
            : balance || '--') +
            '  ' +
            (cion?.name || '--')}
        </div>
        <div className={cx('left-bottom')}>
          {apy?.apy ? Number(apy.apy).toFixed(2) : '--'}%
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
            translateBase<platformItf>(platformMapping, props.item.platform) ||
            ICON_URL
          }
        />
        {props.item.platform}
      </div>
    </div>
  );
};

export default PortfoliosItem;
