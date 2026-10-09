'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/features/auth/providers/auth-provider'
import { SocketProvider } from '@/lib/socket-provider'
import { ThemeProvider } from '@/components/theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors except 408, 429
              if (
                error instanceof Error &&
                'status' in error &&
                typeof error.status === 'number'
              ) {
                if (error.status >= 400 && error.status < 500) {
                  return error.status === 408 || error.status === 429
                }
              }
              return failureCount < 3
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}