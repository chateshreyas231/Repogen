'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

export function Nav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (!session || pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/" className="font-bold text-xl">
              Repogen
            </Link>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className={`text-sm hover:text-foreground ${
                  pathname === '/dashboard' ? 'font-semibold' : 'text-muted-foreground'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className={`text-sm hover:text-foreground ${
                  pathname?.startsWith('/projects') ? 'font-semibold' : 'text-muted-foreground'
                }`}
              >
                Projects
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user?.name || session.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

