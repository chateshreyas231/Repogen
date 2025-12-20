'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

import { Rocket } from 'lucide-react'

export const StartNode = memo(({ selected }: NodeProps) => {
  return (
    <div
      className={`rounded-full transition-all duration-200 flex items-center justify-center ${
        selected 
          ? 'ring-2 ring-primary ring-offset-2 shadow-xl scale-105' 
          : 'shadow-md hover:shadow-lg hover:scale-[1.02]'
      }`}
      style={{
        width: '120px',
        height: '120px',
        backgroundColor: '#10b981',
        border: '3px solid #059669',
        color: 'white',
      }}
    >
      <div className="text-center">
        <Rocket className="h-6 w-6 mx-auto mb-1" />
        <div className="font-bold text-sm">Start</div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#059669', width: '12px', height: '12px' }} />
    </div>
  )
})

StartNode.displayName = 'StartNode'
