import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { ApyTypeLocal } from '@/config/dict.enum';
import { useApyList } from '@/hooks';
import { ApyData, ProjectType } from 'cro-sdk';
import { translate } from '@/utils/dict';
import { apyMapping } from '@/config/dict.mapping';
import { LoadingOutlined } from '@ant-design/icons';
import { ConfigProvider, Spin } from 'antd';
import { ApyListItem } from '..';
export type ApyListProps = {
  apyType: ApyTypeLocal;
  apyDataItem: ApyData | null;
  onItemClick: (item: ApyData) => void;
};

const ApyList: React.FC<ApyListProps> = (props) => {
  const apyList = useApyList(
    translate(apyMapping, props.apyType),
    ProjectType.DEFAULT
  );

  const onItemClick = (item: ApyData) => {
    props.onItemClick(item);
  };
  return (
    <Scrollbars autoHide hideTracksWhenNotNeeded>
      {apyList.isLoading && (
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
      {apyList.isError && (
        <div
          style={{
            color: '#fefefe',
            fontSize: '18px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: '35px',
            fontFamily: 'Bold, serif',
          }}
        >
          error
        </div>
      )}
      {apyList.isSuccess &&
        apyList.data?.code == 200 &&
        (apyList.data?.data?.length || 0) > 0 &&
        apyList.data?.data?.map((item, index) => {
          return (
            <ApyListItem
              onClick={() => {
                onItemClick(item);
              }}
              apyDataItem={props.apyDataItem}
              item={item}
              key={index}
            />
          );
        })}
    </Scrollbars>
  );
};

export default ApyList;
