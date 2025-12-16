'use client'

import { useState } from 'react'
import { SectionBlock } from './blocks/section-block'
import { SubSectionBlock } from './blocks/subsection-block'
import { TextBlock } from './blocks/text-block'
import { PromptBlock } from './blocks/prompt-block'
import { Button } from '@/components/ui/button'

interface CanvasBlock {
  id: string
  type: string
  title: string | null
  content: string
  order: number
  parentBlockId: string | null
  aiGenerated: boolean
  aiPrompt: string | null
  linkedResourceIds: string | null
  childBlocks?: CanvasBlock[]
}

interface ProjectResource {
  id: string
  type: string
  title: string | null
  content: string
}

function buildBlockTree(blocks: CanvasBlock[]): CanvasBlock[] {
  const blockMap = new Map<string, CanvasBlock>()
  const rootBlocks: CanvasBlock[] = []

  // Create map of all blocks
  blocks.forEach((block) => {
    blockMap.set(block.id, { ...block, childBlocks: [] })
  })

  // Build tree
  blocks.forEach((block) => {
    const blockWithChildren = blockMap.get(block.id)!
    if (block.parentBlockId) {
      const parent = blockMap.get(block.parentBlockId)
      if (parent) {
        if (!parent.childBlocks) parent.childBlocks = []
        parent.childBlocks.push(blockWithChildren)
      }
    } else {
      rootBlocks.push(blockWithChildren)
    }
  })

  // Sort by order
  const sortBlocks = (blocks: CanvasBlock[]) => {
    blocks.sort((a, b) => a.order - b.order)
    blocks.forEach((block) => {
      if (block.childBlocks) {
        sortBlocks(block.childBlocks)
      }
    })
  }

  sortBlocks(rootBlocks)
  return rootBlocks
}

export function CanvasArea({
  reportId,
  blocks,
  resources,
  onUpdate,
}: {
  reportId: string
  blocks: CanvasBlock[]
  resources: ProjectResource[]
  onUpdate: () => void
}) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const blockTree = buildBlockTree(blocks)

  const handleAddBlock = async (type: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/canvas/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: type === 'section' ? 'New Section' : null,
          content: '',
        }),
      })

      if (response.ok) {
        onUpdate()
        setShowAddMenu(false)
      }
    } catch (err) {
      console.error('Error adding block:', err)
    }
  }

  const renderBlock = (block: CanvasBlock, depth = 0) => {
    const props = {
      key: block.id,
      block,
      reportId,
      resources,
      onUpdate,
      depth,
    }

    switch (block.type) {
      case 'section':
        return <SectionBlock {...props} />
      case 'sub_section':
        return <SubSectionBlock {...props} />
      case 'text':
        return <TextBlock {...props} />
      case 'prompt':
        return <PromptBlock {...props} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Report Canvas</h1>
        <div className="relative">
          <Button onClick={() => setShowAddMenu(!showAddMenu)}>
            + Add Block
          </Button>
          {showAddMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-10">
              <button
                onClick={() => handleAddBlock('section')}
                className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
              >
                Section
              </button>
              <button
                onClick={() => handleAddBlock('sub_section')}
                className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
              >
                Sub-Section
              </button>
              <button
                onClick={() => handleAddBlock('text')}
                className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
              >
                Text Block
              </button>
              <button
                onClick={() => handleAddBlock('prompt')}
                className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
              >
                Prompt Block
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {blockTree.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No blocks yet. Click "Add Block" to get started.</p>
          </div>
        ) : (
          blockTree.map((block) => (
            <div key={block.id} id={`block-${block.id}`}>
              {renderBlock(block)}
              {block.childBlocks && block.childBlocks.length > 0 && (
                <div className="ml-8 mt-2 space-y-2">
                  {block.childBlocks.map((child) => renderBlock(child, 1))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

