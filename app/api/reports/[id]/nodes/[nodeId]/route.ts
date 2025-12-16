import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; nodeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, position, linkedResourceIds, order, aiGenerated, parentNodeId, collapsed, status, assignedTo, dueDate, metadata } = body

    const updateData: any = {}
    if (data !== undefined) updateData.data = JSON.stringify(data)
    if (position !== undefined) {
      updateData.positionX = position.x
      updateData.positionY = position.y
    }
    if (linkedResourceIds !== undefined)
      updateData.linkedResourceIds = JSON.stringify(linkedResourceIds)
    if (order !== undefined) updateData.order = order
    if (aiGenerated !== undefined) updateData.aiGenerated = aiGenerated
    if (parentNodeId !== undefined) updateData.parentNodeId = parentNodeId
    if (collapsed !== undefined) updateData.collapsed = collapsed
    if (status !== undefined) updateData.status = status
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata)

    const node = await prisma.reportNode.update({
      where: { id: params.nodeId },
      data: updateData,
    })

    return NextResponse.json(node)
  } catch (error) {
    console.error('Error updating node:', error)
    return NextResponse.json(
      { error: 'Failed to update node' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; nodeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.reportNode.delete({
      where: { id: params.nodeId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting node:', error)
    return NextResponse.json(
      { error: 'Failed to delete node' },
      { status: 500 }
    )
  }
}

