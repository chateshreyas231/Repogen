'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

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

export function TextBlock({
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
  const [content, setContent] = useState(block.content)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setContent(block.content)
  }, [block.content])

  const handleContentChange = (value: string) => {
    setContent(value)
    clearTimeout((window as any)[`save-content-${block.id}`])
    ;(window as any)[`save-content-${block.id}`] = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`/api/reports/${reportId}/canvas/blocks/${block.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: value }),
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
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">⋮⋮</span>
          <span className="text-xs text-muted-foreground">Text Block</span>
          {block.aiGenerated && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              AI Generated
            </span>
          )}
          {saving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
        </div>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={handleContentChange}
          placeholder="Enter text content..."
        />
      </CardContent>
    </Card>
  )
}

