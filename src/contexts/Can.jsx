// src/contexts/Can.jsx

import { useAuth } from './AuthContext';

/**
 * Componente de verificação de permissões.
 * Esta versão foi simplificada e corrigida para alinhar-se com a nova
 * estrutura do AuthContext, que fornece uma única 'role' no perfil.
 */
const Can = ({ children }) => {
	const { profile } = useAuth();

	// A nossa nova verificação, simples e robusta, igual à do DashboardPage.
	// 1. Verifica se o perfil existe.
	// 2. Verifica se a propriedade 'role' existe.
	// 3. Converte a 'role' para maiúsculas para evitar erros de 'adm' vs 'ADM'.
	// 4. Compara com 'ADM'.
	const isUserAdmin = profile && profile.role?.toUpperCase() === 'ADM';

	if (isUserAdmin) {
		return <>{children}</>;
	}

	// Não mostra o conteúdo para utilizadores que não são administradores.
	return null;
};

export default Can;