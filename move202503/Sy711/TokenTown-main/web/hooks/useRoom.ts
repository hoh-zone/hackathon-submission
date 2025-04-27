// web/hooks/useRoom.ts
import useSWR from 'swr'
import { BattleRoom } from '@/types/room'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const useRoom = (roomId: string) => {
  const { data, error, isLoading, mutate } = useSWR<BattleRoom>(`/api/room?id=${roomId}`, fetcher)
  return { room: data, error, isLoading, mutate }
}
