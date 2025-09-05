'use client';

// Modules Layout
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Users, 
  Home, 
  Building2, 
  Package, 
  ShoppingCart, 
  DollarSign,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const modules = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'HR', href: '/hr', icon: Building2, disabled: true },
  { name: 'Inventory', href: '/inventory', icon: Package, disabled: true },
  { name: 'POS', href: '/pos', icon: ShoppingCart, disabled: true },
  { name: 'Finance', href: '/finance', icon: DollarSign, disabled: true },
];

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();
  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });
  }, []);

  return (
    <>
      {/* Skip to main content link for keyboard/screen reader users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-primary-foreground p-2 m-2 rounded z-50"
      >
        Skip to main content
      </a>
      
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col" role="navigation" aria-label="Main navigation">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <h2 className="text-xl font-bold">AMELIA-Mini</h2>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1" role="navigation">
              {modules.map((module) => {
                const isActive = pathname === module.href;
                
                return (
                  <Link
                    key={module.name}
                    href={module.disabled ? '#' : module.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      module.disabled
                        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : isActive
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    onClick={module.disabled ? (e) => e.preventDefault() : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    aria-disabled={module.disabled}
                >
                  <module.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      module.disabled
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                  {module.name}
                  {module.disabled && (
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Soon</span>
                  )}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userEmail}
                  </p>
                  <form action="/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu drawer */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation menu">
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full bg-white dark:bg-gray-800">
              <div className="flex items-center flex-shrink-0 px-4 py-5">
                <h2 className="text-xl font-bold">AMELIA-Mini</h2>
              </div>
              <div className="mt-5 flex-grow flex flex-col">
                <nav className="flex-1 px-2 pb-4 space-y-1" role="navigation" aria-label="Mobile navigation">
                  {modules.map((module) => {
                    const isActive = pathname === module.href;
                    
                    return (
                      <Link
                        key={module.name}
                        href={module.disabled ? '#' : module.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          module.disabled
                            ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : isActive
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                        onClick={(e) => {
                          if (module.disabled) {
                            e.preventDefault();
                          } else {
                            setMobileMenuOpen(false);
                          }
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        aria-disabled={module.disabled}
                    >
                      <module.icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          module.disabled
                            ? 'text-gray-400 dark:text-gray-500'
                            : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        }`}
                        aria-hidden="true"
                      />
                      {module.name}
                      {module.disabled && (
                        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Soon</span>
                      )}
                      </Link>
                    )
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {userEmail}
                      </p>
                      <form action="/auth/logout" method="POST">
                        <button
                          type="submit"
                          className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          Sign out
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content area with footer */}
      <div className="flex-1 flex flex-col">
        <main id="main-content" className="flex-1 overflow-y-auto" role="main">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
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
        </footer>
      </div>
    </div>
    </>
  );
}