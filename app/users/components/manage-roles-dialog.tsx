'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { assignRole, removeRole } from '../actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Loader2, X } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
}

interface ManageRolesDialogProps {
  user: {
    id: string;
    email: string;
    display_name?: string;
  };
  currentRoles: Role[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageRolesDialog({ 
  user, 
  currentRoles = [], 
  open, 
  onOpenChange 
}: ManageRolesDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const router = useRouter();

  // Fetch available roles
  useEffect(() => {
    if (open) {
      fetch('/api/roles')
        .then(res => {
          if (!res.ok) {
            throw new Error('Unable to fetch roles. You may not have permission.');
          }
          return res.json();
        })
        .then(data => {
          setAvailableRoles(data.roles || []);
          setSelectedRoles(currentRoles.map(r => r.id));
          setError(null);
        })
        .catch(err => {
          setError(err.message || 'Failed to fetch roles');
          console.error('Error fetching roles:', err);
        });
    }
  }, [open, currentRoles]);

  const handleSave = async () => {
    setError(null);
    
    const currentRoleIds = currentRoles.map(r => r.id);
    const rolesToAdd = selectedRoles.filter(id => !currentRoleIds.includes(id));
    const rolesToRemove = currentRoleIds.filter(id => !selectedRoles.includes(id));
    
    startTransition(async () => {
      try {
        // Add new roles
        for (const roleId of rolesToAdd) {
          const result = await assignRole(user.id, roleId);
          if (result.error) {
            throw new Error(result.error);
          }
        }
        
        // Remove unchecked roles
        for (const roleId of rolesToRemove) {
          const result = await removeRole(user.id, roleId);
          if (result.error) {
            throw new Error(result.error);
          }
        }
        
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update roles');
      }
    });
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const displayName = user.display_name || user.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Manage Roles</DialogTitle>
          </div>
          <DialogDescription>
            Assign or remove roles for {displayName}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Available Roles</h4>
              <div className="space-y-3">
                {availableRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Loading roles...</p>
                ) : (
                  availableRoles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={role.id}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                        disabled={isPending}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={role.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {role.display_name}
                        </label>
                        {role.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                      {role.name === 'super_admin' && (
                        <Badge variant="destructive" className="ml-2">
                          Critical
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {currentRoles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Current Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {currentRoles.map((role) => (
                    <Badge key={role.id} variant="secondary">
                      {role.display_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
          <Button
            onClick={handleSave}
            disabled={isPending || availableRoles.length === 0}
          >
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
      </DialogContent>
    </Dialog>
  );
}