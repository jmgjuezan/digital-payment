import { describe, expect, it } from 'vitest'
import { calculatePaymentCharge } from '@/lib/payment-charge'

describe('calculatePaymentCharge', () => {
  it('returns 0 for non-positive or invalid amounts', () => {
    expect(calculatePaymentCharge('GCash Cash-in', 0)).toBe(0)
    expect(calculatePaymentCharge('GCash Cash-in', -100)).toBe(0)
    expect(calculatePaymentCharge('Maya Cash-out', Number.NaN)).toBe(0)
    expect(calculatePaymentCharge('BPI Cash-in', Number.NEGATIVE_INFINITY)).toBe(0)
  })

  it('calculates 500 slab charges correctly for GCash and Maya cash-in and cash-out', () => {
    const types = ['GCash Cash-in', 'GCash Cash-out', 'Maya Cash-in', 'Maya Cash-out']

    types.forEach((type) => {
      expect(calculatePaymentCharge(type, 1)).toBe(5)
      expect(calculatePaymentCharge(type, 250)).toBe(5)
      expect(calculatePaymentCharge(type, 500)).toBe(5)
      expect(calculatePaymentCharge(type, 501)).toBe(10)
      expect(calculatePaymentCharge(type, 1000)).toBe(10)
      expect(calculatePaymentCharge(type, 1001)).toBe(15)
      expect(calculatePaymentCharge(type, 2500)).toBe(25)
    })
  })

  it('calculates 1000 slab charges correctly for bank transactions and other types', () => {
    const bankTypes = ['BPI Cash-in', 'BDO Cash-out', 'UnionBank Cash-in', 'GCash Load']

    bankTypes.forEach((type) => {
      expect(calculatePaymentCharge(type, 1)).toBe(5)
      expect(calculatePaymentCharge(type, 500)).toBe(5)
      expect(calculatePaymentCharge(type, 1000)).toBe(5)
      expect(calculatePaymentCharge(type, 1001)).toBe(10)
      expect(calculatePaymentCharge(type, 2000)).toBe(10)
      expect(calculatePaymentCharge(type, 2001)).toBe(15)
    })
  })
})
