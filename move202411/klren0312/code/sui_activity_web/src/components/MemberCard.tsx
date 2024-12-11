import { Avatar, Card } from 'antd'
import { UserData } from '../stores/user'
const { Meta } = Card

export default function MemberCard({ userData }: { userData: UserData }) {
  return (
    <Card
      hoverable
      style={{ width: 300, height: 435 }}
      cover={
        <img
          className="object-cover w-72 h-72"
          alt="avatar"
          src={userData.avatar}
        />
      }
      actions={[
        <div>积分: {userData.point}</div>
      ]}
    >
      <div className="absolute top-0 right-0">
        #{userData.index}
      </div>
      <Meta
        avatar={<Avatar src={
          userData.sex === '未知' ?
          '/logo.svg' :
          userData.sex === '男' ?
          'https://api.dicebear.com/7.x/miniavs/svg?seed=8' :
          'https://api.dicebear.com/7.x/miniavs/svg?seed=9'
        } />}
        title={userData.nickname}
        description={userData.description}
      />
    </Card>
  )
}
