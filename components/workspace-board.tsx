'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'

interface Report {
  id: string
  title: string
  clientName: string
  projectTitle: string
  status: string
  priority: number | null
  dueDate: string | null
  lastEditedAt: string | null
  lastEditedBy: { id: string; name: string } | null
  assignedUsers: Array<{ id: string; name: string; role: string }>
}

const STATUSES = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'drafting', label: 'Drafting' },
  { id: 'in_review', label: 'In Review' },
  { id: 'ready_for_export', label: 'Ready for Export' },
  { id: 'delivered', label: 'Delivered' },
]

function StatusColumn({
  id,
  label,
  reports,
  onStatusChange,
}: {
  id: string
  label: string
  reports: Report[]
  onStatusChange: (reportId: string, newStatus: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { status: id },
  })

  return (
    <div className="min-h-[600px]">
      <div className="mb-4">
        <h2 className="font-semibold text-lg mb-1">{label}</h2>
        <p className="text-sm text-muted-foreground">
          {reports.length} report{reports.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-gray-50 rounded-lg p-4 min-h-[500px] ${
          isOver ? 'bg-blue-100' : ''
        }`}
      >
        <SortableContext
          items={reports.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

function ReportCard({
  report,
  onStatusChange,
}: {
  report: Report
  onStatusChange: (reportId: string, newStatus: string) => void
}) {
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: report.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return 'bg-gray-100 text-gray-600'
    if (priority === 1) return 'bg-red-100 text-red-700'
    if (priority === 2) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  const getPriorityLabel = (priority: number | null) => {
    if (!priority) return 'Normal'
    if (priority === 1) return 'High'
    if (priority === 2) return 'Medium'
    return 'Low'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="mb-3 cursor-move hover:shadow-md transition-shadow"
        onClick={() => router.push(`/reports/${report.id}/workspace`)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-sm">{report.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded ${getPriorityColor(
                report.priority
              )}`}
            >
              {getPriorityLabel(report.priority)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {report.clientName} • {report.projectTitle}
          </p>
          {report.assignedUsers.length > 0 && (
            <div className="flex gap-1 mb-2">
              {report.assignedUsers.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center"
                  title={user.name}
                >
                  {getInitials(user.name)}
                </div>
              ))}
              {report.assignedUsers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">
                  +{report.assignedUsers.length - 3}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            {report.dueDate && (
              <span>Due: {formatDate(report.dueDate)}</span>
            )}
            {report.lastEditedAt && (
              <span>Edited {formatDate(report.lastEditedAt)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function WorkspaceBoard({
  reports,
  onStatusChange,
}: {
  reports: Report[]
  onStatusChange: (reportId: string, newStatus: string) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedReport, setDraggedReport] = useState<Report | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    const report = reports.find((r) => r.id === event.active.id)
    setDraggedReport(report || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDraggedReport(null)

    if (!over) return

    const reportId = active.id as string
    let newStatus: string | null = null

    // Check if dropped on a status column
    const statusElement = (over.data.current as any)?.status
    if (statusElement) {
      newStatus = statusElement
    } else {
      // Check if dropped on a status column div
      const target = over.id as string
      if (STATUSES.find((s) => s.id === target)) {
        newStatus = target
      }
    }

    if (newStatus) {
      onStatusChange(reportId, newStatus)
    }
  }

  const reportsByStatus = STATUSES.map((status) => ({
    ...status,
    reports: reports.filter((r) => r.status === status.id),
  }))

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-5 gap-4">
        {reportsByStatus.map((column) => (
          <StatusColumn
            key={column.id}
            id={column.id}
            label={column.label}
            reports={column.reports}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
      <DragOverlay>
        {draggedReport ? (
          <Card className="w-64 opacity-90">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm">{draggedReport.title}</h3>
              <p className="text-xs text-muted-foreground">
                {draggedReport.clientName}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

