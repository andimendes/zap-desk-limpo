import { useAuth } from './AuthContext';

/**
 * Componente de verificação de permissões.
 * Esta versão foi tornada mais robusta para aguardar o fim do carregamento
 * dos dados de autenticação antes de verificar as permissões do utilizador.
 */
const Can = ({ children }) => {
	// 1. Agora também pedimos o estado de 'loading' ao AuthContext.
	const { profile, loading } = useAuth();

	// 2. A nossa "guarda" de segurança: Se os dados ainda estiverem a carregar,
	// não mostramos nada. É como se o componente estivesse invisível
	// até ter a certeza de que tem a informação do perfil.
	if (loading) {
		return null;
	}

	// 3. A partir daqui, podemos ter a certeza de que 'loading' é 'false' e
	// que já temos uma resposta sobre o perfil do utilizador.
	const hasRoles = profile && Array.isArray(profile.roles);
	const isUserAdmin = hasRoles && profile.roles.some(role => role.toLowerCase() === 'admin');

	if (isUserAdmin) {
		return <>{children}</>;
	}

	return null; // Não mostra nada se o utilizador não for admin
};

export default Can;