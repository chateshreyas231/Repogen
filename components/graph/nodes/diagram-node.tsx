'use client'

import { memo, useState } from 'react'
import { NodeProps } from 'reactflow'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp } from 'lucide-react'

export const DiagramNode = memo(({ data, id, selected }: NodeProps) => {
  const diagramData = (data as any) || {}
  const [title, setTitle] = useState(diagramData.title || 'Diagram')
  const [isExpanded, setIsExpanded] = useState(false)
  const color = '#ef4444' // Red

  const reportId = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : ''

  const updateNode = async (updates: any) => {
    if (!reportId) return
    clearTimeout((window as any)[`save-diagram-${id}`])
    ;(window as any)[`save-diagram-${id}`] = setTimeout(async () => {
      try {
        await fetch(`/api/reports/${reportId}/nodes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { ...diagramData, ...updates },
          }),
        })
      } catch (err) {
        console.error('Error updating node:', err)
      }
    }, 1000)
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    updateNode({ title: newTitle })
  }

  return (
    <div
      className={`min-w-[300px] rounded-lg shadow-md transition-all duration-200 ${
        selected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      style={{
        backgroundColor: isExpanded ? `${color}15` : `${color}20`,
        border: `2px solid ${color}`,
      }}
    >
      {!isExpanded ? (
        <div
          className="p-4 cursor-pointer"
          onClick={() => setIsExpanded(true)}
          style={{ backgroundColor: `${color}20` }}
        >
          <div className="flex items-center justify-between">
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Diagram title"
              className="font-bold border-none shadow-none p-0 h-auto text-base flex-1 bg-transparent"
              style={{ color: color }}
            />
            <ChevronDown className="h-4 w-4" style={{ color: color }} />
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Diagram title"
              className="font-bold border-none shadow-none p-0 h-auto text-base flex-1 bg-transparent"
              style={{ color: color }}
            />
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              <ChevronUp className="h-4 w-4" style={{ color: color }} />
            </button>
          </div>
          <div className="pt-2 border-t" style={{ borderColor: `${color}40` }}>
            <div className="text-xs text-muted-foreground">
              Diagram editing available in expanded view
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

DiagramNode.displayName = 'DiagramNode'
