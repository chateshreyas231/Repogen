import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'

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
    const { diagramNodeId, prompt, description } = body

    if (!diagramNodeId || (!prompt && !description)) {
      return NextResponse.json(
        { error: 'diagramNodeId and prompt/description are required' },
        { status: 400 }
      )
    }

    const promptText = prompt || description

    // Generate Mermaid code using OpenAI
    const aiPrompt = `You are a Mermaid diagram generator. Generate ONLY valid Mermaid code based on this description: "${promptText}"

Rules:
- Output ONLY the Mermaid code, no markdown backticks, no explanations
- Use appropriate diagram type (flowchart, sequenceDiagram, classDiagram, etc.)
- Keep it simple and clear
- Use descriptive node labels`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You generate Mermaid diagrams only. Output pure Mermaid code, no backticks, no explanations.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const mermaidCode =
      completion.choices[0]?.message?.content?.trim() ||
      'graph TD\n    A[Start] --> B[End]'

    // Update the diagram node
    const diagramNode = await prisma.reportNode.findUnique({
      where: { id: diagramNodeId },
    })

    if (!diagramNode) {
      return NextResponse.json(
        { error: 'Diagram node not found' },
        { status: 404 }
      )
    }

    const nodeData = JSON.parse(diagramNode.data || '{}')
    nodeData.mermaidCode = mermaidCode

    await prisma.reportNode.update({
      where: { id: diagramNodeId },
      data: {
        data: JSON.stringify(nodeData),
      },
    })

    return NextResponse.json({ mermaidCode })
  } catch (error) {
    console.error('Error generating diagram:', error)
    return NextResponse.json(
      { error: 'Failed to generate diagram' },
      { status: 500 }
    )
  }
}
