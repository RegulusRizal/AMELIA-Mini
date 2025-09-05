'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Settings, X, Check, Shield } from 'lucide-react';
import Link from 'next/link';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    preferences: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const savedPrefs = JSON.parse(localStorage.getItem('cookie-preferences') || '{}');
        setPreferences({ ...preferences, ...savedPrefs, necessary: true });
      } catch (e) {
        console.error('Failed to load cookie preferences:', e);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    
    // Here you would typically initialize or destroy tracking scripts based on preferences
    if (prefs.analytics) {
      // Initialize analytics (e.g., Google Analytics, Mixpanel)
      console.log('Analytics cookies enabled');
    }
    if (prefs.marketing) {
      // Initialize marketing tools (e.g., Facebook Pixel, Google Ads)
      console.log('Marketing cookies enabled');
    }
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      preferences: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
    setShowBanner(false);
    setShowSettings(false);
  };

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      preferences: false,
      marketing: false,
    };
    setPreferences(onlyNecessary);
    savePreferences(onlyNecessary);
    setShowBanner(false);
    setShowSettings(false);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
    // If closing settings without saving and no consent given yet, show banner again
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  };

  // Cookie Settings Modal
  if (showSettings) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={closeSettings}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Cookie Preferences</CardTitle>
            </div>
            <CardDescription>
              Manage your cookie preferences. You can enable or disable different categories of cookies below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Necessary Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="necessary" className="font-semibold">
                      Necessary Cookies
                    </Label>
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                      Always Enabled
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Essential for the website to function properly. These cookies ensure basic functionalities 
                    and security features of the website, anonymously.
                  </p>
                </div>
                <Switch
                  id="necessary"
                  checked={true}
                  disabled
                  className="opacity-50"
                />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="analytics" className="font-semibold">
                    Analytics Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Help us understand how visitors interact with our website by collecting and reporting 
                    information anonymously. This helps us improve our service.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, analytics: checked })
                  }
                />
              </div>
            </div>

            {/* Preference Cookies */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="preferences" className="font-semibold">
                    Preference Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow the website to remember choices you make (such as your language or region) and 
                    provide enhanced, more personalized features.
                  </p>
                </div>
                <Switch
                  id="preferences"
                  checked={preferences.preferences}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, preferences: checked })
                  }
                />
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="marketing" className="font-semibold">
                    Marketing Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Used to track visitors across websites to display ads that are relevant and engaging 
                    for the individual user.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, marketing: checked })
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={rejectAll}
                className="flex-1"
              >
                Reject All
              </Button>
              <Button 
                variant="outline"
                onClick={saveCustomPreferences}
                className="flex-1"
              >
                Save Preferences
              </Button>
              <Button 
                onClick={acceptAll}
                className="flex-1"
              >
                Accept All
              </Button>
            </div>

            {/* Privacy Policy Link */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              Learn more about how we use cookies in our{' '}
              <Link href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cookie Banner
  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t shadow-lg">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                We use cookies to enhance your experience
              </p>
              <p className="text-sm text-muted-foreground">
                We use cookies and similar technologies to help personalize content, tailor and measure ads, 
                and provide a better experience. By clicking accept, you agree to this, as outlined in our{' '}
                <Link href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={rejectAll}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Reject All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={openSettings}
              className="flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Customize
            </Button>
            <Button 
              size="sm"
              onClick={acceptAll}
              className="flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a function to programmatically open cookie settings
export function openCookieSettings() {
  // Dispatch a custom event that the component can listen to
  window.dispatchEvent(new CustomEvent('open-cookie-settings'));
}

// Add event listener support to the component
export function CookieSettingsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleOpenSettings = () => {
      // This would need to be connected to the component's state
      // For now, we'll just clear the consent to show the banner again
      localStorage.removeItem('cookie-consent');
      window.location.reload();
    };

    window.addEventListener('open-cookie-settings', handleOpenSettings);
    return () => window.removeEventListener('open-cookie-settings', handleOpenSettings);
  }, []);

  return <>{children}</>;
}