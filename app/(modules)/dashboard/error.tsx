'use client'

import { useEffect } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="text-center space-y-4 max-w-lg">
        <AlertTriangle className="h-20 w-20 text-yellow-500 mx-auto" />
        <h1 className="text-3xl font-bold">Dashboard Unavailable</h1>
        <p className="text-lg text-muted-foreground">
          We're having trouble loading the dashboard. This might be a temporary connection issue.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-muted rounded-lg p-4 mt-4">
            <p className="text-sm font-mono text-muted-foreground">
              Error details: {error.message}
            </p>
          </div>
        )}
        <div className="flex gap-3 justify-center pt-6">
          <Button onClick={reset} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Loading
          </Button>
          <Button 
            onClick={() => window.location.href = '/'} 
            variant="outline"
            size="lg"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
        <p className="text-sm text-muted-foreground pt-4">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  )
}