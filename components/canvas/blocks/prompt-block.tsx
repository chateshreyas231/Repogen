'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface CanvasBlock {
  id: string
  type: string
  title: string | null
  content: string
  order: number
  parentBlockId: string | null
  aiGenerated: boolean
  aiPrompt: string | null
  linkedResourceIds: string | null
}

interface ProjectResource {
  id: string
  type: string
  title: string | null
}

export function PromptBlock({
  block,
  reportId,
  resources,
  onUpdate,
  depth,
}: {
  block: CanvasBlock
  reportId: string
  resources: ProjectResource[]
  onUpdate: () => void
  depth: number
}) {
  const [prompt, setPrompt] = useState(block.aiPrompt || '')
  const [selectedResources, setSelectedResources] = useState<string[]>(
    block.linkedResourceIds ? JSON.parse(block.linkedResourceIds) : []
  )
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/reports/${reportId}/canvas/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId: block.id,
          prompt,
          resourceIds: selectedResources,
        }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (err) {
      console.error('Error generating content:', err)
    } finally {
      setGenerating(false)
    }
  }

  const toggleResource = (resourceId: string) => {
    setSelectedResources((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    )
  }

  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">⋮⋮</span>
          <span className="text-xs text-muted-foreground">Prompt Block</span>
        </div>

        <div className="space-y-3">
          <div>
            <Label>AI Prompt</Label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              placeholder="Enter your prompt for AI generation..."
            />
          </div>

          <div>
            <Label>Attach Resources (optional)</Label>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {resources.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No resources available
                </p>
              ) : (
                resources.map((resource) => (
                  <label
                    key={resource.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedResources.includes(resource.id)}
                      onChange={() => toggleResource(resource.id)}
                    />
                    <span className="truncate">
                      {resource.title || resource.type}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full"
          >
            {generating ? 'Generating...' : 'Generate Content'}
          </Button>

          {block.content && (
            <div className="mt-4 p-3 bg-muted rounded">
              <div className="text-xs text-muted-foreground mb-2">
                Generated Content:
              </div>
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

