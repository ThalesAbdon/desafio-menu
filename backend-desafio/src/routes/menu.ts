import express from 'express'
import Menu from '../controllers/menu'
import validation from '../validation/menu'

const routes = express.Router()

routes.post('/', validation.create, Menu.create)
routes.delete('/:id', validation.objectId, Menu.delete)
routes.get('/', Menu.getAll)

export default routes