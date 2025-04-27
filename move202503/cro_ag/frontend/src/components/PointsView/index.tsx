import React from 'react';
import classNames from 'classnames/bind';
import styles from './index.module.scss';
import { Flex } from 'antd';
import { Scrollbars } from 'react-custom-scrollbars';
const cx = classNames.bind(styles);

const PointsView: React.FC = () => {
  return (
    <Scrollbars>
      <Flex
        vertical
        align="center"
        style={{
          marginBottom: '100px',
        }}
      >
        <div>PointsView</div>
      </Flex>
    </Scrollbars>
  );
};

export default PointsView;
