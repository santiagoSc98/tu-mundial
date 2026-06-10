import { redirect } from 'next/navigation'

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  redirect(`/home?join=${code}`)
}
