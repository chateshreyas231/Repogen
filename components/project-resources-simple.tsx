'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Resource {
  id: string
  type: string
  title: string | null
  content: string
  createdAt: string
}

export function ProjectResources({
  projectId,
  initialResources,
}: {
  projectId: string
  initialResources: Resource[]
}) {
  const [resources, setResources] = useState(initialResources)
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, content }),
      })

      if (response.ok) {
        const newResource = await response.json()
        setResources([newResource, ...resources])
        setShowForm(false)
        setTitle('')
        setContent('')
      }
    } catch (err) {
      console.error('Error creating resource:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Resources</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Resource'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 pb-6 border-b">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="text">Text Note</option>
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
                <option value="table">Table</option>
                <option value="link">Link</option>
                <option value="media">Media</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resource title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter resource content..."
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Resource'}
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {resources.length === 0 ? (
            <p className="text-muted-foreground text-sm">No resources yet</p>
          ) : (
            resources.map((resource) => (
              <div key={resource.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {resource.type}
                    </span>
                    {resource.title && (
                      <h4 className="font-medium mt-1">{resource.title}</h4>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {resource.content.substring(0, 200)}
                  {resource.content.length > 200 && '...'}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

