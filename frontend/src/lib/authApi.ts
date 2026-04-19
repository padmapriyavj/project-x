import { apiFetchJson } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'
import { getApiBaseUrl } from '@/lib/env'

type LoginRequest = components['schemas']['LoginRequest']
type SignupRequest = components['schemas']['SignupRequest']
type AuthResponse = components['schemas']['AuthResponse']

function shouldUseAuthMock(): boolean {
  return (
    !getApiBaseUrl() || import.meta.env.VITE_AUTH_MOCK === 'true'
  )
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Mock auth for local UI when `VITE_API_BASE_URL` is unset or `VITE_AUTH_MOCK=true`. */
async function mockLogin(body: LoginRequest): Promise<AuthResponse> {
  await delay(350)
  if (body.password.length < 4) {
    throw new Error('Invalid email or password.')
  }
  const professorDemo = body.email.toLowerCase().includes('professor')
  return {
    access_token: 'mock-access-token',
    user: {
      id: 1,
      email: body.email,
      display_name: professorDemo ? 'Demo professor' : 'Demo learner',
      role: professorDemo ? 'professor' : 'student',
    },
  }
}

async function mockSignup(body: SignupRequest): Promise<AuthResponse> {
  await delay(350)
  return {
    access_token: 'mock-access-token',
    user: {
      id: 2,
      email: body.email,
      display_name: body.display_name,
      role: body.role,
    },
  }
}

export async function loginRequest(body: LoginRequest): Promise<AuthResponse> {
  if (shouldUseAuthMock()) {
    return mockLogin(body)
  }
  return apiFetchJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function signupRequest(body: SignupRequest): Promise<AuthResponse> {
  if (shouldUseAuthMock()) {
    return mockSignup(body)
  }
  return apiFetchJson<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
