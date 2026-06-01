import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('sb-access-token')?.value
  if (!token) return NextResponse.redirect(new URL('/admin', req.url))

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) console.error('Proxy auth error', error)
  if (!user) return NextResponse.redirect(new URL('/admin', req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/bookings/:path*', '/admin/schedule/:path*', '/api/admin/:path*'],
}
