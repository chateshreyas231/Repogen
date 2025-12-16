'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface ReportSection {
  id: string
  title: string
  order: number
  content: string
  aiGenerated: boolean
}

interface Report {
  id: string
  status: string
  project: {
    id: string
    title: string
    client: {
      id: string
      name: string
    }
  }
  template: {
    name: string
  }
  sections: ReportSection[]
}

interface User {
  id: string
  name: string
  email: string
  lastActiveAt?: string
}

interface Assignment {
  id: string
  userId: string
  role: string
  user: User
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  assigneeId: string | null
  assignee: User | null
  dueDate: string | null
  createdBy: {
    id: string
    name: string
  }
}

interface Activity {
  id: string
  type: string
  details: any
  user: { id: string; name: string } | null
  createdAt: string
}

export function ReportWorkspace({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'collaborators' | 'tasks' | 'activity'>('collaborators')
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    fetchReport()
    fetchUsers()

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      if (polling) {
        fetchReport()
        fetchAssignments()
        fetchTasks()
        fetchActivity()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [reportId, polling])

  useEffect(() => {
    if (report) {
      fetchAssignments()
    }
  }, [report])

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data)
        if (data.sections.length > 0 && !selectedSectionId) {
          setSelectedSectionId(data.sections[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching report:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.assignments) {
          setAssignments(
            data.assignments.map((a: any) => ({
              id: a.id,
              userId: a.userId,
              role: a.role,
              user: a.user,
            }))
          )
        }
      }
    } catch (err) {
      console.error('Error fetching assignments:', err)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
    }
  }

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (err) {
      console.error('Error fetching activity:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const handleAssignUser = async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      if (response.ok) {
        fetchAssignments()
        fetchActivity()
      }
    } catch (err) {
      console.error('Error assigning user:', err)
    }
  }

  const handleCreateTask = async (title: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status: 'todo' }),
      })
      if (response.ok) {
        fetchTasks()
      }
    } catch (err) {
      console.error('Error creating task:', err)
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        fetchTasks()
      }
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  if (loading || !report) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading workspace...</div>
      </div>
    )
  }

  const selectedSection = report.sections.find((s) => s.id === selectedSectionId)

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel - Outline */}
      <div className="w-64 border-r bg-muted/30 overflow-y-auto">
        <div className="p-4">
          <div className="mb-4">
            <Link href={`/clients/${report.project.client.id}`} className="text-sm text-muted-foreground hover:text-foreground">
              {report.project.client.name}
            </Link>
            <h2 className="font-semibold mt-1">{report.project.title}</h2>
            <h1 className="text-lg font-bold mt-2">{report.template.name}</h1>
          </div>
          <div className="space-y-1">
            {report.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSectionId(section.id)}
                className={`w-full text-left p-2 rounded text-sm hover:bg-accent ${
                  selectedSectionId === section.id ? 'bg-accent font-medium' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{section.title}</span>
                  {section.aiGenerated && (
                    <span className="text-xs text-primary">AI</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center Panel - Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto">
          {selectedSection ? (
            <SectionEditor
              reportId={reportId}
              section={selectedSection}
              onUpdate={fetchReport}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              Select a section to edit
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Context */}
      <div className="w-80 border-l bg-muted/30 overflow-y-auto">
        <div className="p-4">
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => setActiveTab('collaborators')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'collaborators'
                  ? 'border-b-2 border-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Collaborators
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'tasks'
                  ? 'border-b-2 border-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'activity'
                  ? 'border-b-2 border-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Activity
            </button>
          </div>

          {activeTab === 'collaborators' && (
            <CollaboratorsPanel
              reportId={reportId}
              assignments={assignments}
              onAssign={handleAssignUser}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksPanel
              reportId={reportId}
              tasks={tasks}
              onCreate={handleCreateTask}
              onUpdate={handleUpdateTask}
            />
          )}

          {activeTab === 'activity' && <ActivityPanel activities={activities} />}
        </div>
      </div>
    </div>
  )
}

function SectionEditor({
  reportId,
  section,
  onUpdate,
}: {
  reportId: string
  section: ReportSection
  onUpdate: () => void
}) {
  const [content, setContent] = useState(section.content)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    setContent(section.content)
  }, [section.content])

  const handleContentChange = (value: string) => {
    setContent(value)
    clearTimeout((window as any)[`save-${section.id}`])
    ;(window as any)[`save-${section.id}`] = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`/api/reports/${reportId}/sections/${section.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: value }),
        })
        onUpdate()
      } catch (err) {
        console.error('Error saving section:', err)
      } finally {
        setSaving(false)
      }
    }, 1000)
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await fetch(`/api/reports/${reportId}/sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      })
      onUpdate()
    } catch (err) {
      console.error('Error regenerating section:', err)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{section.title}</h2>
        <div className="flex gap-2">
          {saving && <span className="text-sm text-muted-foreground">Saving...</span>}
          <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? 'Regenerating...' : 'Regenerate with AI'}
          </Button>
        </div>
      </div>
      <ReactQuill
        theme="snow"
        value={content}
        onChange={handleContentChange}
        placeholder="Enter section content..."
        className="bg-background"
      />
    </div>
  )
}

function CollaboratorsPanel({
  reportId,
  assignments,
  onAssign,
}: {
  reportId: string
  assignments: Assignment[]
  onAssign: (userId: string, role: string) => void
}) {
  const [users, setUsers] = useState<User[]>([])
  const [showAssign, setShowAssign] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('drafter')

  useEffect(() => {
    // Fetch all users - we'll need to create this endpoint
    // For now, use a placeholder
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isRecentlyActive = (lastActiveAt?: string) => {
    if (!lastActiveAt) return false
    const lastActive = new Date(lastActiveAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastActive.getTime()) / 1000 / 60
    return diffMinutes < 10
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Collaborators</h3>
        <Button size="sm" onClick={() => setShowAssign(!showAssign)}>
          Assign
        </Button>
      </div>
      {showAssign && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-2">
            <div>
              <Label>User</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="drafter">Drafter</option>
                <option value="reviewer">Reviewer</option>
                <option value="lead">Lead</option>
              </select>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (selectedUserId) {
                  onAssign(selectedUserId, selectedRole)
                  setShowAssign(false)
                }
              }}
            >
              Assign
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No collaborators assigned</p>
      ) : (
        assignments.map((assignment) => (
          <div key={assignment.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {getInitials(assignment.user.name || assignment.user.email)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {assignment.user.name || assignment.user.email}
              </div>
              <div className="text-xs text-muted-foreground">
                {assignment.role}
                {isRecentlyActive(assignment.user.lastActiveAt) && (
                  <span className="ml-2 text-green-600">• Active</span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
      </div>
    </div>
  )
}

function TasksPanel({
  reportId,
  tasks,
  onCreate,
  onUpdate,
}: {
  reportId: string
  tasks: Task[]
  onCreate: (title: string) => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
}) {
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const handleCreate = () => {
    if (newTaskTitle.trim()) {
      onCreate(newTaskTitle)
      setNewTaskTitle('')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button size="sm" onClick={handleCreate}>
            Add
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet</p>
        ) : (
          tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={(e) =>
                    onUpdate(task.id, { status: e.target.checked ? 'done' : 'todo' })
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{task.title}</div>
                  {task.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {task.description}
                    </div>
                  )}
                  {task.assignee && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Assigned to: {task.assignee.name || task.assignee.email}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  )
}

function ActivityPanel({ activities }: { activities: Activity[] }) {
  const formatActivity = (activity: Activity) => {
    const userName = activity.user?.name || 'System'
    const time = new Date(activity.createdAt).toLocaleTimeString()

    switch (activity.type) {
      case 'created':
        return `${userName} created the report (${time})`
      case 'status_change':
        const details = activity.details
        return `${userName} moved from ${details?.from} → ${details?.to} (${time})`
      case 'ai_generation':
        return `${userName} generated content with AI (${time})`
      case 'section_edited':
        return `${userName} edited a section (${time})`
      case 'exported':
        return `${userName} exported the report (${time})`
      default:
        return `${userName} performed an action (${time})`
    }
  }

  return (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet</p>
      ) : (
        activities.map((activity) => (
        <div key={activity.id} className="text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <div>{formatActivity(activity)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(activity.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        ))
      )}
    </div>
  )
}

