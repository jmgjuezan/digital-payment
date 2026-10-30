import { describe, expect, it } from 'vitest'
import { paymentTypeOptions } from '@/lib/payment-options'

describe('paymentTypeOptions', () => {
  it('contains expected payment types and no duplicates', () => {
    expect(paymentTypeOptions.length).toBeGreaterThan(0)

    const uniqueSet = new Set(paymentTypeOptions)
    expect(uniqueSet.size).toBe(paymentTypeOptions.length)
  })

  it('includes core payment methods (GCash, Maya, Bank Cash-in and Cash-out)', () => {
    expect(paymentTypeOptions).toContain('GCash Cash-in')
    expect(paymentTypeOptions).toContain('GCash Cash-out')
    expect(paymentTypeOptions).toContain('GCash Load')
    expect(paymentTypeOptions).toContain('Maya Cash-in')
    expect(paymentTypeOptions).toContain('Maya Cash-out')
    expect(paymentTypeOptions).toContain('BPI Cash-in')
    expect(paymentTypeOptions).toContain('BDO Cash-in')
    expect(paymentTypeOptions).toContain('UnionBank Cash-in')
  })
})
