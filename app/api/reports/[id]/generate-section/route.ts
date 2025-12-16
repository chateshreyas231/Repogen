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
    const { sectionNodeId, prompt } = body

    if (!sectionNodeId) {
      return NextResponse.json(
        { error: 'sectionNodeId is required' },
        { status: 400 }
      )
    }

    // Get the section node and report
    const [sectionNode, report] = await Promise.all([
      prisma.reportNode.findUnique({ where: { id: sectionNodeId } }),
      prisma.report.findUnique({
        where: { id: params.id },
        include: {
          project: {
            include: {
              resources: true,
            },
          },
        },
      }),
    ])

    if (!sectionNode || !report) {
      return NextResponse.json(
        { error: 'Node or report not found' },
        { status: 404 }
      )
    }

    const sectionData = JSON.parse(sectionNode.data || '{}')
    const sectionTitle = sectionData.title || 'Section'

    // Get all project resources
    const projectResources = report.project.resources.map((r) => ({
      type: r.type,
      title: r.title,
      content: r.content,
    }))

    // Get previous reports from the same project for context
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
      take: 3, // Get last 3 reports for reference
    })

    // Build context from previous reports
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

    // Use custom prompt if provided, otherwise use section title
    const promptText = prompt || `Generate content for the section: ${sectionTitle}`

    // Generate content with context
    const generatedContent = await generateSectionContent(
      promptText,
      projectResources,
      sectionTitle,
      previousReportContext
    )

    // Update section node with generated content
    sectionData.content = generatedContent
    sectionData.aiGenerated = true

    const updatedNode = await prisma.reportNode.update({
      where: { id: sectionNodeId },
      data: {
        data: JSON.stringify(sectionData),
        aiGenerated: true,
      },
    })

    return NextResponse.json(updatedNode)
  } catch (error) {
    console.error('Error generating section:', error)
    return NextResponse.json(
      { error: 'Failed to generate section' },
      { status: 500 }
    )
  }
}

