import { useState, forwardRef, useImperativeHandle } from 'react'
import ActivityDetailModal from '../ActivityDetailModal'
import { Button, message } from 'antd'
import { useNetworkVariable } from '/@/utils/networkConfig'
import { Transaction } from '@mysten/sui/transactions'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { useUserStore } from '/@/stores/user'

export interface JoinActivityData {
  activity_id: string
  activity_title: string
  check_in: boolean
  id: {
    id: string
  }
  index: string
  join_time: string
  name: string
  url: string
}

// 添加导出的方法类型定义
export interface JoinActivityCardRef {
  handleCheckIn: () => void
}

interface Props {
  joinData: JoinActivityData
  checkInHandle: () => void
}

// 修改组件定义，使用 forwardRef
export default forwardRef<JoinActivityCardRef, Props>(function JoinActivityCard({ joinData, checkInHandle }: Props, ref) {
  const [activityDetailModalOpen, setActivityDetailModalOpen] = useState(false)
  const packageId = useNetworkVariable('packageId')
  const { mutate } = useSignAndExecuteTransaction()
  const { userData } = useUserStore()
  const [messageApi, contextHolder] = message.useMessage()

  // 使用 useImperativeHandle 导出方法
  useImperativeHandle(ref, () => ({
    handleCheckIn
  }))

  /**
   * 打开活动详情弹窗
   */
  const handleActivityDetailModalOpen = () => {
    setActivityDetailModalOpen(true)
  }

  /**
   * 活动签到
   */
  const handleCheckIn = () => {
    const txb = new Transaction()
    txb.moveCall({
      target: `${packageId}::activity::check_in`,
      arguments: [
        txb.object(userData.objectId),
        txb.object(joinData.id.id),
        txb.object(joinData.activity_id)
      ]
    })
    mutate(
      {
        transaction: txb,
      },
      {
        onSuccess: () => {
          Object.assign(joinData, { check_in: true })
          messageApi.success('签到成功')
          checkInHandle()
        },
        onError: (err) => {
          messageApi.error(err.message)
        }
      }
    )
  }

  return (
    <>
      {contextHolder}
      <div key={joinData.id.id} onClick={handleActivityDetailModalOpen} className="join-activity-card relative rounded-md shadow-lg shadow-black cursor-pointer">
        <div className="absolute top-1 right-1 text-white text-sm">
          #{joinData.index}-{joinData.check_in ? '已签到' : '未签到'}
        </div>
        <div className="w-full absolute bottom-4 left-4">
          <div className="text-lg font-bold text-white overflow-hidden whitespace-nowrap text-ellipsis" title={joinData.activity_title}>{joinData.activity_title}</div>
          <div className="text-sm text-white">{joinData.join_time}</div>
        </div>
      </div>
      {
        activityDetailModalOpen && 
        <ActivityDetailModal
          activityDetailModalOpen={activityDetailModalOpen}
          setActivityDetailModalOpen={setActivityDetailModalOpen}
          activityId={joinData.activity_id}
          customFooter={
            joinData.check_in ? null : <div className="flex justify-center">
              <Button type="primary" onClick={handleCheckIn}>活动签到</Button>
            </div>
          }
        />
      }
    </>
  )
})
