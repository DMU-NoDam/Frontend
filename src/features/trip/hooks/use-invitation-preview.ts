import { useQuery } from '@tanstack/react-query'
import { tripMemberApi } from '../api/trip-member-api'
import { tripKeys } from '../query/trip-keys'

export function useInvitationPreview(token: string | undefined) {
  return useQuery({
    queryKey: tripKeys.invitationPreview(token ?? ''),
    queryFn: () => tripMemberApi.previewInvitation(token!),
    enabled: !!token,
    retry: false,
  })
}
