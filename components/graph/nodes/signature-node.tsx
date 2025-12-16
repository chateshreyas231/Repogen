'use client'

import { memo, useState, useEffect } from 'react'
import { NodeProps } from 'reactflow'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PenTool, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { SignatureNodeData } from '@/types/report-nodes'

export const SignatureNode = memo(({ data, id, selected }: NodeProps) => {
  const nodeData = data as SignatureNodeData
  const [title, setTitle] = useState(nodeData?.title || 'Signature')
  const [signerName, setSignerName] = useState(nodeData?.signerName || '')
  const [signerTitle, setSignerTitle] = useState(nodeData?.signerTitle || '')
  const [status, setStatus] = useState<'pending' | 'signed' | 'rejected'>(nodeData?.status || 'pending')
  const [isExpanded, setIsExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  const reportId = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : ''

  useEffect(() => {
    const nodeData = data as SignatureNodeData
    setTitle(nodeData?.title || 'Signature')
    setSignerName(nodeData?.signerName || '')
    setSignerTitle(nodeData?.signerTitle || '')
    setStatus(nodeData?.status || 'pending')
  }, [data])

  const updateNode = async (updates: any) => {
    if (!reportId) return
    clearTimeout((window as any)[`save-signature-${id}`])
    ;(window as any)[`save-signature-${id}`] = setTimeout(async () => {
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

  const getStatusIcon = () => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const nodeColor = '#ef4444' // Red for signatures

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
          <PenTool className="h-4 w-4" style={{ color: nodeColor }} />
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              updateNode({ title: e.target.value })
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Signature title"
            className="font-semibold border-none shadow-none p-0 h-auto text-sm flex-1 bg-transparent"
            style={{ color: nodeColor }}
          />
          {getStatusIcon()}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-2 space-y-3">
          <div>
            <Label className="text-xs">Status</Label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'pending' | 'signed' | 'rejected')
                updateNode({ status: e.target.value })
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
            >
              <option value="pending">Pending</option>
              <option value="signed">Signed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Signer Name</Label>
            <Input
              value={signerName}
              onChange={(e) => {
                setSignerName(e.target.value)
                updateNode({ signerName: e.target.value })
              }}
              placeholder="Name of signer"
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Signer Title</Label>
            <Input
              value={signerTitle}
              onChange={(e) => {
                setSignerTitle(e.target.value)
                updateNode({ signerTitle: e.target.value })
              }}
              placeholder="Title/Role"
              className="mt-1 text-xs"
            />
          </div>
          {status === 'signed' && nodeData?.signedAt && (
            <div className="text-xs text-muted-foreground">
              Signed: {new Date(nodeData.signedAt).toLocaleDateString()}
            </div>
          )}
          <div className="border rounded p-4 bg-muted/30 min-h-[100px] flex items-center justify-center">
            <div className="text-center">
              <PenTool className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                Signature capture (coming soon)
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

SignatureNode.displayName = 'SignatureNode'

