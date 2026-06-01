import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${req.cookies.get('sb-access-token')?.value ?? ''}` } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/admin', req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/bookings/:path*', '/admin/schedule/:path*', '/api/admin/:path*'],
}
