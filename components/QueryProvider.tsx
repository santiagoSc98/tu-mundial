'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:        5 * 60 * 1000,
        gcTime:           30 * 60 * 1000,
        retry:            1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
