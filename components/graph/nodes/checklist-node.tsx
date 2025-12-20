'use client'

import { memo, useState, useEffect } from 'react'
import { NodeProps } from 'reactflow'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CheckSquare, Plus, Trash2, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react'
import type { ChecklistNodeData, ChecklistItem } from '@/types/report-nodes'

export const ChecklistNode = memo(({ data, id, selected }: NodeProps) => {
  const nodeData = data as ChecklistNodeData
  const [title, setTitle] = useState(nodeData?.title || 'Checklist')
  const [items, setItems] = useState<ChecklistItem[]>(nodeData?.items || [])
  const [isExpanded, setIsExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  const reportId = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : ''

  useEffect(() => {
    const nodeData = data as ChecklistNodeData
    setTitle(nodeData?.title || 'Checklist')
    setItems(nodeData?.items || [])
  }, [data])

  const updateNode = async (updates: any) => {
    if (!reportId) return
    clearTimeout((window as any)[`save-checklist-${id}`])
    ;(window as any)[`save-checklist-${id}`] = setTimeout(async () => {
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

  const handleAddItem = () => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: 'New checklist item',
      checked: false,
    }
    const newItems = [...items, newItem]
    setItems(newItems)
    updateNode({ items: newItems })
  }

  const handleItemChange = (itemId: string, updates: Partial<ChecklistItem>) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    )
    setItems(newItems)
    updateNode({ items: newItems })
  }

  const handleDeleteItem = (itemId: string) => {
    const newItems = items.filter((item) => item.id !== itemId)
    setItems(newItems)
    updateNode({ items: newItems })
  }

  const nodeColor = '#10b981' // Green for checklist

  return (
    <Card
      className={`min-w-[320px] transition-all duration-200 ${
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
          <CheckSquare className="h-4 w-4" style={{ color: nodeColor }} />
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Checklist title"
            className="font-semibold border-none shadow-none p-0 h-auto text-sm flex-1 bg-transparent"
            style={{ color: nodeColor }}
          />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-2 space-y-2">
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-2 p-2 border rounded">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) =>
                    handleItemChange(item.id, { checked: e.target.checked })
                  }
                  className="mt-1"
                />
                <Input
                  value={item.text}
                  onChange={(e) => handleItemChange(item.id, { text: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-sm"
                  placeholder="Item text"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddItem}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Item
          </Button>
          {saving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
        </CardContent>
      )}
    </Card>
  )
})

ChecklistNode.displayName = 'ChecklistNode'

