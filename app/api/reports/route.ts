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

    const reports = await prisma.report.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
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
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, title } = body

    if (!projectId || !title) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      )
    }

    // Create report with initial section nodes
    const initialSections = [
      { title: 'Executive Summary', color: '#3b82f6' },
      { title: 'Background', color: '#10b981' },
      { title: 'Key Findings', color: '#8b5cf6' },
      { title: 'Proposed Solutions', color: '#ec4899' },
      { title: 'Conclusion', color: '#f97316' },
    ]

    const report = await prisma.report.create({
      data: {
        projectId,
        title,
        nodes: {
          create: initialSections.map((section, index) => ({
            type: 'section',
            positionX: 250,
            positionY: index * 200 + 50,
            data: JSON.stringify({
              title: section.title,
              content: '',
              color: section.color,
              prompt: '',
            }),
            order: index,
            aiGenerated: false,
          })),
        },
      },
      include: {
        nodes: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}
