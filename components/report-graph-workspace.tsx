'use client'

import { useState, useEffect } from 'react'
import { ResourcesPanel } from './graph/resources-panel'
import { FlowCanvas } from './graph/flow-canvas'
import { ReportPreview } from './graph/report-preview'
import type { Node } from 'reactflow'

interface Report {
  id: string
  title: string
  project: {
    id: string
    name: string
  }
}

export function ReportGraphWorkspace({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<Report | null>(null)
  const [resources, setResources] = useState<any[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Panel sizes
  const [leftPanelWidth, setLeftPanelWidth] = useState(280)
  const [rightPanelWidth, setRightPanelWidth] = useState(384)
  const [isLeftMinimized, setIsLeftMinimized] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const [isResizingLeft, setIsResizingLeft] = useState(false)

  useEffect(() => {
    fetchData()
  }, [reportId])

  const fetchData = async () => {
    try {
      const [reportRes, nodesRes] = await Promise.all([
        fetch(`/api/reports/${reportId}`),
        fetch(`/api/reports/${reportId}/nodes`),
      ])

      if (reportRes.ok) {
        const reportData = await reportRes.json()
        setReport(reportData)
        
        // Fetch resources from project
        if (reportData.project?.id) {
          const resourcesRes = await fetch(
            `/api/projects/${reportData.project.id}/resources`
          )
          if (resourcesRes.ok) {
            const resourcesData = await resourcesRes.json()
            setResources(resourcesData || [])
          }
        }
      }

      if (nodesRes.ok) {
        const nodesData = await nodesRes.json()
        setNodes(nodesData.nodes || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Listen for node updates
  useEffect(() => {
    const handleNodesUpdated = () => {
      fetchData()
    }
    window.addEventListener('nodes-updated', handleNodesUpdated)
    return () => window.removeEventListener('nodes-updated', handleNodesUpdated)
  }, [reportId])

  // Handle panel resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX
        const minWidth = 200
        const maxWidth = window.innerWidth * 0.8
        setRightPanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
      }
      if (isResizingLeft) {
        const newWidth = e.clientX
        const minWidth = 50
        const maxWidth = 600
        setLeftPanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
      }
    }

    const handleMouseUp = () => {
      setIsResizingRight(false)
      setIsResizingLeft(false)
    }

    if (isResizingRight || isResizingLeft) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingRight, isResizingLeft, isLeftMinimized, leftPanelWidth])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading workspace...</div>
      </div>
    )
  }

  if (!report) {
    return <div>Report not found</div>
  }

  const effectiveLeftWidth = isLeftMinimized ? 50 : leftPanelWidth

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId)
    window.dispatchEvent(new CustomEvent('select-node', { detail: { nodeId } }))
  }


  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel - Resources (Resizable & Minimizable) */}
      <div
        className="border-r bg-muted/30 overflow-hidden flex-shrink-0 transition-all duration-200 relative"
        style={{ width: `${effectiveLeftWidth}px` }}
      >
        <ResourcesPanel
          resources={resources}
          projectId={report.project.id}
          onResourceAdded={fetchData}
          isMinimized={isLeftMinimized}
          onToggleMinimize={() => setIsLeftMinimized(!isLeftMinimized)}
        />
        {/* Left resize handle */}
        {!isLeftMinimized && (
          <div
            className="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
            style={{ right: '-2px' }}
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizingLeft(true)
            }}
          />
        )}
      </div>


      {/* Center - React Flow Canvas */}
      <div className="flex-1 overflow-hidden bg-background relative">
        <FlowCanvas 
          reportId={reportId} 
          resources={resources}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
        />
      </div>

      {/* Right Panel - Report Preview (Resizable) */}
      <div
        className="border-l bg-background overflow-hidden flex-shrink-0 relative"
        style={{ width: `${rightPanelWidth}px` }}
      >
        <div className="h-full overflow-y-auto">
          <ReportPreview reportId={reportId} />
        </div>
        {/* Right resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
          onMouseDown={(e) => {
            e.preventDefault()
            setIsResizingRight(true)
          }}
        />
      </div>
    </div>
  )
}
