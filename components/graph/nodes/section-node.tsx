'use client'

import { memo, useState } from 'react'
import { NodeProps } from 'reactflow'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp } from 'lucide-react'

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

export const SectionNode = memo(({ data, id, selected }: NodeProps) => {
  const [title, setTitle] = useState(data?.title || 'Section')
  const [prompt, setPrompt] = useState(data?.prompt || '')
  const [color, setColor] = useState(data?.color || COLORS[0].value)
  const [isExpanded, setIsExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const reportId = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : ''

  const updateNode = async (updates: any) => {
    if (!reportId) return
    clearTimeout((window as any)[`save-${id}`])
    ;(window as any)[`save-${id}`] = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`/api/reports/${reportId}/nodes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { ...(data || {}), ...updates },
          }),
        })
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
    setColor(newColor)
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
          sectionNodeId: id,
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
    if (data?.content) return data?.aiGenerated ? 'AI' : 'ED'
    return ''
  }

  // Get darker shade for border
  const getBorderColor = (baseColor: string) => {
    // Simple darkening - in production you might want a proper color manipulation library
    return baseColor
  }

  return (
    <div
      className={`min-w-[300px] rounded-lg shadow-md transition-all duration-200 ${
        selected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      style={{
        backgroundColor: isExpanded ? `${color}15` : `${color}20`,
        border: `2px solid ${color}`,
      }}
    >
      {/* Collapsed View */}
      {!isExpanded && (
        <div
          className="p-4 cursor-pointer"
          onClick={() => setIsExpanded(true)}
          style={{ backgroundColor: `${color}20` }}
        >
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
                onClick={(e) => e.stopPropagation()}
                placeholder="Section title"
                className="font-bold border-none shadow-none p-0 h-auto text-base flex-1 bg-transparent"
                style={{ color: getBorderColor(color) }}
              />
            </div>
            <ChevronDown className="h-4 w-4" style={{ color: getBorderColor(color) }} />
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4 space-y-3">
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
                className="font-bold border-none shadow-none p-0 h-auto text-base flex-1 bg-transparent"
                style={{ color: getBorderColor(color) }}
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
                  style={{ backgroundColor: color }}
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
                          color === c.value ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-black/10 rounded transition-colors"
              >
                <ChevronUp className="h-4 w-4" style={{ color: getBorderColor(color) }} />
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${color}40` }}>
            <div>
              <Label className="text-xs" style={{ color: getBorderColor(color) }}>
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
              style={{ backgroundColor: color, borderColor: color }}
            >
              {generating ? 'Generating...' : 'Generate Content'}
            </Button>
            {saving && (
              <span className="text-xs text-muted-foreground">Saving...</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

SectionNode.displayName = 'SectionNode'
