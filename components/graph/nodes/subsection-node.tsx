'use client'

import { memo, useState } from 'react'
import { NodeProps } from 'reactflow'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp } from 'lucide-react'

export const SubSectionNode = memo(({ data, id, selected }: NodeProps) => {
  const [title, setTitle] = useState(data?.title || 'Sub-Section')
  const [isExpanded, setIsExpanded] = useState(false)
  const color = data?.color || data?.parentColor || '#10b981'

  const reportId = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : ''

  const updateNode = async (updates: any) => {
    if (!reportId) return
    clearTimeout((window as any)[`save-${id}`])
    ;(window as any)[`save-${id}`] = setTimeout(async () => {
      try {
        await fetch(`/api/reports/${reportId}/nodes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { ...(data || {}), ...updates },
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
      className={`min-w-[280px] rounded-lg shadow-md transition-all duration-200 ml-8 ${
        selected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      style={{
        backgroundColor: isExpanded ? `${color}15` : `${color}20`,
        border: `2px solid ${color}`,
      }}
    >
      {!isExpanded ? (
        <div
          className="p-3 cursor-pointer"
          onClick={() => setIsExpanded(true)}
          style={{ backgroundColor: `${color}20` }}
        >
          <div className="flex items-center justify-between">
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Sub-Section title"
              className="font-semibold border-none shadow-none p-0 h-auto text-sm flex-1 bg-transparent"
              style={{ color: color }}
            />
            <ChevronDown className="h-4 w-4" style={{ color: color }} />
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Sub-Section title"
              className="font-semibold border-none shadow-none p-0 h-auto text-sm flex-1 bg-transparent"
              style={{ color: color }}
            />
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              <ChevronUp className="h-4 w-4" style={{ color: color }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

SubSectionNode.displayName = 'SubSectionNode'
