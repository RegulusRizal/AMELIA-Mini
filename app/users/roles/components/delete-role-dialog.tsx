'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteRole } from '../actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  display_name: string;
  is_system: boolean;
  userCount: number;
  permissionCount: number;
}

interface DeleteRoleDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteRoleDialog = React.memo(function DeleteRoleDialog({ role, open, onOpenChange }: DeleteRoleDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const handleDelete = async () => {
    setError(null);
    
    startTransition(async () => {
      const result = await deleteRole(role.id);
      
      if (result.error) {
        setError(result.error);
        if (result.userCount) {
          toast.error(`Cannot delete: ${result.userCount} users have this role`);
        }
      } else {
        toast.success('Role deleted successfully');
        onOpenChange(false);
        router.refresh();
      }
    });
  };
  
  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Role</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this role?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Warning:</strong> This action cannot be undone.
            </AlertDescription>
          </Alert>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <h4 className="font-medium">Role Details</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{role.display_name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">System Name:</span>
                <span className="font-mono text-xs">{role.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Type:</span>
                <span>{role.is_system ? 'System Role' : 'Custom Role'}</span>
              </div>
            </div>
          </div>
          
          {(role.userCount > 0 || role.permissionCount > 0) && (
            <div className="space-y-2">
              <h4 className="font-medium">Impact</h4>
              <div className="text-sm space-y-1">
                {role.userCount > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{role.userCount} user(s) have this role</span>
                  </div>
                )}
                {role.permissionCount > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>{role.permissionCount} permission(s) will be removed</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {role.userCount > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                This role cannot be deleted while users are assigned to it.
                Please remove all users from this role first.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || role.is_system || role.userCount > 0}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Role'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

DeleteRoleDialog.displayName = 'DeleteRoleDialog';