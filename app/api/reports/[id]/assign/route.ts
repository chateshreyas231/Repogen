import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      )
    }

    const assignment = await prisma.reportAssignment.upsert({
      where: {
        reportId_userId: {
          reportId: params.id,
          userId,
        },
      },
      update: {
        role,
      },
      create: {
        reportId: params.id,
        userId,
        role,
      },
    })

    // Create activity log
    await prisma.reportActivity.create({
      data: {
        reportId: params.id,
        userId: session.user?.id,
        type: 'comment',
        details: JSON.stringify({
          action: 'user_assigned',
          assignedUserId: userId,
          role,
        }),
      },
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error assigning user to report:', error)
    return NextResponse.json(
      { error: 'Failed to assign user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    await prisma.reportAssignment.delete({
      where: {
        reportId_userId: {
          reportId: params.id,
          userId,
        },
      },
    })

    // Create activity log
    await prisma.reportActivity.create({
      data: {
        reportId: params.id,
        userId: session.user?.id,
        type: 'comment',
        details: JSON.stringify({
          action: 'user_unassigned',
          unassignedUserId: userId,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unassigning user from report:', error)
    return NextResponse.json(
      { error: 'Failed to unassign user' },
      { status: 500 }
    )
  }
}

