'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CanvasBlock {
  id: string
  type: string
  title: string | null
  content: string
  order: number
  parentBlockId: string | null
  aiGenerated: boolean
  linkedResourceIds: string | null
}

export function SectionBlock({
  block,
  reportId,
  onUpdate,
  depth,
}: {
  block: CanvasBlock
  reportId: string
  resources: any[]
  onUpdate: () => void
  depth: number
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [title, setTitle] = useState(block.title || '')
  const [saving, setSaving] = useState(false)

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle)
    clearTimeout((window as any)[`save-title-${block.id}`])
    ;(window as any)[`save-title-${block.id}`] = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`/api/reports/${reportId}/canvas/blocks/${block.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        })
        onUpdate()
      } catch (err) {
        console.error('Error updating block:', err)
      } finally {
        setSaving(false)
      }
    }, 1000)
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">⋮⋮</span>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Section title"
              className="font-semibold border-none shadow-none p-0 h-auto"
            />
            {saving && (
              <span className="text-xs text-muted-foreground">Saving...</span>
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Section content will appear here when blocks are added inside.
          </div>
        </CardContent>
      )}
    </Card>
  )
}

