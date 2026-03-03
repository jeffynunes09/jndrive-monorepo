import { Request, Response } from 'express'
import { forwardGeocode, reverseGeocode } from '../../infrastructure/routes/geocoding.client'

export class GeocodeController {
  async forward(req: Request, res: Response): Promise<void> {
    const { address } = req.query
    if (!address || typeof address !== 'string') {
      res.status(400).json({ message: 'Parâmetro address é obrigatório' })
      return
    }

    const result = await forwardGeocode(address)
    if (!result) {
      res.status(404).json({ message: 'Endereço não encontrado' })
      return
    }

    res.json(result)
  }

  async reverse(req: Request, res: Response): Promise<void> {
    const { lat, lng } = req.query
    if (!lat || !lng) {
      res.status(400).json({ message: 'Parâmetros lat e lng são obrigatórios' })
      return
    }

    const address = await reverseGeocode(Number(lat), Number(lng))
    if (!address) {
      res.status(404).json({ message: 'Endereço não encontrado' })
      return
    }

    res.json({ address })
  }
}
