import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      projects: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { reports: true, resources: true } },
        },
      },
    },
  })

  if (!client) {
    return <div>Client not found</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link href="/clients" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
          ← Back to Clients
        </Link>
        <div className="flex justify-between items-start mt-4">
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            {client.email && <p className="text-muted-foreground">{client.email}</p>}
            {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
            {client.address && <p className="text-muted-foreground">{client.address}</p>}
          </div>
          <Link href={`/projects/new?clientId=${client.id}`}>
            <Button>New Project</Button>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Projects</h2>
        {client.projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Link href={`/projects/new?clientId=${client.id}`}>
                <Button>Create First Project</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {client.projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle>{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.location && (
                      <p className="text-sm text-muted-foreground mb-2">{project.location}</p>
                    )}
                    <div className="flex gap-4 text-sm">
                      <span>{project._count.reports} report{project._count.reports !== 1 ? 's' : ''}</span>
                      <span>{project._count.resources} resource{project._count.resources !== 1 ? 's' : ''}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

