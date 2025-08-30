import { useAuth } from './AuthContext';

/**
 * Documentação do Componente Can (Versão 2 - Corrigida)
 * * Este componente funciona como um "porteiro" para outras partes do seu sistema.
 * Ele verifica se o utilizador logado possui a função (role) de administrador.
 *
 * * Como funciona:
 * 1. Ele utiliza o `useAuth` para obter os dados do `profile` do utilizador.
 * 2. Faz uma verificação segura para ver se `profile` e `profile.roles` existem.
 * 3. **CORREÇÃO:** Ele agora verifica se a lista de `roles` inclui 'ADM' (em maiúsculas),
 * que é o padrão usado no resto da sua aplicação.
 * 4. Se o utilizador for um administrador, ele renderiza o conteúdo filho (children).
 * 5. Se não for, não renderiza nada.
 *
 * @param {object} props - As propriedades do componente.
 * @param {React.ReactNode} props.children - O conteúdo a ser exibido se o utilizador tiver permissão.
 */
const Can = ({ children }) => {
	const { profile } = useAuth();

	// Verificação segura para ver se o perfil existe e se 'roles' é uma lista
	const hasRoles = profile && Array.isArray(profile.roles);

	// A verificação agora procura por 'ADM' em maiúsculas.
	const canSee = hasRoles && profile.roles.includes('ADM');

	if (canSee) {
		return <>{children}</>;
	}

	return null; // Não mostra nada se não tiver permissão
};

export default Can;

