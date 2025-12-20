'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  NodeTypes,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from '@/components/ui/button'
import { RefreshCw, Sparkles } from 'lucide-react'
import { SectionNode } from './nodes/section-node'
import { SubSectionNode } from './nodes/subsection-node'
import { ContentNode } from './nodes/content-node'
import { PromptNode } from './nodes/prompt-node'
import { TableNode } from './nodes/table-node'
import { DiagramNode } from './nodes/diagram-node'
import { StartNode } from './nodes/start-node'
import { EndNode } from './nodes/end-node'
import { ChecklistNode } from './nodes/checklist-node'
import { ChartNode } from './nodes/chart-node'
import { ReferenceNode } from './nodes/reference-node'
import { SignatureNode } from './nodes/signature-node'
import { NodeAddDialog } from './node-add-dialog'
import { NodePalette } from './node-palette'

const nodeTypes: NodeTypes = {
  section: SectionNode,
  sub_section: SubSectionNode,
  content: ContentNode,
  prompt: PromptNode,
  table: TableNode,
  diagram: DiagramNode,
  checklist: ChecklistNode,
  chart: ChartNode,
  reference: ReferenceNode,
  signature: SignatureNode,
  start: StartNode,
  end: EndNode,
}

function FlowCanvasInner({
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
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null)
  const reactFlowInstance = useReactFlow()
  const nodeIdToDeleteRef = useRef<string | null>(null)

  // Handle node selection from outline panel
  useEffect(() => {
    const handleSelectNode = (event: CustomEvent) => {
      const { nodeId } = event.detail
      if (onNodeSelect) {
        onNodeSelect(nodeId)
      }
      // Scroll to node in canvas
      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1, duration: 300 })
        // Highlight node
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === nodeId,
          }))
        )
      }
    }
    window.addEventListener('select-node', handleSelectNode as EventListener)
    return () => window.removeEventListener('select-node', handleSelectNode as EventListener)
  }, [nodes, reactFlowInstance, onNodeSelect, setNodes])

  // Update node selection when selectedNodeId prop changes
  useEffect(() => {
    if (selectedNodeId !== undefined) {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === selectedNodeId,
        }))
      )
    }
  }, [selectedNodeId, setNodes])
  
  // Store resources in a way nodes can access
  useEffect(() => {
    ;(window as any).__reportResources = resources
  }, [resources])

  useEffect(() => {
    fetchNodes()
  }, [reportId])

  const fetchNodes = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/nodes`)
      if (response.ok) {
        const data = await response.json()
        const fetchedNodes = data.nodes || []
        
        // Ensure Start and End nodes exist
        let startNode = fetchedNodes.find((n: Node) => n.type === 'start')
        let endNode = fetchedNodes.find((n: Node) => n.type === 'end')
        
        // Create Start node if it doesn't exist
        if (!startNode) {
          const startResponse = await fetch(`/api/reports/${reportId}/nodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'start',
              position: { x: 400, y: 0 },
              data: { title: 'Start' },
            }),
          })
          if (startResponse.ok) {
            const startData = await startResponse.json()
            startNode = {
              id: startData.id,
              type: 'start',
              position: { x: 400, y: 0 },
              data: { title: 'Start' },
            }
          }
        }
        
        // Create End node if it doesn't exist
        if (!endNode) {
          const sortedNodes = [...fetchedNodes].sort((a: Node, b: Node) => 
            ((a.data as any)?.order ?? 0) - ((b.data as any)?.order ?? 0)
          )
          const lastY = sortedNodes.length > 0 
            ? sortedNodes[sortedNodes.length - 1].position.y + 200
            : 200
          
          const endResponse = await fetch(`/api/reports/${reportId}/nodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'end',
              position: { x: 400, y: lastY },
              data: { title: 'End' },
            }),
          })
          if (endResponse.ok) {
            const endData = await endResponse.json()
            endNode = {
              id: endData.id,
              type: 'end',
              position: { x: 400, y: lastY },
              data: { title: 'End' },
            }
          }
        }
        
        // Separate regular nodes (excluding Start and End)
        const regularNodes = fetchedNodes
          .filter((n: Node) => n.type !== 'start' && n.type !== 'end')
          .sort((a: Node, b: Node) => {
            const aOrder = (a.data as any)?.order ?? a.position.y
            const bOrder = (b.data as any)?.order ?? b.position.y
            return aOrder - bOrder
          })
        
        // Combine: Start → Regular Nodes → End
        const allNodes = [
          startNode,
          ...regularNodes,
          endNode,
        ].filter(Boolean) as Node[]
        
        setNodes(allNodes)
        
        // Build edges: Start → First Node → ... → Last Node → End
        const newEdges: Edge[] = []
        
        // Connect Start to first regular node (if exists)
        if (startNode && regularNodes.length > 0) {
          newEdges.push({
            id: `e-${startNode.id}-${regularNodes[0].id}`,
            source: startNode.id,
            target: regularNodes[0].id,
            type: 'smoothstep',
            animated: false,
          })
        }
        
        // Connect regular nodes in sequence
        for (let i = 0; i < regularNodes.length - 1; i++) {
          newEdges.push({
            id: `e-${regularNodes[i].id}-${regularNodes[i + 1].id}`,
            source: regularNodes[i].id,
            target: regularNodes[i + 1].id,
            type: 'smoothstep',
            animated: false,
          })
        }
        
        // Connect last regular node to End (if exists)
        if (endNode && regularNodes.length > 0) {
          newEdges.push({
            id: `e-${regularNodes[regularNodes.length - 1].id}-${endNode.id}`,
            source: regularNodes[regularNodes.length - 1].id,
            target: endNode.id,
            type: 'smoothstep',
            animated: false,
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

  const saveGraph = useCallback(async () => {
    try {
      // Rebuild edges: Start → Regular Nodes → End
      const startNode = nodes.find((n) => n.type === 'start')
      const endNode = nodes.find((n) => n.type === 'end')
      const regularNodes = nodes
        .filter((n) => n.type !== 'start' && n.type !== 'end')
        .sort((a, b) => {
          const aOrder = (a.data as any)?.order ?? a.position.y
          const bOrder = (b.data as any)?.order ?? b.position.y
          return aOrder - bOrder
        })
      
      const newEdges: Edge[] = []
      
      // Connect Start to first regular node
      if (startNode && regularNodes.length > 0) {
        newEdges.push({
          id: `e-${startNode.id}-${regularNodes[0].id}`,
          source: startNode.id,
          target: regularNodes[0].id,
          type: 'smoothstep',
          animated: false,
        })
      }
      
      // Connect regular nodes in sequence
      for (let i = 0; i < regularNodes.length - 1; i++) {
        newEdges.push({
          id: `e-${regularNodes[i].id}-${regularNodes[i + 1].id}`,
          source: regularNodes[i].id,
          target: regularNodes[i + 1].id,
          type: 'smoothstep',
          animated: false,
        })
      }
      
      // Connect last regular node to End
      if (endNode && regularNodes.length > 0) {
        newEdges.push({
          id: `e-${regularNodes[regularNodes.length - 1].id}-${endNode.id}`,
          source: regularNodes[regularNodes.length - 1].id,
          target: endNode.id,
          type: 'smoothstep',
          animated: false,
        })
      }
      
      setEdges(newEdges)
      
      await fetch(`/api/reports/${reportId}/nodes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges: newEdges }),
      })
    } catch (err) {
      console.error('Error saving graph:', err)
    }
  }, [reportId, nodes, setEdges])

  // Allow connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  const onNodesDelete = useCallback(
    async (deleted: Node[]) => {
      // Prevent deletion of Start and End nodes
      const deletableNodes = deleted.filter(
        (node) => node.type !== 'start' && node.type !== 'end'
      )
      
      if (deletableNodes.length === 0) {
        // If only Start/End nodes were selected, don't delete anything
        return
      }
      
      // Delete nodes from database
      for (const node of deletableNodes) {
        try {
          await fetch(`/api/reports/${reportId}/nodes/${node.id}`, {
            method: 'DELETE',
          })
        } catch (err) {
          console.error('Error deleting node:', err)
        }
      }
      // Notify preview of deletion
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('nodes-updated'))
      }
    },
    [reportId]
  )

  const onNodeDragStop = useCallback(
    (event: any, node: Node) => {
      const centerX = 40
      const verticalSpacing = 5
      
      // All nodes must stay in the vertical line
      let constrainedX = centerX
      let constrainedY = node.position.y
      
      if (node.type === 'start') {
        constrainedX = centerX
        constrainedY = 0
      } else if (node.type === 'end') {
        constrainedX = centerX
        // End stays at the bottom
        const regularNodes = nodes.filter((n) => n.type !== 'start' && n.type !== 'end' && n.id !== node.id)
        if (regularNodes.length > 0) {
          const sortedNodes = [...regularNodes].sort((a, b) => a.position.y - b.position.y)
          const lastNode = sortedNodes[sortedNodes.length - 1]
          constrainedY = lastNode.position.y + verticalSpacing
        } else {
          constrainedY = 15
        }
      } else {
        // All regular nodes must stay in the vertical line
        constrainedX = centerX
        
        // Snap to nearest node Y position to maintain order
        const otherNodes = nodes
          .filter((n) => n.type !== 'start' && n.type !== 'end' && n.id !== node.id)
          .sort((a, b) => a.position.y - b.position.y)
        
        // Find the correct position in the sequence
        let targetY = node.position.y
        for (let i = 0; i < otherNodes.length; i++) {
          if (node.position.y < otherNodes[i].position.y) {
            // Insert before this node
            if (i === 0) {
              targetY = Math.max(150, otherNodes[0].position.y - verticalSpacing)
            } else {
              targetY = (otherNodes[i - 1].position.y + otherNodes[i].position.y) / 2
            }
            break
          }
        }
        // If it's after all nodes, position after the last one
        if (otherNodes.length > 0 && node.position.y >= otherNodes[otherNodes.length - 1].position.y) {
          targetY = otherNodes[otherNodes.length - 1].position.y + verticalSpacing
        }
        constrainedY = targetY
      }

      // Constrain to reasonable bounds
      const minX = -500
      const minY = -500
      const maxX = 2000
      const maxY = 3000

      constrainedX = Math.max(minX, Math.min(maxX, constrainedX))
      constrainedY = Math.max(minY, Math.min(maxY, constrainedY))

      if (constrainedX !== node.position.x || constrainedY !== node.position.y) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? { ...n, position: { x: constrainedX, y: constrainedY } }
              : n
          )
        )
      }
    },
    [nodes, setNodes]
  )

  const onNodeDrag = useCallback(
    (event: any, node: Node) => {
      const centerX = 400
      const snapDistance = 30
      
      // All nodes snap to the vertical line
      if (node.type !== 'start' && node.type !== 'end') {
        const dx = Math.abs(node.position.x - centerX)
        if (dx < snapDistance) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id
                ? { ...n, position: { x: centerX, y: node.position.y } }
                : n
            )
          )
        }
      }
    },
    [setNodes]
  )

    // Save graph when nodes or edges change
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        saveGraph()
      }, 1000)
      return () => clearTimeout(timeoutId)
    }, [nodes, edges, saveGraph])

  const handleAddNode = async (
    type: string,
    position: { x: number; y: number },
    parentNodeId: string | null = null
  ) => {
    try {
    const centerX = 400 // All nodes in vertical line
    const verticalSpacing = 50 // Tight spacing for compact layout
      
      let newX = centerX
      let newY = 100
      
      // All nodes go in the same vertical line
      const regularNodes = nodes
        .filter((n) => n.type !== 'start' && n.type !== 'end')
        .sort((a, b) => {
          const aOrder = (a.data as any)?.order ?? a.position.y
          const bOrder = (b.data as any)?.order ?? b.position.y
          return aOrder - bOrder
        })
      
      if (parentNodeId) {
        // Find parent and insert after it or after its last child
        const parentNode = nodes.find((n) => n.id === parentNodeId)
        if (parentNode) {
          // Find all children of this parent
          const parentChildren = nodes
            .filter((n) => n.parentNode === parentNodeId)
            .sort((a, b) => {
              const aOrder = (a.data as any)?.order ?? a.position.y
              const bOrder = (b.data as any)?.order ?? b.position.y
              return aOrder - bOrder
            })
          
          if (parentChildren.length > 0) {
            // Position after the last child
            const lastChild = parentChildren[parentChildren.length - 1]
            newY = lastChild.position.y + verticalSpacing
          } else {
            // Position right after parent
            newY = parentNode.position.y + verticalSpacing
          }
        }
      } else {
        // No parent - add at the end or in correct position
        const endNode = nodes.find((n) => n.type === 'end')
        if (regularNodes.length > 0) {
          const lastNode = regularNodes[regularNodes.length - 1]
          newY = lastNode.position.y + verticalSpacing
          // Make sure it's before the End node
          if (endNode && newY >= endNode.position.y) {
            newY = endNode.position.y - verticalSpacing
          }
        } else {
          newY = 150 // First node after Start
        }
      }
      
      newX = centerX

      // Professional color palette
      const colors: Record<string, string> = {
        section: '#2563eb',      // Professional blue
        sub_section: '#059669',   // Professional green
        table: '#ea580c',         // Warm orange
        diagram: '#dc2626',       // Alert red
        content: '#64748b',       // Neutral gray
        prompt: '#9333ea',        // Purple
        checklist: '#16a34a',     // Success green
        chart: '#0284c7',         // Sky blue
        reference: '#7c3aed',      // Purple
        signature: '#be123c',     // Deep red
      }

      const response = await fetch(`/api/reports/${reportId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          position: { x: newX, y: newY },
          data: {
            title: type === 'section' ? 'New Section' : type === 'sub_section' ? 'New Sub-Section' : `New ${type}`,
            color: colors[type] || '#3b82f6',
          },
          parentNodeId: parentNodeId || null,
        }),
      })

      if (response.ok) {
        await fetchNodes()
        // Auto-layout after adding node
        setTimeout(() => {
          handleRefreshLayout()
        }, 100)
      }
    } catch (err) {
      console.error('Error adding node:', err)
    }
  }

  const handleRefreshLayout = () => {
    // Auto-layout: All nodes in a single vertical line
    const startNode = nodes.find((n) => n.type === 'start')
    const endNode = nodes.find((n) => n.type === 'end')
    const regularNodes = nodes
      .filter((n) => n.type !== 'start' && n.type !== 'end')
      .sort((a, b) => {
        const aOrder = (a.data as any)?.order ?? a.position.y
        const bOrder = (b.data as any)?.order ?? b.position.y
        return aOrder - bOrder
      })

    const centerX = 400 // All nodes in this vertical line
    const verticalSpacing = 50 // Tight spacing for compact layout
    let currentY = 150 // Start below Start node

    const updatedNodes = nodes.map((node) => {
      let x = centerX
      let y = node.position.y

      if (node.type === 'start') {
        x = centerX
        y = 0
      } else if (node.type === 'end') {
        x = centerX
        // Position End after all regular nodes
        y = regularNodes.length > 0 
          ? currentY + (regularNodes.length - 1) * verticalSpacing + verticalSpacing
          : currentY + verticalSpacing
      } else {
        // All regular nodes go in the vertical line
        const nodeIndex = regularNodes.findIndex((n) => n.id === node.id)
        if (nodeIndex >= 0) {
          y = currentY + nodeIndex * verticalSpacing
          x = centerX
        }
      }

      return {
        ...node,
        position: { x, y },
        style: {
          ...node.style,
          transition: 'all 0.3s ease-out',
        },
      }
    })

    setNodes(updatedNodes)
    
    // Rebuild edges: Start → All nodes in order → End
    const newEdges: Edge[] = []
    
    // Connect Start to first node
    if (startNode && regularNodes.length > 0) {
      newEdges.push({
        id: `e-${startNode.id}-${regularNodes[0].id}`,
        source: startNode.id,
        target: regularNodes[0].id,
        type: 'smoothstep',
        animated: false,
      })
    }
    
    // Connect all nodes in sequence
    for (let i = 0; i < regularNodes.length - 1; i++) {
      newEdges.push({
        id: `e-${regularNodes[i].id}-${regularNodes[i + 1].id}`,
        source: regularNodes[i].id,
        target: regularNodes[i + 1].id,
        type: 'smoothstep',
        animated: false,
      })
    }
    
    // Connect last node to End
    if (endNode && regularNodes.length > 0) {
      newEdges.push({
        id: `e-${regularNodes[regularNodes.length - 1].id}-${endNode.id}`,
        source: regularNodes[regularNodes.length - 1].id,
        target: endNode.id,
        type: 'smoothstep',
        animated: false,
      })
    }
    
    setEdges(newEdges)
    
    // Fit view after layout
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 300 })
    }, 100)
  }

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

  // Listen for node updates
  useEffect(() => {
    const handleUpdate = () => {
      fetchNodes()
    }
    window.addEventListener('nodes-updated', handleUpdate)
    return () => window.removeEventListener('nodes-updated', handleUpdate)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      
      // Check if it's a node type from the palette
      const nodeType = event.dataTransfer.getData('application/reactflow')
      if (nodeType) {
        const reactFlowBounds = (event.target as HTMLElement).getBoundingClientRect()
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        })
        handleAddNode(nodeType, position, null)
        return
      }
      
      // Otherwise, check if it's a resource
      const resourceId = event.dataTransfer.getData('resourceId')
      if (!resourceId) return

      const reactFlowBounds = (event.target as Element)
        .closest('.react-flow')
        ?.getBoundingClientRect()
      if (!reactFlowBounds) return

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }

      // Create a content node with the resource attached
      handleAddNode('content', position)
    },
    []
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-950 to-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <div className="text-sm text-gray-400">Loading canvas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative bg-gradient-to-br from-gray-950 to-gray-900">
      <NodePalette onNodeDragStart={setDraggedNodeType} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        snapToGrid={true}
        snapGrid={[40, 40]}
        preventScrolling={true}
        panOnDrag={[1, 2]} // Enable pan on left and middle mouse button
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        selectionOnDrag={true}
        connectionLineStyle={{ 
          stroke: '#6366f1', 
          strokeWidth: 2,
          strokeDasharray: '5,5',
        }}
        defaultEdgeOptions={{ 
          type: 'smoothstep', 
          animated: false,
          style: {
            stroke: '#6366f1',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#6366f1',
          },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#333"
          className="opacity-30"
        />
        <Controls 
          showInteractive={false}
          className="!bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl"
        />
        <Panel position="top-left" className="flex gap-2 p-2">
          <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl p-2 flex gap-2">
            <NodeAddMenu onAddNode={handleAddNode} nodes={nodes} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshLayout}
              className="gap-2 shadow-sm"
              title="Arrange nodes sequentially"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateAll}
              className="gap-2 shadow-sm"
              title="Generate all sections"
            >
              <Sparkles className="h-4 w-4" />
              Generate All
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export function FlowCanvas({
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
  return (
    <ReactFlowProvider>
      <FlowCanvasInner 
        reportId={reportId} 
        resources={resources}
        selectedNodeId={selectedNodeId}
        onNodeSelect={onNodeSelect}
      />
    </ReactFlowProvider>
  )
}

function NodeAddMenu({
  onAddNode,
  nodes,
}: {
  onAddNode: (type: string, position: { x: number; y: number }, parentNodeId: string | null) => void
  nodes: Node[]
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
          existingNodes={nodes}
        />
      )}
    </>
  )
}

