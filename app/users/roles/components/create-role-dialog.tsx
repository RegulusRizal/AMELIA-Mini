'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createRole } from '../actions';
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Module {
  id: string;
  name: string;
  display_name: string;
}

interface CreateRoleDialogProps {
  modules: Module[];
  children: React.ReactNode;
}

export function CreateRoleDialog({ modules, children }: CreateRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    module_id: 'global',
    priority: '50'
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!formData.name || !formData.display_name) {
      setError('Role name and display name are required');
      return;
    }
    
    // Validate name format (lowercase, alphanumeric, underscore)
    if (!/^[a-z][a-z0-9_]*$/.test(formData.name)) {
      setError('Role name must start with a letter and contain only lowercase letters, numbers, and underscores');
      return;
    }
    
    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value);
    });
    
    startTransition(async () => {
      const result = await createRole(formDataObj);
      
      if (result.error) {
        setError(result.error);
      } else {
        toast.success('Role created successfully');
        setOpen(false);
        setFormData({
          name: '',
          display_name: '',
          description: '',
          module_id: '',
          priority: '50'
        });
        router.refresh();
      }
    });
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        module_id: '',
        priority: '50'
      });
    }
    setOpen(newOpen);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                placeholder="e.g., content_editor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier. Use lowercase with underscores.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                placeholder="e.g., Content Editor"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Human-readable name shown in the UI
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role's purpose and responsibilities..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isPending}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="module_id">Module</Label>
              <Select
                value={formData.module_id}
                onValueChange={(value) => setFormData({ ...formData, module_id: value })}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Global Role</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leave empty for a global role, or select a specific module
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
                disabled={isPending}
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
              onClick={() => handleOpenChange(false)}
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
                'Create Role'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}