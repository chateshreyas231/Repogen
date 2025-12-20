'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { Stage, Layer, Group, Rect, Text, Line, Circle, Arrow } from 'react-konva'
import Konva from 'konva'
import { Button } from '@/components/ui/button'
import { RefreshCw, Sparkles } from 'lucide-react'
import { NodeAddDialog } from './node-add-dialog'
import { NodeOverlay } from './node-overlay'

// Node data structure (simplified from React Flow)
interface CanvasNode {
  id: string
  type: string
  x: number
  y: number
  data: any
  selected?: boolean
  parentNodeId?: string | null
  order?: number
}

interface CanvasEdge {
  id: string
  source: string
  target: string
}

const NODE_COLORS: Record<string, string> = {
  section: '#2563eb',
  sub_section: '#059669',
  table: '#ea580c',
  diagram: '#dc2626',
  content: '#64748b',
  prompt: '#9333ea',
  checklist: '#16a34a',
  chart: '#0284c7',
  reference: '#7c3aed',
  signature: '#be123c',
  start: '#10b981',
  end: '#ef4444',
}

const NODE_WIDTH = 300
const NODE_HEIGHT = 80
const VERTICAL_SPACING = 140
const CENTER_X = 400

export function KonvaCanvas({
  reportId,
  resources,
  selectedNodeId,
  onNodeSelect,
}: {
  reportId: string
  resources: any[]
  selectedNodeId?: string | null
  onNodeSelect?: (nodeId: string) => void
}) {
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [edges, setEdges] = useState<CanvasEdge[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 })
  const [isDraggingStage, setIsDraggingStage] = useState(false)
  const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 })
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [overlayPositions, setOverlayPositions] = useState<Record<string, { x: number; y: number }>>({})
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<Konva.Layer>(null)

  // Store resources globally
  useEffect(() => {
    ;(window as any).__reportResources = resources
  }, [resources])

  // Update stage size based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setStageSize({ width: rect.width, height: rect.height })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Update overlay positions when nodes move or canvas transforms
  useEffect(() => {
    const updateOverlayPositions = () => {
      if (!stageRef.current || !containerRef.current) return

      const stage = stageRef.current
      const scale = stage.scaleX()
      const stagePos = stage.position()

      const newPositions: Record<string, { x: number; y: number }> = {}
      nodes.forEach((node) => {
        if (node.type === 'start' || node.type === 'end') return

        // Convert Konva world coordinates to container-relative coordinates
        // Formula: x = (node.x * scale) + stage.x()
        const x = (node.x * scale) + stagePos.x
        const y = (node.y * scale) + stagePos.y
        newPositions[node.id] = { x, y }
      })
      setOverlayPositions(newPositions)
    }

    updateOverlayPositions()

    // Update on stage transform changes
    const handleTransform = () => {
      requestAnimationFrame(updateOverlayPositions)
    }

    if (stageRef.current) {
      const stage = stageRef.current
      stage.on('dragmove', handleTransform)
      stage.on('wheel', handleTransform)
    }

    // Also update on node drag and stage position changes
    const interval = setInterval(updateOverlayPositions, 16) // ~60fps
    return () => {
      clearInterval(interval)
      if (stageRef.current) {
        const stage = stageRef.current
        stage.off('dragmove', handleTransform)
        stage.off('wheel', handleTransform)
      }
    }
  }, [nodes, stagePos, stageScale])

  // Fetch nodes from API
  const fetchNodes = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/nodes`)
      if (response.ok) {
        const data = await response.json()
        const fetchedNodes = (data.nodes || []).map((node: any) => ({
          id: node.id,
          type: node.type,
          x: node.positionX || node.position?.x || CENTER_X,
          y: node.positionY || node.position?.y || 0,
          data: typeof node.data === 'string' ? JSON.parse(node.data) : node.data,
          parentNodeId: node.parentNodeId || null,
          order: node.order || 0,
        }))

        // Ensure Start and End nodes exist
        let startNode = fetchedNodes.find((n) => n.type === 'start')
        let endNode = fetchedNodes.find((n) => n.type === 'end')

        if (!startNode) {
          const startResponse = await fetch(`/api/reports/${reportId}/nodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'start',
              position: { x: CENTER_X, y: 0 },
              data: { title: 'Start' },
            }),
          })
          if (startResponse.ok) {
            const startData = await startResponse.json()
            startNode = {
              id: startData.id,
              type: 'start',
              x: CENTER_X,
              y: 0,
              data: { title: 'Start' },
            }
          }
        }

        if (!endNode) {
          const sortedNodes = [...fetchedNodes].sort((a, b) => a.order - b.order)
          const lastY = sortedNodes.length > 0 ? sortedNodes[sortedNodes.length - 1].y + 200 : 200

          const endResponse = await fetch(`/api/reports/${reportId}/nodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'end',
              position: { x: CENTER_X, y: lastY },
              data: { title: 'End' },
            }),
          })
          if (endResponse.ok) {
            const endData = await endResponse.json()
            endNode = {
              id: endData.id,
              type: 'end',
              x: CENTER_X,
              y: lastY,
              data: { title: 'End' },
            }
          }
        }

        const regularNodes = fetchedNodes.filter((n: CanvasNode) => n.type !== 'start' && n.type !== 'end')
        const allNodes = [startNode, ...regularNodes, endNode].filter(Boolean) as CanvasNode[]
        setNodes(allNodes)

        // Build edges
        const newEdges: CanvasEdge[] = []
        if (startNode && regularNodes.length > 0) {
          newEdges.push({
            id: `e-${startNode.id}-${regularNodes[0].id}`,
            source: startNode.id,
            target: regularNodes[0].id,
          })
        }
        for (let i = 0; i < regularNodes.length - 1; i++) {
          newEdges.push({
            id: `e-${regularNodes[i].id}-${regularNodes[i + 1].id}`,
            source: regularNodes[i].id,
            target: regularNodes[i + 1].id,
          })
        }
        if (endNode && regularNodes.length > 0) {
          newEdges.push({
            id: `e-${regularNodes[regularNodes.length - 1].id}-${endNode.id}`,
            source: regularNodes[regularNodes.length - 1].id,
            target: endNode.id,
          })
        }
        setEdges(newEdges)
      }
    } catch (err) {
      console.error('Error fetching nodes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNodes()
  }, [reportId])

  // Listen for node updates
  useEffect(() => {
    const handleUpdate = () => {
      fetchNodes()
    }
    window.addEventListener('nodes-updated', handleUpdate)
    return () => window.removeEventListener('nodes-updated', handleUpdate)
  }, [])

  // Handle node selection from outline
  useEffect(() => {
    const handleSelectNode = (event: CustomEvent) => {
      const { nodeId } = event.detail
      if (onNodeSelect) {
        onNodeSelect(nodeId)
      }
      const node = nodes.find((n) => n.id === nodeId)
      if (node && stageRef.current) {
        const stage = stageRef.current
        const stageBox = stage.container().getBoundingClientRect()
        const scale = stage.scaleX()
        const x = (stageBox.width / 2) - (node.x * scale)
        const y = (stageBox.height / 2) - (node.y * scale)
        stage.position({ x, y })
        setStagePos({ x, y })
      }
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }))
      )
    }
    window.addEventListener('select-node', handleSelectNode as EventListener)
    return () => window.removeEventListener('select-node', handleSelectNode as EventListener)
  }, [nodes, onNodeSelect])

  // Update selection when prop changes
  useEffect(() => {
    if (selectedNodeId !== undefined) {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === selectedNodeId,
        }))
      )
    }
  }, [selectedNodeId])

  // Save node position
  const saveNodePosition = async (nodeId: string, x: number, y: number) => {
    try {
      await fetch(`/api/reports/${reportId}/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: { x, y },
        }),
      })
    } catch (err) {
      console.error('Error saving node position:', err)
    }
  }

  // Handle stage drag (pan)
  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only pan if clicking on the stage/background or layer, not on a node
    const target = e.target
    const stage = target.getStage()
    if (!stage) return

    // Check if we clicked on the stage itself, layer, or an edge (not a node)
    const clickedOnEmpty = 
      target === stage || 
      target.getType() === 'Layer' ||
      target.getType() === 'Arrow' ||
      target.getType() === 'Line'

    if (clickedOnEmpty) {
      setIsDraggingStage(true)
      const pointerPos = stage.getPointerPosition()
      if (pointerPos) {
        setLastPointerPos(pointerPos)
        // Change cursor to grabbing
        stage.container().style.cursor = 'grabbing'
      }
    }
  }, [])

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    if (!stage) return

    if (isDraggingStage) {
      const pointerPos = stage.getPointerPosition()
      if (!pointerPos) return

      const newPos = {
        x: stagePos.x + (pointerPos.x - lastPointerPos.x),
        y: stagePos.y + (pointerPos.y - lastPointerPos.y),
      }

          stage.position(newPos)
          setStagePos(newPos)
          setLastPointerPos(pointerPos)
        } else {
          // Change cursor based on what we're hovering over
          const target = e.target
          const isNode = target.getType() === 'Group' && target.getParent()?.getType() === 'Layer'
          const isEmpty = target === stage || target.getType() === 'Layer' || target.getType() === 'Arrow'
          
          if (isEmpty) {
            stage.container().style.cursor = 'grab'
          } else if (isNode) {
            stage.container().style.cursor = 'pointer'
          }
        }
      }, [isDraggingStage, stagePos, lastPointerPos])

  // Update stage position and scale state when stage transforms
  useEffect(() => {
    if (!stageRef.current) return

    const stage = stageRef.current
    const updateTransform = () => {
      const pos = stage.position()
      const scale = stage.scaleX()
      setStagePos(pos)
      setStageScale(scale)
    }

    stage.on('dragmove', updateTransform)
    stage.on('wheel', updateTransform)
    return () => {
      stage.off('dragmove', updateTransform)
      stage.off('wheel', updateTransform)
    }
  }, [])

  const handleStageMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    setIsDraggingStage(false)
    const stage = e.target.getStage()
    if (stage) {
      stage.container().style.cursor = 'default'
    }
  }, [])

  // Handle node drag
  const handleNodeDrag = useCallback(
    (nodeId: string) => {
      return (e: Konva.KonvaEventObject<DragEvent>) => {
        // Prevent stage panning when dragging a node
        setIsDraggingStage(false)
        
        const node = e.target
        const newX = Math.max(0, node.x())
        const newY = Math.max(0, node.y())

        // Snap to vertical line
        const snappedX = Math.abs(newX - CENTER_X) < 30 ? CENTER_X : newX

        node.position({ x: snappedX, y: newY })

        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, x: snappedX, y: newY }
              : n
          )
        )

        // Update overlay position for this node
        if (stageRef.current) {
          const stage = stageRef.current
          const scale = stage.scaleX()
          const stagePos = stage.position()
          setOverlayPositions((prev) => ({
            ...prev,
            [nodeId]: {
              x: (snappedX * scale) + stagePos.x,
              y: (newY * scale) + stagePos.y,
            },
          }))
        }
      }
    },
    []
  )

  // Handle node drag end
  const handleNodeDragEnd = useCallback(
    (nodeId: string) => {
      return async (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target
        const x = Math.max(0, node.x())
        const y = Math.max(0, node.y())
        const snappedX = CENTER_X // Always snap to center

        node.position({ x: snappedX, y: y })

        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, x: snappedX, y: y }
              : n
          )
        )

        await saveNodePosition(nodeId, snappedX, y)
        setDraggedNodeId(null)
      }
    },
    [reportId]
  )

  // Handle node click
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      return () => {
        if (onNodeSelect) {
          onNodeSelect(nodeId)
        }
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === nodeId,
          }))
        )
      }
    },
    [onNodeSelect]
  )

  // Toggle node expand/collapse
  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })

    // Update node data
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: { ...n.data, isExpanded: !expandedNodes.has(nodeId) },
            }
          : n
      )
    )
  }, [expandedNodes])

  // Handle node data update
  const handleNodeUpdate = useCallback((nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, ...updates } }
          : n
      )
    )
  }, [])

  // Render a node
  const renderNode = (node: CanvasNode) => {
    const color = NODE_COLORS[node.type] || '#3b82f6'
    const isSelected = node.selected || selectedNodeId === node.id
    const title = node.data?.title || `Untitled ${node.type}`

    if (node.type === 'start' || node.type === 'end') {
      // Circular nodes for start/end
      const radius = 60
      return (
        <Group
          key={node.id}
          x={node.x}
          y={node.y}
          draggable={false}
          onClick={handleNodeClick(node.id)}
        >
          <Circle
            radius={radius}
            fill={color}
            stroke={isSelected ? '#000' : color}
            strokeWidth={isSelected ? 3 : 2}
            shadowBlur={isSelected ? 10 : 5}
            shadowColor="rgba(0,0,0,0.3)"
          />
          <Text
            text={node.type === 'start' ? 'Start' : 'End'}
            fontSize={14}
            fontStyle="bold"
            fill="white"
            align="center"
            verticalAlign="middle"
            width={radius * 2}
            height={radius * 2}
            offsetX={radius}
            offsetY={radius}
          />
        </Group>
      )
    }

    // Regular rectangular nodes
    const isExpanded = expandedNodes.has(node.id) || node.data?.isExpanded
    const height = isExpanded ? 200 : NODE_HEIGHT
    const borderLeftWidth = 4

    return (
      <Group
        key={node.id}
        id={`node-${node.id}`}
        x={node.x}
        y={node.y}
        draggable={true}
        onDragStart={() => setDraggedNodeId(node.id)}
        onDragMove={handleNodeDrag(node.id)}
        onDragEnd={handleNodeDragEnd(node.id)}
        onClick={handleNodeClick(node.id)}
      >
        {/* Background */}
        <Rect
          width={NODE_WIDTH}
          height={height}
          fill={isExpanded ? '#ffffff' : `${color}08`}
          stroke={isSelected ? '#000' : `${color}40`}
          strokeWidth={isSelected ? 2 : 1.5}
          cornerRadius={8}
          shadowBlur={isSelected ? 10 : 5}
          shadowColor="rgba(0,0,0,0.2)"
        />
        {/* Left border accent */}
        <Rect
          x={0}
          y={0}
          width={borderLeftWidth}
          height={height}
          fill={color}
          cornerRadius={[8, 0, 0, 8]}
        />
        {/* Title */}
        <Text
          x={borderLeftWidth + 12}
          y={16}
          text={title}
          fontSize={15}
          fontStyle="600"
          fill={color}
          width={NODE_WIDTH - borderLeftWidth - 24}
        />
        {/* Status badge if exists */}
        {node.data?.content && (
          <Text
            x={borderLeftWidth + 12}
            y={40}
            text={node.data?.aiGenerated ? 'AI' : 'ED'}
            fontSize={10}
            fill="#64748b"
          />
        )}
      </Group>
    )
  }

  // Render an edge
  const renderEdge = (edge: CanvasEdge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const targetNode = nodes.find((n) => n.id === edge.target)

    if (!sourceNode || !targetNode) return null

    const sourceY = sourceNode.type === 'start' || sourceNode.type === 'end' 
      ? sourceNode.y + 60 
      : sourceNode.y + NODE_HEIGHT
    const targetY = targetNode.y

    return (
      <Arrow
        key={edge.id}
        points={[sourceNode.x, sourceY, targetNode.x, targetY]}
        stroke="#cbd5e1"
        strokeWidth={1.5}
        fill="#94a3b8"
        pointerLength={10}
        pointerWidth={10}
      />
    )
  }

  // Handle add node
  const handleAddNode = async (
    type: string,
    position: { x: number; y: number },
    parentNodeId: string | null = null
  ) => {
    try {
      const regularNodes = nodes
        .filter((n) => n.type !== 'start' && n.type !== 'end')
        .sort((a, b) => a.order - b.order)

      let newX = CENTER_X
      let newY = 150

      if (regularNodes.length > 0) {
        const lastNode = regularNodes[regularNodes.length - 1]
        newY = lastNode.y + VERTICAL_SPACING
      }

      const response = await fetch(`/api/reports/${reportId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          position: { x: newX, y: newY },
          data: {
            title: type === 'section' ? 'New Section' : `New ${type}`,
            color: NODE_COLORS[type] || '#3b82f6',
          },
          parentNodeId: parentNodeId || null,
        }),
      })

      if (response.ok) {
        await fetchNodes()
        setTimeout(() => {
          handleRefreshLayout()
        }, 100)
      }
    } catch (err) {
      console.error('Error adding node:', err)
    }
  }

  // Refresh layout
  const handleRefreshLayout = () => {
    const startNode = nodes.find((n) => n.type === 'start')
    const endNode = nodes.find((n) => n.type === 'end')
    const regularNodes = nodes
      .filter((n) => n.type !== 'start' && n.type !== 'end')
      .sort((a, b) => a.order - b.order)

    const updatedNodes = nodes.map((node) => {
      if (node.type === 'start') {
        return { ...node, x: CENTER_X, y: 0 }
      } else if (node.type === 'end') {
        const endY = regularNodes.length > 0
          ? 150 + regularNodes.length * VERTICAL_SPACING + VERTICAL_SPACING
          : 150 + VERTICAL_SPACING
        return { ...node, x: CENTER_X, y: endY }
      } else {
        const nodeIndex = regularNodes.findIndex((n) => n.id === node.id)
        if (nodeIndex >= 0) {
          return { ...node, x: CENTER_X, y: 150 + nodeIndex * VERTICAL_SPACING }
        }
      }
      return node
    })

    setNodes(updatedNodes)

    // Save positions
    updatedNodes.forEach((node) => {
      saveNodePosition(node.id, node.x, node.y)
    })

    // Rebuild edges
    const newEdges: CanvasEdge[] = []
    if (startNode && regularNodes.length > 0) {
      newEdges.push({
        id: `e-${startNode.id}-${regularNodes[0].id}`,
        source: startNode.id,
        target: regularNodes[0].id,
      })
    }
    for (let i = 0; i < regularNodes.length - 1; i++) {
      newEdges.push({
        id: `e-${regularNodes[i].id}-${regularNodes[i + 1].id}`,
        source: regularNodes[i].id,
        target: regularNodes[i + 1].id,
      })
    }
    if (endNode && regularNodes.length > 0) {
      newEdges.push({
        id: `e-${regularNodes[regularNodes.length - 1].id}-${endNode.id}`,
        source: regularNodes[regularNodes.length - 1].id,
        target: endNode.id,
      })
    }
    setEdges(newEdges)
  }

  // Generate all
  const handleGenerateAll = async () => {
    const sectionNodes = nodes.filter((n) => n.type === 'section')
    if (sectionNodes.length === 0) return

    try {
      const response = await fetch(`/api/reports/${reportId}/generate-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionNodeIds: sectionNodes.map((n) => n.id),
        }),
      })

      if (response.ok) {
        fetchNodes()
        window.dispatchEvent(new Event('nodes-updated'))
      }
    } catch (err) {
      console.error('Error generating all sections:', err)
    }
  }

  // Draw background grid
  const drawGrid = (layer: Konva.Layer) => {
    const width = layer.width()
    const height = layer.height()
    const gap = 60

    for (let x = 0; x < width; x += gap) {
      layer.add(
        new Konva.Line({
          points: [x, 0, x, height],
          stroke: 'rgba(148, 163, 184, 0.08)',
          strokeWidth: 1,
        })
      )
    }

    for (let y = 0; y < height; y += gap) {
      layer.add(
        new Konva.Line({
          points: [0, y, width, y],
          stroke: 'rgba(148, 163, 184, 0.08)',
          strokeWidth: 1,
        })
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-sm text-muted-foreground">Loading canvas...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="h-full w-full relative bg-gradient-to-br from-slate-50 to-slate-100"
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={() => {
          setIsDraggingStage(false)
          if (stageRef.current) {
            stageRef.current.container().style.cursor = 'default'
          }
        }}
        onWheel={(e) => {
          e.evt.preventDefault()
          const scaleBy = 1.1
          const stage = e.target.getStage()
          if (!stage) return

          const oldScale = stage.scaleX()
          const pointer = stage.getPointerPosition()
          if (!pointer) return

          const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
          }

          const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy
          const clampedScale = Math.max(0.1, Math.min(2, newScale))

          stage.scale({ x: clampedScale, y: clampedScale })
          setStageScale(clampedScale)

          const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
          }
          stage.position(newPos)
          setStagePos(newPos)
          
          // Trigger overlay position update
          requestAnimationFrame(() => {
            const updateOverlayPositions = () => {
              if (!stageRef.current || !containerRef.current) return
              const stage = stageRef.current
              const scale = stage.scaleX()
              const stagePos = stage.position()
              const newPositions: Record<string, { x: number; y: number }> = {}
              nodes.forEach((node) => {
                if (node.type === 'start' || node.type === 'end') return
                const x = (node.x * scale) + stagePos.x
                const y = (node.y * scale) + stagePos.y
                newPositions[node.id] = { x, y }
              })
              setOverlayPositions(newPositions)
            }
            updateOverlayPositions()
          })
        }}
      >
        <Layer ref={layerRef}>
          {/* Background grid will be drawn here */}
          {nodes.map(renderNode)}
          {edges.map(renderEdge)}
        </Layer>
      </Stage>

      {/* HTML Overlays for Node Editing */}
      <div className="absolute inset-0 pointer-events-none">
        {nodes
          .filter((node) => node.type !== 'start' && node.type !== 'end')
          .map((node) => {
            const position = overlayPositions[node.id] || { x: node.x, y: node.y }
            return (
              <NodeOverlay
                key={node.id}
                nodeId={node.id}
                nodeType={node.type}
                nodeData={node.data}
                position={position}
                isExpanded={expandedNodes.has(node.id) || node.data?.isExpanded}
                onToggleExpand={() => handleToggleExpand(node.id)}
                onUpdate={(updates) => handleNodeUpdate(node.id, updates)}
                reportId={reportId}
                color={NODE_COLORS[node.type] || '#3b82f6'}
                isSelected={node.selected || selectedNodeId === node.id}
              />
            )
          })}
      </div>

      {/* Controls Panel */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg p-2 flex gap-2">
          <NodeAddMenu onAddNode={handleAddNode} nodes={nodes} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshLayout}
            className="gap-2 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateAll}
            className="gap-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Generate All
          </Button>
        </div>
      </div>
    </div>
  )
}

// Node Add Menu component
function NodeAddMenu({
  onAddNode,
  nodes,
}: {
  onAddNode: (type: string, position: { x: number; y: number }, parentNodeId: string | null) => void
  nodes: CanvasNode[]
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const handleAdd = (type: string) => {
    setSelectedType(type)
    setShowMenu(false)
  }

  const handleDialogConfirm = (parentNodeId: string | null) => {
    if (selectedType) {
      onAddNode(selectedType, { x: 250, y: 200 }, parentNodeId)
    }
    setSelectedType(null)
  }

  const handleDialogClose = () => {
    setSelectedType(null)
  }

  return (
    <>
      <div className="relative">
        <Button
          onClick={() => setShowMenu(!showMenu)}
          size="sm"
          className="shadow-sm"
        >
          + Add Node
        </Button>
        {showMenu && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-background border rounded-md shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
              Structure
            </div>
            <button
              onClick={() => handleAdd('section')}
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
            >
              Section
            </button>
            <button
              onClick={() => handleAdd('sub_section')}
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
            >
              Sub-Section
            </button>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase mt-2">
              Content
            </div>
            <button
              onClick={() => handleAdd('content')}
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
            >
              Content
            </button>
            <button
              onClick={() => handleAdd('prompt')}
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
            >
              Prompt
            </button>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase mt-2">
              Data & Media
            </div>
            <button
              onClick={() => handleAdd('table')}
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
            >
              Table
            </button>
            <button
              onClick={() => handleAdd('diagram')}
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
            >
              Diagram
            </button>
            <button
              onClick={() => handleAdd('checklist')}
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
            >
              Checklist
            </button>
            <button
              onClick={() => handleAdd('chart')}
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
            >
              Chart
            </button>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase mt-2">
              References & Approval
            </div>
            <button
              onClick={() => handleAdd('reference')}
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
            >
              Reference
            </button>
            <button
              onClick={() => handleAdd('signature')}
              className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
            >
              Signature
            </button>
          </div>
        )}
      </div>
      {selectedType && (
        <NodeAddDialog
          isOpen={true}
          onClose={handleDialogClose}
          onConfirm={handleDialogConfirm}
          nodeType={selectedType}
          existingNodes={nodes.map((n) => ({ id: n.id, type: n.type } as any))}
        />
      )}
    </>
  )
}

