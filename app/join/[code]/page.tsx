import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const cookieStore = await cookies()
  cookieStore.set('pending_join_code', code.toUpperCase(), {
    maxAge: 60 * 30,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })
  redirect('/home')
}
