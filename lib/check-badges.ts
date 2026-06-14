// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkAndUnlockBadges(supabase: any, userId: string) {
  const { data: preds } = await supabase
    .from('user_predictions')
    .select('is_correct, points_earned, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!preds) return

  const totalPreds   = preds.length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const correctCount = preds.filter((p: any) => p.is_correct).length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exactCount   = preds.filter((p: any) => p.points_earned === 8).length

  let streak = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of preds) {
    if (p.is_correct) streak++
    else break
  }

  const toUnlock: string[] = []
  if (correctCount >= 1) toUnlock.push('primer_acierto')
  if (streak >= 3)        toUnlock.push('racha_3')
  if (streak >= 5)        toUnlock.push('racha_5')
  if (exactCount >= 1)    toUnlock.push('marcador_exacto')
  if (exactCount >= 5)    toUnlock.push('cinco_exactos')
  if (totalPreds >= 10)   toUnlock.push('diez_predicciones')
  if (totalPreds >= 20)   toUnlock.push('veinte_predicciones')

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points')
    .eq('id', userId)
    .single()

  const { data: topUser } = await supabase
    .from('profiles')
    .select('id, total_points')
    .order('total_points', { ascending: false })
    .limit(1)
    .single()

  if (topUser?.id === userId && (profile?.total_points ?? 0) > 0) {
    toUnlock.push('lider')
  }

  for (const badgeId of toUnlock) {
    await supabase
      .from('user_badges')
      .upsert({ user_id: userId, badge_id: badgeId }, { onConflict: 'user_id,badge_id' })
  }
}
