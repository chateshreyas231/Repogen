'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

export const EndNode = memo(({ selected }: NodeProps) => {
  return (
    <div
      className={`rounded-full shadow-md transition-all duration-200 flex items-center justify-center ${
        selected ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      style={{
        width: '120px',
        height: '120px',
        backgroundColor: '#ef4444',
        border: '3px solid #dc2626',
        color: 'white',
      }}
    >
      <div className="text-center">
        <div className="font-bold text-sm">End</div>
      </div>
      <Handle type="target" position={Position.Top} style={{ background: '#dc2626', width: '12px', height: '12px' }} />
    </div>
  )
})

EndNode.displayName = 'EndNode'
