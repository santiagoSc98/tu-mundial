import { redirect } from 'next/navigation'

export default function JoinPage({
  params,
}: {
  params: { code: string }
}) {
  redirect(`/?join=${params.code}`)
}
