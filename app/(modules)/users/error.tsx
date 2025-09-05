'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Users module error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-6">
      <div className="text-center space-y-4 max-w-md">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold">Users Module Error</h2>
        <p className="text-muted-foreground">
          We encountered an error while loading the users module. This could be a temporary issue.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive font-mono">{error.message}</p>
          </div>
        )}
        <div className="flex gap-3 justify-center pt-4">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="outline"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}