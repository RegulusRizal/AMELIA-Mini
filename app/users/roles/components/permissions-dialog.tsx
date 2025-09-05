'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRolePermissions, getAvailablePermissions, updateRolePermissions } from '../actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  AlertCircle, 
  Shield, 
  Lock,
  CheckCircle2,
  XCircle,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  display_name: string;
  is_system: boolean;
}

interface Permission {
  id: string;
  module_id?: string;
  resource: string;
  action: string;
  description?: string;
  module?: {
    name: string;
    display_name: string;
  };
}

interface PermissionsDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PermissionsDialog = React.memo(function PermissionsDialog({ role, open, onOpenChange }: PermissionsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [originalPermissions, setOriginalPermissions] = useState<Set<string>>(new Set());
  const router = useRouter();
  
  useEffect(() => {
    if (open && role) {
      loadPermissions();
    }
  }, [open, role]);
  
  const loadPermissions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load available permissions
      const availableResult = await getAvailablePermissions();
      if (availableResult.error) {
        throw new Error(availableResult.error);
      }
      // Fix any type issues with module being an array
      const formattedPermissions: Record<string, Permission[]> = {};
      if (availableResult.permissions) {
        Object.entries(availableResult.permissions).forEach(([key, perms]) => {
          formattedPermissions[key] = (perms as any[]).map(p => ({
            ...p,
            module: Array.isArray(p.module) ? p.module[0] : p.module
          }));
        });
      }
      setAllPermissions(formattedPermissions);
      
      // Load role's current permissions
      const roleResult = await getRolePermissions(role.id);
      if (roleResult.error) {
        throw new Error(roleResult.error);
      }
      
      const currentPermIds = new Set(roleResult.permissions?.map((p: any) => p.id) || []);
      setSelectedPermissions(currentPermIds);
      setOriginalPermissions(currentPermIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTogglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };
  
  const handleToggleAll = (permissions: Permission[], checked: boolean) => {
    const newSelected = new Set(selectedPermissions);
    permissions.forEach(perm => {
      if (checked) {
        newSelected.add(perm.id);
      } else {
        newSelected.delete(perm.id);
      }
    });
    setSelectedPermissions(newSelected);
  };
  
  const handleSave = async () => {
    setError(null);
    
    startTransition(async () => {
      const result = await updateRolePermissions(
        role.id, 
        Array.from(selectedPermissions)
      );
      
      if (result.error) {
        setError(result.error);
        toast.error('Failed to update permissions');
      } else {
        toast.success('Permissions updated successfully');
        onOpenChange(false);
        router.refresh();
      }
    });
  };
  
  const hasChanges = () => {
    if (selectedPermissions.size !== originalPermissions.size) return true;
    const selectedArray = Array.from(selectedPermissions);
    for (const id of selectedArray) {
      if (!originalPermissions.has(id)) return true;
    }
    return false;
  };
  
  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create': return 'default';
      case 'read': case 'list': return 'secondary';
      case 'update': return 'outline';
      case 'delete': return 'destructive';
      default: return 'secondary';
    }
  };
  
  const modules = Object.keys(allPermissions);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Configure permissions for {role.display_name}
          </DialogDescription>
        </DialogHeader>
        
        {role.is_system && role.name === 'super_admin' && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Super Admin has full system access. Permissions cannot be modified.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue={modules[0]} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(modules.length, 4)}, 1fr)` }}>
              {modules.map(moduleName => (
                <TabsTrigger key={moduleName} value={moduleName}>
                  {moduleName}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <ScrollArea className="h-[400px] mt-4">
              {modules.map(moduleName => {
                const permissions = allPermissions[moduleName] || [];
                const groupedByResource = permissions.reduce((acc, perm) => {
                  if (!acc[perm.resource]) acc[perm.resource] = [];
                  acc[perm.resource].push(perm);
                  return acc;
                }, {} as Record<string, Permission[]>);
                
                const allSelected = permissions.every(p => selectedPermissions.has(p.id));
                const someSelected = permissions.some(p => selectedPermissions.has(p.id));
                
                return (
                  <TabsContent key={moduleName} value={moduleName}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{moduleName}</span>
                          <Badge variant="secondary">
                            {permissions.filter(p => selectedPermissions.has(p.id)).length}/{permissions.length}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAll(permissions, !allSelected)}
                          disabled={role.name === 'super_admin'}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      
                      {Object.entries(groupedByResource).map(([resource, resourcePerms]) => (
                        <div key={resource} className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="capitalize">{resource}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 ml-5">
                            {resourcePerms.map(perm => (
                              <div key={perm.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={perm.id}
                                  checked={selectedPermissions.has(perm.id)}
                                  onCheckedChange={() => handleTogglePermission(perm.id)}
                                  disabled={isPending || role.name === 'super_admin'}
                                />
                                <label
                                  htmlFor={perm.id}
                                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                                >
                                  <Badge variant={getActionBadgeVariant(perm.action)} className="text-xs">
                                    {perm.action}
                                  </Badge>
                                  {perm.description && (
                                    <span className="text-xs text-muted-foreground">
                                      {perm.description}
                                    </span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </ScrollArea>
          </Tabs>
        )}
        
        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedPermissions.size} permission(s) selected
              {hasChanges() && (
                <span className="text-orange-600 ml-2">• Unsaved changes</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending || !hasChanges() || role.name === 'super_admin'}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Permissions'
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

PermissionsDialog.displayName = 'PermissionsDialog';