'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateUser } from '../actions';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

interface EditUserDialogProps {
  user: {
    id: string;
    email: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    employee_id?: string;
    status: 'active' | 'inactive' | 'suspended';
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditUserDialog = React.memo(function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(user.status || 'active');
  const router = useRouter();
  
  // Update status when user prop changes
  useEffect(() => {
    setStatus(user.status || 'active');
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await updateUser(user.id, formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and account status.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div 
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
                aria-describedby="email-note"
              />
              <p id="email-note" className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            
            <fieldset>
              <legend className="sr-only">Personal Information</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">
                    First Name <span className="text-red-500" aria-label="required">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    defaultValue={user.first_name || ''}
                    placeholder="John"
                    required
                    aria-required="true"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-red-500" aria-label="required">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    defaultValue={user.last_name || ''}
                    placeholder="Doe"
                    required
                    aria-required="true"
                  />
                </div>
              </div>
            </fieldset>
            
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={user.display_name || ''}
                placeholder="John Doe"
              />
            </div>
            
            <fieldset>
              <legend className="sr-only">Contact and Employee Information</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={user.phone || ''}
                    placeholder="+1 555-0123"
                    aria-describedby="phone-edit-description"
                  />
                  <span id="phone-edit-description" className="sr-only">Optional phone number</span>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    name="employee_id"
                    defaultValue={user.employee_id || ''}
                    placeholder="EMP001"
                    aria-describedby="employee-edit-description"
                  />
                  <span id="employee-edit-description" className="sr-only">Optional employee identifier</span>
                </div>
              </div>
            </fieldset>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-status-select">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="edit-status-select" aria-label="Select user status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="status" value={status} />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

EditUserDialog.displayName = 'EditUserDialog';