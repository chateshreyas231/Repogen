// Shared enums / helpers

export type ReportNodeType =
  | "section"
  | "subSection"
  | "content"
  | "prompt"
  | "table"
  | "diagram"
  | "media"
  | "checklist"
  | "chart"
  | "reference"
  | "signature"

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
  // Metadata fields
  status?: "draft" | "complete" | "in_review" | "approved"
  assignedTo?: string // User ID
  dueDate?: string // ISO date
  tags?: string[]
  collapsed?: boolean
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
  annotations?: MediaAnnotation[] // For photo annotation features
}

export interface MediaAnnotation {
  id: string
  x: number // percentage or pixel
  y: number
  text: string
  type: "callout" | "arrow" | "highlight"
}

// ===================== Checklist Node =====================

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  comment?: string
  photoUrl?: string
}

export interface ChecklistNodeData extends BaseReportNodeData {
  nodeType: "checklist"
  parentId: string
  title: string
  items: ChecklistItem[]
  allowPhotos?: boolean
}

// ===================== Chart Node =========================

export interface ChartNodeData extends BaseReportNodeData {
  nodeType: "chart"
  parentId: string
  title?: string
  chartType: "bar" | "line" | "pie" | "scatter" | "area"
  dataSource?: string // CSV, JSON, or API endpoint
  data?: any // Chart data
  xAxisLabel?: string
  yAxisLabel?: string
}

// ===================== Reference Node =====================

export interface ReferenceNodeData extends BaseReportNodeData {
  nodeType: "reference"
  parentId: string
  title: string
  citation: string
  url?: string
  standard?: string // e.g., "ADA Title III", "IBC 2021"
  pageNumber?: string
}

// ===================== Signature Node =====================

export interface SignatureNodeData extends BaseReportNodeData {
  nodeType: "signature"
  parentId: string
  title: string
  signerName?: string
  signerTitle?: string
  signatureData?: string // Base64 image or SVG
  signedAt?: string // ISO date
  status: "pending" | "signed" | "rejected"
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
  | ChecklistNodeData
  | ChartNodeData
  | ReferenceNodeData
  | SignatureNodeData

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
