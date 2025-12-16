import type { Edge } from "reactflow"
import type {
  ReportFlowNode,
  ReportNodeData,
  SectionNodeData,
  SubSectionNodeData,
  ContentNodeData,
  TableNodeData,
  DiagramNodeData,
  MediaNodeData,
  ExportBlock,
  ExportReport,
} from "@/types/report-nodes"

type RFNode = ReportFlowNode

// Helper: get children of a node in sorted order
function getChildNodes(
  parentId: string,
  nodes: RFNode[],
  edges: Edge[]
): RFNode[] {
  const childIds = edges
    .filter((e) => e.source === parentId)
    .map((e) => e.target)

  const children = nodes.filter((n) => childIds.includes(n.id))

  // sort by explicit order if present, else by position.y
  return children.sort((a, b) => {
    const da: any = a.data
    const db: any = b.data
    const orderA = typeof da.order === "number" ? da.order : a.position.y
    const orderB = typeof db.order === "number" ? db.order : b.position.y
    return orderA - orderB
  })
}

function isSectionNode(n: RFNode): n is RFNode & { data: SectionNodeData } {
  return n.data.nodeType === "section"
}

function isSubSectionNode(
  n: RFNode
): n is RFNode & { data: SubSectionNodeData } {
  return n.data.nodeType === "subSection"
}

function isContentNode(n: RFNode): n is RFNode & { data: ContentNodeData } {
  return n.data.nodeType === "content"
}

function isTableNode(n: RFNode): n is RFNode & { data: TableNodeData } {
  return n.data.nodeType === "table"
}

function isDiagramNode(n: RFNode): n is RFNode & { data: DiagramNodeData } {
  return n.data.nodeType === "diagram"
}

function isMediaNode(n: RFNode): n is RFNode & { data: MediaNodeData } {
  return n.data.nodeType === "media"
}

// Recursive traversal
function traverseNodeChildren(
  nodes: RFNode[],
  allNodes: RFNode[],
  edges: Edge[],
  blocks: ExportBlock[],
  headingLevel: number
) {
  for (const node of nodes) {
    const data = node.data as ReportNodeData

    if (isSubSectionNode(node)) {
      blocks.push({
        type: "heading",
        level: headingLevel,
        text: data.title,
      })
      const children = getChildNodes(node.id, allNodes, edges)
      traverseNodeChildren(children, allNodes, edges, blocks, headingLevel + 1)
    } else if (isContentNode(node)) {
      if (data.content?.trim()) {
        blocks.push({
          type: "paragraph",
          text: data.content,
        })
      }
    } else if (isTableNode(node)) {
      blocks.push({
        type: "table",
        table: data,
      })
    } else if (isDiagramNode(node)) {
      blocks.push({
        type: "diagram",
        diagram: data,
      })
    } else if (isMediaNode(node)) {
      blocks.push({
        type: "media",
        media: data,
      })
    } else if (data.nodeType === "prompt") {
      // PromptNode itself is not exported; its output lives in linked ContentNodes
      continue
    } else if (data.nodeType === "section") {
      // Section nodes should already be handled at a higher level
      continue
    }
  }
}

// Main export builder
export function buildExportReport(
  reportTitle: string,
  allNodes: RFNode[],
  edges: Edge[]
): ExportReport {
  const blocks: ExportBlock[] = []

  // Top-level sections are nodes with nodeType=section and no incoming edges
  const sectionNodes = allNodes.filter(isSectionNode).sort((a, b) => {
    const da = a.data
    const db = b.data
    return (da.order ?? a.position.y) - (db.order ?? b.position.y)
  })

  for (const section of sectionNodes) {
    const sData = section.data as SectionNodeData

    // Heading level 1
    blocks.push({
      type: "heading",
      level: 1,
      text: sData.title,
    })

    const children = getChildNodes(section.id, allNodes, edges)

    // Traverse section children recursively
    traverseNodeChildren(children, allNodes, edges, blocks, 2)
  }

  return { title: reportTitle, blocks }
}

// Markdown export
export function exportToMarkdown(er: ExportReport): string {
  const lines: string[] = [`# ${er.title}`, ""]

  for (const block of er.blocks) {
    switch (block.type) {
      case "heading":
        lines.push(`${"#".repeat(block.level ?? 1)} ${block.text}`, "")
        break
      case "paragraph":
        lines.push(block.text ?? "", "")
        break
      case "table":
        // render simple markdown table from TableNodeData
        const t = block.table!
        const headers = t.columns.map((c) => c.header)
        lines.push(`| ${headers.join(" | ")} |`)
        lines.push(`| ${headers.map(() => "---").join(" | ")} |`)
        for (const row of t.rows) {
          const cells = t.columns.map((c) => row.cells[c.id] ?? "")
          lines.push(`| ${cells.join(" | ")} |`)
        }
        lines.push("")
        break
      case "diagram":
        // Mermaid fenced block
        lines.push("```mermaid")
        lines.push(block.diagram!.mermaidCode)
        lines.push("```", "")
        break
      case "media":
        const m = block.media!
        if (m.mediaType === "image") {
          lines.push(`![${m.altText ?? ""}](${m.url})`, "")
        } else {
          lines.push(`${m.caption ?? "Media"}: ${m.url}`, "")
        }
        break
    }
  }

  return lines.join("\n")
}
