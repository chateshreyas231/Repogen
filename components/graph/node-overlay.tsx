'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Teal', value: '#14b8a6' },
]

interface NodeOverlayProps {
  nodeId: string
  nodeType: string
  nodeData: any
  position: { x: number; y: number }
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: any) => void
  reportId: string
  color: string
  isSelected: boolean
}

export function NodeOverlay({
  nodeId,
  nodeType,
  nodeData,
  position,
  isExpanded,
  onToggleExpand,
  onUpdate,
  reportId,
  color,
  isSelected,
}: NodeOverlayProps) {
  const [title, setTitle] = useState(nodeData?.title || '')
  const [prompt, setPrompt] = useState(nodeData?.prompt || '')
  const [nodeColor, setNodeColor] = useState(nodeData?.color || color)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTitle(nodeData?.title || '')
    setPrompt(nodeData?.prompt || '')
    setNodeColor(nodeData?.color || color)
  }, [nodeData, color])

  const updateNode = async (updates: any) => {
    if (!reportId) return
    clearTimeout((window as any)[`save-${nodeId}`])
    ;(window as any)[`save-${nodeId}`] = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`/api/reports/${reportId}/nodes/${nodeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { ...(nodeData || {}), ...updates },
          }),
        })
        onUpdate(updates)
      } catch (err) {
        console.error('Error updating node:', err)
      } finally {
        setSaving(false)
      }
    }, 1000)
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    updateNode({ title: newTitle })
  }

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt)
    updateNode({ prompt: newPrompt })
  }

  const handleColorChange = (newColor: string) => {
    setNodeColor(newColor)
    updateNode({ color: newColor })
    setShowColorPicker(false)
  }

  const handleGenerate = async () => {
    if (!reportId) return
    setGenerating(true)
    try {
      const response = await fetch(`/api/reports/${reportId}/generate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionNodeId: nodeId,
          prompt: prompt || undefined,
        }),
      })

      if (response.ok) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('nodes-updated'))
        }
      }
    } catch (err) {
      console.error('Error generating section:', err)
    } finally {
      setGenerating(false)
    }
  }

  const getStatusIcon = () => {
    if (nodeData?.content) return nodeData?.aiGenerated ? 'AI' : 'ED'
    return ''
  }

  // Don't render overlay for start/end nodes
  if (nodeType === 'start' || nodeType === 'end') {
    return null
  }

  const NODE_WIDTH = 300
  const NODE_HEIGHT = 80
  const height = isExpanded ? 200 : NODE_HEIGHT

  return (
    <div
      ref={overlayRef}
      className="absolute pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${NODE_WIDTH}px`,
        height: `${height}px`,
        zIndex: isSelected ? 100 : 10,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`w-full h-full rounded-lg transition-all duration-200 ${
          isSelected
            ? 'ring-2 ring-primary ring-offset-2 shadow-xl'
            : 'shadow-sm hover:shadow-lg'
        }`}
        style={{
          backgroundColor: isExpanded ? '#ffffff' : `${nodeColor}08`,
          border: `1.5px solid ${nodeColor}40`,
          borderLeft: `4px solid ${nodeColor}`,
        }}
      >
        {/* Collapsed View */}
        {!isExpanded && (
          <div
            className="p-4 cursor-pointer h-full flex items-center"
            onClick={onToggleExpand}
            style={{ backgroundColor: `${nodeColor}08` }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1">
                {getStatusIcon() && (
                  <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 bg-muted rounded">
                    {getStatusIcon()}
                  </span>
                )}
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Section title"
                  className="font-semibold text-base tracking-tight border-none shadow-none p-0 h-auto flex-1 bg-transparent"
                  style={{
                    color: nodeColor,
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                />
              </div>
              <ChevronDown className="h-4 w-4" style={{ color: nodeColor }} />
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="p-4 space-y-3 h-full overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                {getStatusIcon() && (
                  <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 bg-muted rounded">
                    {getStatusIcon()}
                  </span>
                )}
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Section title"
                  className="font-semibold text-base tracking-tight border-none shadow-none p-0 h-auto flex-1 bg-transparent"
                  style={{
                    color: nodeColor,
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowColorPicker(!showColorPicker)
                    }}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                    style={{ backgroundColor: nodeColor }}
                    title="Change color"
                  />
                  {showColorPicker && (
                    <div className="absolute top-full right-0 mt-1 p-2 bg-background border rounded-md shadow-lg z-50 grid grid-cols-4 gap-1">
                      {COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleColorChange(c.value)
                          }}
                          className={`w-6 h-6 rounded border-2 ${
                            nodeColor === c.value ? 'border-gray-900' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={onToggleExpand}
                  className="p-1 hover:bg-black/10 rounded transition-colors"
                >
                  <ChevronUp className="h-4 w-4" style={{ color: nodeColor }} />
                </button>
              </div>
            </div>

            {nodeType === 'section' && (
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${nodeColor}40` }}>
                <div>
                  <Label className="text-xs" style={{ color: nodeColor }}>
                    AI Prompt (optional)
                  </Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    placeholder="e.g., 'Summarize key findings from the attached audit report.'"
                    rows={3}
                    className="text-xs mt-1"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full text-white hover:opacity-90"
                  style={{ backgroundColor: nodeColor, borderColor: nodeColor }}
                >
                  {generating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
                {saving && (
                  <span className="text-xs text-muted-foreground">Saving...</span>
                )}
              </div>
            )}

            {/* Node type specific editing UIs */}
            {nodeType === 'content' && (
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${nodeColor}40` }}>
                <Label className="text-xs" style={{ color: nodeColor }}>
                  Content
                </Label>
                <Textarea
                  value={nodeData?.content || ''}
                  onChange={(e) => updateNode({ content: e.target.value })}
                  placeholder="Enter content..."
                  rows={4}
                  className="text-xs mt-1"
                />
              </div>
            )}

            {nodeType === 'prompt' && (
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${nodeColor}40` }}>
                <Label className="text-xs" style={{ color: nodeColor }}>
                  Prompt Text
                </Label>
                <Textarea
                  value={nodeData?.prompt || ''}
                  onChange={(e) => updateNode({ prompt: e.target.value })}
                  placeholder="Enter prompt for AI generation..."
                  rows={4}
                  className="text-xs mt-1"
                />
              </div>
            )}

            {nodeType === 'sub_section' && (
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${nodeColor}40` }}>
                <Label className="text-xs" style={{ color: nodeColor }}>
                  Sub-Section Title
                </Label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Sub-section title"
                  className="text-xs mt-1"
                />
              </div>
            )}

            {nodeType === 'table' && (
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${nodeColor}40` }}>
                <Label className="text-xs" style={{ color: nodeColor }}>
                  Table Title
                </Label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Table title"
                  className="text-xs mt-1"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Table editing available in report preview
                </p>
              </div>
            )}

            {nodeType === 'diagram' && (
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${nodeColor}40` }}>
                <Label className="text-xs" style={{ color: nodeColor }}>
                  Diagram Title
                </Label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Diagram title"
                  className="text-xs mt-1"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Mermaid diagram editing available in report preview
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

