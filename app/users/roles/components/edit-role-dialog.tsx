'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateRole } from '../actions';
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  module_id?: string;
  is_system: boolean;
  priority: number;
}

interface Module {
  id: string;
  name: string;
  display_name: string;
}

interface EditRoleDialogProps {
  role: Role;
  modules: Module[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditRoleDialog = React.memo(function EditRoleDialog({ role, modules, open, onOpenChange }: EditRoleDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    display_name: '',
    description: '',
    priority: ''
  });
  
  useEffect(() => {
    if (open && role) {
      setFormData({
        display_name: role.display_name || '',
        description: role.description || '',
        priority: role.priority?.toString() || '50'
      });
    }
  }, [open, role]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.display_name) {
      setError('Display name is required');
      return;
    }
    
    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value);
    });
    
    startTransition(async () => {
      const result = await updateRole(role.id, formDataObj);
      
      if (result.error) {
        setError(result.error);
      } else {
        toast.success('Role updated successfully');
        onOpenChange(false);
        router.refresh();
      }
    });
  };
  
  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };
  
  const moduleName = modules.find(m => m.id === role.module_id)?.display_name || 'Global';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and properties
            </DialogDescription>
          </DialogHeader>
          
          {role.is_system && (
            <Alert className="mt-4">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                This is a system role. Some properties cannot be modified.
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={role.name}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Role name cannot be changed
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                disabled={isPending || role.is_system}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isPending || role.is_system}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="module">Module</Label>
              <Input
                id="module"
                value={moduleName}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Module assignment cannot be changed
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="100"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                disabled={isPending || role.is_system}
              />
              <p className="text-xs text-muted-foreground">
                Higher values indicate higher priority (0-100)
              </p>
            </div>
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
              type="submit" 
              disabled={isPending || role.is_system}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

EditRoleDialog.displayName = 'EditRoleDialog';