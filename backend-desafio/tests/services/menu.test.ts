import { buildTree, collectDescendantIds } from '../../src/services/menu'

describe('buildTree', () => {
    it('returns an empty array when there are no items', () => {
        expect(buildTree([])).toEqual([])
    })

    it('treats items without relatedId as top-level nodes', () => {
        const items = [
            { _id: '1', name: 'Eletrodomésticos' },
            { _id: '7', name: 'Informática' },
        ]

        expect(buildTree(items)).toEqual([
            { id: '1', name: 'Eletrodomésticos' },
            { id: '7', name: 'Informática' },
        ])
    })

    it('nests children under their parent using relatedId', () => {
        const items = [
            { _id: '1', name: 'Eletrodomésticos' },
            { _id: '2', name: 'Televisores', relatedId: '1' },
            { _id: '3', name: 'LCD', relatedId: '2' },
        ]

        expect(buildTree(items)).toEqual([
            {
                id: '1',
                name: 'Eletrodomésticos',
                submenus: [
                    {
                        id: '2',
                        name: 'Televisores',
                        submenus: [{ id: '3', name: 'LCD' }],
                    },
                ],
            },
        ])
    })

    it('supports arbitrarily deep nesting', () => {
        const items = [
            { _id: '1', name: 'A' },
            { _id: '2', name: 'B', relatedId: '1' },
            { _id: '3', name: 'C', relatedId: '2' },
            { _id: '4', name: 'D', relatedId: '3' },
            { _id: '5', name: 'E', relatedId: '4' },
        ]

        const tree = buildTree(items)

        const depth = (nodes: any[]): number =>
            nodes.length
                ? 1 + Math.max(...nodes.map((n) => depth(n.submenus || [])))
                : 0

        expect(depth(tree)).toBe(5)
    })

    it('keeps siblings independent of each other', () => {
        const items = [
            { _id: '1', name: 'Eletrodomésticos' },
            { _id: '2', name: 'Televisores', relatedId: '1' },
            { _id: '6', name: 'Plasma', relatedId: '2' },
            { _id: '3', name: 'LCD', relatedId: '2' },
            { _id: '4', name: '110', relatedId: '3' },
        ]

        const tree = buildTree(items)
        const televisores = tree[0].submenus?.[0]

        expect(televisores?.submenus).toEqual([
            { id: '6', name: 'Plasma' },
            { id: '3', name: 'LCD', submenus: [{ id: '4', name: '110' }] },
        ])
    })
})

describe('collectDescendantIds', () => {
    it('returns an empty array when the item has no children', () => {
        const items = [{ _id: '1', name: 'Eletrodomésticos' }]

        expect(collectDescendantIds(items, '1')).toEqual([])
    })

    it('collects direct and nested descendant ids', () => {
        const items = [
            { _id: '1', name: 'Eletrodomésticos' },
            { _id: '2', name: 'Televisores', relatedId: '1' },
            { _id: '3', name: 'LCD', relatedId: '2' },
            { _id: '4', name: '110', relatedId: '3' },
            { _id: '5', name: '220', relatedId: '3' },
            { _id: '6', name: 'Plasma', relatedId: '2' },
        ]

        expect(collectDescendantIds(items, '1').sort()).toEqual(
            ['2', '3', '4', '5', '6'].sort(),
        )
    })

    it('does not include siblings or unrelated items', () => {
        const items = [
            { _id: '1', name: 'A' },
            { _id: '2', name: 'B', relatedId: '1' },
            { _id: '7', name: 'Unrelated' },
        ]

        expect(collectDescendantIds(items, '1')).toEqual(['2'])
    })
})