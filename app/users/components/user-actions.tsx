'use client';

import { useState } from 'react';
import { EditUserDialog } from './edit-user-dialog';
import { DeleteUserDialog } from './delete-user-dialog';
import { ManageRolesDialog } from './manage-roles-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Shield,
  Key
} from 'lucide-react';

interface UserActionsProps {
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
  userRoles: Array<{
    id: string;
    name: string;
    display_name: string;
    description?: string;
  }>;
}

export function UserActions({ user, userRoles = [] }: UserActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0"
            aria-label={`Actions for ${user.display_name || user.email}`}
          >
            <span className="sr-only">Open actions menu</span>
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => setEditOpen(true)}
            aria-label={`Edit user ${user.display_name || user.email}`}
          >
            <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit User
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setRolesOpen(true)}
            aria-label={`Manage roles for ${user.display_name || user.email}`}
          >
            <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
            Manage Roles
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setResetPasswordOpen(true)}
            aria-label={`Reset password for ${user.display_name || user.email}`}
          >
            <Key className="mr-2 h-4 w-4" aria-hidden="true" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
            aria-label={`Delete user ${user.display_name || user.email}`}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog 
        user={user}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      
      <DeleteUserDialog
        user={user}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      
      <ManageRolesDialog
        user={user}
        currentRoles={userRoles}
        open={rolesOpen}
        onOpenChange={setRolesOpen}
      />
      
      <ResetPasswordDialog
        user={user}
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
      />
    </>
  );
}