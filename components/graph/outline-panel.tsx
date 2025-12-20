'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, FileText, Folder, Table, GitBranch, Image, CheckSquare, BarChart3, BookOpen, PenTool, Sparkles } from 'lucide-react'
import type { Node } from 'reactflow'

interface OutlinePanelProps {
  nodes: Node[]
  selectedNodeId: string | null
  onNodeSelect: (nodeId: string) => void
  onNodeExpand: (nodeId: string) => void
  expandedNodes: Set<string>
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'section':
      return <Folder className="h-4 w-4" />
    case 'sub_section':
      return <FileText className="h-4 w-4" />
    case 'content':
      return <FileText className="h-4 w-4" />
    case 'table':
      return <Table className="h-4 w-4" />
    case 'diagram':
      return <GitBranch className="h-4 w-4" />
    case 'media':
      return <Image className="h-4 w-4" />
    case 'checklist':
      return <CheckSquare className="h-4 w-4" />
    case 'chart':
      return <BarChart3 className="h-4 w-4" />
    case 'reference':
      return <BookOpen className="h-4 w-4" />
    case 'signature':
      return <PenTool className="h-4 w-4" />
    case 'prompt':
      return <Sparkles className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export function OutlinePanel({
  nodes,
  selectedNodeId,
  onNodeSelect,
  onNodeExpand,
  expandedNodes,
}: OutlinePanelProps) {
  // Build hierarchical tree structure
  const tree = useMemo(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const rootNodes: Node[] = []
    const childrenOf: Record<string, Node[]> = {}

    nodes.forEach((node) => {
      if (node.type === 'start' || node.type === 'end') return
      
      const parentId = (node.data as any)?.parentNode || node.parentNode
      if (parentId) {
        if (!childrenOf[parentId]) {
          childrenOf[parentId] = []
        }
        childrenOf[parentId].push(node)
      } else {
        rootNodes.push(node)
      }
    })

    // Sort by order
    const sortNodes = (nodeList: Node[]) => {
      return nodeList.sort((a, b) => {
        const aOrder = (a.data as any)?.order ?? a.position.y
        const bOrder = (b.data as any)?.order ?? b.position.y
        return aOrder - bOrder
      })
    }

    rootNodes.sort((a, b) => {
      const aOrder = (a.data as any)?.order ?? a.position.y
      const bOrder = (b.data as any)?.order ?? b.position.y
      return aOrder - bOrder
    })

    Object.values(childrenOf).forEach((children) => {
      sortNodes(children)
    })

    return { rootNodes, childrenOf }
  }, [nodes])

  const renderNode = (node: Node, depth: number = 0) => {
    const nodeData = node.data as any
    const title = nodeData?.title || nodeData?.label || `Untitled ${node.type}`
    const hasChildren = (tree.childrenOf[node.id]?.length || 0) > 0
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNodeId === node.id

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer hover:bg-accent transition-colors ${
            isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onNodeSelect(node.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNodeExpand(node.id)
              }}
              className="p-0.5 hover:bg-accent rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getNodeIcon(node.type)}
            <span className="text-sm truncate">{title}</span>
            {nodeData?.status && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                nodeData.status === 'approved' ? 'bg-green-100 text-green-700' :
                nodeData.status === 'in_review' ? 'bg-yellow-100 text-yellow-700' :
                nodeData.status === 'complete' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {nodeData.status}
              </span>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {tree.childrenOf[node.id].map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b bg-muted/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Report Outline</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Navigate report structure
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {tree.rootNodes.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4 text-center">
            No nodes yet. Add sections to build your report.
          </div>
        ) : (
          <div className="space-y-1">
            {tree.rootNodes.map((node) => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  )
}

