'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Users,
  Lock,
  Globe,
  Puzzle,
  Copy,
  Key
} from 'lucide-react';
import { EditRoleDialog } from './edit-role-dialog';
import { DeleteRoleDialog } from './delete-role-dialog';
import { PermissionsDialog } from './permissions-dialog';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  module_id?: string;
  is_system: boolean;
  priority: number;
  created_at: string;
  module?: {
    id: string;
    name: string;
    display_name: string;
  };
  userCount: number;
  permissionCount: number;
}

interface Module {
  id: string;
  name: string;
  display_name: string;
}

interface RolesTableProps {
  roles: Role[];
  modules: Module[];
}

export function RolesTable({ roles, modules }: RolesTableProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  
  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setEditOpen(true);
  };
  
  const handleDelete = (role: Role) => {
    setSelectedRole(role);
    setDeleteOpen(true);
  };
  
  const handlePermissions = (role: Role) => {
    setSelectedRole(role);
    setPermissionsOpen(true);
  };
  
  const getRoleBadgeVariant = (priority: number) => {
    if (priority >= 90) return 'destructive';
    if (priority >= 50) return 'default';
    return 'secondary';
  };
  
  const getRoleIcon = (role: Role) => {
    if (role.is_system) return <Lock className="h-4 w-4" />;
    if (!role.module_id) return <Globe className="h-4 w-4" />;
    return <Puzzle className="h-4 w-4" />;
  };
  
  return (
    <>
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Module</TableHead>
              <TableHead className="text-center">Priority</TableHead>
              <TableHead className="text-center">Users</TableHead>
              <TableHead className="text-center">Permissions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-muted-foreground">
                        {getRoleIcon(role)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {role.is_system ? 'System Role' : 
                       !role.module_id ? 'Global Role' : 
                       'Module-specific Role'}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.display_name}</span>
                      {role.is_system && (
                        <Badge variant="outline" className="text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {role.name}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {role.description || 'No description'}
                  </span>
                </TableCell>
                
                <TableCell>
                  {role.module ? (
                    <Badge variant="outline">
                      {role.module.display_name}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Global
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell className="text-center">
                  <Badge variant={getRoleBadgeVariant(role.priority)}>
                    {role.priority}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{role.userCount}</span>
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Key className="h-3 w-3 text-muted-foreground" />
                    <span>{role.permissionCount}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {new Date(role.created_at).toLocaleDateString()}
                  </span>
                </TableCell>
                
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handlePermissions(role)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleEdit(role)}
                        disabled={role.is_system}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigator.clipboard.writeText(role.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(role)}
                        disabled={role.is_system}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Role
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
      
      {selectedRole && (
        <>
          <EditRoleDialog
            role={selectedRole}
            modules={modules}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          
          <DeleteRoleDialog
            role={selectedRole}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
          
          <PermissionsDialog
            role={selectedRole}
            open={permissionsOpen}
            onOpenChange={setPermissionsOpen}
          />
        </>
      )}
    </>
  );
}