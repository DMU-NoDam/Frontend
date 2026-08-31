import { apiClient } from '@/shared/api/client'
import type {
  TripInvitationLinkResponse,
  TripInvitationPreview,
  TripInvitationPreviewResponse,
  TripMemberInfo,
  TripMemberListResponse,
} from '../types/trip-member-types'

const getMembers = async (tripId: string): Promise<TripMemberInfo[]> => {
  const { data } = await apiClient.get<TripMemberListResponse>(`/trip/api/${tripId}/members`)
  return data.body
}

const leaveTrip = async (tripId: string, newOwnerUserId?: number): Promise<void> => {
  await apiClient.post(`/trip/api/${tripId}/leave`, newOwnerUserId ? { newOwnerUserId } : undefined)
}

const getOrCreateInvitationLink = async (tripId: string): Promise<string> => {
  const { data } = await apiClient.post<TripInvitationLinkResponse>(`/trip/api/${tripId}/invitations/link`)
  return data.body.token
}

const previewInvitation = async (token: string): Promise<TripInvitationPreview> => {
  const { data } = await apiClient.get<TripInvitationPreviewResponse>(`/trip/public/invitations/${token}`)
  return data.body
}

const joinInvitation = async (token: string): Promise<void> => {
  await apiClient.post(`/trip/api/invitations/${token}/join`)
}

export const tripMemberApi = {
  getMembers,
  leaveTrip,
  getOrCreateInvitationLink,
  previewInvitation,
  joinInvitation,
}
