import Menu from '../models/menu'

interface MenuNode {
    id: string
    name: string
    submenus?: MenuNode[]
}

const buildTree = (items: any[], parentId: string | null = null): MenuNode[] =>
    items
        .filter((item) => (item.relatedId ?? null) === parentId)
        .map((item) => {
            const node: MenuNode = { id: item._id.toString(), name: item.name }
            const children = buildTree(items, item._id.toString())
            if (children.length) node.submenus = children
            return node
        })

export default {
    create: async (data: { name: string; relatedId?: string }) => {
        try {
            const menu = await Menu.create(data)
            return { id: menu._id }
        } catch (err: any) {
            if (err.code === 11000) throw new Error('DUPLICATE_NAME')
            throw err
        }
    },
    delete: async (id: string) => {
        const menu = await Menu.findOne({ _id: id })
        if (!menu) return null

        await Menu.deleteOne({ _id: menu._id })
        return { id: menu._id }
    },
    getAll: async () => {
        const items = await Menu.find().lean()
        return buildTree(items)
    },
}