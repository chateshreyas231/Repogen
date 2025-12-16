'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  sections: ReportSection[]
}

function SortableSection({
  section,
  onUpdate,
  onRegenerate,
  reportId,
}: {
  section: ReportSection
  onUpdate: (id: string, content: string) => void
  onRegenerate: (id: string) => Promise<void>
  reportId: string
}) {
  const [content, setContent] = useState(section.content)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  useEffect(() => {
    setContent(section.content)
  }, [section.content])

  const handleContentChange = (value: string) => {
    setContent(value)
    // Debounce save
    clearTimeout((window as any)[`save-${section.id}`])
    ;(window as any)[`save-${section.id}`] = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`/api/reports/${reportId}/sections/${section.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: value }),
        })
        onUpdate(section.id, value)
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
      await onRegenerate(section.id)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              >
                ⋮⋮
              </div>
              <CardTitle>{section.title}</CardTitle>
              {section.aiGenerated && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  AI Generated
                </span>
              )}
              {saving && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerate}
              disabled={regenerating}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate Section'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleContentChange}
            placeholder="Enter section content..."
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function ReportEditor({
  report,
  onUpdate,
}: {
  report: Report
  onUpdate: () => void
}) {
  const [sections, setSections] = useState(report.sections)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    setSections(report.sections)
  }, [report.sections])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id)
      const newIndex = sections.findIndex((s) => s.id === over.id)

      const newSections = arrayMove(sections, oldIndex, newIndex)
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        order: index + 1,
      }))

      setSections(updatedSections)

      // Update order in database
      setUpdating(true)
      try {
        await fetch(`/api/reports/${report.id}/sections`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sections: updatedSections.map((s) => ({
              id: s.id,
              order: s.order,
            })),
          }),
        })
        onUpdate()
      } catch (err) {
        console.error('Error updating section order:', err)
      } finally {
        setUpdating(false)
      }
    }
  }

  const handleContentUpdate = (id: string, content: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content } : s))
    )
  }

  const handleRegenerate = async (sectionId: string) => {
    try {
      const response = await fetch(
        `/api/reports/${report.id}/sections/${sectionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ regenerate: true }),
        }
      )

      if (response.ok) {
        const updatedSection = await response.json()
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId
              ? { ...s, content: updatedSection.content, aiGenerated: true }
              : s
          )
        )
        onUpdate()
      }
    } catch (err) {
      console.error('Error regenerating section:', err)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        {updating && (
          <div className="mb-4 text-sm text-muted-foreground">
            Updating section order...
          </div>
        )}
        {sections.map((section) => (
          <SortableSection
            key={section.id}
            section={section}
            onUpdate={handleContentUpdate}
            onRegenerate={handleRegenerate}
            reportId={report.id}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}

