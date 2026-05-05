import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { UserInfo, UserLoginResponse } from '@/types/user'

const TOKEN_KEY = 'jredmine_access_token'
const USER_KEY = 'jredmine_user'

function parseStoredUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserInfo
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<UserInfo | null>(parseStoredUser())

  /** 展示名：姓名优先，否则登录名 */
  const displayName = computed(() => {
    const u = user.value
    if (!u) return ''
    const full = `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim()
    return full || u.login
  })

  const isAuthenticated = computed(() => Boolean(accessToken.value))

  /** 登录或刷新 Token 成功后写入会话（持久化 token + user） */
  function applyLoginPayload(payload: UserLoginResponse) {
    accessToken.value = payload.token
    user.value = payload.user
    localStorage.setItem(TOKEN_KEY, payload.token)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
  }

  function clearSession() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return {
    accessToken,
    user,
    displayName,
    isAuthenticated,
    applyLoginPayload,
    clearSession,
  }
})
