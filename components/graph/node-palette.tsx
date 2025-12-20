'use client'

import { useCallback } from 'react'
import { 
  FileText, 
  Folder, 
  Table, 
  GitBranch, 
  Sparkles, 
  ListChecks, 
  BarChart3, 
  BookOpen, 
  PenTool,
  MoreVertical
} from 'lucide-react'

interface NodeType {
  type: string
  label: string
  icon: React.ReactNode
  color: string
}

const NODE_TYPES: NodeType[] = [
  { type: 'section', label: 'Section', icon: <Folder className="h-4 w-4" />, color: '#3b82f6' },
  { type: 'sub_section', label: 'Sub-Section', icon: <FileText className="h-4 w-4" />, color: '#10b981' },
  { type: 'content', label: 'Content', icon: <FileText className="h-4 w-4" />, color: '#6b7280' },
  { type: 'prompt', label: 'AI Prompt', icon: <Sparkles className="h-4 w-4" />, color: '#8b5cf6' },
  { type: 'table', label: 'Table', icon: <Table className="h-4 w-4" />, color: '#f97316' },
  { type: 'diagram', label: 'Diagram', icon: <GitBranch className="h-4 w-4" />, color: '#ef4444' },
  { type: 'checklist', label: 'Checklist', icon: <ListChecks className="h-4 w-4" />, color: '#14b8a6' },
  { type: 'chart', label: 'Chart', icon: <BarChart3 className="h-4 w-4" />, color: '#0284c7' },
  { type: 'reference', label: 'Reference', icon: <BookOpen className="h-4 w-4" />, color: '#7c3aed' },
  { type: 'signature', label: 'Signature', icon: <PenTool className="h-4 w-4" />, color: '#be123c' },
]

interface NodePaletteProps {
  onNodeDragStart: (nodeType: string) => void
}

export function NodePalette({ onNodeDragStart }: NodePaletteProps) {
  const handleDragStart = useCallback((e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType)
    e.dataTransfer.effectAllowed = 'move'
    onNodeDragStart(nodeType)
  }, [onNodeDragStart])

  return (
    <div className="absolute left-4 top-20 bottom-20 z-10 w-48">
      <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl p-2 h-full overflow-y-auto">
        <div className="mb-3 px-2">
          <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
            Node Types
          </h3>
        </div>
        <div className="space-y-1">
          {NODE_TYPES.map((nodeType) => (
            <div
              key={nodeType.type}
              draggable
              onDragStart={(e) => handleDragStart(e, nodeType.type)}
              className="group flex items-center gap-2 px-3 py-2 rounded-md cursor-grab active:cursor-grabbing hover:bg-gray-800/50 transition-all border border-transparent hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20"
            >
              <div 
                className="flex-shrink-0"
                style={{ color: nodeType.color }}
              >
                {nodeType.icon}
              </div>
              <span className="text-sm font-medium text-gray-200 flex-1">
                {nodeType.label}
              </span>
              <MoreVertical className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

