'use client'

import { useState, useEffect } from 'react'
import { ResourcesSidebar } from './canvas/resources-sidebar'
import { CanvasArea } from './canvas/canvas-area'
import { SectionTree } from './canvas/section-tree'
import { ReportPreview } from './canvas/report-preview'

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
  childBlocks?: CanvasBlock[]
}

interface ProjectResource {
  id: string
  type: string
  title: string | null
  content: string
}

export function ReportCanvas({ reportId }: { reportId: string }) {
  const [blocks, setBlocks] = useState<CanvasBlock[]>([])
  const [resources, setResources] = useState<ProjectResource[]>([])
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchData()
  }, [reportId])

  const fetchData = async () => {
    try {
      const [blocksRes, reportRes] = await Promise.all([
        fetch(`/api/reports/${reportId}/canvas/blocks`),
        fetch(`/api/reports/${reportId}`),
      ])

      if (blocksRes.ok) {
        const blocksData = await blocksRes.json()
        setBlocks(blocksData.blocks || [])
      }

      if (reportRes.ok) {
        const reportData = await reportRes.json()
        setReport(reportData)
        const projectId = reportData.project?.id
        if (projectId) {
          const resourcesRes = await fetch(`/api/projects/${projectId}/resources`)
          if (resourcesRes.ok) {
            const resourcesData = await resourcesRes.json()
            setResources(resourcesData || [])
          }
        }
      }
    } catch (err) {
      console.error('Error fetching canvas data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUpdate = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading canvas...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar - Resources */}
      {report?.project?.id && (
        <div className="w-64 border-r bg-muted/30 overflow-y-auto">
          <ResourcesSidebar
            resources={resources}
            projectId={report.project.id}
            onResourceAdded={fetchData}
          />
        </div>
      )}

      {/* Center - Canvas */}
      <div className="flex-1 overflow-y-auto bg-background">
        <CanvasArea
          reportId={reportId}
          blocks={blocks}
          resources={resources}
          onUpdate={handleBlockUpdate}
        />
      </div>

      {/* Right Sidebar - Section Tree */}
      <div className="w-64 border-l bg-muted/30 overflow-y-auto">
        <SectionTree
          blocks={blocks}
          onBlockSelect={(blockId) => {
            const element = document.getElementById(`block-${blockId}`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
        />
      </div>

      {/* Far Right - Preview (Toggle) */}
      {showPreview && (
        <div className="w-96 border-l bg-background overflow-y-auto">
          <ReportPreview blocks={blocks} />
        </div>
      )}

      {/* Preview Toggle Button */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg hover:bg-primary/90"
      >
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </button>
    </div>
  )
}

