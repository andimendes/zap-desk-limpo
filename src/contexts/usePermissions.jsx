import { useAuth } from './AuthContext';

export const usePermissions = () => {
  const { profile } = useAuth();

  const can = (permissionName) => {
    if (!profile || !profile.permissions) {
      return false;
    }
    // Verifica se a permissão exata existe na lista de permissões do utilizador
    return profile.permissions.includes(permissionName);
  };

  return { can, permissions: profile?.permissions || [] };
};