import { useAuth } from './AuthContext';

/**
 * Documentação do Componente Can (Versão 3 - Robusta)
 * * Este componente funciona como um "porteiro" para outras partes do seu sistema.
 * Ele verifica se o utilizador logado possui a função (role) de administrador.
 *
 * * Como funciona:
 * 1. Ele utiliza o `useAuth` para obter os dados do `profile` do utilizador.
 * 2. Faz uma verificação segura para ver se `profile` e `profile.roles` existem.
 * 3. **NOVA CORREÇÃO:** Ele agora faz uma verificação que ignora se as letras são
 * maiúsculas ou minúsculas. Ele vai encontrar 'ADM', 'admin', 'Admin', etc.
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

	// Verificação robusta e insensível a maiúsculas/minúsculas.
	// O método 'some' verifica se pelo menos um item na lista 'roles'
	// satisfaz a condição. A condição é transformar o 'role' para minúsculas
	// e comparar com 'admin'.
	const isUserAdmin = hasRoles && profile.roles.some(role => role.toLowerCase() === 'admin');

	if (isUserAdmin) {
		return <>{children}</>;
	}

	return null; // Não mostra nada se não tiver permissão
};

export default Can;


