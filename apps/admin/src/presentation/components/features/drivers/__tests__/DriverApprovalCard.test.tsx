import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DriverApprovalCard } from '../DriverApprovalCard'
import { User } from '../../../../../domain/entities/User'

function makeDriver(isApproved = false) {
  return new User({
    id: 'd1',
    name: 'Carlos Motorista',
    email: 'carlos@test.com',
    role: 'driver',
    isActive: true,
    isApproved,
    licensePlate: 'ABC-1234',
    vehicleModel: 'Honda Civic',
    vehicleYear: 2022,
    vehicleColor: 'Preto',
    document: '123.456.789-00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

describe('DriverApprovalCard', () => {
  it('deve exibir nome e email do motorista', () => {
    render(<DriverApprovalCard driver={makeDriver()} onApprove={vi.fn()} />)
    expect(screen.getByText('Carlos Motorista')).toBeInTheDocument()
    expect(screen.getByText('carlos@test.com')).toBeInTheDocument()
  })

  it('deve exibir dados do veículo', () => {
    render(<DriverApprovalCard driver={makeDriver()} onApprove={vi.fn()} />)
    expect(screen.getByText(/ABC-1234/)).toBeInTheDocument()
    expect(screen.getByText(/Honda Civic/)).toBeInTheDocument()
  })

  it('deve exibir botão "Aprovar motorista" para motorista pendente', () => {
    render(<DriverApprovalCard driver={makeDriver(false)} onApprove={vi.fn()} />)
    expect(screen.getByText('Aprovar motorista')).toBeInTheDocument()
  })

  it('não deve exibir botão "Aprovar motorista" para motorista já aprovado', () => {
    render(<DriverApprovalCard driver={makeDriver(true)} onApprove={vi.fn()} />)
    expect(screen.queryByText('Aprovar motorista')).not.toBeInTheDocument()
  })

  it('deve chamar onApprove com o id ao clicar em aprovar', async () => {
    const onApprove = vi.fn()
    render(<DriverApprovalCard driver={makeDriver(false)} onApprove={onApprove} />)

    await userEvent.click(screen.getByText('Aprovar motorista'))

    expect(onApprove).toHaveBeenCalledWith('d1')
  })

  it('deve exibir badge "Pendente" para motorista não aprovado', () => {
    render(<DriverApprovalCard driver={makeDriver(false)} onApprove={vi.fn()} />)
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('deve exibir badge "Aprovado" para motorista aprovado', () => {
    render(<DriverApprovalCard driver={makeDriver(true)} onApprove={vi.fn()} />)
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
  })
})
