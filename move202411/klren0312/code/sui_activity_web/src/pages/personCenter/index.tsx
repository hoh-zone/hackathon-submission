import { Button, Divider, message, Spin, Table } from 'antd'
import { useUserStore } from '/@/stores/user'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQueries, useSuiClientQuery } from '@mysten/dapp-kit'
import { useNetworkVariable } from '/@/utils/networkConfig'
import { useEffect, useState } from 'react'
import JoinActivityCard, { JoinActivityData } from '/@/components/JoinActivityCard'
import './index.less'
import { ActivityData } from '/@/components/ActivityCard'
import dayjs from 'dayjs'
import { SUI_DECIMALS } from '/@/utils/constants'
import QrcodeModal from '/@/components/QrcodeModal'
import { Transaction } from '@mysten/sui/transactions'
import MemberCard from '/@/components/MemberCard'


interface CreateActivityData {
  activity_id: string
  admin_cap: string
  id: {
    id: string
  }
  title: string
}

interface MyCreateActivityData extends ActivityData {
  admin_cap: string
}

export default function PersonCenter() {
  const [messageApi, contextHolder] = message.useMessage()
  const { userData } = useUserStore()
  const account = useCurrentAccount()
  const packageId = useNetworkVariable('packageId')
  const server = useNetworkVariable('server')
  const { mutate } = useSignAndExecuteTransaction()
  const [joinActivity, setJoinActivity] = useState<JoinActivityData[]>([])
  const [createActivity, setCreateActivity] = useState<MyCreateActivityData[]>([])
  const [qrcodeModalOpen, setQrcodeModalOpen] = useState(false)
  const [qrcodeActivityId, setQrcodeActivityId] = useState('')

  const { joinData, createData, isPending: dataPending, isError } = useSuiClientQueries({
    queries: [
      {
        method: 'getOwnedObjects',
        params: {
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
        }
      },
      {
        method: 'getOwnedObjects',
        params: {
          owner: account?.address || '',
          filter: {
            MatchAll: [
              {
                StructType: `${packageId}::activity::CreateActivityNft`,
              },
              {
                AddressOwner: account?.address!!,
              },
            ],
          },
          options: {
            showContent: true,
          },
        }
      }
    ],
    combine: (results) => {
      return {
        joinData: results[0].data,
        createData: results[1].data,
        isPending: results.some((result) => result.isPending),
        isError: results.some((result) => result.isError),
      }
    }
  })

  if (isError) {
    console.error('获取数据失败', isError)
  }

  const { data: multiActivityObjects } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: createData?.data && createData.data.map((item) => item.data?.content?.dataType === 'moveObject' ? (item.data.content.fields as unknown as CreateActivityData).activity_id : '') || [],
      options: {
        showContent: true,
      },
    },
    {
      enabled:
        createData &&
        createData.data.length > 0,
      refetchInterval: 10000,
    }
  )

  // 设置参与活动
  useEffect(() => {
    if (!joinData) {
      setJoinActivity([])
      return
    }
    if (joinData.data.length > 0) {
      setJoinActivity(joinData.data.map((item) => {
        if (item?.data?.content?.dataType === 'moveObject') {
          return item.data.content.fields as unknown as JoinActivityData
        }
        return undefined
      }).filter((item) => item !== undefined))
    } else {
      setJoinActivity([])
    }
  }, [joinData])

  // 设置发布活动
  useEffect(() => {
    if (!multiActivityObjects) {
      setCreateActivity([])
      return
    }
    if (multiActivityObjects.length > 0) {
      const formatArr = multiActivityObjects.map(item => {
        if (item.data && item.data.content && item.data.content.dataType === 'moveObject') {
          const temp = item.data.content.fields as unknown as ActivityData
          const createDataTemp = createData?.data.map((item) => item.data?.content?.dataType === 'moveObject' ? (item.data.content.fields as unknown as CreateActivityData) : '').filter((item) => item !== '')
          if (createDataTemp) {
            const findCreateData = createDataTemp.find((item) => item.activity_id === temp.id.id)
            return {
              ...temp,
              admin_cap: findCreateData?.admin_cap
            }
          }
        }
        return undefined
      }).filter(item => item) as unknown as MyCreateActivityData[]
      setCreateActivity(formatArr)
    } else {
      setCreateActivity([])
    }
  }, [multiActivityObjects])

  /**
   * 提取活动经费
   * @param activityId 活动ID
   */
  const getActivityFunds = (activityId: string, adminCap: string) => {
    const txb = new Transaction()
    txb.moveCall({
      target: `${packageId}::activity::withdraw`,
      arguments: [
        txb.object(adminCap),
        txb.object(server),
        txb.object(activityId)
      ]
    })
    mutate(
      {
        transaction: txb
      },
      {
        onSuccess: (result) => {
          messageApi.success(`提取活动经费成功: ${result.digest}`)
        },
        onError: (err) => {
          console.error(err)
          messageApi.error('提取活动经费失败')
        }
      }
    )
  }

  /**
   * 获取活动签到二维码
   * @param activityId 活动ID
   */
  const getActivityCheckInQRCode = (activityId: string) => {
    setQrcodeActivityId(activityId)
    setQrcodeModalOpen(true)
  }
  return (
    <div>
      {contextHolder}
      {
        userData.objectId ?
          dataPending ?
          <Spin size="large" /> :
          <div className="flex">
            <MemberCard userData={userData} />
            <div className="flex-1 pl-5 box-border">
              <div className="text-xl font-bold">参与的活动</div>
              <Divider />
              {/* 参与的活动卡片 */}
              <div className="grid grid-cols-3 gap-4">
                {joinActivity && joinActivity.map((item: JoinActivityData) => (
                  <JoinActivityCard key={item.id.id} joinData={item} />
                ))}
              </div>
              <div className="mt-10 text-xl font-bold">发布的活动</div>
              <Divider />
              {/* 发布的活动卡片 */}
              <Table
                rowKey={(record) => record.id.id}
                dataSource={createActivity}
                pagination={false}
                columns={[
                  {
                    title: '活动名称',
                    dataIndex: 'title',
                    key: 'title',
                  },
                  {
                    title: '活动时间',
                    dataIndex: 'date_range',
                    key: 'date_range',
                    render: (dateRange: string[]) => {
                      return dateRange.map((date) => dayjs(date).format('YYYY-MM-DD')).join(' - ')
                    }
                  },
                  {
                    title: '活动费用',
                    dataIndex: 'join_fee',
                    key: 'join_fee',
                    render: (joinFee: string) => {
                      return `${(Number(joinFee) / SUI_DECIMALS).toFixed(2)} SUI`
                    }
                  },
                  {
                    title: '活动资金池',
                    dataIndex: 'total_price',
                    key: 'total_price',
                    render: (totalPrice: string) => {
                      return `${(Number(totalPrice) / SUI_DECIMALS).toFixed(2)} SUI`
                    }
                  },
                  {
                    title: '活动人数',
                    dataIndex: 'total_people_num',
                    key: 'total_people_num',
                  },
                  {
                    title: '参与人数',
                    dataIndex: 'join_memeber',
                    key: 'join_memeber',
                    render: (joinMember: {
                      type: string
                      fields: {
                        contents: string[]
                      }
                    }) => {
                      return joinMember.fields.contents.length
                    }
                  },
                  {
                    title: '活动类型',
                    dataIndex: 'tag',
                    key: 'tag',
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record) => (
                      <div className="flex">
                        <Button type="link" onClick={() => getActivityFunds(record.id.id, record.admin_cap)}>提取活动经费</Button>
                        <Button type="link" onClick={() => getActivityCheckInQRCode(record.id.id)}>签到二维码</Button>
                      </div>
                    ),
                  },
                ]}
              />
              <QrcodeModal open={qrcodeModalOpen} activityId={qrcodeActivityId} onCancel={() => setQrcodeModalOpen(false)} />
            </div>
          </div> :
          <div className="w-screen h-screen flex flex-col justify-center items-center text-2xl bg-white">请先申请会员</div>
      }
    </div>
  )
}