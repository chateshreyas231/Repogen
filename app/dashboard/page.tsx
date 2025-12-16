import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const [projects, reports] = await Promise.all([
    prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { reports: true, resources: true } },
      },
    }),
    prisma.report.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { name: true } },
        _count: { select: { nodes: true } },
      },
    }),
  ])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session.user?.name || session.user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/projects/new">
            <Button>New Project</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Total projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>Total reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Latest project activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects.length === 0 ? (
                <p className="text-muted-foreground text-sm">No projects yet</p>
              ) : (
                projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-3 rounded-md hover:bg-accent"
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {project._count.reports} report{project._count.reports !== 1 ? 's' : ''} • {project._count.resources} resource{project._count.resources !== 1 ? 's' : ''}
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link href="/projects" className="text-sm text-primary hover:underline mt-4 block">
              View all projects →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Latest reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reports yet</p>
              ) : (
                reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="block p-3 rounded-md hover:bg-accent"
                  >
                    <div className="font-medium">{report.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {report.project.name} • {report._count.nodes} node{report._count.nodes !== 1 ? 's' : ''}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

