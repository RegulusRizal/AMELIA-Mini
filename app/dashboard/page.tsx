import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Building2, Package, ShoppingCart, DollarSign, ArrowRight, UserCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
          <section className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg" aria-labelledby="welcome-heading">
            <h2 id="welcome-heading" className="text-xl font-semibold mb-4">Welcome!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              You are logged in as:
            </p>
            <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
              {user.email}
            </p>
          </section>

          <section className="mb-8" aria-labelledby="user-details-heading">
            <h2 id="user-details-heading" className="text-lg font-semibold mb-4">User Details</h2>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="font-medium w-24">ID:</dt>
                <dd className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                  {user.id}
                </dd>
              </div>
              <div className="flex">
                <dt className="font-medium w-24">Created:</dt>
                <dd className="text-gray-600 dark:text-gray-400">
                  <time dateTime={user.created_at}>
                    {user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}
                  </time>
                </dd>
              </div>
              <div className="flex">
                <dt className="font-medium w-24">Last Sign In:</dt>
                <dd className="text-gray-600 dark:text-gray-400">
                  {user.last_sign_in_at 
                    ? <time dateTime={user.last_sign_in_at}>
                        {new Date(user.last_sign_in_at).toLocaleString()}
                      </time>
                    : 'First time'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="mb-8" aria-labelledby="modules-heading">
            <h2 id="modules-heading" className="text-lg font-semibold mb-4">Quick Access to Modules</h2>
            <nav className="grid grid-cols-2 md:grid-cols-3 gap-4" aria-label="Module navigation">
              <Link
                href="/users"
                className="group p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all hover:scale-105 border border-blue-200 dark:border-blue-800"
                aria-label="User Management - Manage users and permissions"
              >
                <div className="flex items-start justify-between">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <ArrowRight className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </div>
                <h3 className="font-medium text-blue-700 dark:text-blue-400 mt-3">User Management</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage users and permissions</p>
              </Link>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg opacity-50 cursor-not-allowed border border-gray-200 dark:border-gray-700" aria-label="HR Module - Coming soon" aria-disabled="true">
                <Building2 className="h-6 w-6 text-gray-400" aria-hidden="true" />
                <h3 className="font-medium text-gray-500 dark:text-gray-500 mt-3">HR Module</h3>
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Coming soon</p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg opacity-50 cursor-not-allowed border border-gray-200 dark:border-gray-700" aria-label="Inventory - Coming soon" aria-disabled="true">
                <Package className="h-6 w-6 text-gray-400" aria-hidden="true" />
                <h3 className="font-medium text-gray-500 dark:text-gray-500 mt-3">Inventory</h3>
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Coming soon</p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg opacity-50 cursor-not-allowed border border-gray-200 dark:border-gray-700" aria-label="POS System - Coming soon" aria-disabled="true">
                <ShoppingCart className="h-6 w-6 text-gray-400" aria-hidden="true" />
                <h3 className="font-medium text-gray-500 dark:text-gray-500 mt-3">POS System</h3>
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Coming soon</p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg opacity-50 cursor-not-allowed border border-gray-200 dark:border-gray-700" aria-label="Finance - Coming soon" aria-disabled="true">
                <DollarSign className="h-6 w-6 text-gray-400" aria-hidden="true" />
                <h3 className="font-medium text-gray-500 dark:text-gray-500 mt-3">Finance</h3>
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Coming soon</p>
              </div>
            </nav>
          </section>

          <nav className="flex gap-4" aria-label="Dashboard actions">
            <Link
              href="/"
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              aria-label="Navigate back to home page"
            >
              Back to Home
            </Link>
            
            <Link
              href="/profile"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
              aria-label="View my profile"
            >
              <UserCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              My Profile
            </Link>
            
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                aria-label="Sign out of your account"
              >
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      </div>
    </main>
  )
}