'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resetUserPassword, sendPasswordResetEmail } from '../actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Key, Mail, Copy, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { generateSecurePassword } from '@/lib/utils/password-generator';

interface ResetPasswordDialogProps {
  user: {
    id: string;
    email: string;
    display_name?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ user, open, onOpenChange }: ResetPasswordDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();


  const handleGeneratePassword = async () => {
    setError(null);
    setSuccess(null);
    
    const newPassword = generateSecurePassword(12);
    setGeneratedPassword(newPassword);
    
    startTransition(async () => {
      const result = await resetUserPassword(user.id, newPassword);
      
      if (result.error) {
        setError(result.error);
        setGeneratedPassword(null);
      } else {
        setSuccess(`Password reset successfully. New password has been generated.`);
        router.refresh();
      }
    });
  };

  const handleCustomPassword = async () => {
    setError(null);
    setSuccess(null);
    
    if (customPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (customPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    startTransition(async () => {
      const result = await resetUserPassword(user.id, customPassword);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Password reset successfully');
        setCustomPassword('');
        setConfirmPassword('');
        router.refresh();
        setTimeout(() => onOpenChange(false), 2000);
      }
    });
  };

  const handleSendResetEmail = async () => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      const result = await sendPasswordResetEmail(user.email);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`Password reset email sent to ${user.email}`);
        setTimeout(() => onOpenChange(false), 2000);
      }
    });
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setGeneratedPassword(null);
      setCustomPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowGeneratedPassword(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset password for {user.display_name || user.email}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Generate a secure random password for the user.
            </div>
            
            {generatedPassword && (
              <div className="space-y-2">
                <Label>Generated Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showGeneratedPassword ? "text" : "password"}
                      value={generatedPassword}
                      readOnly
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                    >
                      {showGeneratedPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Copy this password now. It won't be shown again.
                </p>
              </div>
            )}

            <Button 
              onClick={handleGeneratePassword} 
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Generate New Password
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-password">New Password</Label>
              <div className="relative">
                <Input
                  id="custom-password"
                  type={showPassword ? "text" : "password"}
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button 
              onClick={handleCustomPassword} 
              disabled={isPending || !customPassword || !confirmPassword}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Password...
                </>
              ) : (
                'Set Custom Password'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Send a password reset email to {user.email}. The user will receive a link to set their own password.
            </div>

            <Button 
              onClick={handleSendResetEmail} 
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reset Email
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}