const STORAGE_KEY = 'fi_access_token'

let accessToken: string | null = null

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore quota / private mode
  }
}

export const tokenStore = {
  get(): string | null {
    if (accessToken) return accessToken
    const stored = readStoredToken()
    if (stored) accessToken = stored
    return accessToken
  },

  set(token: string | null): void {
    accessToken = token
    writeStoredToken(token)
  },

  clear(): void {
    accessToken = null
    writeStoredToken(null)
  },

  hasToken(): boolean {
    const token = this.get()
    return token !== null && token.length > 0
  },
}
