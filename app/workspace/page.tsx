'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WorkspaceBoard } from '@/components/workspace-board'
import { WorkspaceList } from '@/components/workspace-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface Report {
  id: string
  title: string
  clientName: string
  projectTitle: string
  projectId: string
  clientId: string
  status: string
  priority: number | null
  dueDate: string | null
  lastEditedAt: string | null
  lastEditedBy: { id: string; name: string } | null
  assignedUsers: Array<{ id: string; name: string; role: string }>
}

export default function WorkspacePage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'board' | 'list'>('board')
  const [clientFilter, setClientFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    fetchClients()
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchReports()
  }, [clientFilter, projectFilter, searchQuery])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.map((c: any) => ({ id: c.id, name: c.name })))
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.map((p: any) => ({ id: p.id, name: p.title })))
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (clientFilter) params.append('clientId', clientFilter)
      if (projectFilter) params.append('projectId', projectFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/workspace/board?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchReports()
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading workspace...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Workspace</h1>
          <div className="flex gap-2">
            <Button
              variant={view === 'board' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('board')}
            >
              Board
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('list')}
            >
              List
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Client</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <option value="">All Clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Project</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setClientFilter('')
                    setProjectFilter('')
                    setSearchQuery('')
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {view === 'board' ? (
        <WorkspaceBoard reports={reports} onStatusChange={handleStatusChange} />
      ) : (
        <WorkspaceList reports={reports} />
      )}
    </div>
  )
}

