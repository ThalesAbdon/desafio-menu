import { model, Schema } from 'mongoose'

interface IMenu {
    _id?: string
    name: string
    relatedId?: string
}

const schema = new Schema<IMenu>({
    name: { type: String, required: true, unique: true },
    relatedId: { type: String, index: true },
})

export default model<IMenu>('menu', schema, 'menus')