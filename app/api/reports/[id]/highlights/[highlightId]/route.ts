import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; highlightId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.reportHighlight.delete({
      where: { id: params.highlightId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting highlight:', error)
    return NextResponse.json(
      { error: 'Failed to delete highlight' },
      { status: 500 }
    )
  }
}

