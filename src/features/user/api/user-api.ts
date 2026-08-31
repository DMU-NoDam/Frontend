import { apiClient } from '@/shared/api/client'
import type { UserInfoResponse } from '../types/user-types'

const updateName = async (name: string): Promise<void> => {
  await apiClient.patch<UserInfoResponse>('/user/api', { name })
}

const deleteAccount = async (): Promise<void> => {
  await apiClient.delete('/user/api')
}

export const userApi = {
  updateName,
  deleteAccount,
}
