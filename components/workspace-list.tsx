'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'

interface Report {
  id: string
  title: string
  clientName: string
  projectTitle: string
  status: string
  priority: number | null
  dueDate: string | null
  lastEditedAt: string | null
  lastEditedBy: { id: string; name: string } | null
  assignedUsers: Array<{ id: string; name: string; role: string }>
}

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  drafting: 'Drafting',
  in_review: 'In Review',
  ready_for_export: 'Ready for Export',
  delivered: 'Delivered',
}

export function WorkspaceList({ reports }: { reports: Report[] }) {
  const router = useRouter()

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString()
  }

  const getPriorityLabel = (priority: number | null) => {
    if (!priority) return 'Normal'
    if (priority === 1) return 'High'
    if (priority === 2) return 'Medium'
    return 'Low'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 text-sm font-semibold">Report</th>
                <th className="text-left p-4 text-sm font-semibold">Client</th>
                <th className="text-left p-4 text-sm font-semibold">Project</th>
                <th className="text-left p-4 text-sm font-semibold">Status</th>
                <th className="text-left p-4 text-sm font-semibold">Priority</th>
                <th className="text-left p-4 text-sm font-semibold">Assigned</th>
                <th className="text-left p-4 text-sm font-semibold">Due Date</th>
                <th className="text-left p-4 text-sm font-semibold">Last Edited</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-t hover:bg-accent cursor-pointer"
                    onClick={() => router.push(`/reports/${report.id}/workspace`)}
                  >
                    <td className="p-4">
                      <div className="font-medium">{report.title}</div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {report.clientName}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {report.projectTitle}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-secondary rounded text-xs">
                        {STATUS_LABELS[report.status] || report.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{getPriorityLabel(report.priority)}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {report.assignedUsers.slice(0, 3).map((user) => (
                          <div
                            key={user.id}
                            className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center"
                            title={user.name}
                          >
                            {getInitials(user.name)}
                          </div>
                        ))}
                        {report.assignedUsers.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">
                            +{report.assignedUsers.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(report.dueDate)}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(report.lastEditedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

