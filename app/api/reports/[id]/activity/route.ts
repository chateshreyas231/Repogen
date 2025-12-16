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

    const activities = await prisma.reportActivity.findMany({
      where: { reportId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 activities
    })

    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      details: activity.details ? JSON.parse(activity.details) : null,
      user: activity.user
        ? {
            id: activity.user.id,
            name: activity.user.name || activity.user.email,
          }
        : null,
      createdAt: activity.createdAt,
    }))

    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

