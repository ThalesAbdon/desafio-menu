import express from 'express'
import Menu from '../controllers/menu'
import validation from '../validation/menu'
import asyncHandler from '../middlewares/async-handler'

const routes = express.Router()

routes.post('/', validation.create, asyncHandler(Menu.create))
routes.delete('/:id', validation.objectId, asyncHandler(Menu.delete))
routes.get('/', asyncHandler(Menu.getAll))

export default routes