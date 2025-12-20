'use client'

import { memo, useState, useEffect } from 'react'
import { NodeProps } from 'reactflow'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { ReferenceNodeData } from '@/types/report-nodes'

export const ReferenceNode = memo(({ data, id, selected }: NodeProps) => {
  const nodeData = data as ReferenceNodeData
  const [title, setTitle] = useState(nodeData?.title || 'Reference')
  const [citation, setCitation] = useState(nodeData?.citation || '')
  const [url, setUrl] = useState(nodeData?.url || '')
  const [standard, setStandard] = useState(nodeData?.standard || '')
  const [isExpanded, setIsExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  const reportId = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : ''

  useEffect(() => {
    const nodeData = data as ReferenceNodeData
    setTitle(nodeData?.title || 'Reference')
    setCitation(nodeData?.citation || '')
    setUrl(nodeData?.url || '')
    setStandard(nodeData?.standard || '')
  }, [data])

  const updateNode = async (updates: any) => {
    if (!reportId) return
    clearTimeout((window as any)[`save-reference-${id}`])
    ;(window as any)[`save-reference-${id}`] = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`/api/reports/${reportId}/nodes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { ...(data || {}), ...updates },
          }),
        })
        window.dispatchEvent(new Event('nodes-updated'))
      } catch (err) {
        console.error('Error updating node:', err)
      } finally {
        setSaving(false)
      }
    }, 1000)
  }

  const nodeColor = '#8b5cf6' // Purple for references

  return (
    <Card
      className={`min-w-[300px] transition-all duration-200 ${
        selected 
          ? 'ring-2 ring-primary ring-offset-2 shadow-xl scale-105' 
          : 'shadow-sm hover:shadow-lg hover:scale-[1.02]'
      }`}
      style={{ 
        borderColor: `${nodeColor}40`, 
        borderWidth: '1.5px',
        borderLeftWidth: '4px',
        borderLeftColor: nodeColor,
        backgroundColor: isExpanded ? '#ffffff' : `${nodeColor}08`,
      }}
    >
      <CardHeader className="pb-2" style={{ backgroundColor: isExpanded ? '#ffffff' : `${nodeColor}08` }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          <BookOpen className="h-4 w-4" style={{ color: nodeColor }} />
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              updateNode({ title: e.target.value })
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Reference title"
            className="font-semibold border-none shadow-none p-0 h-auto text-sm flex-1 bg-transparent"
            style={{ color: nodeColor }}
          />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-2 space-y-3">
          <div>
            <Label className="text-xs">Citation</Label>
            <Textarea
              value={citation}
              onChange={(e) => {
                setCitation(e.target.value)
                updateNode({ citation: e.target.value })
              }}
              rows={2}
              className="mt-1 text-xs"
              placeholder="Full citation text..."
            />
          </div>
          <div>
            <Label className="text-xs">Standard/Code</Label>
            <Input
              value={standard}
              onChange={(e) => {
                setStandard(e.target.value)
                updateNode({ standard: e.target.value })
              }}
              placeholder="e.g., ADA Title III, IBC 2021"
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">URL (optional)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  updateNode({ url: e.target.value })
                }}
                placeholder="https://..."
                className="text-xs"
              />
              {url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          {saving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
        </CardContent>
      )}
    </Card>
  )
})

ReferenceNode.displayName = 'ReferenceNode'

