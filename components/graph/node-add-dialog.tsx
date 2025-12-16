'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import type { Node } from 'reactflow'

interface NodeAddDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (parentNodeId: string | null) => void
  nodeType: string
  existingNodes: Node[]
}

export function NodeAddDialog({
  isOpen,
  onClose,
  onConfirm,
  nodeType,
  existingNodes,
}: NodeAddDialogProps) {
  const [selectedParentId, setSelectedParentId] = useState<string>('')

  if (!isOpen) return null

  // Filter parent options based on node type
  const getParentOptions = () => {
    if (nodeType === 'sub_section') {
      // Sub-sections can only be children of sections
      return existingNodes.filter((n) => n.type === 'section')
    } else if (nodeType === 'section') {
      // Sections can be connected to other sections (for sequencing)
      return existingNodes.filter((n) => n.type === 'section')
    } else {
      // Content, prompt, table, diagram can be children of sections or subsections
      return existingNodes.filter(
        (n) => n.type === 'section' || n.type === 'sub_section'
      )
    }
  }

  const parentOptions = getParentOptions()
  const requiresParent = nodeType === 'sub_section'

  const handleConfirm = () => {
    if (nodeType === 'sub_section' && !selectedParentId) {
      alert('Please select a parent section for this sub-section.')
      return
    }
    // Convert empty string to null for "None" option
    const parentId = selectedParentId === '' ? null : selectedParentId
    onConfirm(parentId)
    setSelectedParentId('')
  }

  const handleCancel = () => {
    setSelectedParentId('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Add {nodeType === 'sub_section' ? 'Sub-Section' : nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
          </h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>
              {nodeType === 'sub_section'
                ? 'Select Parent Section *'
                : nodeType === 'section'
                ? 'Connect After Section (optional)'
                : 'Select Parent Node (optional)'}
            </Label>
            {parentOptions.length === 0 ? (
              <div className="mt-2 p-3 bg-muted rounded-md text-sm text-muted-foreground">
                {nodeType === 'sub_section'
                  ? 'No sections available. Please create a section first.'
                  : 'No parent nodes available. This will be created at root level.'}
              </div>
            ) : (
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {!requiresParent || nodeType !== 'sub_section' ? (
                  <label className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer">
                    <input
                      type="radio"
                      name="parent"
                      value=""
                      checked={selectedParentId === ''}
                      onChange={() => setSelectedParentId('')}
                    />
                    <span className="text-sm">
                      {nodeType === 'section' ? 'Create as new root section' : 'None (root level)'}
                    </span>
                  </label>
                ) : null}
                {parentOptions.map((node) => {
                  const nodeData = node.data as any
                  const title = nodeData?.title || `Untitled ${node.type}`
                  return (
                    <label
                      key={node.id}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="parent"
                        value={node.id}
                        checked={selectedParentId === node.id}
                        onChange={() => setSelectedParentId(node.id)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{title}</div>
                        <div className="text-xs text-muted-foreground">
                          {node.type}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={requiresParent && nodeType === 'sub_section' && !selectedParentId}
            >
              Create Node
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

