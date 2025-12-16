import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx'
import jsPDF from 'jspdf'
import { buildExportReport, exportToMarkdown } from '@/lib/export-traversal'
import type { ReportFlowNode } from '@/types/report-nodes'
import type { Edge } from 'reactflow'

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
    const format = searchParams.get('format') || 'docx'

    // Get report with all data
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        nodes: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Convert to React Flow format, excluding Start and End nodes
    const flowNodes: ReportFlowNode[] = report.nodes
      .filter((node) => node.type !== 'start' && node.type !== 'end')
      .map((node) => ({
        id: node.id,
        type: node.type,
        position: { x: node.positionX, y: node.positionY },
        data: {
          ...JSON.parse(node.data || '{}'),
          nodeType: node.type,
          reportId: params.id,
          order: node.order,
        } as any,
      }))

    // Build edges from order - Start and End are excluded from export
    const edges = []
    const sortedNodes = [...flowNodes].sort((a, b) => {
      const aOrder = (a.data as any).order ?? a.position.y
      const bOrder = (b.data as any).order ?? b.position.y
      return aOrder - bOrder
    })

    // Connect nodes in sequence (excluding Start/End)
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      edges.push({
        id: `e-${sortedNodes[i].id}-${sortedNodes[i + 1].id}`,
        source: sortedNodes[i].id,
        target: sortedNodes[i + 1].id,
      })
    }

    // Build export report using traversal
    const exportReport = buildExportReport(report.title, flowNodes, edges as any)

    if (format === 'docx') {
      // Generate Word document from export blocks
      const docChildren = [
        new Paragraph({
          text: exportReport.title || 'Accessibility Assessment Report',
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({
          text: `Project: ${report.project.name}`,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: `Generated: ${new Date(report.createdAt).toLocaleDateString()}`,
          spacing: { after: 400 },
        }),
        new Paragraph({
          text: 'Table of Contents',
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),
        ...exportReport.blocks
          .filter((b) => b.type === 'heading')
          .map((b) =>
            new Paragraph({
              text: b.text || '',
              spacing: { after: 100 },
            })
          ),
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        }),
      ]

      // Add content blocks
      for (const block of exportReport.blocks) {
        if (block.type === 'heading') {
          docChildren.push(
            new Paragraph({
              text: block.text || '',
              heading:
                block.level === 1
                  ? HeadingLevel.HEADING_1
                  : block.level === 2
                  ? HeadingLevel.HEADING_2
                  : HeadingLevel.HEADING_3,
              spacing: { before: 400, after: 200 },
            })
          )
        } else if (block.type === 'paragraph') {
          docChildren.push(
            new Paragraph({
              text: stripHtml(block.text || ''),
              spacing: { after: 200 },
            })
          )
        } else if (block.type === 'table' && block.table) {
          const tableRows = [
            new TableRow({
              children: block.table.columns.map((col) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      text: col.header,
                    }),
                  ],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                })
              ),
            }),
            ...block.table.rows.map((row) =>
              new TableRow({
                children: block.table!.columns.map((col) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: row.cells[col.id] || '',
                      }),
                    ],
                  })
                ),
              })
            ),
          ]
          docChildren.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          )
        } else if (block.type === 'diagram' && block.diagram) {
          docChildren.push(
            new Paragraph({
              text: block.diagram.title || 'Diagram',
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 300, after: 150 },
            }),
            new Paragraph({
              text: block.diagram.mermaidCode,
              spacing: { after: 200 },
            })
          )
        }
      }

      const doc = new Document({
        sections: [
          {
            children: docChildren,
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      const buffer = Buffer.from(await blob.arrayBuffer())

      // Log export activity (commented out as activity logging was removed)
      // const userId = session.user?.id
      // if (userId) {
      //   await Promise.all([
      //     logActivity(params.id, userId, 'exported', { format: 'docx' }),
      //     updateUserActivity(userId),
      //   ])
      // }

      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="report-${params.id}.docx"`,
        },
      })
    } else if (format === 'pdf') {
      // Generate PDF from export blocks
      const pdf = new jsPDF()
      let yPos = 20

      // Cover page
      pdf.setFontSize(20)
      pdf.text(exportReport.title || 'Accessibility Assessment Report', 105, yPos, {
        align: 'center',
      })
      yPos += 20
      pdf.setFontSize(12)
      pdf.text(`Project: ${report.project.name}`, 105, yPos, {
        align: 'center',
      })
      yPos += 10
      pdf.text(
        `Generated: ${new Date(report.createdAt).toLocaleDateString()}`,
        105,
        yPos,
        { align: 'center' }
      )
      yPos += 30

      // Table of Contents
      pdf.setFontSize(16)
      pdf.text('Table of Contents', 20, yPos)
      yPos += 10
      pdf.setFontSize(12)
      exportReport.blocks
        .filter((b) => b.type === 'heading')
        .forEach((b) => {
          if (yPos > 280) {
            pdf.addPage()
            yPos = 20
          }
          pdf.text(b.text || '', 20, yPos)
          yPos += 7
        })

      // Add new page for content
      pdf.addPage()
      yPos = 20

      // Render content blocks
      for (const block of exportReport.blocks) {
        if (yPos > 250) {
          pdf.addPage()
          yPos = 20
        }

        if (block.type === 'heading') {
          pdf.setFontSize(block.level === 1 ? 16 : block.level === 2 ? 14 : 12)
          pdf.text(block.text || '', 20, yPos)
          yPos += 10
        } else if (block.type === 'paragraph') {
          pdf.setFontSize(11)
          const text = stripHtml(block.text || '')
          const lines = pdf.splitTextToSize(text, 170)
          lines.forEach((line: string) => {
            if (yPos > 280) {
              pdf.addPage()
              yPos = 20
            }
            pdf.text(line, 20, yPos)
            yPos += 7
          })
          yPos += 5
        } else if (block.type === 'table' && block.table) {
          // Simple table rendering
          pdf.setFontSize(10)
          const startX = 20
          const colWidth = 170 / block.table.columns.length
          let xPos = startX

          // Headers
          block.table.columns.forEach((col) => {
            pdf.text(col.header, xPos, yPos)
            xPos += colWidth
          })
          yPos += 8

          // Rows
          block.table.rows.forEach((row) => {
            if (yPos > 280) {
              pdf.addPage()
              yPos = 20
            }
            xPos = startX
            block.table!.columns.forEach((col) => {
              pdf.text(row.cells[col.id] || '', xPos, yPos)
              xPos += colWidth
            })
            yPos += 7
          })
          yPos += 5
        } else if (block.type === 'diagram' && block.diagram) {
          pdf.setFontSize(12)
          pdf.text(block.diagram.title || 'Diagram', 20, yPos)
          yPos += 8
          pdf.setFontSize(9)
          const codeLines = pdf.splitTextToSize(block.diagram.mermaidCode, 170)
          codeLines.forEach((line: string) => {
            if (yPos > 280) {
              pdf.addPage()
              yPos = 20
            }
            pdf.text(line, 20, yPos)
            yPos += 5
          })
          yPos += 5
        }
      }

      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

      // Log export activity (commented out)
      // const userId = session.user?.id
      // if (userId) {
      //   await Promise.all([
      //     logActivity(params.id, userId, 'exported', { format: 'pdf' }),
      //     updateUserActivity(userId),
      //   ])
      // }

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="report-${params.id}.pdf"`,
        },
      })
    } else if (format === 'markdown') {
      // Export as Markdown
      const markdown = exportToMarkdown(exportReport)
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="report-${params.id}.md"`,
        },
      })
    } else if (format === 'txt') {
      // Export as plain text
      const textLines: string[] = []
      textLines.push(exportReport.title || 'Report')
      textLines.push('')
      textLines.push(`Project: ${report.project.name}`)
      textLines.push(`Generated: ${new Date(report.createdAt).toLocaleDateString()}`)
      textLines.push('')
      textLines.push('='.repeat(60))
      textLines.push('')
      
      for (const block of exportReport.blocks) {
        if (block.type === 'heading') {
          textLines.push('')
          textLines.push(block.text || '')
          textLines.push('-'.repeat(block.text?.length || 40))
        } else if (block.type === 'paragraph') {
          textLines.push(stripHtml(block.text || ''))
          textLines.push('')
        } else if (block.type === 'table' && block.table) {
          textLines.push('')
          // Table headers
          const headers = block.table.columns.map(col => col.header).join(' | ')
          textLines.push(headers)
          textLines.push('-'.repeat(headers.length))
          // Table rows
          block.table.rows.forEach(row => {
            const rowText = block.table!.columns.map(col => row.cells[col.id] || '').join(' | ')
            textLines.push(rowText)
          })
          textLines.push('')
        } else if (block.type === 'diagram' && block.diagram) {
          textLines.push('')
          textLines.push(block.diagram.title || 'Diagram')
          textLines.push('')
          textLines.push(block.diagram.mermaidCode)
          textLines.push('')
        }
      }
      
      return new NextResponse(textLines.join('\n'), {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="report-${params.id}.txt"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

