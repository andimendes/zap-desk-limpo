// src/contexts/Can.jsx

import { useAuth } from './AuthContext';

/**
 * Componente de verificação de permissões, alinhado com a nova estrutura do AuthContext.
 */
const Can = ({ children }) => {
	const { profile, loading } = useAuth();

	// Enquanto os dados do perfil estiverem a carregar, não mostramos nada.
	if (loading) {
		return null;
	}

	// Verificação robusta e não sensível a maiúsculas/minúsculas.
	// A sua tabela 'roles' tem 'admin', por isso verificamos por 'admin'.
	const isUserAdmin = profile && profile.role?.toLowerCase() === 'admin';

	if (isUserAdmin) {
		return <>{children}</>;
	}

	// Não mostra o conteúdo para utilizadores que não são administradores.
	return null;
};

export default Can;