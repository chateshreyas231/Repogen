'use client'

import { memo, useState } from 'react'
import { NodeProps } from 'reactflow'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TableNodeData, TableColumn, TableRow } from '@/types/report-nodes'

export const TableNode = memo(({ data, id, selected }: NodeProps) => {
  const tableData = (data as any) || {}
  const [title, setTitle] = useState(tableData.title || 'Table')
  const [isExpanded, setIsExpanded] = useState(false)
  const color = '#f97316' // Orange

  const reportId = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : ''

  const updateNode = async (updates: any) => {
    if (!reportId) return
    clearTimeout((window as any)[`save-table-${id}`])
    ;(window as any)[`save-table-${id}`] = setTimeout(async () => {
      try {
        await fetch(`/api/reports/${reportId}/nodes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { ...tableData, ...updates },
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
      className={`min-w-[300px] rounded-lg transition-all duration-200 ${
        selected 
          ? 'ring-2 ring-primary ring-offset-2 shadow-xl scale-105' 
          : 'shadow-sm hover:shadow-lg hover:scale-[1.02]'
      }`}
      style={{
        backgroundColor: isExpanded ? '#ffffff' : `${color}08`,
        border: `1.5px solid ${color}40`,
        borderLeft: `4px solid ${color}`,
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
              placeholder="Table title"
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
              placeholder="Table title"
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
              Table editing available in expanded view
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

TableNode.displayName = 'TableNode'
