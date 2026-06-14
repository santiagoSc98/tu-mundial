import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTeamNameES } from '@/lib/worldcup'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: predictions, error } = await (supabase as any)
    .from('predictions')
    .select('id, options, correct_answer, title')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let updated = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changes: any[] = []

  for (const pred of (predictions ?? [])) {
    const opts = Array.isArray(pred.options) ? (pred.options as string[]) : []
    const newOpts = opts.map((o: string) => getTeamNameES(o) || o)

    const optsChanged = JSON.stringify(opts) !== JSON.stringify(newOpts)
    const newCorrectAnswer = pred.correct_answer
      ? (getTeamNameES(pred.correct_answer) || pred.correct_answer)
      : pred.correct_answer
    const correctAnswerChanged = newCorrectAnswer !== pred.correct_answer

    if (!optsChanged && !correctAnswerChanged) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upErr } = await (supabase as any)
      .from('predictions')
      .update({
        options:        newOpts,
        correct_answer: newCorrectAnswer,
      })
      .eq('id', pred.id)

    if (upErr) {
      console.error(`[fix-team-names] update failed for ${pred.id}:`, upErr)
      continue
    }

    updated++
    changes.push({
      id:    pred.id,
      title: pred.title,
      optsBefore:          opts,
      optsAfter:           newOpts,
      correctAnswerBefore: pred.correct_answer,
      correctAnswerAfter:  newCorrectAnswer,
    })
    console.log(`[fix-team-names] fixed "${pred.title}":`, { optsBefore: opts, optsAfter: newOpts })
  }

  return NextResponse.json({ total: predictions?.length ?? 0, updated, changes })
}
