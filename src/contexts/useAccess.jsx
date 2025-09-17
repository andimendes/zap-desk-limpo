import { useCallback } from 'react';
import { useAuth } from './AuthContext';

export const useAccess = () => {
  const { profile } = useAuth();

  const hasModuleAccess = useCallback((moduleName) => {
    if (profile?.is_super_admin) {
      return true;
    }
    
    if (!profile || !profile.roles || !Array.isArray(profile.roles)) {
      return false;
    }

    const userRoles = profile.roles.map(r => r.toUpperCase());
    const upperModuleName = moduleName.toUpperCase();

    if (upperModuleName === 'ATENDIMENTO') { // Módulo "Chamados"
      return userRoles.includes('ATENDENTE') || userRoles.includes('GERENTE') || userRoles.includes('ADMIN');
    }

    if (upperModuleName === 'CRM') {
      return userRoles.includes('GERENTE') || userRoles.includes('ADMIN');
    }
    
    return false;
  }, [profile]);

  const can = useCallback((permissionName) => {
    if (profile?.is_super_admin) {
        return true;
    }
    if (!profile || !profile.permissions) {
      return false;
    }
    return profile.permissions.includes(permissionName);
  }, [profile]);

  return { hasModuleAccess, can };
};