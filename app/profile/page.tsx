import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Key,
  Settings,
  Activity
} from 'lucide-react';
import { ChangePasswordForm } from './components/change-password-form';
import { ProfileForm } from './components/profile-form';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // Get user roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select(`
      role:roles(
        id,
        name,
        display_name,
        description
      )
    `)
    .eq('user_id', user.id);
  
  const roles = userRoles?.map(ur => ur.role).filter(Boolean).flat() || [];
  
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || 'U';
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" aria-label="Back to dashboard">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Profile Settings</h1>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar - Profile Summary */}
          <aside className="lg:col-span-1" aria-label="Profile summary">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4" aria-label="Profile avatar">
                  <AvatarImage src={profile?.avatar_url} alt="Profile picture" />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile?.display_name || `${profile?.first_name} ${profile?.last_name}`, user.email)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{profile?.display_name || `${profile?.first_name} ${profile?.last_name}` || 'User'}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.employee_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground">Employee ID:</span>
                    <span className="font-medium">{profile.employee_id}</span>
                  </div>
                )}
                
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span>{user.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-muted-foreground">Joined:</span>
                  <time dateTime={profile?.created_at || user.created_at}>
                    {formatDate(profile?.created_at || user.created_at)}
                  </time>
                </div>
                
                {profile?.last_active_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground">Last active:</span>
                    <time dateTime={profile.last_active_at}>
                      {formatDate(profile.last_active_at)}
                    </time>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium">Roles</span>
                  </div>
                  <div className="flex flex-wrap gap-2" role="list" aria-label="Assigned roles">
                    {roles.length > 0 ? (
                      roles.map((role: any) => (
                        <Badge key={role.id} variant="secondary" role="listitem">
                          {role.display_name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No roles assigned</span>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Badge 
                    variant={profile?.status === 'active' ? 'default' : profile?.status === 'inactive' ? 'secondary' : 'destructive'}
                    className="w-full justify-center"
                    aria-label={`Account status: ${profile?.status || 'active'}`}
                  >
                    {profile?.status?.toUpperCase() || 'ACTIVE'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </aside>
          
          {/* Main Content - Tabs */}
          <section className="lg:col-span-2" aria-label="Profile settings tabs">
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile" aria-label="Profile information tab">
                  <User className="h-4 w-4 mr-2" aria-hidden="true" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" aria-label="Security settings tab">
                  <Key className="h-4 w-4 mr-2" aria-hidden="true" />
                  Security
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Profile Information</h2>
                    <CardDescription>
                      Update your personal information and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProfileForm profile={profile} userId={user.id} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Change Password</h2>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChangePasswordForm />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
    </div>
  );
}