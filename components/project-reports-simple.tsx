'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Report {
  id: string
  title: string
  createdAt: string
  _count: {
    nodes: number
  }
}

export function ProjectReports({
  projectId,
  initialReports,
}: {
  projectId: string
  initialReports: Report[]
}) {
  const router = useRouter()
  const [reports, setReports] = useState(initialReports)
  const [newReportTitle, setNewReportTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateReport = async () => {
    if (!newReportTitle.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: newReportTitle,
        }),
      })

      if (response.ok) {
        const newReport = await response.json()
        router.push(`/reports/${newReport.id}`)
      }
    } catch (err) {
      console.error('Error creating report:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Reports</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="New report title..."
              value={newReportTitle}
              onChange={(e) => setNewReportTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateReport()}
            />
            <Button onClick={handleCreateReport} disabled={loading || !newReportTitle.trim()}>
              {loading ? 'Creating...' : 'New Report'}
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reports yet</p>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="p-3 border rounded-md hover:bg-accent cursor-pointer"
                onClick={() => router.push(`/reports/${report.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {report._count.nodes} node{report._count.nodes !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

