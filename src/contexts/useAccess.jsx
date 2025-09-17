import { useCallback } from 'react';
import { useAuth } from './AuthContext';

export const useAccess = () => {
  const { profile } = useAuth();

  // ✅ CORRIGIDO: Esta função agora verifica a lista de PERMISSÕES corretamente.
  const hasModuleAccess = useCallback((moduleName) => {
    if (profile?.is_super_admin) {
      return true;
    }
    
    if (!profile || !profile.permissions || !Array.isArray(profile.permissions)) {
      return false;
    }

    const upperModuleName = moduleName.toUpperCase();
    
    // Verifica se ALGUMA das permissões do usuário começa com o nome do módulo.
    // Ex: Para o módulo 'CRM', ele procurará por 'crm:create', 'crm:read', etc.
    return profile.permissions.some(permission => 
        typeof permission === 'string' && permission.toUpperCase().startsWith(upperModuleName)
    );
  }, [profile]);

  // Esta função verifica se o UTILIZADOR tem a permissão para uma ação específica.
  const can = useCallback((permissionName) => {
    if (profile?.is_super_admin) {
        return true;
    }

    if (!profile || !profile.permissions || !Array.isArray(profile.permissions)) {
      return false;
    }
    return profile.permissions.includes(permissionName);
  }, [profile]);

  return { hasModuleAccess, can };
};