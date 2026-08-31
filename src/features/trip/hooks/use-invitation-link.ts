import { useMutation } from '@tanstack/react-query'
import { tripMemberApi } from '../api/trip-member-api'

export function useInvitationLink() {
  return useMutation({
    mutationFn: (tripId: string) => tripMemberApi.getOrCreateInvitationLink(tripId),
  })
}
