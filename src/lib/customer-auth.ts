import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const COOKIE = '__customer_session'

async function resolveSession(token: string | undefined): Promise<{ phone: string } | null> {
  if (!token) return null
  const session = await prisma.customerSession.findUnique({ where: { sessionToken: token } })
  if (!session || session.expiresAt < new Date()) return null
  return { phone: session.phone }
}

// For API route handlers and proxy.ts
export async function getCustomerSession(req: NextRequest): Promise<{ phone: string } | null> {
  return resolveSession(req.cookies.get(COOKIE)?.value)
}

// For server components (App Router pages) — uses next/headers
export async function getCustomerSessionFromCookies(): Promise<{ phone: string } | null> {
  const jar = await cookies()
  return resolveSession(jar.get(COOKIE)?.value)
}
