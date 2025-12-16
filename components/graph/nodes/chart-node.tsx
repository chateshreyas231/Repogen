'use client'

import { memo, useState, useEffect } from 'react'
import { NodeProps } from 'reactflow'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import type { ChartNodeData } from '@/types/report-nodes'

export const ChartNode = memo(({ data, id, selected }: NodeProps) => {
  const nodeData = data as ChartNodeData
  const [title, setTitle] = useState(nodeData?.title || 'Chart')
  const [chartType, setChartType] = useState(nodeData?.chartType || 'bar')
  const [isExpanded, setIsExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  const reportId = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : ''

  useEffect(() => {
    const nodeData = data as ChartNodeData
    setTitle(nodeData?.title || 'Chart')
    setChartType(nodeData?.chartType || 'bar')
  }, [data])

  const updateNode = async (updates: any) => {
    if (!reportId) return
    clearTimeout((window as any)[`save-chart-${id}`])
    ;(window as any)[`save-chart-${id}`] = setTimeout(async () => {
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

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    updateNode({ title: newTitle })
  }

  const handleChartTypeChange = (newType: string) => {
    setChartType(newType)
    updateNode({ chartType: newType })
  }

  const nodeColor = '#3b82f6' // Blue for charts

  return (
    <Card
      className={`min-w-[280px] ${selected ? 'ring-2 ring-primary' : ''}`}
      style={{ borderColor: nodeColor, borderWidth: '2px' }}
    >
      <CardHeader className="pb-2" style={{ backgroundColor: `${nodeColor}15` }}>
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
          <BarChart3 className="h-4 w-4" style={{ color: nodeColor }} />
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Chart title"
            className="font-semibold border-none shadow-none p-0 h-auto text-sm flex-1 bg-transparent"
            style={{ color: nodeColor }}
          />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-2 space-y-3">
          <div>
            <Label className="text-xs">Chart Type</Label>
            <select
              value={chartType}
              onChange={(e) => handleChartTypeChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="scatter">Scatter Plot</option>
              <option value="area">Area Chart</option>
            </select>
          </div>
          <div className="border rounded p-4 bg-muted/30 min-h-[150px] flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                Chart preview (data visualization coming soon)
              </div>
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

ChartNode.displayName = 'ChartNode'

