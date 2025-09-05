'use client';

import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-1">
        {children}
      </div>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>© 2025 AMELIA-Mini ERP</span>
            </div>
            <nav className="flex items-center space-x-4" aria-label="Footer navigation">
              <Link 
                href="/privacy-policy" 
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Terms of Service
              </Link>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                Cookie Settings
              </button>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}