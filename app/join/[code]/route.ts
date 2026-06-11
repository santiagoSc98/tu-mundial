import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const cookieStore = await cookies()
  cookieStore.set('pending_join_code', code.toUpperCase(), {
    maxAge: 60 * 30,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })
  return NextResponse.redirect(new URL('/home', request.url))
}
