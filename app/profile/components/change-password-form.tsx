'use client';

import { useState, useTransition } from 'react';
import { changePassword } from '../actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };
  
  const getPasswordStrengthLabel = (strength: number) => {
    switch(strength) {
      case 0:
      case 1:
        return { label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { label: 'Fair', color: 'bg-orange-500' };
      case 3:
        return { label: 'Good', color: 'bg-yellow-500' };
      case 4:
        return { label: 'Strong', color: 'bg-green-500' };
      case 5:
        return { label: 'Very Strong', color: 'bg-green-600' };
      default:
        return { label: 'Weak', color: 'bg-red-500' };
    }
  };
  
  const strength = passwordStrength(newPassword);
  const strengthInfo = getPasswordStrengthLabel(strength);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }
    
    if (strength < 3) {
      setError('Please choose a stronger password');
      return;
    }
    
    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.error) {
        setError(result.error);
        toast.error('Failed to change password');
      } else {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Password changed successfully');
        
        // Reset success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Your password has been changed successfully.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            className="pr-10"
            disabled={isPending}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            disabled={isPending}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            className="pr-10"
            disabled={isPending}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowNewPassword(!showNewPassword)}
            disabled={isPending}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {newPassword && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${strengthInfo.color}`}
                  style={{ width: `${(strength / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{strengthInfo.label}</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                • At least 8 characters
              </li>
              <li className={newPassword.match(/[a-z]/) ? 'text-green-600' : ''}>
                • One lowercase letter
              </li>
              <li className={newPassword.match(/[A-Z]/) ? 'text-green-600' : ''}>
                • One uppercase letter
              </li>
              <li className={newPassword.match(/[0-9]/) ? 'text-green-600' : ''}>
                • One number
              </li>
              <li className={newPassword.match(/[^a-zA-Z0-9]/) ? 'text-green-600' : ''}>
                • One special character
              </li>
            </ul>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            className="pr-10"
            disabled={isPending}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isPending}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-sm text-destructive">Passwords do not match</p>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={isPending || !currentPassword || !newPassword || !confirmPassword}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Changing Password...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </>
        )}
      </Button>
    </form>
  );
}