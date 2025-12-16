import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSectionContent } from '@/lib/openai'
import { logActivity, updateLastEdited, updateUserActivity } from '@/lib/activity'

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
    const { blockId, prompt, resourceIds } = body

    if (!blockId || !prompt) {
      return NextResponse.json(
        { error: 'blockId and prompt are required' },
        { status: 400 }
      )
    }

    // Get the block
    const block = await prisma.canvasBlock.findUnique({
      where: { id: blockId },
      include: {
        report: {
          include: {
            project: {
              include: {
                resources: true,
              },
            },
          },
        },
      },
    })

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }

    // Get parent section title if block has a parent
    let parentSectionTitle = ''
    if (block.parentBlockId) {
      const parent = await prisma.canvasBlock.findUnique({
        where: { id: block.parentBlockId },
      })
      if (parent && parent.type === 'section') {
        parentSectionTitle = parent.title || ''
      }
    }

    // Filter resources by linked IDs if provided
    let resourcesToUse = block.report.project.resources
    if (resourceIds && resourceIds.length > 0) {
      resourcesToUse = resourcesToUse.filter((r) =>
        resourceIds.includes(r.id)
      )
    }

    // Build context from resources
    const projectResources = resourcesToUse.map((r) => ({
      type: r.type,
      title: r.title,
      content: r.content,
    }))

    // Generate content using the prompt
    const generatedContent = await generateSectionContent(
      prompt,
      projectResources,
      parentSectionTitle
    )

    // Update the block with generated content
    const updatedBlock = await prisma.canvasBlock.update({
      where: { id: blockId },
      data: {
        content: generatedContent,
        aiGenerated: true,
        aiPrompt: prompt,
        linkedResourceIds: resourceIds
          ? JSON.stringify(resourceIds)
          : block.linkedResourceIds,
      },
    })

    // Log activity
    const userId = session.user?.id
    if (userId) {
      await Promise.all([
        logActivity(params.id, userId, 'ai_generation', {
          action: 'prompt_generated',
          blockId: blockId,
          prompt: prompt,
        }),
        updateLastEdited(params.id, userId),
        updateUserActivity(userId),
      ])
    }

    return NextResponse.json(updatedBlock)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

