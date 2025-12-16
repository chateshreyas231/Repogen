import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get('nodeId')

    const highlights = await prisma.reportHighlight.findMany({
      where: {
        reportId: params.id,
        nodeId: nodeId || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(highlights)
  } catch (error) {
    console.error('Error fetching highlights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch highlights' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { nodeId, color, position, note } = body

    if (!color || !position) {
      return NextResponse.json(
        { error: 'Color and position are required' },
        { status: 400 }
      )
    }

    const highlight = await prisma.reportHighlight.create({
      data: {
        reportId: params.id,
        nodeId: nodeId || null,
        userId: session.user.id,
        color,
        position: JSON.stringify(position),
        note: note || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(highlight, { status: 201 })
  } catch (error) {
    console.error('Error creating highlight:', error)
    return NextResponse.json(
      { error: 'Failed to create highlight' },
      { status: 500 }
    )
  }
}

