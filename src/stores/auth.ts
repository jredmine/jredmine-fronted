import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'jredmine_access_token'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem(TOKEN_KEY))

  const isAuthenticated = computed(() => Boolean(accessToken.value))

  function setToken(token: string | null) {
    accessToken.value = token
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  function clearSession() {
    setToken(null)
  }

  return { accessToken, isAuthenticated, setToken, clearSession }
})
