// GET/PATCH /user/api 의 SuccessResponse<UserInfoDto>
export type UserInfo = {
  name: string
  isOAuthUser: boolean
  provider: string
}

export type UserInfoResponse = {
  message: string
  body: UserInfo
}
