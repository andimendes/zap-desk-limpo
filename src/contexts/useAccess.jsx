import { useCallback } from 'react';
import { useAuth } from './AuthContext';

export const useAccess = () => {
  const { profile } = useAuth();

  // ✅ CORRIGIDO: Esta função agora decide o acesso com base nos NOMES DOS CARGOS do usuário
  const hasModuleAccess = useCallback((moduleName) => {
    if (profile?.is_super_admin) {
      return true;
    }
    
    // Se não houver perfil ou lista de cargos, nega o acesso.
    if (!profile || !profile.roles || !Array.isArray(profile.roles)) {
      return false;
    }

    const userRoles = profile.roles.map(r => r.toUpperCase()); // Ex: ['ATENDENTE', 'GERENTE']
    const upperModuleName = moduleName.toUpperCase();

    // --- LÓGICA DE PERMISSÃO PARA A SUA APRESENTAÇÃO ---
    // Você pode customizar estas regras como quiser

    if (upperModuleName === 'ATENDIMENTO') { // Módulo "Chamados"
      // Permite acesso se o usuário for ATENDENTE, GERENTE ou ADMIN
      return userRoles.includes('ATENDENTE') || userRoles.includes('GERENTE') || userRoles.includes('ADMIN');
    }

    if (upperModuleName === 'CRM') { // Módulo "CRM"
      // Permite acesso se o usuário for GERENTE ou ADMIN
      return userRoles.includes('GERENTE') || userRoles.includes('ADMIN');
    }
    
    // Adicione regras para outros módulos aqui
    // if (upperModuleName === 'FINANCEIRO') { ... }

    return false; // Nega acesso a outros módulos por padrão
  }, [profile]);

  // A função 'can' pode permanecer para verificações futuras mais detalhadas
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