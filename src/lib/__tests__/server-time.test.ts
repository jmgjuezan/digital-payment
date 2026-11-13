import { describe, expect, it, vi } from 'vitest'
import { getServerTime, getTodayInPaymentTimeZone, getTimeInPaymentTimeZone, getYesterdayInPaymentTimeZone } from '@/lib/server-time'

describe('server time helpers', () => {
  it('reads the timestamp from the Supabase RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: '2026-11-09T16:30:00.000Z', error: null })

    await expect(getServerTime({ rpc } as never)).resolves.toEqual(new Date('2026-11-09T16:30:00.000Z'))
    expect(rpc).toHaveBeenCalledWith('get_server_time')
  })

  it('throws when the server time RPC fails or returns an invalid timestamp', async () => {
    const rpcFailure = vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC unavailable' } })
    const invalidTime = vi.fn().mockResolvedValue({ data: 'invalid', error: null })

    await expect(getServerTime({ rpc: rpcFailure } as never)).rejects.toThrow('Could not read server time from Supabase.')
    await expect(getServerTime({ rpc: invalidTime } as never)).rejects.toThrow('Could not read server time from Supabase.')
  })

  it('formats the server timestamp in Manila time', () => {
    const serverTime = new Date('2026-11-09T16:30:00.000Z')

    expect(getTodayInPaymentTimeZone(serverTime)).toBe('2026-11-10')
    expect(getTimeInPaymentTimeZone(serverTime)).toBe('00:30')
    expect(getYesterdayInPaymentTimeZone(serverTime)).toBe('2026-11-09')
  })
})
