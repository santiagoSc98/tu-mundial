'use server'

import { cookies } from 'next/headers'

export async function clearJoinCode() {
  const cookieStore = await cookies()
  cookieStore.delete('pending_join_code')
}
