import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SetBalanceForm from '@/components/balances/SetBalanceForm'

vi.mock('@/app/balances/new/actions', () => ({
  saveBalance: vi.fn(),
}))

describe('SetBalanceForm Component', () => {
  it('renders all required form fields', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    expect(screen.getByLabelText(/balance type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/device/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    // Date is readonly display
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
  })

  it('opens type dropdown and shows GCash and Maya options on focus', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const typeInput = screen.getByLabelText(/balance type/i)
    fireEvent.focus(typeInput)

    expect(screen.getByRole('option', { name: 'GCash' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Maya' })).toBeInTheDocument()
  })

  it('selects a balance type when clicking a dropdown option', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const typeInput = screen.getByLabelText(/balance type/i) as HTMLInputElement
    fireEvent.focus(typeInput)
    fireEvent.click(screen.getByRole('option', { name: 'GCash' }))

    expect(typeInput.value).toBe('GCash')
    // Dropdown should close after selection
    expect(screen.queryByRole('option', { name: 'GCash' })).not.toBeInTheDocument()
  })

  it('filters balance type options based on typed query', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const typeInput = screen.getByLabelText(/balance type/i)
    fireEvent.focus(typeInput)
    fireEvent.change(typeInput, { target: { value: 'May' } })

    expect(screen.getByRole('option', { name: 'Maya' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'GCash' })).not.toBeInTheDocument()
  })

  it('shows no-match message when type filter has no results', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const typeInput = screen.getByLabelText(/balance type/i)
    fireEvent.focus(typeInput)
    fireEvent.change(typeInput, { target: { value: 'VISA' } })

    expect(screen.getByText(/no matching balance types/i)).toBeInTheDocument()
  })

  it('navigates type dropdown with ArrowDown key', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const typeInput = screen.getByLabelText(/balance type/i)
    fireEvent.focus(typeInput)
    fireEvent.keyDown(typeInput, { key: 'ArrowDown' })

    const firstOption = screen.getByRole('option', { name: 'GCash' })
    expect(firstOption.className).toContain('is-active')
  })

  it('navigates type dropdown with ArrowUp key', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const typeInput = screen.getByLabelText(/balance type/i)
    fireEvent.focus(typeInput)
    // ArrowUp from -1 wraps to last
    fireEvent.keyDown(typeInput, { key: 'ArrowUp' })

    const mayaOption = screen.getByRole('option', { name: 'Maya' })
    expect(mayaOption.className).toContain('is-active')
  })

  it('selects active option with Enter key', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const typeInput = screen.getByLabelText(/balance type/i) as HTMLInputElement
    fireEvent.focus(typeInput)
    fireEvent.keyDown(typeInput, { key: 'ArrowDown' })
    fireEvent.keyDown(typeInput, { key: 'Enter' })

    expect(typeInput.value).toBe('GCash')
  })

  it('closes type dropdown with Escape key', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const typeInput = screen.getByLabelText(/balance type/i)
    fireEvent.focus(typeInput)
    expect(screen.getByRole('option', { name: 'GCash' })).toBeInTheDocument()

    fireEvent.keyDown(typeInput, { key: 'Escape' })
    expect(screen.queryByRole('option', { name: 'GCash' })).not.toBeInTheDocument()
  })

  it('opens device dropdown and shows device options on focus', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const deviceInput = screen.getByLabelText(/device/i)
    fireEvent.focus(deviceInput)

    expect(screen.getByRole('option', { name: 'CP1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'CP8' })).toBeInTheDocument()
  })

  it('selects a device when clicking a dropdown option', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const deviceInput = screen.getByLabelText(/device/i) as HTMLInputElement
    fireEvent.focus(deviceInput)
    fireEvent.click(screen.getByRole('option', { name: 'CP3' }))

    expect(deviceInput.value).toBe('CP3')
  })

  it('filters device options based on typed query', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const deviceInput = screen.getByLabelText(/device/i)
    fireEvent.focus(deviceInput)
    fireEvent.change(deviceInput, { target: { value: 'CP1' } })

    expect(screen.getByRole('option', { name: 'CP1' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'CP2' })).not.toBeInTheDocument()
  })

  it('shows no-match message when device filter has no results', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const deviceInput = screen.getByLabelText(/device/i)
    fireEvent.focus(deviceInput)
    fireEvent.change(deviceInput, { target: { value: 'TABLET' } })

    expect(screen.getByText(/no matching devices/i)).toBeInTheDocument()
  })

  it('navigates device dropdown with ArrowDown key', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const deviceInput = screen.getByLabelText(/device/i)
    fireEvent.focus(deviceInput)
    fireEvent.keyDown(deviceInput, { key: 'ArrowDown' })

    const cp1Option = screen.getByRole('option', { name: 'CP1' })
    expect(cp1Option.className).toContain('is-active')
  })

  it('closes device dropdown with Escape key', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const deviceInput = screen.getByLabelText(/device/i)
    fireEvent.focus(deviceInput)
    expect(screen.getByRole('option', { name: 'CP1' })).toBeInTheDocument()

    fireEvent.keyDown(deviceInput, { key: 'Escape' })
    expect(screen.queryByRole('option', { name: 'CP1' })).not.toBeInTheDocument()
  })

  it('selects device with Enter key when active', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const deviceInput = screen.getByLabelText(/device/i) as HTMLInputElement
    fireEvent.focus(deviceInput)
    fireEvent.keyDown(deviceInput, { key: 'ArrowDown' }) // CP1 active
    fireEvent.keyDown(deviceInput, { key: 'Enter' })

    expect(deviceInput.value).toBe('CP1')
  })

  it('navigates device dropdown with ArrowUp wrapping to last option', () => {
    render(<SetBalanceForm onActionChange={vi.fn()} />)

    const deviceInput = screen.getByLabelText(/device/i)
    fireEvent.focus(deviceInput)
    fireEvent.keyDown(deviceInput, { key: 'ArrowUp' })

    const cp8Option = screen.getByRole('option', { name: 'CP8' })
    expect(cp8Option.className).toContain('is-active')
  })

  it('calls onActionChange with the submit function and pending state', () => {
    const onActionChange = vi.fn()
    render(<SetBalanceForm onActionChange={onActionChange} />)

    // Called on mount via useEffect
    expect(onActionChange).toHaveBeenCalled()
    const [submitFn, pendingArg] = onActionChange.mock.calls[0]
    expect(typeof submitFn).toBe('function')
    expect(pendingArg).toBe(false)
  })
})
