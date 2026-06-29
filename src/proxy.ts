import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getCustomerSession } from '@/lib/customer-auth'

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Admin routes — Better Auth session required
  if (
    path.startsWith('/admin/dashboard') ||
    path.startsWith('/admin/bookings') ||
    path.startsWith('/admin/schedule') ||
    path.startsWith('/admin/discounts') ||
    path.startsWith('/api/admin/')
  ) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  }

  // Customer portal routes — customer session required
  if (path.startsWith('/my/') && path !== '/my/login') {
    const session = await getCustomerSession(req)
    if (!session) {
      const next = encodeURIComponent(path)
      return NextResponse.redirect(new URL(`/my/login?next=${next}`, req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/admin/bookings/:path*',
    '/admin/schedule/:path*',
    '/admin/discounts/:path*',
    '/api/admin/:path*',
    '/my/:path*',
  ],
}
