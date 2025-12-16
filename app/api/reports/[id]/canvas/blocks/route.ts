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

    const blocks = await prisma.canvasBlock.findMany({
      where: { reportId: params.id },
      orderBy: [{ order: 'asc' }],
      include: {
        childBlocks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // Build tree structure
    const buildTree = (parentId: string | null) => {
      return blocks
        .filter((block) => block.parentBlockId === parentId)
        .map((block) => ({
          ...block,
          children: buildTree(block.id),
        }))
    }

    const tree = buildTree(null)

    return NextResponse.json({ blocks, tree })
  } catch (error) {
    console.error('Error fetching canvas blocks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch canvas blocks' },
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
    const {
      type,
      title,
      content,
      parentBlockId,
      order,
      linkedResourceIds,
    } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    // Get max order for positioning
    const maxOrder = await prisma.canvasBlock.findFirst({
      where: {
        reportId: params.id,
        parentBlockId: parentBlockId || null,
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const newOrder = order !== undefined ? order : (maxOrder?.order || 0) + 1

    const block = await prisma.canvasBlock.create({
      data: {
        reportId: params.id,
        type,
        title: title || null,
        content: content || '',
        parentBlockId: parentBlockId || null,
        order: newOrder,
        linkedResourceIds: linkedResourceIds
          ? JSON.stringify(linkedResourceIds)
          : null,
      },
    })

    // Log activity
    const { logActivity, updateLastEdited, updateUserActivity } = await import(
      '@/lib/activity'
    )
    const userId = session.user?.id
    if (userId) {
      await Promise.all([
        logActivity(params.id, userId, 'comment', {
          action: 'block_created',
          blockId: block.id,
          blockType: block.type,
        }),
        updateLastEdited(params.id, userId),
        updateUserActivity(userId),
      ])
    }

    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    console.error('Error creating canvas block:', error)
    return NextResponse.json(
      { error: 'Failed to create canvas block' },
      { status: 500 }
    )
  }
}

