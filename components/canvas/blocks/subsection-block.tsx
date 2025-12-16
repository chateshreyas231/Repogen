'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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

export function SubSectionBlock({
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
    <Card className="mb-2 ml-4">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">⋮⋮</span>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Sub-section title"
            className="font-medium border-none shadow-none p-0 h-auto text-sm"
          />
          {saving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}

