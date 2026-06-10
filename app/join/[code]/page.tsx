import { redirect } from 'next/navigation'

export default function JoinPage({ params }: { params: { code: string } }) {
  redirect(`/home?join=${params.code}`)
}
