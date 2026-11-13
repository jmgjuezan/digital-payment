import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NewTransactionForm from '@/components/transactions/NewTransactionForm'

vi.mock('@/app/transactions/new/actions', () => ({
  createPayment: vi.fn(),
}))

vi.mock('@/app/actions/server-time', () => ({
  getCurrentServerTime: vi.fn().mockResolvedValue('2026-11-09T16:47:00.000Z'),
}))

/** Helper: select a device so the payment type combobox becomes enabled. */
function selectDevice(deviceName: string) {
  const deviceInput = screen.getByRole('combobox', { name: /device/i })
  fireEvent.focus(deviceInput)
  fireEvent.click(screen.getByRole('option', { name: deviceName }))
}

describe('NewTransactionForm — extended coverage', () => {
  describe('payment type combobox', () => {
    it('is disabled and shows a hint until a device is selected', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      const typeInput = screen.getByRole('combobox', { name: /payment type/i }) as HTMLInputElement
      expect(typeInput).toBeDisabled()
      expect(typeInput.placeholder).toBe('Select a device first')
    })

    it('becomes enabled after a device is selected', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i }) as HTMLInputElement
      expect(typeInput).not.toBeDisabled()
      expect(typeInput.placeholder).toBe('Search payment type')
    })

    it('opens type dropdown on focus and shows options', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)

      expect(screen.getByRole('option', { name: 'GCash Cash-in' })).toBeInTheDocument()
    })

    it('filters type options when user types', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)
      fireEvent.change(typeInput, { target: { value: 'Maya' } })

      expect(screen.getByRole('option', { name: 'Maya Cash-out' })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'GCash Cash-in' })).not.toBeInTheDocument()
    })

    it('shows no-match message when filter yields no results', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)
      fireEvent.change(typeInput, { target: { value: 'VISA' } })

      expect(screen.getByText(/no matching payment types/i)).toBeInTheDocument()
    })

    it('navigates type dropdown with ArrowDown key', () => {
      const { container } = render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)
      fireEvent.keyDown(typeInput, { key: 'ArrowDown' })

      // After first ArrowDown activeIndex = 0 → first option gets is-active class
      const firstOption = container.querySelector('#payment-type-option-0')
      expect(firstOption?.className).toContain('is-active')
    })

    it('navigates type dropdown with ArrowUp wrapping to last option', () => {
      const { container } = render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)
      fireEvent.keyDown(typeInput, { key: 'ArrowUp' })

      // ArrowUp from -1 wraps to last option; find by is-active class
      const activeOption = container.querySelector('.payment-type-option.is-active')
      expect(activeOption).not.toBeNull()
    })

    it('selects active type option with Enter key', () => {
      const { container } = render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i }) as HTMLInputElement
      fireEvent.focus(typeInput)
      fireEvent.keyDown(typeInput, { key: 'ArrowDown' }) // activeIndex = 0 → first option
      fireEvent.keyDown(typeInput, { key: 'Enter' })

      // Index 0 in paymentTypeOptions is AllBank Cash-out
      const hiddenInput = container.querySelector('input[name="type"]') as HTMLInputElement
      expect(hiddenInput?.value).toBe('AllBank Cash-out')
    })

    it('closes type dropdown with Escape key', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)

      fireEvent.keyDown(typeInput, { key: 'Escape' })
      expect(screen.queryByRole('option', { name: 'GCash Cash-in' })).not.toBeInTheDocument()
    })

    it('shows selection error when submitting without choosing a device', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      const form = document.getElementById('new-transaction-form') as HTMLFormElement
      fireEvent.submit(form)

      expect(screen.getByRole('alert', { name: '' })).toBeInTheDocument()
      expect(screen.getByText(/select a device from the list/i)).toBeInTheDocument()
    })

    it('clears charge when a Load payment type is selected', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      // Select a regular type first, enter an amount
      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)
      fireEvent.click(screen.getByRole('option', { name: 'GCash Cash-in' }))

      const amountInput = screen.getByLabelText(/amount/i)
      fireEvent.change(amountInput, { target: { value: '500' } })

      // Now switch to a Load type
      fireEvent.focus(typeInput)
      fireEvent.change(typeInput, { target: { value: 'GCash Load' } })
      fireEvent.click(screen.getByRole('option', { name: 'GCash Load' }))

      const chargeInput = screen.getByRole('spinbutton', { name: /charge/i }) as HTMLInputElement
      expect(chargeInput.value).toBe('')
    })
  })

  describe('device combobox', () => {
    it('opens device dropdown on focus', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      const deviceInput = screen.getByRole('combobox', { name: /device/i })
      fireEvent.focus(deviceInput)

      expect(screen.getByRole('option', { name: 'CP1' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'ME' })).toBeInTheDocument()
    })

    it('filters device options when user types', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      const deviceInput = screen.getByRole('combobox', { name: /device/i })
      fireEvent.focus(deviceInput)
      fireEvent.change(deviceInput, { target: { value: 'CP5' } })

      expect(screen.getByRole('option', { name: 'CP5' })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'CP1' })).not.toBeInTheDocument()
    })

    it('shows no-match message when device filter has no results', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      const deviceInput = screen.getByRole('combobox', { name: /device/i })
      fireEvent.focus(deviceInput)
      fireEvent.change(deviceInput, { target: { value: 'TABLET' } })

      expect(screen.getByText(/no matching devices/i)).toBeInTheDocument()
    })

    it('selects device with Enter key when active', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      const deviceInput = screen.getByRole('combobox', { name: /device/i }) as HTMLInputElement
      fireEvent.focus(deviceInput)
      fireEvent.keyDown(deviceInput, { key: 'ArrowDown' })
      fireEvent.keyDown(deviceInput, { key: 'Enter' })

      expect(deviceInput.value).toBe('CP1')
    })

    it('closes device dropdown with Escape key', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      const deviceInput = screen.getByRole('combobox', { name: /device/i })
      fireEvent.focus(deviceInput)
      expect(screen.getByRole('option', { name: 'CP1' })).toBeInTheDocument()

      fireEvent.keyDown(deviceInput, { key: 'Escape' })
      expect(screen.queryByRole('option', { name: 'CP1' })).not.toBeInTheDocument()
    })

    it('navigates device list with ArrowUp wrapping to last option', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      const deviceInput = screen.getByRole('combobox', { name: /device/i })
      fireEvent.focus(deviceInput)
      fireEvent.keyDown(deviceInput, { key: 'ArrowUp' })

      // last device is ME
      const meOption = screen.getByRole('option', { name: 'ME' })
      expect(meOption.className).toContain('is-active')
    })

    it('shows payment type selection error when submitting with device but no type', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first
      const deviceInput = screen.getByRole('combobox', { name: /device/i })
      fireEvent.focus(deviceInput)
      fireEvent.click(screen.getByRole('option', { name: 'CP1' }))

      const form = document.getElementById('new-transaction-form') as HTMLFormElement
      fireEvent.submit(form)

      expect(screen.getByText(/select a payment type from the list/i)).toBeInTheDocument()
    })

    it('shows only GCash options when a standard CP device is selected', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      selectDevice('CP1')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)

      expect(screen.getByRole('option', { name: 'GCash Cash-in' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'GCash Cash-out' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'GCash Load' })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'Maya Cash-in' })).not.toBeInTheDocument()
    })

    it('shows GCash and Maya options when CP2 is selected', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      selectDevice('CP2')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)

      expect(screen.getByRole('option', { name: 'GCash Cash-in' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Maya Cash-in' })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'Maribank Cash-in' })).not.toBeInTheDocument()
    })

    it('shows GCash and Maribank options when CP4 is selected', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      selectDevice('CP4')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)

      expect(screen.getByRole('option', { name: 'GCash Cash-in' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Maribank Cash-in' })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'Maya Cash-in' })).not.toBeInTheDocument()
    })

    it('shows all payment options when ME is selected', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)

      expect(screen.getByRole('option', { name: 'GCash Cash-in' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Maya Cash-in' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Maribank Cash-in' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'BDO Cash-in' })).toBeInTheDocument()
    })

    it('clears payment type when switching to a device that does not support it', () => {
      const { container } = render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select ME and pick Maya Cash-in
      selectDevice('ME')
      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)
      fireEvent.click(screen.getByRole('option', { name: 'Maya Cash-in' }))

      // Switch to CP1 which only supports GCash
      // Clear the device query so all devices are visible in the dropdown
      const deviceInput = screen.getByRole('combobox', { name: /device/i })
      fireEvent.change(deviceInput, { target: { value: '' } })
      fireEvent.focus(deviceInput)
      fireEvent.click(screen.getByRole('option', { name: 'CP1' }))

      const hiddenInput = container.querySelector('input[name="type"]') as HTMLInputElement
      expect(hiddenInput?.value).toBe('')
    })
  })

  describe('amount field', () => {
    it('prevents negative sign key from being entered', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      const amountInput = screen.getByLabelText(/^amount/i)
      const event = fireEvent.keyDown(amountInput, { key: '-' })

      // keyDown with preventDefault called — event should be preventable
      expect(event).toBe(false) // fireEvent returns false when default was prevented
    })

    it('clears charge when amount is cleared', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)
      fireEvent.click(screen.getByRole('option', { name: 'GCash Cash-in' }))

      const amountInput = screen.getByLabelText(/^amount/i)
      fireEvent.change(amountInput, { target: { value: '1000' } })

      const chargeInput = screen.getByRole('spinbutton', { name: /charge/i }) as HTMLInputElement
      expect(chargeInput.value).toBe('10.00')

      // Clear amount
      fireEvent.change(amountInput, { target: { value: '' } })
      expect(chargeInput.value).toBe('')
    })
  })

  describe('transaction ID field', () => {
    it('marks transaction ID as required when type is not a Load type', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)
      fireEvent.click(screen.getByRole('option', { name: 'GCash Cash-in' }))

      const tranIdInput = screen.getByLabelText(/transaction id/i) as HTMLInputElement
      expect(tranIdInput.required).toBe(true)
    })

    it('marks transaction ID as optional for Load type', () => {
      render(<NewTransactionForm initialServerTime='2026-11-09T16:47:00.000Z' />)

      // Select a device first to unlock payment type options
      selectDevice('ME')

      const typeInput = screen.getByRole('combobox', { name: /payment type/i })
      fireEvent.focus(typeInput)
      fireEvent.click(screen.getByRole('option', { name: 'GCash Load' }))

      const tranIdInput = screen.getByLabelText(/transaction id/i) as HTMLInputElement
      expect(tranIdInput.required).toBe(false)
    })
  })
})
