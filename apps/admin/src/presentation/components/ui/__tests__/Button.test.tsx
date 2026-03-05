import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

describe('Button', () => {
  it('deve renderizar o texto do filho', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeInTheDocument()
  })

  it('deve chamar onClick ao clicar', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Salvar</Button>)

    await userEvent.click(screen.getByText('Salvar'))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('deve estar desabilitado quando disabled=true', () => {
    render(<Button disabled>Salvar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('deve estar desabilitado quando loading=true', () => {
    render(<Button loading>Salvar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('deve mostrar spinner quando loading=true', () => {
    const { container } = render(<Button loading>Salvar</Button>)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('não deve chamar onClick quando desabilitado', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Salvar</Button>)

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).not.toHaveBeenCalled()
  })
})
