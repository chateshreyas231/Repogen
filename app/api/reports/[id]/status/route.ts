import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_STATUSES = [
  'backlog',
  'drafting',
  'in_review',
  'ready_for_export',
  'delivered',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current report to track status change
    const currentReport = await prisma.report.findUnique({
      where: { id: params.id },
      select: { status: true },
    })

    if (!currentReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const previousStatus = currentReport.status

    // Update report status
    const report = await prisma.report.update({
      where: { id: params.id },
      data: {
        status,
        lastEditedByUserId: session.user?.id,
        lastEditedAt: new Date(),
      },
    })

    // Create activity log for status change
    if (previousStatus !== status) {
      await prisma.reportActivity.create({
        data: {
          reportId: params.id,
          userId: session.user?.id,
          type: 'status_change',
          details: JSON.stringify({
            from: previousStatus,
            to: status,
          }),
        },
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error updating report status:', error)
    return NextResponse.json(
      { error: 'Failed to update report status' },
      { status: 500 }
    )
  }
}

