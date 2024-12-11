import supabase from '../utils/supabase'
import { UserData } from '../stores/user'

export const UpdatePointApi = async (address: string, userData: UserData) => {
  // 查询是否存在当前address
  const { data: filterData, error: filterError } = await supabase
    .from('member')
    .select('address')
    .eq('address', address)

  // 没有数据，就插入
  if (filterError || filterData.length === 0) {
    const { error: insertError } = await supabase
      .from('member')
      .insert([
        { 
          address: address,
          nick_name: userData.nickname,
          point: userData.point,
        },
      ])
      .select()
    if (insertError) {
      console.log('insertError', insertError)
    }
  } else {
    // 有数据，更新
    const { error: updateError } = await supabase
      .from('member')
      .update({ point: userData.point })
      .eq('address', address)
      .select()
    if (updateError) {
      console.log('updateError', updateError)
    }
  }
}