import mongoose from 'mongoose'
import Menu from '../models/menu'

interface MenuNode {
    id: string
    name: string
    submenus?: MenuNode[]
}

interface FlatMenuItem {
    _id: string | mongoose.Types.ObjectId
    name: string
    relatedId?: string | null
}

const buildChildrenMap = (items: FlatMenuItem[]) => {
    const childrenMap = new Map<string | null, FlatMenuItem[]>()

    for (const item of items) {
        const parentId = item.relatedId ?? null

        if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, [])
        }

        childrenMap.get(parentId)!.push(item)
    }

    return childrenMap
}

export const buildTree = (items: FlatMenuItem[]): MenuNode[] => {
    const childrenMap = buildChildrenMap(items)

    const build = (parentId: string | null): MenuNode[] =>
        (childrenMap.get(parentId) ?? []).map((item) => {
            const node: MenuNode = {
                id: item._id.toString(),
                name: item.name,
            }

            const children = build(item._id.toString())

            if (children.length) {
                node.submenus = children
            }

            return node
        })

    return build(null)
}

export const collectDescendantIds = (
    items: FlatMenuItem[],
    parentId: string,
): string[] => {
    const childrenMap = buildChildrenMap(items)

    const collect = (id: string): string[] =>
        (childrenMap.get(id) ?? []).flatMap((child) => {
            const childId = child._id.toString()
            return [childId, ...collect(childId)]
        })

    return collect(parentId)
}

export default {
    create: async (data: { name: string; relatedId?: string }) => {
        if (data.relatedId) {
            if (!mongoose.Types.ObjectId.isValid(data.relatedId))
                throw new Error('PARENT_NOT_FOUND')

            const parentExists = await Menu.exists({ _id: data.relatedId })
            if (!parentExists) throw new Error('PARENT_NOT_FOUND')
        }

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

        const items = await Menu.find().lean()
        const descendantIds = collectDescendantIds(items as FlatMenuItem[], id)

        await Menu.deleteMany({ _id: { $in: [id, ...descendantIds] } })

        return { id: menu._id }
    },

    getAll: async () => {
        const items = await Menu.find().lean()
        return buildTree(items as FlatMenuItem[])
    },
}