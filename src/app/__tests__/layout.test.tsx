import { describe, expect, it, vi } from 'vitest'
import RootLayout from '@/app/layout'

vi.mock('next/font/google', () => ({ Outfit: () => ({ variable: 'font-outfit' }) }))

describe('RootLayout', () => {
  it('wraps page content in the application document', () => {
    const layout = RootLayout({ children: <p>Page content</p> })

    expect(layout.type).toBe('html')
    expect(layout.props.lang).toBe('en')
    expect(layout.props.className).toBe('font-outfit')
    expect(layout.props.children.props.children).toEqual(<p>Page content</p>)
  })
})
