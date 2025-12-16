import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nodes = await prisma.reportNode.findMany({
      where: { reportId: params.id },
      orderBy: { order: 'asc' },
    })

    // Convert to React Flow format
    const flowNodes = nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: { x: node.positionX, y: node.positionY },
      data: {
        ...JSON.parse(node.data || '{}'),
        nodeType: node.type,
        linkedResourceIds: node.linkedResourceIds
          ? JSON.parse(node.linkedResourceIds)
          : [],
        collapsed: node.collapsed || false,
        status: node.status,
        assignedTo: node.assignedTo,
        dueDate: node.dueDate?.toISOString(),
        metadata: node.metadata ? JSON.parse(node.metadata) : undefined,
      },
      parentNode: node.parentNodeId,
      order: node.order,
    }))

    // Build edges from parent-child relationships and order
    // Create vertical flow edges based on order
    const sortedNodes = [...nodes].sort((a, b) => a.order - b.order)
    const edges: any[] = []
    
    // Create edges between consecutive nodes (top to bottom flow)
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const current = sortedNodes[i]
      const next = sortedNodes[i + 1]
      
      // Only create edge if they're at similar x position (same column)
      if (Math.abs(current.positionX - next.positionX) < 100) {
        edges.push({
          id: `e-${current.id}-${next.id}`,
          source: current.id,
          target: next.id,
          type: 'smoothstep',
        })
      }
    }
    
    // Also add parent-child edges
    nodes
      .filter((node) => node.parentNodeId)
      .forEach((node) => {
        if (!edges.find((e) => e.id === `e-${node.parentNodeId}-${node.id}`)) {
          edges.push({
            id: `e-${node.parentNodeId}-${node.id}`,
            source: node.parentNodeId!,
            target: node.id,
            type: 'smoothstep',
          })
        }
      })

    return NextResponse.json({ nodes: flowNodes, edges })
  } catch (error) {
    console.error('Error fetching nodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nodes' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, position, data, parentNodeId } = body

    if (!type || !position) {
      return NextResponse.json(
        { error: 'Type and position are required' },
        { status: 400 }
      )
    }

    // Get max order
    const maxOrder = await prisma.reportNode.findFirst({
      where: { reportId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const node = await prisma.reportNode.create({
      data: {
        reportId: params.id,
        type,
        positionX: position.x,
        positionY: position.y,
        data: JSON.stringify(data || {}),
        parentNodeId: parentNodeId || null,
        order: (maxOrder?.order || 0) + 1,
        aiGenerated: false,
      },
    })

    return NextResponse.json(node, { status: 201 })
  } catch (error) {
    console.error('Error creating node:', error)
    return NextResponse.json(
      { error: 'Failed to create node' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { nodes, edges } = body

    if (!Array.isArray(nodes)) {
      return NextResponse.json(
        { error: 'Nodes must be an array' },
        { status: 400 }
      )
    }

    // Update all nodes
    await Promise.all(
      nodes.map((node: any) =>
        prisma.reportNode.update({
          where: { id: node.id },
          data: {
            positionX: node.position.x,
            positionY: node.position.y,
            data: JSON.stringify(node.data || {}),
            parentNodeId: edges
              ? edges.find((e: any) => e.target === node.id)?.source || null
              : undefined,
          },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating nodes:', error)
    return NextResponse.json(
      { error: 'Failed to update nodes' },
      { status: 500 }
    )
  }
}

