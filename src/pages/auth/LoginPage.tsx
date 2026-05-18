import type { ReactNode } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { RiKakaoTalkFill } from 'react-icons/ri'
import { SiNaver } from 'react-icons/si'
import arubiIcon from '@/assets/Arubi-icon.png'
import arubiTextIcon from '@/assets/Arubi-text-icon.png'
import { authApi, useMockAuth } from '@/features/auth/api/auth-api'
import { testAuthApi } from '@/features/auth/api/test-auth-api'
import { useLogin } from '@/features/auth/hooks/use-login'
import { OAUTH_PROVIDERS } from '@/features/auth/types/auth-types'
import type { OAuthProvider } from '@/features/auth/types/auth-types'
import './LoginPage.css'

const providerLabels: Record<OAuthProvider, string> = {
  google: 'Sign in with Google',
  kakao: '\uCE74\uCE74\uC624 \uB85C\uADF8\uC778',
  naver: '\uB124\uC774\uBC84 \uB85C\uADF8\uC778',
}

const providerIcons: Record<OAuthProvider, ReactNode> = {
  google: <FcGoogle />,
  kakao: <RiKakaoTalkFill />,
  naver: <SiNaver />,
}

export function LoginPage() {
  const { mutate: login, isPending, isError } = useLogin()
  const {
    mutate: loginWithTestUser,
    isPending: isTestLoginPending,
    isError: isTestLoginError,
  } = useLogin({
    mutationFn: testAuthApi.login,
  })
  const isLoginPending = isPending || isTestLoginPending

  const handleOAuthLogin = (provider: OAuthProvider) => {
    sessionStorage.setItem('oauth_provider', provider)

    if (useMockAuth) {
      login({
        provider,
        code: 'mock-code',
      })
      return
    }

    window.location.assign(authApi.getOAuthStartUrl(provider))
  }

  return (
    <main className="login-page">
      <section className="login-shell" aria-labelledby="login-title">
        <div className="login-brand" aria-hidden="true">
          <img className="login-brand-icon" src={arubiIcon} alt="" />
          <img className="login-brand-text" src={arubiTextIcon} alt="ARUBI" />
        </div>

        <div className="login-actions">
          <h1 id="login-title" className="login-title">
            {'\uB85C\uADF8\uC778'}
          </h1>

          <div className="login-provider-list">
            {OAUTH_PROVIDERS.map((provider) => (
              <button
                key={provider}
                type="button"
                className={`login-provider-button login-provider-button--${provider}`}
                onClick={() => handleOAuthLogin(provider)}
                disabled={isLoginPending}
              >
                <span className="login-provider-icon" aria-hidden="true">
                  {providerIcons[provider]}
                </span>
                <span>{providerLabels[provider]}</span>
              </button>
            ))}

            {testAuthApi.enabled && (
              <button
                type="button"
                className="login-provider-button login-provider-button--test"
                onClick={() => loginWithTestUser()}
                disabled={isLoginPending}
              >
                <span className="login-provider-icon" aria-hidden="true">
                  DEV
                </span>
                <span>Test user login</span>
              </button>
            )}
          </div>

          {(isError || isTestLoginError) && (
            <p className="login-message login-message--error">
              {'\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.'}
            </p>
          )}

          {isLoginPending && (
            <p className="login-message">
              {'\uB85C\uADF8\uC778 \uCC98\uB9AC \uC911\uC785\uB2C8\uB2E4...'}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
