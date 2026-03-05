import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RideStatusBadge } from '../RideStatusBadge'

describe('RideStatusBadge', () => {
  it('deve exibir label "Em andamento" para in_progress', () => {
    render(<RideStatusBadge status="in_progress" />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  it('deve exibir label "Buscando motorista" para searching_driver', () => {
    render(<RideStatusBadge status="searching_driver" />)
    expect(screen.getByText('Buscando motorista')).toBeInTheDocument()
  })

  it('deve exibir label "Concluída" para completed', () => {
    render(<RideStatusBadge status="completed" />)
    expect(screen.getByText('Concluída')).toBeInTheDocument()
  })

  it('deve exibir label "Cancelada" para cancelled', () => {
    render(<RideStatusBadge status="cancelled" />)
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
  })

  it('deve exibir label "Motorista atribuído" para driver_assigned', () => {
    render(<RideStatusBadge status="driver_assigned" />)
    expect(screen.getByText('Motorista atribuído')).toBeInTheDocument()
  })

  it('deve exibir label "Aguardando pagamento" para payment_pending', () => {
    render(<RideStatusBadge status="payment_pending" />)
    expect(screen.getByText('Aguardando pagamento')).toBeInTheDocument()
  })

  it('deve exibir label "Pago" para paid', () => {
    render(<RideStatusBadge status="paid" />)
    expect(screen.getByText('Pago')).toBeInTheDocument()
  })
})
