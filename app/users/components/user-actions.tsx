'use client';

import { useState } from 'react';
import { EditUserDialog } from './edit-user-dialog';
import { DeleteUserDialog } from './delete-user-dialog';
import { ManageRolesDialog } from './manage-roles-dialog';
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
  Shield
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRolesOpen(true)}>
            <Shield className="mr-2 h-4 w-4" />
            Manage Roles
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
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
    </>
  );
}