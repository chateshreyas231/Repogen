// Shared enums / helpers

export type ReportNodeType =
  | "section"
  | "subSection"
  | "content"
  | "prompt"
  | "table"
  | "diagram"
  | "media"

export type AiStatus = "none" | "pending" | "aiGenerated" | "edited"

// Link to left-panel resources
export interface LinkedResourceRef {
  id: string
  label: string
  type: "note" | "pdf" | "image" | "table" | "link" | "other"
}

// ---------- Base data for ALL nodes ----------
export interface BaseReportNodeData {
  reportId: string
  nodeType: ReportNodeType
  label?: string // short label shown in node header
  description?: string // optional blurb / tooltip
  aiStatus?: AiStatus
  linkedResources?: LinkedResourceRef[]
  // For audit/tracking
  lastEditedBy?: string
  lastEditedAt?: string // ISO
}

// ===================== Section Nodes =====================

export interface SectionNodeData extends BaseReportNodeData {
  nodeType: "section"
  title: string
  order: number // high-level ordering in report
  collapsed?: boolean
  color?: string
  prompt?: string
}

export interface SubSectionNodeData extends BaseReportNodeData {
  nodeType: "subSection"
  title: string
  parentSectionId: string // node.id of SectionNode
  order: number
  collapsed?: boolean
}

// ===================== Content Node =======================

export interface ContentNodeData extends BaseReportNodeData {
  nodeType: "content"
  parentId: string // section OR subsection node id
  // main body text. You can treat as markdown / rich-text JSON.
  content: string
  // if this content came from a PromptNode:
  sourcePromptNodeId?: string
}

// ===================== Prompt Node ========================

export interface PromptNodeData extends BaseReportNodeData {
  nodeType: "prompt"
  parentId: string // usually a section or subSection id
  promptTitle?: string
  promptText: string
  temperature?: number
  maxTokens?: number
  // AI provenance
  modelName?: string
  lastRunAt?: string
  lastRunUserId?: string
  // target node(s) that should receive the output
  targetContentNodeId?: string
}

// ===================== Table Node =========================

export interface TableColumn {
  id: string
  header: string
}

export interface TableRow {
  id: string
  // keyed by column.id
  cells: Record<string, string>
}

export interface TableNodeData extends BaseReportNodeData {
  nodeType: "table"
  parentId: string // section or subsection
  title?: string
  columns: TableColumn[]
  rows: TableRow[]
  // Optional: linkage to a source table resource
  sourceResourceId?: string
  // Optional: AI fill/transform metadata
  sourcePromptNodeId?: string
}

// ===================== Diagram (Mermaid) Node =============

export interface DiagramNodeData extends BaseReportNodeData {
  nodeType: "diagram"
  parentId: string
  title?: string
  // Mermaid code string, e.g. "graph TD; A-->B"
  mermaidCode: string
  // Output from AI generator, if applicable
  sourcePromptNodeId?: string
  // Optionally store a snapshot SVG/PNG URL if you want caching
  snapshotUrl?: string
}

// ===================== Media Node =========================

export interface MediaNodeData extends BaseReportNodeData {
  nodeType: "media"
  parentId: string
  mediaType: "image" | "video" | "link" | "file"
  url: string // or file path
  caption?: string
  altText?: string
}

// ===================== Union for React Flow =================

export type ReportNodeData =
  | SectionNodeData
  | SubSectionNodeData
  | ContentNodeData
  | PromptNodeData
  | TableNodeData
  | DiagramNodeData
  | MediaNodeData

// React Flow node type
import type { Node } from "reactflow"

export type ReportFlowNode = Node<ReportNodeData>

// ===================== Export Types =======================

export interface ExportBlock {
  type: "heading" | "paragraph" | "table" | "diagram" | "media"
  level?: number // heading level: 1 = section, 2 = subsection
  text?: string // for headings, paragraphs
  table?: TableNodeData
  diagram?: DiagramNodeData
  media?: MediaNodeData
}

export interface ExportReport {
  title: string
  blocks: ExportBlock[]
}
