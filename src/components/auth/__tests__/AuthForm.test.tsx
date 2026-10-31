import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import AuthForm from '@/components/auth/AuthForm'

const { mockAuthCallback, mockAuthRender, mockOnAuthStateChange, mockReplace, mockRefresh } = vi.hoisted(() => ({
  mockAuthCallback: { current: undefined as ((event: string, session: unknown) => void) | undefined },
  mockAuthRender: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockReplace: vi.fn(),
  mockRefresh: vi.fn(),
}))

// Mock heavy Supabase auth-ui dependency – we only test our own wrapper logic
vi.mock('@supabase/auth-ui-react', () => ({
  Auth: (props: { supabaseClient: unknown }) => {
    mockAuthRender(props)
    return <div data-testid='supabase-auth-ui' />
  },
}))

vi.mock('@supabase/auth-ui-shared', () => ({
  ThemeSupa: {},
}))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      onAuthStateChange: mockOnAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
        mockAuthCallback.current = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        }
      }),
    },
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
}))

describe('AuthForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthCallback.current = undefined
  })

  it('shows unconfigured message when supabase props are missing', () => {
    render(<AuthForm />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/sign-in is not configured yet/i)).toBeInTheDocument()
    expect(screen.getByText(/NEXT_PUBLIC_SUPABASE_URL/)).toBeInTheDocument()
  })

  it('renders the Supabase Auth UI when both env props are provided', () => {
    render(
      <AuthForm
        supabaseUrl='https://example.supabase.co'
        supabasePublishableKey='anon-key'
      />
    )

    expect(screen.getByTestId('supabase-auth-ui')).toBeInTheDocument()
  })

  it('does not render the auth UI when only one prop is present', () => {
    render(<AuthForm supabaseUrl='https://example.supabase.co' />)

    // Missing key → unconfigured message, not the auth widget
    expect(screen.queryByTestId('supabase-auth-ui')).not.toBeInTheDocument()
    expect(screen.getByText(/sign-in is not configured yet/i)).toBeInTheDocument()
  })

  it('shows a loading state and refreshes the router after sign in', () => {
    render(<AuthForm supabaseUrl='https://example.supabase.co' supabasePublishableKey='anon-key' />)

    act(() => mockAuthCallback.current?.('SIGNED_IN', { user: { id: 'user-1' } }))

    expect(screen.getByText('Signing you in')).toBeInTheDocument()
    expect(mockReplace).toHaveBeenCalledWith('/dashboard')
    expect(mockRefresh).toHaveBeenCalledOnce()
  })
})
