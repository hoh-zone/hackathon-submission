import { useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit'
import { Divider, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { useNetworkVariable, useNetworkVariables } from '/@/utils/networkConfig'
import ActivityCard, { ActivityData } from '/@/components/ActivityCard'

// 服务器数据类型
interface ServerData {
  activity_fee: string
  activity_max_join_fee: string
  id: {
    id: string
  }
  members: {
    type: string
    fields: {
      id: {
        id: string
      }
      size: string
    }
  }
  name: string
  pool_balance: string
}

export interface ActivityEventData {
  id: {
    txDigest: string
    eventSeq: string
  }
  packageId: string
  transactionModule: string
  sender: string
  type: string
  parsedJson: {
    activity_id: string
    creator: string
    date_range: string[]
    description: string
    join_fee: string
    location: string
    media: string[]
    tag: string
    title: string
    total_people_num: string
  }
  bcs: string
  timestampMs: string
}

function HomePage () {
  const packageId = useNetworkVariable('packageId')
  const client = useSuiClient()
  const [serverData, setServerData] = useState<ServerData>()
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [serverDataLoading, setServerDataLoading] = useState(false)
  const { server } = useNetworkVariables()
  /**
   * 查询注册事件
   */
  const {
    data: registerEvents,
  } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveModule: {
          package: packageId,
          module: "sui_hai",
        },
      },
      order: "descending",
    },
    {
      refetchInterval: 10000,
    }
  )

  /**
   * 查询活动创建事件
   */
  const {
    data: activityEvents,
  } = useSuiClientQuery(
    'queryEvents',
    {
      query: {
        MoveEventType:  `${packageId}::activity::CreateActivityEvent`,
      },
      order: "descending",
    },
    {
      refetchInterval: 10000,
    }
  )

  const { data: multiActivityObjects } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids:
      activityEvents?.data && (activityEvents?.data as unknown as ActivityEventData[]).map((item) => item.parsedJson.activity_id) || [],
      options: {
        showContent: true,
      },
    },
    {
      enabled:
        activityEvents &&
        activityEvents.data.length > 0,
      refetchInterval: 10000,
    }
  )

  useEffect(() => {
    if (multiActivityObjects && multiActivityObjects.length > 0) {
      const formatArr = multiActivityObjects.map(item => {
        if (item.data && item.data.content && item.data.content.dataType === 'moveObject') {
          return item.data.content.fields as unknown as ActivityData
        }
        return undefined
      }).filter(item => item) as unknown as ActivityData[]
      setActivityData(formatArr)

    }
  }, [multiActivityObjects])

  /**
   * 根据注册事件更新服务器数据
   */
  useEffect(() => {
    if (registerEvents && registerEvents.data.length > 0) {
      getServerData()
    }
  }, [registerEvents])

  /**
   * 初始化时获取服务器数据
   */
  useEffect(() => {
    getServerData()
  }, [])
  /**
   * 获取服务器数据
   */
  const getServerData = async () => {
    setServerDataLoading(true)
    const { data: sdata, error } = await client.getObject({
      id: server,
      options: {
        showContent: true
      }
    })
    if (error) {
      console.error(error)
    } else {
      if (sdata && sdata.content?.dataType === 'moveObject') {
        setServerData(sdata.content.fields as unknown as ServerData)
      }
    }
    setServerDataLoading(false)
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {
            serverDataLoading ?
            <div>加载中...</div> :
            <div className="flex">
              <Tag color="#2db7f5">总用户数：{serverData?.members.fields.size || 0} 人</Tag>
              <Tag color="#2db7f5">系统资金池：{serverData?.pool_balance ? parseInt(serverData.pool_balance) / 1000000000 : 0} SUI</Tag>
            </div>
          }
        </div>
      </div>
      <Divider />
      <div className="grid grid-cols-5 gap-5">
        {
          activityData.map((activity) => (
            <ActivityCard key={activity.id.id} activity={activity} />
          ))
        }
      </div>
    </div>
  )
}

export default HomePage
