import { Request, Response } from 'express'
import MenuService from '../services/menu'

export default {
    create: async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = await MenuService.create(req.body)
            return res.status(201).json({ id })
        } catch (err: any) {
            if (err.message === 'DUPLICATE_NAME')
                return res.status(400).json({ message: 'Name must be unique' })
            if (err.message === 'PARENT_NOT_FOUND')
                return res
                    .status(400)
                    .json({ message: 'relatedId does not reference an existing item' })
            throw err
        }
    },
    delete: async (req: Request, res: Response): Promise<Response> => {
        const result = await MenuService.delete(req.params.id)
        if (!result) return res.status(400).json({ message: 'Item not found' })

        return res.status(200).json({ id: result.id })
    },
    getAll: async (_: Request, res: Response): Promise<Response> => {
        const tree = await MenuService.getAll()
        return res.status(200).json(tree)
    },
}