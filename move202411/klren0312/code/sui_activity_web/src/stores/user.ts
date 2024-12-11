import { create } from 'zustand'

export interface UserData {
  objectId: string,
  name: string,
  nickname: string,
  description: string,
  sex: string,
  avatar: string,
  index: string,
  point: number,
}
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

interface UserState {
  userData: UserData // 用户信息
  joinActivityList: JoinActivityData[] // 参与活动列表
  joinActivityIdList: string[] // 参与活动ID列表
  activityListRefetch: () => void // 活动列表刷新函数
  setUser: (userData: UserData, address: string) => void // 设置用户信息
  resetUser: () => void // 重置用户信息
  setJoinActivityList: (joinActivityList: JoinActivityData[]) => void // 设置参与活动列表
  setActivityListRefetch: (activityListRefetch: () => void) => void // 设置活动列表刷新函数
}

export const useUserStore = create<UserState>()((set) => ({
  userData: {
    objectId: '',
    name: '',
    nickname: '',
    description: '',
    sex: '',
    avatar: '',
    index: '',
    point: 0,
  },
  joinActivityList: [],
  joinActivityIdList: [],
  activityListRefetch: () => {},
  setUser: async (userData: UserData) => {
    set({
      userData: {
        objectId: userData.objectId,
        name: userData.name,
        nickname: userData.nickname,
        description: userData.description,
        sex: userData.sex,
        avatar: userData.avatar,
        index: userData.index,
        point: userData.point,
      },
    })
  },
  // 清空userData
  resetUser: () => {
    set({
      userData: {
        objectId: '',
        name: '',
        nickname: '',
        description: '',
        sex: '',
        avatar: '',
        index: '',
        point: 0,
      },
    })
  },
  setJoinActivityList: (joinActivityList: JoinActivityData[]) => {
    set({
      joinActivityList,
      joinActivityIdList: joinActivityList && joinActivityList.map((item) => item.activity_id) || [],
    }) 
  },
  setActivityListRefetch: (activityListRefetch: () => void) => set({
    activityListRefetch,
  }),
}))
