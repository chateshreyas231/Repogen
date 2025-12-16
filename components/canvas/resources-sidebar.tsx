'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Image, Mail, MapPin } from 'lucide-react'

interface ProjectResource {
  id: string
  type: string
  title: string | null
  content: string
}

// Icons are now handled by lucide-react components
const getResourceIcon = (type: string) => {
  return ''
}

export function ResourcesSidebar({
  resources,
  projectId,
  onResourceAdded,
}: {
  resources: ProjectResource[]
  projectId: string
  onResourceAdded: () => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [type, setType] = useState('note')
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Resources</h2>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          + Add
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <div>
              <Label>Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="note">Note</option>
                <option value="site_observation">Site Observation</option>
                <option value="email">Email</option>
                <option value="image">Image</option>
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
      )}

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
              className="p-3 border rounded-md cursor-move hover:bg-accent"
            >
              <div className="flex items-start gap-2">
                {resource.type === 'site_observation' && <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />}
                {resource.type === 'email' && <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />}
                {resource.type === 'note' && <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />}
                {resource.type === 'image' && <Image className="h-4 w-4 text-muted-foreground mt-0.5" />}
                {!['site_observation', 'email', 'note', 'image'].includes(resource.type) && (
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  {resource.title && (
                    <div className="font-medium text-sm truncate">
                      {resource.title}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground uppercase mt-1">
                    {resource.type.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {resource.content.substring(0, 100)}
                    {resource.content.length > 100 && '...'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

