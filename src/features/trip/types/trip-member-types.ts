export type TripMemberRole = 'OWNER' | 'MEMBER'

export type TripMemberInfo = {
  userId: number
  role: TripMemberRole
  joinedAt: string
}

export type TripMemberListResponse = {
  message: string
  body: TripMemberInfo[]
}

export type TripInvitationLinkResponse = {
  message: string
  body: { token: string }
}

export type TripInvitationPreview = {
  tripName: string
  startDate: string
  endDate: string
}

export type TripInvitationPreviewResponse = {
  message: string
  body: TripInvitationPreview
}
