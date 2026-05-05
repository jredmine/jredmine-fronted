/**
 * 与后端 UserLoginResponseDTO.UserInfo 对齐
 */
export interface UserInfo {
  id: number
  login: string
  firstname: string
  lastname: string
  email: string | null
  admin: boolean | null
  status: number | null
}

/**
 * 与后端 UserLoginResponseDTO 对齐（登录 / 刷新 Token 共用）
 */
export interface UserLoginResponse {
  token: string
  tokenType: string
  expiresIn: number
  user: UserInfo
}

/**
 * 与后端 UserRegisterResponseDTO 对齐
 */
export interface UserRegisterResponse {
  login: string
  firstname: string
  lastname: string
}

export interface UserRegisterRequest {
  login: string
  password: string
  confirmPassword: string
  firstname: string
  lastname: string
  email: string
  hideEmailFlag?: boolean
}
