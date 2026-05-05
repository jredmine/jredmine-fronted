import type { ApiResponse } from '@/types/api-response'
import type {
  UserLoginResponse,
  UserRegisterRequest,
  UserRegisterResponse,
} from '@/types/user'
import { http } from '@/services/http'

function ensureSuccess<T>(body: ApiResponse<T>, fallback: string): T {
  if (!body.success || body.data === undefined || body.data === null) {
    throw new Error(body.message || fallback)
  }
  return body.data
}

export async function loginApi(login: string, password: string): Promise<UserLoginResponse> {
  const { data } = await http.post<ApiResponse<UserLoginResponse>>('/api/auth/login', {
    login,
    password,
  })
  return ensureSuccess(data, '登录失败')
}

export async function registerApi(payload: UserRegisterRequest): Promise<UserRegisterResponse> {
  const { data } = await http.post<ApiResponse<UserRegisterResponse>>('/api/auth/register', {
    ...payload,
    hideEmailFlag: payload.hideEmailFlag ?? false,
  })
  return ensureSuccess(data, '注册失败')
}
