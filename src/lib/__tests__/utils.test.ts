import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('combines class names correctly', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary')
  })

  it('handles falsy and conditional values', () => {
    const isPrimary = false
    const isRounded = true

    expect(cn('btn', isPrimary && 'btn-primary', isRounded && 'rounded')).toBe('btn rounded')
  })
})
