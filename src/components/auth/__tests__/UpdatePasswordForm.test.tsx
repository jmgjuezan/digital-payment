import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm'

const { mockPush, mockRefresh, mockUpdateUser, mockSignOut } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockSignOut: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockPush, push: mockPush, refresh: mockRefresh }) }))
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { updateUser: mockUpdateUser, signOut: mockSignOut },
  })),
}))

describe('UpdatePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateUser.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({ error: null })
  })

  it('updates the password, signs out, and returns to login', async () => {
    render(<UpdatePasswordForm supabaseUrl='https://example.supabase.co' supabasePublishableKey='publishable-key' />)
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'long-new-password-123' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'long-new-password-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }))

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'long-new-password-123' }))
    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(mockPush).toHaveBeenCalledWith('/login?password-updated=true')
  })

  it('rejects mismatched passwords without sending an update', async () => {
    render(<UpdatePasswordForm supabaseUrl='https://example.supabase.co' supabasePublishableKey='publishable-key' />)
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'long-new-password-123' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different-password-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The passwords do not match.')
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })
})
