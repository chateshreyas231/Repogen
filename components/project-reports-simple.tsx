'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TemplateSelector } from '@/components/graph/template-selector'
import { reportTemplates, type ReportTemplate } from '@/lib/templates'

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
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelectTemplate = async (template: ReportTemplate) => {
    setShowTemplateSelector(false)
    setLoading(true)
    
    try {
      // Create report with title
      const reportResponse = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: template.name,
        }),
      })

      if (reportResponse.ok) {
        const newReport = await reportResponse.json()
        
        // Apply template to the report
        const templateResponse = await fetch(`/api/reports/${newReport.id}/apply-template`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: template.id,
          }),
        })

        if (templateResponse.ok) {
          router.push(`/reports/${newReport.id}`)
        } else {
          // Report created but template failed - still navigate
          router.push(`/reports/${newReport.id}`)
        }
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
          <Button 
            onClick={() => setShowTemplateSelector(true)} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating...' : '+ New Report from Template'}
          </Button>
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
      {showTemplateSelector && (
        <TemplateSelector
          onSelectTemplate={handleSelectTemplate}
          onCancel={() => setShowTemplateSelector(false)}
        />
      )}
    </Card>
  )
}

