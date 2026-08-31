import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tripMemberApi } from '../api/trip-member-api'
import { tripKeys } from '../query/trip-keys'

export function useJoinInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => tripMemberApi.joinInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.list() })
    },
  })
}
