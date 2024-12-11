import { Layout } from 'antd'
import router from '../../routers/router'
import React, { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ConnectButton, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit'
import '@mysten/dapp-kit/dist/index.css'
import './style.less'
import MemberInfo from '../MemberInfo'
import { useNetworkVariable } from '/@/utils/networkConfig'
import CreateActivityBtn from '../CreateActivityBtn'
import { JoinActivityData, useUserStore } from '../../stores/user'

const { Header, Content } = Layout

export default function PageLayout() {
  const packageId = useNetworkVariable('packageId')
  const account = useCurrentAccount()
  const { setJoinActivityList, setActivityListRefetch } = useUserStore()
  const [currentPath, setCurrentPath] = useState('/')
  const [redirect, setRedirect] = useState('')
  const chain = account?.chains?.find((c) => c.startsWith('sui:'))?.replace(/^sui:/, '')

  // 查找参与的活动
  const { data: joinQueryData, refetch: joinRefetch } = useSuiClientQuery(
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
        showDisplay: true,
        showContent: true,
      },
    },
    {
      gcTime: 10000,
    },
  )

  /**
   * 初始化时设置活动列表刷新函数
   */
  useEffect(() => {
    setActivityListRefetch(joinRefetch)
    setCurrentPath(window.location.pathname)
  }, [])

  /**
   * 监听网络切换
   */
  useEffect(() => {
    if (chain === 'mainnet' || chain === 'devnet') {
      setRedirect(window.location.pathname)
      router.navigate('/errorNetwork')
    } else {

      router.navigate(redirect)
    }
  }, [chain])

  /**
   * 监听参与活动列表
   */
  useEffect(() => {
    if (joinQueryData && joinQueryData.data.length > 0) {
      const arr = joinQueryData.data.map((item) => {
        if (item?.data?.content?.dataType === 'moveObject') {
          return item.data.content.fields as unknown as JoinActivityData
        }
        return undefined
      }).filter((item) => item !== undefined) as JoinActivityData[]
      setJoinActivityList(arr)
    } else {
      setJoinActivityList([])
    }
  }, [joinQueryData])

  return (
    <Layout>
      <Header className="page-header flex items-center justify-between px-5 flex-wrap h-auto min-h-16">
        <div className="flex items-center">
          <img className="w-10 h-10" src="/logo-transparent.svg" alt="logo" />
          <div className="page-title ml-5 text-white font-bold text-xl">SuiHi 随嗨</div>
          <div
            onClick={() => {setCurrentPath('/'); router.navigate('/')}}
            className={`ml-10 text-white text-base cursor-pointer ${
              currentPath === '/' ? 'font-bold' : ''
            }`}
          >
            首页
          </div>
          <div
            onClick={() => {setCurrentPath('/personCenter'); router.navigate('/personCenter')}}
            className={`ml-5 text-white text-base cursor-pointer ${
              currentPath === '/personCenter' ? 'font-bold' : ''
            }`}
          >
            个人中心
          </div>
          <div
            onClick={() => {setCurrentPath('/point'); router.navigate('/point')}}
            className={`ml-5 text-white text-base cursor-pointer ${
              currentPath === '/point' ? 'font-bold' : ''
            }`}
          >
            积分
          </div>
        </div>
        <div className="flex items-center justify-between">
          <MemberInfo />
          <ConnectButton className="reset-connect-button" connectText="使用钱包登录"></ConnectButton>
        </div>
      </Header>
      <Content className="p-2 flex box-border">
        <div className="h-full w-full p-5 bg-white rounded-md box-border" style={{minHeight: 'calc(100vh - 83px)'}}>
          <React.StrictMode>
            <RouterProvider router={router} future={{v7_startTransition: true}}/>
          </React.StrictMode>
        </div>
      </Content>
      <CreateActivityBtn />
    </Layout>
  )
}
