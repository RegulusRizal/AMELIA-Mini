'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '../actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from 'lucide-react';
import { generateSecurePassword } from '@/lib/utils/password-generator';

interface Role {
  id: string;
  name: string;
  display_name: string;
}

interface AddUserDialogProps {
  children?: React.ReactNode;
  roles?: Role[];
}

export const AddUserDialog = React.memo(function AddUserDialog({ children, roles = [] }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('active');
  const [roleId, setRoleId] = useState('no-role');
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    
    // Generate a secure temporary password
    const tempPassword = generateSecurePassword(12);
    formData.append('password', tempPassword);
    
    startTransition(async () => {
      const result = await createUser(formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        // Reset form state
        setStatus('active');
        setRoleId('no-role');
        setError(null);
        router.refresh();
        // In production, password is sent via email only
        // alert(`User created successfully! Temporary password: ${tempPassword}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will receive an email with login instructions.
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
                    placeholder="John"
                    required
                    aria-required="true"
                    aria-describedby="first_name-description"
                  />
                  <span id="first_name-description" className="sr-only">Enter the user's first name</span>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-red-500" aria-label="required">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    placeholder="Doe"
                    required
                    aria-required="true"
                    aria-describedby="last_name-description"
                  />
                  <span id="last_name-description" className="sr-only">Enter the user's last name</span>
                </div>
              </div>
            </fieldset>
            
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-red-500" aria-label="required">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
                aria-required="true"
                aria-describedby="email-description"
              />
              <span id="email-description" className="sr-only">Enter the user's email address for login</span>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                placeholder="John Doe"
                aria-describedby="display_name-description"
              />
              <span id="display_name-description" className="sr-only">Optional display name for the user</span>
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
                    placeholder="+1 555-0123"
                    aria-describedby="phone-description"
                  />
                  <span id="phone-description" className="sr-only">Optional phone number</span>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    name="employee_id"
                    placeholder="EMP001"
                    aria-describedby="employee_id-description"
                  />
                  <span id="employee_id-description" className="sr-only">Optional employee identifier</span>
                </div>
              </div>
            </fieldset>
            
            <div className="grid gap-2">
              <Label htmlFor="status-select">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status-select" aria-label="Select user status">
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
            
            <div className="grid gap-2">
              <Label htmlFor="role-select">Role (Optional)</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="role-select" aria-label="Select user role" aria-describedby="role-helper">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-role">No role</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.display_name || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="role_id" value={roleId} />
              <p id="role-helper" className="text-xs text-muted-foreground">
                You can assign a role to the user now or later from their profile
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

AddUserDialog.displayName = 'AddUserDialog';