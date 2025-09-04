// User Management React Hooks
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { 
  UserProfile, 
  UserPermissions, 
  Role, 
  Module,
  UserType
} from './types';

// =====================================================
// USER HOOKS
// =====================================================

export function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
              *,
              user_type:user_types(*),
              user_roles(
                *,
                role:roles(*)
              )
            `)
            .eq('id', authUser.id)
            .single();
          
          if (profileError) throw profileError;
          setUser(profile as UserProfile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select(`
            *,
            user_type:user_types(*),
            user_roles(
              *,
              role:roles(*)
            )
          `)
          .eq('id', authUser.id)
          .single();
        
        setUser(profile as UserProfile);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, refresh };
}

// =====================================================
// PERMISSION HOOKS
// =====================================================

export function usePermissions(userId?: string) {
  const [permissions, setPermissions] = useState<UserPermissions>({ modules: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      const supabase = createClient();
      
      try {
        let targetUserId = userId;
        
        if (!targetUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setPermissions({ modules: {} });
            return;
          }
          targetUserId = user.id;
        }

        const { data, error: rpcError } = await supabase.rpc('get_user_permissions', {
          p_user_id: targetUserId
        });

        if (rpcError) throw rpcError;

        // Transform flat list to nested structure
        const perms: UserPermissions = { modules: {} };
        
        data?.forEach((perm: any) => {
          if (!perms.modules[perm.module_name]) {
            perms.modules[perm.module_name] = {};
          }
          if (!perms.modules[perm.module_name][perm.resource]) {
            perms.modules[perm.module_name][perm.resource] = [];
          }
          perms.modules[perm.module_name][perm.resource].push(perm.action);
        });

        setPermissions(perms);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [userId]);

  const hasPermission = useCallback((module: string, resource: string, action: string): boolean => {
    return permissions.modules[module]?.[resource]?.includes(action) || false;
  }, [permissions]);

  const hasModuleAccess = useCallback((module: string): boolean => {
    return !!permissions.modules[module];
  }, [permissions]);

  return { permissions, hasPermission, hasModuleAccess, loading, error };
}

export function usePermission(module: string, resource: string, action: string) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasPermission(false);
          return;
        }

        const { data, error } = await supabase.rpc('has_permission', {
          p_module: module,
          p_resource: resource,
          p_action: action,
          p_user_id: user.id
        });

        if (error) throw error;
        setHasPermission(data === true);
      } catch (err) {
        console.error('Error checking permission:', err);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [module, resource, action]);

  return { hasPermission, loading };
}

// =====================================================
// ROLE HOOKS
// =====================================================

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      const supabase = createClient();
      
      try {
        const { data, error: rolesError } = await supabase
          .from('roles')
          .select(`
            *,
            module:modules(*),
            role_permissions(
              permission:permissions(*)
            )
          `)
          .order('priority', { ascending: false });

        if (rolesError) throw rolesError;
        setRoles(data as Role[]);
      } catch (err) {
        console.error('Error fetching roles:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  return { roles, loading, error };
}

export function useUserRoles(userId: string) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRoles = async () => {
      const supabase = createClient();
      
      try {
        const { data, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            role:roles(
              *,
              module:modules(*),
              role_permissions(
                permission:permissions(*)
              )
            )
          `)
          .eq('user_id', userId);

        if (rolesError) throw rolesError;
        setRoles(data?.map((ur: any) => ur.role as Role) || []);
      } catch (err) {
        console.error('Error fetching user roles:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user roles');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserRoles();
    }
  }, [userId]);

  return { roles, loading, error };
}

// =====================================================
// MODULE HOOKS
// =====================================================

export function useModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      const supabase = createClient();
      
      try {
        const { data, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('is_active', true)
          .order('display_name');

        if (modulesError) throw modulesError;
        setModules(data as Module[]);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch modules');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  return { modules, loading, error };
}

// =====================================================
// USER TYPE HOOKS
// =====================================================

export function useUserTypes() {
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserTypes = async () => {
      const supabase = createClient();
      
      try {
        const { data, error: typesError } = await supabase
          .from('user_types')
          .select('*')
          .order('display_name');

        if (typesError) throw typesError;
        setUserTypes(data as UserType[]);
      } catch (err) {
        console.error('Error fetching user types:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user types');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTypes();
  }, []);

  return { userTypes, loading, error };
}

// =====================================================
// REALTIME HOOKS
// =====================================================

export function useRealtimeUser(userId: string) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    const fetchUser = async () => {
      const { data } = await supabase
        .from('profiles')
        .select(`
          *,
          user_type:user_types(*),
          user_roles(
            *,
            role:roles(*)
          )
        `)
        .eq('id', userId)
        .single();
      
      setUser(data as UserProfile);
      setLoading(false);
    };

    fetchUser();

    // Subscribe to changes
    const subscription = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        () => {
          fetchUser();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { user, loading };
}