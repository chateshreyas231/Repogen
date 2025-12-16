import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { sections } = body // Array of { id, order, content?, title? }

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Sections must be an array' },
        { status: 400 }
      )
    }

    // Update all sections
    await Promise.all(
      sections.map((section: { id: string; order: number; content?: string; title?: string }) =>
        prisma.reportSection.update({
          where: { id: section.id },
          data: {
            order: section.order,
            ...(section.content !== undefined && { content: section.content }),
            ...(section.title !== undefined && { title: section.title }),
          },
        })
      )
    )

    const updatedReport = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('Error updating sections:', error)
    return NextResponse.json(
      { error: 'Failed to update sections' },
      { status: 500 }
    )
  }
}

