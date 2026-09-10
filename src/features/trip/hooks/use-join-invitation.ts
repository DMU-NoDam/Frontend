import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tripMemberApi } from '../api/trip-member-api'
import { tripKeys } from '../query/trip-keys'

export function useJoinInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => tripMemberApi.joinInvitation(token),
    onSuccess: () => {
      // 어떤 여행에 참여했는지 토큰만으로는 알 수 없어 trip 캐시 전체를 무효화한다
      queryClient.invalidateQueries({ queryKey: tripKeys.all })
    },
  })
}
