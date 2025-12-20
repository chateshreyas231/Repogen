import { useEffect, useCallback } from 'react'
import { hierarchy, tree } from 'd3-hierarchy'
import type { Node, Edge } from 'reactflow'

interface LayoutOptions {
  nodeWidth?: number
  nodeHeight?: number
  horizontalSpacing?: number
  verticalSpacing?: number
  direction?: 'vertical' | 'horizontal'
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  nodeWidth: 280,
  nodeHeight: 120,
  horizontalSpacing: 200,
  verticalSpacing: 140,
  direction: 'vertical',
}

export function useDynamicLayout(
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void,
  options: LayoutOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const applyLayout = useCallback(() => {
    // Filter out Start and End nodes for layout calculation
    const regularNodes = nodes.filter((n) => n.type !== 'start' && n.type !== 'end')
    const startNode = nodes.find((n) => n.type === 'start')
    const endNode = nodes.find((n) => n.type === 'end')

    if (regularNodes.length === 0) {
      // If no regular nodes, just position Start and End
      if (startNode && endNode) {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === startNode.id) {
              return { ...n, position: { x: 400, y: 0 } }
            }
            if (n.id === endNode.id) {
              return { ...n, position: { x: 400, y: 200 } }
            }
            return n
          })
        )
      }
      return
    }

    // Build hierarchy from edges
    const nodeMap = new Map(regularNodes.map((n) => [n.id, n]))
    const childrenMap = new Map<string, string[]>()
    const parentMap = new Map<string, string>()

    // Find root nodes (nodes with no incoming edges from regular nodes)
    const regularNodeIds = new Set(regularNodes.map((n) => n.id))
    const hasIncomingEdge = new Set<string>()

    edges.forEach((edge) => {
      if (regularNodeIds.has(edge.source) && regularNodeIds.has(edge.target)) {
        hasIncomingEdge.add(edge.target)
        if (!childrenMap.has(edge.source)) {
          childrenMap.set(edge.source, [])
        }
        childrenMap.get(edge.source)!.push(edge.target)
        parentMap.set(edge.target, edge.source)
      }
    })

    // If no hierarchical structure, create a simple sequential layout
    const rootNodes = regularNodes.filter((n) => !hasIncomingEdge.has(n.id))

    if (rootNodes.length === 0) {
      // Fallback: sequential layout based on order
      const centerX = 400
      let currentY = 150

      setNodes((nds) =>
        nds.map((n) => {
          if (n.type === 'start') {
            return { ...n, position: { x: centerX, y: 0 } }
          }
          if (n.type === 'end') {
            const endY = currentY + regularNodes.length * opts.verticalSpacing
            return { ...n, position: { x: centerX, y: endY } }
          }
          const nodeIndex = regularNodes.findIndex((rn) => rn.id === n.id)
          if (nodeIndex >= 0) {
            const y = currentY + nodeIndex * opts.verticalSpacing
            return {
              ...n,
              position: { x: centerX, y },
              style: {
                ...n.style,
                transition: 'all 0.3s ease-out',
              },
            }
          }
          return n
        })
      )
      return
    }

    // Build d3 hierarchy
    const buildHierarchy = (nodeId: string): any => {
      const node = nodeMap.get(nodeId)
      if (!node) return null

      const children = childrenMap.get(nodeId) || []
      return {
        id: nodeId,
        node,
        children: children.map(buildHierarchy).filter(Boolean),
      }
    }

    // For multiple roots, create a virtual root
    const rootData = rootNodes.length === 1
      ? buildHierarchy(rootNodes[0].id)
      : {
          id: 'virtual-root',
          children: rootNodes.map((n) => buildHierarchy(n.id)).filter(Boolean),
        }

    const root = hierarchy(rootData)

    // Apply tree layout
    const treeLayout = tree<Node>()
      .nodeSize([opts.nodeWidth + opts.horizontalSpacing, opts.nodeHeight + opts.verticalSpacing])
      .separation((a, b) => {
        // Sibling separation
        return a.parent === b.parent ? 1 : 1.2
      })

    treeLayout(root as any)

    // Calculate positions
    const positions = new Map<string, { x: number; y: number }>()

    const traverse = (node: any, offsetX: number = 0, offsetY: number = 0) => {
      if (node.data?.id && node.data.id !== 'virtual-root') {
        const x = opts.direction === 'vertical' ? offsetX + (node.x || 0) : offsetX + (node.y || 0)
        const y = opts.direction === 'vertical' ? offsetY + (node.y || 0) : offsetY + (node.x || 0)
        positions.set(node.data.id, { x, y })
      }

      if (node.children) {
        node.children.forEach((child: any) => traverse(child, offsetX, offsetY))
      }
    }

    // Center the layout
    const minX = Math.min(...Array.from(positions.values()).map((p) => p.x))
    const maxX = Math.max(...Array.from(positions.values()).map((p) => p.x))
    const centerX = 400
    const offsetX = centerX - (minX + maxX) / 2

    // Apply positions with smooth transitions
    setNodes((nds) =>
      nds.map((n) => {
        if (n.type === 'start') {
          return { ...n, position: { x: centerX, y: 0 } }
        }
        if (n.type === 'end') {
          const maxY = Math.max(...Array.from(positions.values()).map((p) => p.y), 0)
          return { ...n, position: { x: centerX, y: maxY + opts.verticalSpacing } }
        }
        const pos = positions.get(n.id)
        if (pos) {
          return {
            ...n,
            position: { x: pos.x + offsetX, y: pos.y + 150 },
            style: {
              ...n.style,
              transition: 'all 0.3s ease-out',
            },
          }
        }
        return n
      })
    )
  }, [nodes, edges, setNodes, opts])

  // Auto-apply layout when nodes or edges change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyLayout()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [nodes.length, edges.length, applyLayout])

  return { applyLayout }
}

