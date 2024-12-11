import { useSuiClientQuery, useCurrentAccount } from '@mysten/dapp-kit'
import { useNetworkVariable } from '/@/utils/networkConfig'
import { useEffect, useRef } from 'react'
import { JoinActivityData } from '/@/stores/user'
import { useState } from 'react'
import { parseSearch } from '/@/utils/tools'
import JoinActivityCard, { JoinActivityCardRef } from '/@/components/JoinActivityCard'
import { Button } from 'antd'

export default function CheckinPage() {
  const account = useCurrentAccount()
  const packageId = useNetworkVariable('packageId')
  const [activityId, setActivityId] = useState('')
  const [currentActivity, setCurrentActivity] = useState<JoinActivityData | null>(null)
  const [isCheckIn, setIsCheckIn] = useState(false)
  const joinActivityCardRef = useRef<JoinActivityCardRef>(null)
  // 查找参加的活动
  const { data: joinData } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      filter: {
        MatchAll: [
          {
            StructType: `${packageId}::activity::JoinActivityNft`,
          },
          {
            AddressOwner: account?.address!!,
          },
        ],
      },
      options: {
        showContent: true,
      },
    },
    {
      gcTime: 10000,
    },
  )
  useEffect(() => {
    const searchData = parseSearch()
    console.log(searchData)
    if (searchData && searchData.activityId) {
      setActivityId(searchData.activityId)
    }
  }, [])
  // 设置参与活动
  useEffect(() => {
    console.log('joinData', joinData)
    if (joinData) {
      if (joinData.data.length > 0) {
        const joinActivity =joinData.data.map((item) => {
        if (item?.data?.content?.dataType === 'moveObject') {
          return item.data.content.fields as unknown as JoinActivityData
        }
        return undefined
        }).filter((item) => item !== undefined)
        setCurrentActivity(joinActivity.find((item) => item.activity_id === activityId) || null)
      } else {
        setCurrentActivity(null)
      }
    } else {
      setCurrentActivity(null)
    }
  }, [joinData])
  return (
    <div className="flex flex-col justify-center items-center h-screen text-2xl">
      {
        currentActivity ? (
          <div className="flex flex-col items-center">
            <JoinActivityCard ref={joinActivityCardRef} joinData={currentActivity} checkInHandle={() => {setIsCheckIn(true)}} />
            {isCheckIn ? <div>签到成功</div> : <Button className="mt-4" type="primary" onClick={() => joinActivityCardRef.current?.handleCheckIn()}>签到</Button>}
          </div>
        ) : <div>您没有参与该活动</div>
      }
    </div>
  )
}
