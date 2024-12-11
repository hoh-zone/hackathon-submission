import { useEffect } from 'react'
import supabase from '/@/utils/supabase'
import { useState } from 'react'
import { Table, TableColumnType } from 'antd'
interface PointData {
  point: number
  address: string
}
export default function PointPage () {
  const [pointData, setPointData] = useState<PointData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const columns: TableColumnType<PointData>[] = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      render: (_text: string, _record: PointData, index: number) => index + 1,
      width: '80px',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '积分',
      dataIndex: 'point',
      key: 'point',
      defaultSortOrder: 'descend',
      sorter: (a: PointData, b: PointData) => a.point - b.point,
    },
  ]
  const getPointData = async () => {
    setIsLoading(true)
    let { data, error } = await supabase
      .from('member')
      .select('address, point')
      .order('id', { ascending: false })
    if (error) {
      console.error(error)
      return
    }
    setPointData(data as PointData[])
    setIsLoading(false)
  }
  useEffect(() => {
    getPointData()
  }, [])
  return (
    <div>
      <Table loading={isLoading} bordered size="small" pagination={false} rowKey="address" columns={columns} dataSource={pointData} />
    </div>
  )
}