import { useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLogin } from '@/features/auth/hooks/use-login'
import { OAUTH_PROVIDERS } from '@/features/auth/types/auth-types'
import type { OAuthProvider } from '@/features/auth/types/auth-types'

const isOAuthProvider = (value: string | null): value is OAuthProvider => {
  return OAUTH_PROVIDERS.includes(value as OAuthProvider)
}

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const hasRequestedLogin = useRef(false)
  const { mutate: login, isPending, isError } = useLogin()

  const provider = useMemo(() => {
    const queryProvider = searchParams.get('provider')
    const storedProvider = sessionStorage.getItem('oauth_provider')

    if (isOAuthProvider(queryProvider)) {
      return queryProvider
    }

    if (isOAuthProvider(storedProvider)) {
      return storedProvider
    }

    return null
  }, [searchParams])

  const code = searchParams.get('code')
  const canLogin = provider !== null && code !== null

  useEffect(() => {
    if (!canLogin || hasRequestedLogin.current) {
      return
    }

    hasRequestedLogin.current = true
    login({ provider, code })
  }, [canLogin, code, login, provider])

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="callback-title">
        <h1 id="callback-title">OAuth callback</h1>

        {!canLogin && (
          <>
            <p className="auth-error">
              Missing OAuth provider or authorization code.
            </p>
            <Link className="auth-link" to="/login">
              Back to login
            </Link>
          </>
        )}

        {canLogin && isPending && (
          <p className="auth-status">{provider} login is processing...</p>
        )}

        {canLogin && isError && (
          <>
            <p className="auth-error">OAuth login failed. Please try again.</p>
            <Link className="auth-link" to="/login">
              Back to login
            </Link>
          </>
        )}
      </section>
    </main>
  )
}
