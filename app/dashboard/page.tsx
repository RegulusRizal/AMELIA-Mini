import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  // Debug logging
  console.log('Dashboard - User:', user)
  console.log('Dashboard - Error:', error)

  if (error || !user) {
    console.log('Dashboard - Redirecting to login, no user found')
    redirect('/auth/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Welcome!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              You are logged in as:
            </p>
            <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
              {user.email}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">User Details</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-medium w-24">ID:</span>
                <span className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                  {user.id}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium w-24">Created:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium w-24">Last Sign In:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : 'First time'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/"
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </Link>
            
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}