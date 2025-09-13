import { useAuth } from './AuthContext';

export const useAccess = () => {
  const { profile } = useAuth();

  // Verifica se a EMPRESA tem acesso ao módulo
  const hasModuleAccess = (moduleName) => {
    // ALTERAÇÃO: Se o utilizador for Super Admin, concede acesso a tudo.
    if (profile?.is_super_admin) {
      return true;
    }
    
    if (!profile || !profile.active_modules) {
      return false;
    }
    return profile.active_modules.includes(moduleName);
  };

  // Verifica se o UTILIZADOR tem a permissão para a ação
  const can = (permissionName) => {
    // ALTERAÇÃO: Se o utilizador for Super Admin, pode fazer tudo.
    if (profile?.is_super_admin) {
        return true;
    }

    if (!profile || !profile.permissions) {
      return false;
    }
    return profile.permissions.includes(permissionName);
  };

  return { hasModuleAccess, can, profile };
};