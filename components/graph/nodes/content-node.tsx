'use client'

import { memo } from 'react'
import { NodeProps } from 'reactflow'

export const ContentNode = memo(({ data, id, selected }: NodeProps) => {
  const color = data?.color || data?.parentColor || '#6b7280'
  const content = data?.content || ''

  return (
    <div
      className={`min-w-[260px] rounded-lg shadow-md transition-all duration-200 ml-16 ${
        selected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      style={{
        backgroundColor: `${color}10`,
        border: `2px solid ${color}`,
      }}
    >
      <div className="p-3">
        <div className="text-xs text-muted-foreground mb-1">Content</div>
        {content ? (
          <div
            className="text-sm line-clamp-3"
            dangerouslySetInnerHTML={{ __html: content.substring(0, 150) + (content.length > 150 ? '...' : '') }}
          />
        ) : (
          <div className="text-sm text-muted-foreground italic">Empty content</div>
        )}
      </div>
    </div>
  )
})

ContentNode.displayName = 'ContentNode'
