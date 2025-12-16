import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTemplateById, type TemplateNode } from '@/lib/templates'

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
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const template = getTemplateById(templateId)
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Get existing nodes to determine starting position
    const existingNodes = await prisma.reportNode.findMany({
      where: { reportId: params.id },
      orderBy: { order: 'desc' },
      take: 1,
    })

    let currentY = existingNodes.length > 0 
      ? existingNodes[0].positionY + 150 
      : 150
    const centerX = 400
    const verticalSpacing = 120

    const nodeColors: Record<string, string> = {
      section: '#3b82f6',
      sub_section: '#10b981',
      table: '#f97316',
      diagram: '#ef4444',
      content: '#6b7280',
      prompt: '#8b5cf6',
      checklist: '#10b981',
      chart: '#3b82f6',
      reference: '#8b5cf6',
      signature: '#ef4444',
    }

    const createNodeFromTemplate = async (
      templateNode: TemplateNode,
      parentNodeId: string | null,
      order: number
    ): Promise<string> => {
      const nodeData: any = {
        title: templateNode.title,
        color: templateNode.color || nodeColors[templateNode.type] || '#3b82f6',
        ...templateNode.data,
      }

      const node = await prisma.reportNode.create({
        data: {
          reportId: params.id,
          type: templateNode.type,
          positionX: centerX,
          positionY: currentY,
          data: JSON.stringify(nodeData),
          parentNodeId: parentNodeId,
          order: order,
          aiGenerated: false,
        },
      })

      currentY += verticalSpacing

      // Create children recursively
      if (templateNode.children && templateNode.children.length > 0) {
        for (let i = 0; i < templateNode.children.length; i++) {
          await createNodeFromTemplate(
            templateNode.children[i],
            node.id,
            i + 1
          )
        }
      }

      return node.id
    }

    // Create all nodes from template
    for (let i = 0; i < template.nodes.length; i++) {
      await createNodeFromTemplate(template.nodes[i], null, i + 1)
    }

    return NextResponse.json({ success: true, message: 'Template applied successfully' })
  } catch (error) {
    console.error('Error applying template:', error)
    return NextResponse.json(
      { error: 'Failed to apply template' },
      { status: 500 }
    )
  }
}

