import { UsergroupAddOutlined } from '@ant-design/icons'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { Badge, Card, Carousel, Button, Tag, message, Image } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNetworkVariable } from '../utils/networkConfig'
import { useUserStore } from '../stores/user'
import { SUI_DECIMALS } from '../utils/constants'
import ActivityDetailModal from './ActivityDetailModal'
import { isActivityInProgress } from '../utils/tools'
const { Meta } = Card

export interface ActivityData {
  date_range: string[]
  description: string
  id: {
    id: string
  }
  join_fee: string
  join_memeber: {
    type: string
    fields: {
      contents: string[]
    }
  }
  location: string
  media: string[]
  tag: string
  title: string
  total_people_num: string
  total_price: string
  score: number
}

interface ActivityCardProps {
  activity: ActivityData
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const [activityDetailModalOpen, setActivityDetailModalOpen] = useState(false)
  const [activityDetailData, setActivityDetailData] = useState<ActivityData>()
  const { mutate } = useSignAndExecuteTransaction()
  const packageId = useNetworkVariable('packageId')
  const { userData, activityListRefetch, joinActivityIdList } = useUserStore()
  const [messageApi, contextHolder] = message.useMessage()
  const [activityStatus, setActivityStatus] = useState<string>('未开始')
  /**
   * 参加活动
   */
  const joinActivity = (activityId: string, joinFee: string) => {
    const txb = new Transaction()
    const [coin] = txb.splitCoins(txb.gas, [BigInt(joinFee)])
    txb.moveCall({
      target: `${packageId}::activity::join_activity`,
      arguments: [
        txb.object(userData.objectId),
        txb.object(activityId),
        coin,
        txb.pure.string(dayjs().format('YYYY-MM-DD HH:mm:ss')),
      ]
    })
    mutate(
      {
        transaction: txb,
      },
      {
        onError(error) {
          console.error(error.message)
          messageApi.error(error.message)
        },
        onSuccess(result) {
          messageApi.success(`参加活动成功: ${result.digest}`)
          activityListRefetch()
        }
      }
    )
  }
  const openActivityDetails = (activity: ActivityData) => {
    setActivityDetailModalOpen(true)
    setActivityDetailData(activity)
  }
  useEffect(() => {
    setActivityStatus(isActivityInProgress(activity.date_range[0], activity.date_range[1]))
  }, [activity])
  return (
    <>
      {contextHolder}
      <Badge.Ribbon
        color={
          activityStatus === '未开始' ?
            'volcano' :
            activityStatus === '进行中' ?
              'green' :
              'gray'
        }
        text={
          <div>
            <div>{activity.tag + (parseInt(activity.join_fee) === 0 ? '（免费）' : '（收费）')}</div>
            <div>{activityStatus}</div>
            {
              activity.score && activity.join_memeber.fields.contents.length > 0 ?
                <div>评分：{((activity.score / activity.join_memeber.fields.contents.length).toFixed(1))}</div> :
                <div>评分：0</div>
            }
          </div>
        }
      >
        {/* 活动卡片 */}
        {/* 添加点击事件，点击后进入详情弹框 */}
        <Card
          onClick={() => {
            openActivityDetails(activity)
          }}
          hoverable
          cover={
            <Carousel arrows infinite={false}>
              {
                activity.media.map((url, index) => (
                  <div key={index}>
                    <Image
                      className="object-cover"
                      width={'100%'}
                      height={200}
                      src={url}
                      fallback="data:image/png;base64,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"
                    />
                  </div>
                ))
              }
            </Carousel>
          }
          actions={[
            joinActivityIdList && joinActivityIdList.includes(activity.id.id) ?
              <Button disabled>已参加</Button> :
              activity.join_memeber.fields.contents.length >= parseInt(activity.total_people_num) ?
                <Button color="danger" disabled>已满员</Button> :
                <Button type="text" onClick={
                  (e: React.MouseEvent) => {
                    e.stopPropagation()
                    joinActivity(activity.id.id, activity.join_fee)
                  }
                }>
                  <UsergroupAddOutlined />
                  {
                    parseInt(activity.join_fee) === 0 ? '免费参加' : (
                      <>
                        立即参加
                        <Tag className="flex items-center" icon={<img className="w-4 h-4" src='/sui.svg' />} color="#55acee">
                          {`${parseInt(activity.join_fee) / SUI_DECIMALS}`}
                        </Tag>
                      </>
                    )
                  }
                </Button>
          ]}
        >
          <Meta
            title={
              <div className="flex justify-between items-center">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap">{activity.title}</div>
                <div className="text-xs text-gray-500">
                  {
                    activity.join_memeber.fields.contents.length === parseInt(activity.total_people_num) ?
                      '已无名额' :
                      `${activity.join_memeber.fields.contents.length} 人 / ${activity.total_people_num} 人`
                  }
                </div>
              </div>
            }
            description={activity.description}
          />
        </Card>
      </Badge.Ribbon>
      {/* 活动详情弹窗 */}
      <ActivityDetailModal
        activityDetail={activityDetailData}
        activityDetailModalOpen={activityDetailModalOpen}
        setActivityDetailModalOpen={setActivityDetailModalOpen}
        customFooter={
          activityDetailData &&
            <div className="w-full mt-5 flex justify-center">
              {joinActivityIdList && joinActivityIdList.includes(activityDetailData?.id.id) ?
                <Button disabled>已参加</Button> :
                activityDetailData && activityDetailData.join_memeber.fields.contents.length >= parseInt(activityDetailData.total_people_num) ?
                  <Button color="danger" disabled>已满员</Button> :
                  <Button type="text" onClick={() => joinActivity(activityDetailData?.id.id, activityDetailData?.join_fee)}><UsergroupAddOutlined />
                    立即参加
                    <Tag className="flex items-center" icon={<img className="w-4 h-4" src='/sui.svg' />} color="#55acee">
                      {activityDetailData?.join_fee === '0' ? '' : `${parseInt(activityDetailData?.join_fee) / SUI_DECIMALS}`}
                    </Tag>
                  </Button>}
            </div>
        }
      />
    </>
  )
}
