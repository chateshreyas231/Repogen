'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Highlighter,
  Plus,
  Trash2,
  Edit2,
  Image,
  Table,
  GitBranch,
  Sparkles,
  GripVertical,
  FileText,
  Download,
  File,
  ChevronRight,
} from 'lucide-react'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface Node {
  id: string
  type: string
  data: any
  parentNode?: string
  order?: number
}

interface Comment {
  id: string
  content: string
  position: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface Highlight {
  id: string
  color: string
  position: string
  note: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

export function ReportPreview({ reportId }: { reportId: string }) {
  const { data: session } = useSession()
  const [isExpanded, setIsExpanded] = useState(true)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Comment[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [showCommentForm, setShowCommentForm] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [selectedText, setSelectedText] = useState<{ start: number; end: number } | null>(null)
  const [highlightColor, setHighlightColor] = useState('#ffeb3b')
  const [showAddMediaMenu, setShowAddMediaMenu] = useState<string | null>(null)
  const [showPromptDialog, setShowPromptDialog] = useState<string | null>(null)
  const [promptText, setPromptText] = useState('')
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)
  const contentRefs = useRef<Record<string, HTMLDivElement>>({})

  // Listen for canvas updates
  useEffect(() => {
    const handleCanvasUpdate = () => {
      fetchNodes()
    }
    window.addEventListener('nodes-updated', handleCanvasUpdate)
    return () => window.removeEventListener('nodes-updated', handleCanvasUpdate)
  }, [])

  useEffect(() => {
    fetchNodes()
    fetchComments()
    fetchHighlights()
  }, [reportId])

  const fetchNodes = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/nodes`)
      if (response.ok) {
        const data = await response.json()
        setNodes(data.nodes || [])
        // Expand all nodes by default
        const allNodeIds = new Set((data.nodes || []).map((n: Node) => n.id))
        setExpandedNodes(allNodeIds)
      }
    } catch (err) {
      console.error('Error fetching nodes:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data || [])
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
    }
  }

  const fetchHighlights = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/highlights`)
      if (response.ok) {
        const data = await response.json()
        setHighlights(data || [])
      }
    } catch (err) {
      console.error('Error fetching highlights:', err)
    }
  }

  // Notify canvas of changes
  const notifyCanvas = () => {
    window.dispatchEvent(new Event('nodes-updated'))
  }

  const buildReportOrder = () => {
    // Sort by order if available, otherwise by position
    return [...nodes].sort((a, b) => {
      const aOrder = a.order ?? (a.data as any)?.order ?? 0
      const bOrder = b.order ?? (b.data as any)?.order ?? 0
      return aOrder - bOrder
    })
  }

  const orderedNodes = buildReportOrder()

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const handleTitleUpdate = async (nodeId: string, title: string) => {
    try {
      await fetch(`/api/reports/${reportId}/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...nodes.find((n) => n.id === nodeId)?.data, title },
        }),
      })
      fetchNodes()
      notifyCanvas()
    } catch (err) {
      console.error('Error updating title:', err)
    }
  }

  const handleContentUpdate = async (nodeId: string, content: string) => {
    try {
      await fetch(`/api/reports/${reportId}/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...nodes.find((n) => n.id === nodeId)?.data, content },
          aiGenerated: false,
        }),
      })
      fetchNodes()
      notifyCanvas()
    } catch (err) {
      console.error('Error updating content:', err)
    }
  }

  const handleAddNode = async (
    type: string,
    parentNodeId: string | null,
    position?: { x: number; y: number }
  ) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          position: position || { x: 400, y: 500 },
          data: {
            title: type === 'section' ? 'New Section' : type === 'sub_section' ? 'New Sub-Section' : `New ${type}`,
            color:
              type === 'section'
                ? '#3b82f6'
                : type === 'sub_section'
                ? '#10b981'
                : type === 'table'
                ? '#f97316'
                : type === 'diagram'
                ? '#ef4444'
                : '#6b7280',
          },
          parentNodeId,
        }),
      })
      if (response.ok) {
        // Immediately fetch nodes to show new node
        await fetchNodes()
        notifyCanvas()
        // Also expand the parent node if it exists
        if (parentNodeId) {
          setExpandedNodes((prev) => new Set([...prev, parentNodeId]))
        }
      }
    } catch (err) {
      console.error('Error adding node:', err)
    }
  }

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Delete this node?')) return
    try {
      await fetch(`/api/reports/${reportId}/nodes/${nodeId}`, {
        method: 'DELETE',
      })
      fetchNodes()
      notifyCanvas()
    } catch (err) {
      console.error('Error deleting node:', err)
    }
  }

  const handleReorder = async (draggedId: string, targetId: string) => {
    const draggedNode = nodes.find((n) => n.id === draggedId)
    const targetNode = nodes.find((n) => n.id === targetId)
    if (!draggedNode || !targetNode) return

    // Get all root nodes (no parent) and their current orders
    const rootNodes = nodes.filter((n) => !n.parentNode).sort((a, b) => {
      const aOrder = a.order ?? (a.data as any)?.order ?? 0
      const bOrder = b.order ?? (b.data as any)?.order ?? 0
      return aOrder - bOrder
    })

    const draggedIndex = rootNodes.findIndex((n) => n.id === draggedId)
    const targetIndex = rootNodes.findIndex((n) => n.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Reorder the array
    const [removed] = rootNodes.splice(draggedIndex, 1)
    rootNodes.splice(targetIndex, 0, removed)

    // Update orders based on new positions
    try {
      await Promise.all(
        rootNodes.map((node, index) =>
          fetch(`/api/reports/${reportId}/nodes/${node.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order: index,
            }),
          })
        )
      )
      fetchNodes()
      notifyCanvas()
    } catch (err) {
      console.error('Error reordering nodes:', err)
    }
  }

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNodeId(nodeId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault()
    if (draggedNodeId && draggedNodeId !== targetNodeId) {
      handleReorder(draggedNodeId, targetNodeId)
    }
    setDraggedNodeId(null)
  }

  const handleGenerateContent = async (nodeId: string) => {
    if (!promptText.trim()) return

    try {
      const response = await fetch(`/api/reports/${reportId}/generate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionNodeId: nodeId,
          prompt: promptText,
        }),
      })

      if (response.ok) {
        setPromptText('')
        setShowPromptDialog(null)
        fetchNodes()
        notifyCanvas()
      }
    } catch (err) {
      console.error('Error generating content:', err)
    }
  }

  const handleTextSelection = (nodeId: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const contentDiv = contentRefs.current[nodeId]
    if (!contentDiv) return

    const textContent = contentDiv.textContent || ''
    const start = textContent.indexOf(range.toString())
    const end = start + range.toString().length

    if (start >= 0 && end > start) {
      setSelectedText({ start, end })
      setShowCommentForm(nodeId)
    }
  }

  const handleAddComment = async (nodeId: string) => {
    if (!newComment.trim() || !session?.user?.id) return

    try {
      const response = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          content: newComment,
          position: selectedText ? JSON.stringify(selectedText) : null,
          userId: session.user.id,
        }),
      })

      if (response.ok) {
        setNewComment('')
        setSelectedText(null)
        setShowCommentForm(null)
        fetchComments()
      }
    } catch (err) {
      console.error('Error adding comment:', err)
    }
  }

  const handleAddHighlight = async (nodeId: string) => {
    if (!selectedText || !session?.user?.id) return

    try {
      const response = await fetch(`/api/reports/${reportId}/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          color: highlightColor,
          position: JSON.stringify(selectedText),
          userId: session.user.id,
        }),
      })

      if (response.ok) {
        setSelectedText(null)
        fetchHighlights()
      }
    } catch (err) {
      console.error('Error adding highlight:', err)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/reports/${reportId}/comments/${commentId}`, {
        method: 'DELETE',
      })
      fetchComments()
    } catch (err) {
      console.error('Error deleting comment:', err)
    }
  }

  const handleDeleteHighlight = async (highlightId: string) => {
    try {
      await fetch(`/api/reports/${reportId}/highlights/${highlightId}`, {
        method: 'DELETE',
      })
      fetchHighlights()
    } catch (err) {
      console.error('Error deleting highlight:', err)
    }
  }

  const handleExport = async (format: string) => {
    setExporting(format)
    try {
      const response = await fetch(`/api/reports/${reportId}/export?format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${reportId}.${format === 'docx' ? 'docx' : format === 'pdf' ? 'pdf' : format === 'txt' ? 'txt' : 'md'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert(`Failed to export report as ${format.toUpperCase()}`)
      }
    } catch (err) {
      console.error('Error exporting report:', err)
      alert(`Error exporting report: ${err}`)
    } finally {
      setExporting(null)
    }
  }

  const applyHighlights = (content: string, nodeId: string) => {
    const nodeHighlights = highlights.filter((h) => h.nodeId === nodeId)
    if (nodeHighlights.length === 0) return content

    const textContent = content.replace(/<[^>]*>/g, '')
    const sortedHighlights = [...nodeHighlights].sort((a, b) => {
      const posA = JSON.parse(a.position)
      const posB = JSON.parse(b.position)
      return posB.start - posA.start
    })

    let highlightedContent = content

    sortedHighlights.forEach((highlight) => {
      const position = JSON.parse(highlight.position)
      const selectedText = textContent.substring(position.start, position.end)
      const regex = new RegExp(selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      highlightedContent = highlightedContent.replace(
        regex,
        `<mark style="background-color: ${highlight.color}; opacity: 0.6;">${selectedText}</mark>`
      )
    })

    return highlightedContent
  }

  const renderNode = (node: Node, depth: number = 0) => {
    const nodeData = node.data as any
    const isExpanded = expandedNodes.has(node.id)
    const isEditing = editingNodeId === node.id
    const nodeComments = comments.filter((c) => c.nodeId === node.id)
    const nodeHighlights = highlights.filter((h) => h.nodeId === node.id)
    // Get child nodes sorted by order
    const childNodes = nodes
      .filter((n) => n.parentNode === node.id)
      .sort((a, b) => {
        const aOrder = a.order ?? (a.data as any)?.order ?? 0
        const bOrder = b.order ?? (b.data as any)?.order ?? 0
        return aOrder - bOrder
      })

    if (node.type === 'section') {
      return (
        <div
          key={node.id}
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node.id)}
          className={`mb-4 border rounded-lg p-4 bg-white shadow-sm ${
            draggedNodeId === node.id ? 'opacity-50' : ''
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-1 hover:bg-accent rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
            {isEditing ? (
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => {
                  handleTitleUpdate(node.id, editingTitle)
                  setEditingNodeId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleUpdate(node.id, editingTitle)
                    setEditingNodeId(null)
                  }
                }}
                className="flex-1 font-bold text-xl"
                autoFocus
              />
            ) : (
              <h1
                className="text-2xl font-bold flex-1 cursor-pointer"
                onClick={() => {
                  setEditingNodeId(node.id)
                  setEditingTitle(nodeData.title || 'Untitled Section')
                }}
              >
                {nodeData.title || 'Untitled Section'}
              </h1>
            )}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowPromptDialog(node.id)
                  setPromptText(nodeData.prompt || '')
                }}
                title="Generate content"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddMediaMenu(node.id)}
                title="Add media"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteNode(node.id)}
                title="Delete section"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showAddMediaMenu === node.id && (
            <Card className="mb-2">
              <CardContent className="p-2 space-y-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleAddNode('table', node.id)
                    setShowAddMediaMenu(null)
                  }}
                >
                  <Table className="h-4 w-4 mr-2" />
                  Add Table
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleAddNode('diagram', node.id)
                    setShowAddMediaMenu(null)
                  }}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Add Diagram
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleAddNode('content', node.id)
                    setShowAddMediaMenu(null)
                  }}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Add Content Block
                </Button>
              </CardContent>
            </Card>
          )}

          {showPromptDialog === node.id && (
            <Card className="mb-2">
              <CardContent className="p-3 space-y-2">
                <Textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter prompt to generate content for this section..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleGenerateContent(node.id)}>
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowPromptDialog(null)
                      setPromptText('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isExpanded && (
            <>
              {nodeData.content && (
                <div
                  ref={(el) => {
                    if (el) contentRefs.current[node.id] = el
                  }}
                  onMouseUp={() => handleTextSelection(node.id)}
                  dangerouslySetInnerHTML={{
                    __html: applyHighlights(nodeData.content, node.id),
                  }}
                  className="mb-2 prose prose-sm max-w-none"
                />
              )}

              {childNodes.map((child) => renderNode(child, depth + 1))}

              {showCommentForm === node.id && (
                <Card className="mb-2">
                  <CardContent className="p-3 space-y-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAddComment(node.id)}>
                        Comment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddHighlight(node.id)}
                      >
                        <Highlighter className="h-3 w-3 mr-1" />
                        Highlight
                      </Button>
                      <input
                        type="color"
                        value={highlightColor}
                        onChange={(e) => setHighlightColor(e.target.value)}
                        className="h-8 w-8"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowCommentForm(null)
                          setNewComment('')
                          setSelectedText(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {nodeComments.map((comment) => (
                <Card key={comment.id} className="mb-2">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {comment.user.name || comment.user.email}
                        </div>
                        <div className="text-sm">{comment.content}</div>
                      </div>
                      {session?.user?.id === comment.user.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )
    } else if (node.type === 'sub_section') {
      return (
        <div
          key={node.id}
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node.id)}
          className={`mb-3 border rounded-lg p-3 bg-gray-50 ${
            draggedNodeId === node.id ? 'opacity-50' : ''
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-1 hover:bg-accent rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
            {isEditing ? (
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => {
                  handleTitleUpdate(node.id, editingTitle)
                  setEditingNodeId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleUpdate(node.id, editingTitle)
                    setEditingNodeId(null)
                  }
                }}
                className="flex-1 font-semibold text-lg"
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-semibold flex-1 cursor-pointer"
                onClick={() => {
                  setEditingNodeId(node.id)
                  setEditingTitle(nodeData.title || 'Untitled Sub-Section')
                }}
              >
                {nodeData.title || 'Untitled Sub-Section'}
              </h2>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteNode(node.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {isExpanded && (
            <>
              {nodeData.content && (
                <div
                  ref={(el) => {
                    if (el) contentRefs.current[node.id] = el
                  }}
                  onMouseUp={() => handleTextSelection(node.id)}
                  dangerouslySetInnerHTML={{
                    __html: applyHighlights(nodeData.content, node.id),
                  }}
                  className="mb-2 prose prose-sm max-w-none"
                />
              )}
              {childNodes.map((child) => renderNode(child, depth + 1))}
            </>
          )}
        </div>
      )
    } else if (node.type === 'content') {
      return (
        <div
          key={node.id}
          className={`mb-3 p-3 border rounded ${
            selectedNodeId === node.id ? 'ring-2 ring-primary' : ''
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex justify-end mb-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteNode(node.id)}
              title="Delete content"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {selectedNodeId === node.id ? (
            <ReactQuill
              theme="snow"
              value={nodeData.content || ''}
              onChange={(value) => handleContentUpdate(node.id, value)}
              placeholder="Edit content..."
              className="min-h-[200px]"
            />
          ) : (
            <div
              ref={(el) => {
                if (el) contentRefs.current[node.id] = el
              }}
              onMouseUp={() => handleTextSelection(node.id)}
              onClick={() => setSelectedNodeId(node.id)}
              dangerouslySetInnerHTML={{
                __html: applyHighlights(
                  nodeData.content || '<p>Empty content</p>',
                  node.id
                ),
              }}
              className="prose prose-sm max-w-none cursor-pointer"
            />
          )}
        </div>
      )
    } else if (node.type === 'table') {
      return (
        <div
          key={node.id}
          className="mb-3 p-3 border rounded bg-orange-50"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-orange-700">
              {nodeData.title || 'Table'}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteNode(node.id)}
              title="Delete table"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Table content (preview coming soon)
          </div>
        </div>
      )
    } else if (node.type === 'diagram') {
      return (
        <div
          key={node.id}
          className="mb-3 p-3 border rounded bg-red-50"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-red-700">
              {nodeData.title || 'Diagram'}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteNode(node.id)}
              title="Delete diagram"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Diagram content (preview coming soon)
          </div>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="p-4">
        <div>Loading preview...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col border-l bg-background">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">Report Preview</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative export-menu-container">
            <Button
              size="sm"
              variant="outline"
              disabled={exporting !== null}
              className="w-full justify-between text-xs"
              onClick={(e) => {
                e.stopPropagation()
                setShowExportMenu(!showExportMenu)
              }}
            >
              <span className="flex items-center gap-2">
                <Download className="h-3 w-3" />
                {exporting ? `Exporting ${exporting.toUpperCase()}...` : 'Export Report'}
              </span>
              <ChevronRight className={`h-3 w-3 transition-transform ${showExportMenu ? 'rotate-90' : ''}`} />
            </Button>
            {showExportMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50">
                <button
                  onClick={() => {
                    handleExport('pdf')
                    setShowExportMenu(false)
                  }}
                  disabled={exporting !== null}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center gap-2 disabled:opacity-50"
                >
                  <FileText className="h-3 w-3" />
                  PDF Document
                </button>
                <button
                  onClick={() => {
                    handleExport('docx')
                    setShowExportMenu(false)
                  }}
                  disabled={exporting !== null}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center gap-2 disabled:opacity-50"
                >
                  <File className="h-3 w-3" />
                  Microsoft Word
                </button>
                <button
                  onClick={() => {
                    handleExport('txt')
                    setShowExportMenu(false)
                  }}
                  disabled={exporting !== null}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center gap-2 disabled:opacity-50"
                >
                  <FileText className="h-3 w-3" />
                  Plain Text
                </button>
                <button
                  onClick={() => {
                    handleExport('markdown')
                    setShowExportMenu(false)
                  }}
                  disabled={exporting !== null}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center gap-2 disabled:opacity-50"
                >
                  <FileText className="h-3 w-3" />
                  Markdown
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {orderedNodes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No content in this report yet. Add nodes to the canvas to see them here.
              </p>
            ) : (
              orderedNodes.map((node) => renderNode(node, 0))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
