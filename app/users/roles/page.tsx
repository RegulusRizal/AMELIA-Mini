import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { checkSuperAdmin } from '@/lib/auth/helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  Plus, 
  Search, 
  Filter,
  ArrowLeft,
  Users,
  Lock,
  Globe,
  Puzzle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { RolesTable } from './components/roles-table';
import { CreateRoleDialog } from './components/create-role-dialog';

export default async function RolesPage() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }
  
  // Check if user is super_admin
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) {
    redirect('/users');
  }
  
  // Fetch all roles with their module information
  const { data: roles } = await supabase
    .from('roles')
    .select(`
      *,
      module:modules(
        id,
        name,
        display_name
      )
    `)
    .order('priority', { ascending: false });
  
  // Fetch all modules for the create dialog
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('display_name');
  
  // Count users for each role
  const { data: roleCounts } = await supabase
    .from('user_roles')
    .select('role_id')
    .then(result => {
      const counts: Record<string, number> = {};
      result.data?.forEach(ur => {
        counts[ur.role_id] = (counts[ur.role_id] || 0) + 1;
      });
      return { data: counts };
    });
  
  // Count permissions for each role
  const { data: permissionCounts } = await supabase
    .from('role_permissions')
    .select('role_id')
    .then(result => {
      const counts: Record<string, number> = {};
      result.data?.forEach(rp => {
        counts[rp.role_id] = (counts[rp.role_id] || 0) + 1;
      });
      return { data: counts };
    });
  
  const rolesWithCounts = roles?.map(role => ({
    ...role,
    userCount: roleCounts?.[role.id] || 0,
    permissionCount: permissionCounts?.[role.id] || 0
  })) || [];
  
  const systemRolesCount = roles?.filter(r => r.is_system).length || 0;
  const customRolesCount = roles?.filter(r => !r.is_system).length || 0;
  const totalUsers = Object.values(roleCounts || {}).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/users">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Role Management</h1>
                <p className="text-sm text-muted-foreground">Manage system roles and permissions</p>
              </div>
            </div>
            <CreateRoleDialog modules={modules || []}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </CreateRoleDialog>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {systemRolesCount} system, {customRolesCount} custom
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Roles</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemRolesCount}</div>
              <p className="text-xs text-muted-foreground">Protected roles</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
              <Puzzle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customRolesCount}</div>
              <p className="text-xs text-muted-foreground">User-defined roles</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Role Assignments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total user-role mappings</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Roles</CardTitle>
                  <CardDescription>Manage roles and their permissions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      placeholder="Search roles..." 
                      className="pl-9 w-64"
                      disabled
                    />
                  </div>
                  <Select disabled>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      <SelectItem value="global">Global Roles</SelectItem>
                      {modules?.map(module => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select disabled>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RolesTable roles={rolesWithCounts} modules={modules || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}