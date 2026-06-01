import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) console.error('Proxy auth error', error)
  if (!user) return NextResponse.redirect(new URL('/admin', req.url))
  return res
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/bookings/:path*', '/admin/schedule/:path*', '/api/admin/:path*'],
}
