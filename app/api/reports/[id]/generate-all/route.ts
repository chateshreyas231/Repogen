import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSectionContent } from '@/lib/openai'

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
    const { sectionNodeIds } = body

    if (!Array.isArray(sectionNodeIds) || sectionNodeIds.length === 0) {
      return NextResponse.json(
        { error: 'sectionNodeIds array is required' },
        { status: 400 }
      )
    }

    // Get the report with all context
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: {
            resources: true,
          },
        },
        nodes: {
          where: { id: { in: sectionNodeIds } },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Get previous reports for context
    const previousReports = await prisma.report.findMany({
      where: {
        projectId: report.projectId,
        id: { not: params.id },
      },
      include: {
        nodes: {
          where: { type: 'section' },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    const previousReportContext = previousReports
      .map((prevReport) => {
        const sections = prevReport.nodes
          .map((node) => {
            const nodeData = JSON.parse(node.data || '{}')
            return `${nodeData.title || 'Section'}: ${nodeData.content || ''}`
          })
          .join('\n\n')
        return `Report: ${prevReport.title}\n${sections}`
      })
      .join('\n\n---\n\n')

    const projectResources = report.project.resources.map((r) => ({
      type: r.type,
      title: r.title,
      content: r.content,
    }))

    // Generate content for each section
    const updates = await Promise.all(
      report.nodes.map(async (node) => {
        const nodeData = JSON.parse(node.data || '{}')
        const sectionTitle = nodeData.title || 'Section'
        const customPrompt = nodeData.prompt

        // Use custom prompt if provided, otherwise use section title
        const promptText = customPrompt || `Generate content for the section: ${sectionTitle}`

        try {
          const generatedContent = await generateSectionContent(
            promptText,
            projectResources,
            sectionTitle,
            previousReportContext
          )

          nodeData.content = generatedContent
          nodeData.aiGenerated = true

          return prisma.reportNode.update({
            where: { id: node.id },
            data: {
              data: JSON.stringify(nodeData),
              aiGenerated: true,
            },
          })
        } catch (error) {
          console.error(`Error generating section ${node.id}:`, error)
          return null
        }
      })
    )

    const successful = updates.filter((u) => u !== null)

    return NextResponse.json({
      success: true,
      generated: successful.length,
      total: report.nodes.length,
    })
  } catch (error) {
    console.error('Error generating all sections:', error)
    return NextResponse.json(
      { error: 'Failed to generate sections' },
      { status: 500 }
    )
  }
}

