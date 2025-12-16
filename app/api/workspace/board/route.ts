import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')

    const reports = await prisma.report.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { project: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { nodes: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedReports = reports.map((report) => ({
      id: report.id,
      title: report.title,
      projectName: report.project.name,
      projectId: report.project.id,
      nodeCount: report._count.nodes,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }))

    return NextResponse.json(formattedReports)
  } catch (error) {
    console.error('Error fetching workspace board:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspace board' },
      { status: 500 }
    )
  }
}
