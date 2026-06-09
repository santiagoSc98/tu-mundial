// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QResult<T> = { data: T | null; error: any; count?: number | null }

export async function queryWithTimeout<T>(
  queryPromise: Promise<QResult<T>>,
  timeoutMs = 8000,
): Promise<QResult<T>> {
  const timeout = new Promise<QResult<T>>(resolve =>
    setTimeout(
      () => resolve({ data: null, error: { message: `Query timeout after ${timeoutMs}ms` } }),
      timeoutMs,
    ),
  )
  return Promise.race([queryPromise, timeout])
}

export async function queryWithRetry<T>(
  queryFn: () => Promise<QResult<T>>,
  maxRetries = 2,
  timeoutMs = 8000,
): Promise<QResult<T>> {
  for (let i = 0; i <= maxRetries; i++) {
    const result = await queryWithTimeout(queryFn(), timeoutMs)
    if (!result.error) return result
    if (i < maxRetries) {
      console.warn(`[queryWithRetry] attempt ${i + 1}/${maxRetries} failed:`, result.error?.message)
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return { data: null, error: { message: 'Max retries reached' } }
}
