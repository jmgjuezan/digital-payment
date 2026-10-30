import { describe, expect, it } from 'vitest'
import HomePage from '@/app/page'

describe('HomePage', () => {
  it('redirects visitors to sign in', () => {
    expect(() => HomePage()).toThrow('NEXT_REDIRECT:/login')
  })
})
