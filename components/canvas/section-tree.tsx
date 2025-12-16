'use client'

import { useState } from 'react'

interface CanvasBlock {
  id: string
  type: string
  title: string | null
  content: string
  order: number
  parentBlockId: string | null
  aiGenerated: boolean
  childBlocks?: CanvasBlock[]
}

function getStatusIcon(block: CanvasBlock) {
  if (block.type === 'section' || block.type === 'sub_section') {
    if (block.content || (block.childBlocks && block.childBlocks.length > 0)) {
      return block.aiGenerated ? 'AI' : 'ED'
    }
    return ''
  }
  return block.aiGenerated ? 'AI' : block.content ? 'ED' : ''
}

export function SectionTree({
  blocks,
  onBlockSelect,
}: {
  blocks: CanvasBlock[]
  onBlockSelect: (blockId: string) => void
}) {
  const buildTree = (parentId: string | null): CanvasBlock[] => {
    return blocks
      .filter((block) => block.parentBlockId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((block) => ({
        ...block,
        childBlocks: buildTree(block.id),
      }))
  }

  const tree = buildTree(null)

  const renderBlock = (block: CanvasBlock, depth = 0) => {
    const isSection = block.type === 'section' || block.type === 'sub_section'
    const indent = depth * 16

    return (
      <div key={block.id}>
        <button
          onClick={() => onBlockSelect(block.id)}
          className="w-full text-left px-2 py-1 hover:bg-accent rounded text-sm flex items-center gap-2"
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          {getStatusIcon(block) && (
            <span className="text-xs text-muted-foreground font-medium">
              {getStatusIcon(block)}
            </span>
          )}
          <span className="truncate">
            {block.title || `${block.type} (untitled)`}
          </span>
        </button>
        {isSection &&
          block.childBlocks &&
          block.childBlocks.length > 0 &&
          block.childBlocks.map((child) => renderBlock(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="font-semibold mb-4">Outline</h2>
      <div className="space-y-1">
        {tree.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sections yet</p>
        ) : (
          tree.map((block) => renderBlock(block))
        )}
      </div>
    </div>
  )
}

