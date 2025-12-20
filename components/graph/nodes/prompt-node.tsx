'use client'

import { memo, useState, useEffect } from 'react'
import { NodeProps } from 'reactflow'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp } from 'lucide-react'

export const PromptNode = memo(
  ({ data, id, selected }: NodeProps) => {
    const [prompt, setPrompt] = useState(data?.prompt || '')
    
    // Safe JSON parsing for linkedResourceIds
    const parseLinkedResources = (value: any): string[] => {
      if (!value) return []
      if (typeof value === 'string') {
        if (value.trim() === '') return []
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      if (Array.isArray(value)) return value
      return []
    }
    
    const [selectedResources, setSelectedResources] = useState<string[]>(
      parseLinkedResources(data?.linkedResourceIds)
    )
    const [generating, setGenerating] = useState(false)
    const [targetNodeId, setTargetNodeId] = useState<string>('')
    const [resources, setResources] = useState<any[]>([])
    const [isExpanded, setIsExpanded] = useState(false)
    const color = '#8b5cf6' // Purple
    
    useEffect(() => {
      const reportResources = (window as any).__reportResources || []
      setResources(reportResources)
    }, [])

    const handleGenerate = async () => {
      if (!prompt.trim() || !targetNodeId) return

      setGenerating(true)
      try {
        const reportId = window.location.pathname.split('/')[2]
        const response = await fetch(`/api/reports/${reportId}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptNodeId: id,
            targetNodeId,
            prompt,
            resourceIds: selectedResources,
          }),
        })

        if (response.ok) {
          window.dispatchEvent(new Event('nodes-updated'))
        }
      } catch (err) {
        console.error('Error generating content:', err)
      } finally {
        setGenerating(false)
      }
    }

    const toggleResource = (resourceId: string) => {
      setSelectedResources((prev) =>
        prev.includes(resourceId)
          ? prev.filter((id) => id !== resourceId)
          : [...prev, resourceId]
      )
    }

    return (
      <div
        className={`min-w-[300px] rounded-lg transition-all duration-200 ${
          selected 
            ? 'ring-2 ring-primary ring-offset-2 shadow-xl scale-105' 
            : 'shadow-sm hover:shadow-lg hover:scale-[1.02]'
        }`}
        style={{
          backgroundColor: isExpanded ? '#ffffff' : `${color}08`,
          border: `1.5px solid ${color}40`,
          borderLeft: `4px solid ${color}`,
        }}
      >
        {!isExpanded ? (
          <div
            className="p-4 cursor-pointer"
            onClick={() => setIsExpanded(true)}
            style={{ backgroundColor: `${color}20` }}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-base" style={{ color: color }}>
                Prompt Node
              </div>
              <ChevronDown className="h-4 w-4" style={{ color: color }} />
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-base" style={{ color: color }}>
                Prompt Node
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-black/10 rounded transition-colors"
              >
                <ChevronUp className="h-4 w-4" style={{ color: color }} />
              </button>
            </div>

            <div className="pt-2 border-t space-y-3" style={{ borderColor: `${color}40` }}>
              <div>
                <Label className="text-xs" style={{ color: color }}>
                  AI Prompt
                </Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="text-xs mt-1"
                  placeholder="Enter your prompt for AI generation..."
                />
              </div>

              <div>
                <Label className="text-xs" style={{ color: color }}>
                  Target Content Node ID
                </Label>
                <Input
                  value={targetNodeId}
                  onChange={(e) => setTargetNodeId(e.target.value)}
                  placeholder="Node ID to write output to"
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs" style={{ color: color }}>
                  Attach Resources (optional)
                </Label>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {resources.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No resources available
                    </p>
                  ) : (
                    resources.map((resource) => (
                      <label
                        key={resource.id}
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedResources.includes(resource.id)}
                          onChange={() => toggleResource(resource.id)}
                        />
                        <span className="truncate">
                          {resource.title || resource.type}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim() || !targetNodeId}
                className="w-full text-white hover:opacity-90"
                style={{ backgroundColor: color, borderColor: color }}
              >
                {generating ? 'Generating...' : 'Generate Content'}
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }
)

PromptNode.displayName = 'PromptNode'
