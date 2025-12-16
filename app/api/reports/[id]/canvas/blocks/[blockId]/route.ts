import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity, updateLastEdited, updateUserActivity } from '@/lib/activity'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const block = await prisma.canvasBlock.findUnique({
      where: { id: params.blockId },
      include: {
        childBlocks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }

    return NextResponse.json(block)
  } catch (error) {
    console.error('Error fetching canvas block:', error)
    return NextResponse.json(
      { error: 'Failed to fetch canvas block' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      content,
      parentBlockId,
      order,
      linkedResourceIds,
      aiPrompt,
    } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (parentBlockId !== undefined)
      updateData.parentBlockId = parentBlockId || null
    if (order !== undefined) updateData.order = order
    if (linkedResourceIds !== undefined)
      updateData.linkedResourceIds = linkedResourceIds
        ? JSON.stringify(linkedResourceIds)
        : null
    if (aiPrompt !== undefined) updateData.aiPrompt = aiPrompt

    const block = await prisma.canvasBlock.update({
      where: { id: params.blockId },
      data: updateData,
    })

    const userId = session.user?.id
    if (userId) {
      await Promise.all([
        logActivity(params.id, userId, 'section_edited', {
          action: 'block_updated',
          blockId: block.id,
        }),
        updateLastEdited(params.id, userId),
        updateUserActivity(userId),
      ])
    }

    return NextResponse.json(block)
  } catch (error) {
    console.error('Error updating canvas block:', error)
    return NextResponse.json(
      { error: 'Failed to update canvas block' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete block and all children (cascade)
    await prisma.canvasBlock.delete({
      where: { id: params.blockId },
    })

    const userId = session.user?.id
    if (userId) {
      await logActivity(params.id, userId, 'comment', {
        action: 'block_deleted',
        blockId: params.blockId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting canvas block:', error)
    return NextResponse.json(
      { error: 'Failed to delete canvas block' },
      { status: 500 }
    )
  }
}

