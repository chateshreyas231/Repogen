import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSectionContent } from '@/lib/openai'
import { logActivity, updateLastEdited, updateUserActivity } from '@/lib/activity'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, regenerate } = body

    // Get the section
    const section = await prisma.reportSection.findUnique({
      where: { id: params.sectionId },
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

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    let finalContent = content

    // If regenerate is true, generate new content using AI
    if (regenerate) {
      const projectResources = section.report.project.resources.map((r) => ({
        type: r.type,
        title: r.title,
        content: r.content,
      }))

      finalContent = await generateSectionContent(
        section.title,
        projectResources
      )
    }

    // Update the section
    const updatedSection = await prisma.reportSection.update({
      where: { id: params.sectionId },
      data: {
        content: finalContent,
        aiGenerated: regenerate ? true : section.aiGenerated,
      },
    })

    const userId = session.user?.id

    // Update last edited and user activity
    if (userId) {
      await Promise.all([
        updateLastEdited(params.id, userId),
        updateUserActivity(userId),
      ])
    }

    // Log activity
    if (regenerate) {
      await logActivity(params.id, userId, 'ai_generation', {
        sectionId: params.sectionId,
        sectionTitle: section.title,
      })
    } else {
      await logActivity(params.id, userId, 'section_edited', {
        sectionId: params.sectionId,
        sectionTitle: section.title,
      })
    }

    return NextResponse.json(updatedSection)
  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

