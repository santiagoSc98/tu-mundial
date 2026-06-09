import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...(options as object) })
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: '', ...(options as object) })
        },
      },
    }
  )

  // Use getSession() instead of getUser() — reads JWT from cookie locally,
  // no network call. The real auth validation happens in each page/route handler.
  const { data: { session } } = await supabase.auth.getSession()

  if (
    !session &&
    (request.nextUrl.pathname.startsWith('/home') ||
      request.nextUrl.pathname.startsWith('/perfil') ||
      request.nextUrl.pathname.startsWith('/rankings'))
  ) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/home/:path*', '/perfil/:path*', '/rankings/:path*'],
}
