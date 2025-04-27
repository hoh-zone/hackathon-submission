import React from 'react';
import styles from './index.module.scss';
import classNames from 'classnames/bind';
import { useCoinByType, useTabletOrMobile } from '@/hooks';
import { Avatar } from 'antd';
import { ICON_URL } from '@/config/iconDefaultUrl';
const cx = classNames.bind(styles);
export type RouterItemProps = {
  typeFrom: string;
  typeTarget: string;
  provider: string;
};
const RouterItem: React.FC<RouterItemProps> = (props) => {
  const ratio = useTabletOrMobile() ? 4 / 5 : 1;

  const cionFromType = useCoinByType(props.typeFrom);
  const cionTargetType = useCoinByType(props.typeTarget);
  return (
    <div
      className={cx('item-content')}
      style={{
        width: `${70 * ratio}px`,
        height: `${40 * ratio}px`,
      }}
    >
      <Avatar
        src={cionFromType?.iconUrl || ICON_URL}
        style={{ width: '100%', height: '100%' }}
      />
      <Avatar
        src={cionTargetType?.iconUrl || ICON_URL}
        style={{ width: '100%', height: '100%', marginLeft: '-10px' }}
      />
      <div
        className={cx('ratio')}
        style={{
          fontSize: `${16 * ratio}px`,
        }}
      >
        {props.provider}
      </div>
    </div>
  );
};

export default RouterItem;
