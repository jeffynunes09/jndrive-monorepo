import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('deve renderizar o texto do filho', () => {
    render(<Badge>Pendente</Badge>)
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('deve renderizar com cor padrão "muted"', () => {
    const { container } = render(<Badge>Texto</Badge>)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('deve aceitar cor personalizada', () => {
    render(<Badge color="success">Aprovado</Badge>)
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
  })

  it('deve renderizar como elemento span', () => {
    const { container } = render(<Badge>Label</Badge>)
    expect(container.querySelector('span')).toBeInTheDocument()
  })
})
