// Full-Featured User Management Page
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Shield, 
  UserCheck, 
  UserX, 
  ArrowLeft,
  Edit,
  Trash2,
  MoreHorizontal,
  Mail,
  Calendar,
  Activity,
  AlertCircle
} from 'lucide-react';
import { checkSuperAdmin } from '@/lib/auth/helpers';
import { AddUserDialog } from './components/add-user-dialog';
import { UserActions } from './components/user-actions';

interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  employee_id?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  last_active_at?: string;
}

interface UserRole {
  user_id: string;
  role: {
    id: string;
    name: string;
    display_name: string;
  } | null;
}

interface PageProps {
  searchParams?: {
    search?: string;
    status?: string;
    page?: string;
  };
}

async function getUsers(searchParams: PageProps['searchParams']) {
  const supabase = await createClient();
  
  const page = parseInt(searchParams?.page || '1');
  const limit = 10;
  const offset = (page - 1) * limit;
  const search = searchParams?.search || '';
  const status = searchParams?.status || 'all';
  
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  // Apply search filter
  if (search) {
    query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }
  
  // Apply status filter
  if (status !== 'all') {
    query = query.eq('status', status);
  }
  
  const { data, count, error } = await query;
  
  if (error) {
    console.error('Error fetching users:', error);
    return { users: [], totalCount: 0 };
  }
  
  return { users: data as UserProfile[] || [], totalCount: count || 0 };
}

async function getUserRoles(userIds: string[]): Promise<UserRole[]> {
  if (userIds.length === 0) return [];
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role:roles(id, name, display_name)
    `)
    .in('user_id', userIds);
  
  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
  
  // Type assertion with unknown first for safety
  return (data as unknown as UserRole[]) || [];
}

function getInitials(user: UserProfile): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  if (user.display_name) {
    return user.display_name.substring(0, 2).toUpperCase();
  }
  if (user.email) {
    return user.email.substring(0, 2).toUpperCase();
  }
  return 'U';
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'secondary';
    case 'suspended':
      return 'destructive';
    default:
      return 'default';
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default async function UsersPage({ searchParams }: PageProps) {
  // Check authentication
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/login');
  }
  
  // Check if user is super_admin
  const isSuperAdmin = await checkSuperAdmin();
  
  if (!isSuperAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access User Management.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Only super administrators can manage users and roles.
            </p>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get users and roles
  const { users, totalCount } = await getUsers(searchParams);
  const userIds = users.map(u => u.id);
  const userRoles = await getUserRoles(userIds);
  
  // Create a map of user roles for easy lookup
  const rolesByUserId = userRoles.reduce((acc, ur) => {
    if (!acc[ur.user_id]) {
      acc[ur.user_id] = [];
    }
    if (ur.role) {
      acc[ur.user_id].push(ur.role);
    }
    return acc;
  }, {} as Record<string, Array<{id: string; name: string; display_name: string}>>);
  
  // Calculate stats
  const activeUsers = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status === 'inactive').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  
  // Calculate pagination
  const currentPage = parseInt(searchParams?.page || '1');
  const totalPages = Math.ceil(totalCount / 10);
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across your system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <AddUserDialog />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount === 1 ? 'user' : 'users'} in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers || totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspendedUsers}</div>
            <p className="text-xs text-muted-foreground">
              Account suspended
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find users by name, email, or filter by status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/users" method="GET" className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                name="search"
                placeholder="Search users..."
                defaultValue={searchParams?.search || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <select
              name="status"
              defaultValue={searchParams?.status || 'all'}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            A list of all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const roles = rolesByUserId[user.id] || [];
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={user.avatar_url || ''} />
                              <AvatarFallback>{getInitials(user)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.display_name || user.email}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                              {user.employee_id && (
                                <p className="text-xs text-muted-foreground">
                                  EMP: {user.employee_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(user.status) as any}>
                            {user.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {roles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {roles.map((role) => (
                                <Badge key={role.id} variant="outline">
                                  {role.display_name || role.name}
                                </Badge>
                              ))}
                            </div>
                          ) : user.id === users[0]?.id ? (
                            <Badge variant="outline">Super Admin</Badge>
                          ) : (
                            <span className="text-muted-foreground">No role</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatDate(user.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <UserActions 
                            user={user}
                            userRoles={roles}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {users.length} of {totalCount} users
                  </p>
                  <div className="flex items-center space-x-2">
                    {currentPage > 1 && (
                      <Link href={`/users?page=${currentPage - 1}${searchParams?.search ? `&search=${searchParams.search}` : ''}${searchParams?.status ? `&status=${searchParams.status}` : ''}`}>
                        <Button variant="outline" size="sm">
                          Previous
                        </Button>
                      </Link>
                    )}
                    {currentPage < totalPages && (
                      <Link href={`/users?page=${currentPage + 1}${searchParams?.search ? `&search=${searchParams.search}` : ''}${searchParams?.status ? `&status=${searchParams.status}` : ''}`}>
                        <Button variant="outline" size="sm">
                          Next
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No users found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchParams?.search ? 'Try adjusting your search criteria' : 'Get started by creating a new user.'}
              </p>
              {!searchParams?.search && (
                <div className="mt-6">
                  <AddUserDialog />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}