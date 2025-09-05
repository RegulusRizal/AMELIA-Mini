import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          AMELIA Mini
        </h1>
        <p className="text-center text-lg mb-8">
          Connected to Supabase & Deployed on Vercel
        </p>
        
        {user && (
          <div className="text-center mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-green-700 dark:text-green-300">
              Logged in as: <span className="font-semibold">{user.email}</span>
            </p>
          </div>
        )}
        
        <div className="flex gap-4 justify-center flex-wrap">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <form action="/auth/logout" method="POST" className="inline">
                <button
                  type="submit"
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In / Sign Up
              </Link>
            </>
          )}
          
          {/* Test API Connection button - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <a
              href="/api/test"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Test API Connection (Dev Only)
            </a>
          )}
        </div>
      </div>
    </main>
  )
}