import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
}

HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  },
}))

afterEach(() => {
  cleanup()
})
