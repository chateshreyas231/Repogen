'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Report {
  id: string
  status: string
  createdAt: string
  template: {
    id: string
    name: string
  }
  _count: {
    sections: number
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
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data)
        if (data.length > 0) {
          setSelectedTemplate(data[0].id)
        }
      })
  }, [])

  const handleCreateReport = async () => {
    if (!selectedTemplate) return

    setLoading(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          templateId: selectedTemplate,
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
          <div className="flex gap-2">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleCreateReport} disabled={loading || !selectedTemplate}>
              {loading ? 'Creating...' : 'New Report'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                    <h4 className="font-medium">{report.template.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {report._count.sections} sections • {report.status}
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

