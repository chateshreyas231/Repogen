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
    const { promptNodeId, targetNodeId, prompt, resourceIds } = body

    if (!promptNodeId || !targetNodeId || !prompt) {
      return NextResponse.json(
        { error: 'promptNodeId, targetNodeId, and prompt are required' },
        { status: 400 }
      )
    }

    // Get the prompt node and target node
    const [promptNode, targetNode, report] = await Promise.all([
      prisma.reportNode.findUnique({ where: { id: promptNodeId } }),
      prisma.reportNode.findUnique({ where: { id: targetNodeId } }),
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

    if (!promptNode || !targetNode || !report) {
      return NextResponse.json(
        { error: 'Node or report not found' },
        { status: 404 }
      )
    }

    // Get parent section context
    let parentSectionTitle = ''
    if (targetNode.parentNodeId) {
      const parent = await prisma.reportNode.findUnique({
        where: { id: targetNode.parentNodeId },
      })
      if (parent) {
        const parentData = JSON.parse(parent.data || '{}')
        parentSectionTitle = parentData.title || ''
      }
    }

    // Filter resources
    let resourcesToUse = report.project.resources
    if (resourceIds && resourceIds.length > 0) {
      resourcesToUse = resourcesToUse.filter((r) =>
        resourceIds.includes(r.id)
      )
    }

    const projectResources = resourcesToUse.map((r) => ({
      type: r.type,
      title: r.title,
      content: r.content,
    }))

    // Generate content
    const generatedContent = await generateSectionContent(
      prompt,
      projectResources,
      parentSectionTitle
    )

    // Update target node with generated content
    const targetData = JSON.parse(targetNode.data || '{}')
    targetData.content = generatedContent

    const updatedNode = await prisma.reportNode.update({
      where: { id: targetNodeId },
      data: {
        data: JSON.stringify(targetData),
        aiGenerated: true,
        linkedResourceIds: resourceIds
          ? JSON.stringify(resourceIds)
          : targetNode.linkedResourceIds,
      },
    })

    return NextResponse.json(updatedNode)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
