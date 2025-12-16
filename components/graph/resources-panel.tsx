'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronsRight, ChevronsLeft, FolderOpen, FileText, Image, Link, Video, File } from 'lucide-react'

const getResourceIcon = (type: string) => {
  // Return empty string - icons will be handled by lucide-react icons
  return ''
}

export function ResourcesPanel({
  resources,
  projectId,
  onResourceAdded,
  isMinimized,
  onToggleMinimize,
}: {
  resources: any[]
  projectId: string
  onResourceAdded: () => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [type, setType] = useState('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!content.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, content }),
      })

      if (response.ok) {
        setShowAddForm(false)
        setTitle('')
        setContent('')
        onResourceAdded()
      }
    } catch (err) {
      console.error('Error adding resource:', err)
    } finally {
      setLoading(false)
    }
  }

  if (isMinimized) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-4 bg-muted/30">
        <button
          onClick={onToggleMinimize}
          className="p-2 hover:bg-accent rounded-md transition-colors mb-4"
          title="Expand Resource Library"
        >
          <ChevronsRight className="h-5 w-5" />
        </button>
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-background">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Resource Library</h2>
          {onToggleMinimize && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleMinimize}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resources yet</p>
          ) : (
            resources.map((resource) => (
              <div
                key={resource.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('resourceId', resource.id)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                  className="p-3 border rounded-md cursor-move hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {resource.type === 'text' && <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />}
                    {resource.type === 'pdf' && <File className="h-4 w-4 text-muted-foreground mt-0.5" />}
                    {resource.type === 'image' && <Image className="h-4 w-4 text-muted-foreground mt-0.5" />}
                    {resource.type === 'table' && <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />}
                    {resource.type === 'link' && <Link className="h-4 w-4 text-muted-foreground mt-0.5" />}
                    {resource.type === 'media' && <Video className="h-4 w-4 text-muted-foreground mt-0.5" />}
                    {!['text', 'pdf', 'image', 'table', 'link', 'media'].includes(resource.type) && (
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                    {resource.title && (
                      <div className="font-medium text-sm truncate">
                        {resource.title}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground uppercase mt-1">
                      {resource.type}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {resource.content?.substring(0, 100)}
                      {resource.content?.length > 100 && '...'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add button at the bottom */}
      <div className="p-4 border-t bg-background">
        {showAddForm ? (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="text">Text Note</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Image</option>
                  <option value="table">Table (CSV/JSON)</option>
                  <option value="link">Link</option>
                  <option value="media">Media</option>
                </select>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Resource title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Content</Label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  placeholder="Resource content..."
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} disabled={loading}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={() => setShowAddForm(true)}
          >
            + Add Resource
          </Button>
        )}
      </div>
    </div>
  )
}
