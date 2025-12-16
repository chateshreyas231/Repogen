import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateLastEdited, updateUserActivity } from '@/lib/activity'

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
    const { updates } = body // Array of { id, order, parentBlockId }

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      )
    }

    // Update all blocks
    await Promise.all(
      updates.map((update: { id: string; order: number; parentBlockId?: string | null }) =>
        prisma.canvasBlock.update({
          where: { id: update.id },
          data: {
            order: update.order,
            parentBlockId: update.parentBlockId !== undefined ? update.parentBlockId : undefined,
          },
        })
      )
    )

    const userId = session.user?.id
    if (userId) {
      await Promise.all([
        updateLastEdited(params.id, userId),
        updateUserActivity(userId),
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering blocks:', error)
    return NextResponse.json(
      { error: 'Failed to reorder blocks' },
      { status: 500 }
    )
  }
}

