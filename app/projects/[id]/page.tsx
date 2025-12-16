import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectResources } from '@/components/project-resources-simple'
import { ProjectReports } from '@/components/project-reports-simple'

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      resources: {
        orderBy: { createdAt: 'desc' },
      },
      reports: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { nodes: true },
          },
        },
      },
    },
  })

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
          ← Back to Projects
        </Link>
        <div className="flex justify-between items-start mt-4">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ProjectResources projectId={params.id} initialResources={project.resources} />
        </div>
        <div>
          <ProjectReports projectId={params.id} initialReports={project.reports} />
        </div>
      </div>
    </div>
  )
}
