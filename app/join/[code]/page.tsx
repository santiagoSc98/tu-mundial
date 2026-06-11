import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function JoinPage({
  params,
}: {
  params: { code: string }
}) {
  const cookieStore = await cookies()
  cookieStore.set('pending_join_code', params.code.toUpperCase(), {
    maxAge: 60 * 30,
    path: '/',
  })

  redirect('/home')
}
