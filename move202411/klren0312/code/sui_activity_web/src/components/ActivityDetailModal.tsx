import { Carousel, Modal, Image, Descriptions, Rate, message } from 'antd'
import { ActivityData } from './ActivityCard'
import { useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit'
import { useEffect, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { Transaction } from '@mysten/sui/transactions'
import { useNetworkVariable } from '../utils/networkConfig'
import { useUserStore } from '../stores/user'
interface Props {
  activityDetailModalOpen: boolean
  setActivityDetailModalOpen: (open: boolean) => void
  activityId?: string | undefined
  customFooter?: React.ReactNode
  activityDetail?: ActivityData
}

export default function ActivityDetailModal({
  activityDetailModalOpen,
  setActivityDetailModalOpen,
  activityDetail,
  activityId,
  customFooter,
}: Props) {
  const packageId = useNetworkVariable('packageId')
  const [activityDetailData, setActivityDetailData] = useState<ActivityData>()
  const { userData, joinActivityIdList, joinActivityList } = useUserStore()
  const { mutate } = useSignAndExecuteTransaction()
  const [messageApi, contextHolder] = message.useMessage()
  const { data: activityData } = useSuiClientQuery(
    'getObject',
    {
      id: activityId || '',
      options: {
        showContent: true,
      },
    },
    {
      gcTime: 10000,
      enabled: activityId !== undefined && activityDetail === undefined,
    },
  )
  useEffect(() => {
    if (activityData && activityData.data && activityData.data.content && activityData.data.content.dataType === 'moveObject') {
      setActivityDetailData(activityData.data.content.fields as unknown as ActivityData)
    }
  }, [activityData])
  // 如果存在详情数据 直接使用详情数据
  useEffect(() => {
    if (activityDetail) {
      setActivityDetailData(activityDetail)
    }
  }, [activityDetail])

  /**
   * 评分
   */
  const pushScore = (value: number) => {
    if (!activityId) {
      return
    }
    const joinObj = joinActivityList.find(item => item.activity_id === activityId)
    if (!joinObj) {
      return
    }
    console.log(value)
    const txb = new Transaction()
    txb.moveCall({
      target: `${packageId}::activity::score`,
      arguments: [
        txb.object(joinObj.id.id),
        txb.object(userData.objectId),
        txb.object(activityId),
        txb.pure.u8(value),
      ]
    })
    mutate(
      {
        transaction: txb
      },
      {
        onError: (err) => {
          console.error(err.message)
          messageApi.error(err.message)
        },
      }
    )
  }
  return (
    <>
      {contextHolder}
      <Modal
        width={1200}
        open={activityDetailModalOpen}
        onCancel={() => setActivityDetailModalOpen(false)}
        title={activityDetailData?.title + '活动详情'}
        footer={null}
      >
        <Carousel arrows infinite={false}>
          {
            activityDetailData && activityDetailData.media.map((url, index) => (
              <div key={index}>
                <Image
                  className="object-cover"
                  width={'100%'}
                  height={400}
                  src={url}
                  fallback="data:image/png;base64,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"
                />
              </div>
            ))
          }
        </Carousel>
        <Descriptions bordered>
          <Descriptions.Item label="活动名称">{activityDetailData?.title}</Descriptions.Item>
          <Descriptions.Item label="活动资金池">{parseInt(activityDetailData?.total_price ?? '0') / 1000000000} SUI</Descriptions.Item>
          <Descriptions.Item label="活动标签">{activityDetailData?.tag}</Descriptions.Item>
          <Descriptions.Item label="活动时间">{activityDetailData?.date_range.join(' - ')}</Descriptions.Item>
          <Descriptions.Item label="活动地点">{activityDetailData?.location}</Descriptions.Item>
          <Descriptions.Item label="活动费用">{activityDetailData?.join_fee === '0' ? '免费' : `${parseInt(activityDetailData?.join_fee || '0') / 1000000000} SUI`}</Descriptions.Item>
          <Descriptions.Item label="活动人数">总人数：{activityDetailData?.join_memeber.fields.contents.length} 人 / 上限：{activityDetailData?.total_people_num} 人</Descriptions.Item>
          <Descriptions.Item label="活动评分">
            {/* 没参加的不能评分 */}
            <Rate
              disabled={!(joinActivityIdList.includes(activityDetailData?.id.id || ''))}
              allowHalf
              value={parseFloat(activityDetailData?.score ? (activityDetailData?.score / activityDetailData?.join_memeber.fields.contents.length).toFixed(1) : '0')}
              onChange={pushScore}
            />
            {}
          </Descriptions.Item>
        </Descriptions>
        <MDEditor
          data-color-mode="light"
          value={activityDetailData?.description}
          hideToolbar
          preview="preview"
        />
        {/* 自定义组件插槽 */}
        <div className="mt-5">
          {customFooter}
        </div>
      </Modal>
    </>
  )
}