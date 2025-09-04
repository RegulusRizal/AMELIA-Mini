'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '../actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileFormProps {
  profile: any;
  userId: string;
}

export function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    email: profile?.email || ''
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value);
    });
    
    startTransition(async () => {
      const result = await updateProfile(userId, formDataObj);
      
      if (result.error) {
        setError(result.error);
        toast.error('Failed to update profile');
      } else {
        setSuccess(true);
        toast.success('Profile updated successfully');
        router.refresh();
        
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
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
            Your profile has been updated successfully.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="Enter your first name"
            disabled={isPending}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Enter your last name"
            disabled={isPending}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          name="display_name"
          type="text"
          value={formData.display_name}
          onChange={handleChange}
          placeholder="Enter your display name"
          disabled={isPending}
        />
        <p className="text-sm text-muted-foreground">
          This is how your name will appear throughout the application
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          disabled={isPending}
        />
        <p className="text-sm text-muted-foreground">
          Note: Changing your email requires verification
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter your phone number"
          disabled={isPending}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isPending}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating Profile...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>
    </form>
  );
}