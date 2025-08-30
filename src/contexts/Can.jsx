import { useAuth } from './AuthContext';

/**
 * Documentação do Componente Can
 * * Este componente funciona como um "porteiro" para outras partes do seu sistema.
 * Ele verifica se o utilizador logado possui a função (role) de "admin".
 *
 * * Como funciona:
 * 1. Ele utiliza o `useAuth` para obter os dados do `profile` do utilizador.
 * 2. Faz uma verificação segura para ver se `profile`, `profile.roles` existem
 * e se a lista de `roles` inclui a palavra "admin".
 * 3. Se o utilizador for um administrador, ele renderiza (mostra na tela)
 * qualquer conteúdo que for passado como "filho" (children) para ele.
 * 4. Se não for um administrador, ele não renderiza nada.
 *
 * @param {object} props - As propriedades do componente.
 * @param {React.ReactNode} props.children - O conteúdo a ser exibido se o utilizador tiver permissão.
 */
const Can = ({ children }) => {
	const { profile } = useAuth();

	// Verificação segura:
	// 1. O perfil existe?
	// 2. O perfil tem a propriedade 'roles'?
	// 3. 'roles' é uma lista (array)?
	// 4. A lista inclui 'admin'?
	const canSee = profile && profile.roles && Array.isArray(profile.roles) && profile.roles.includes('admin');

	if (canSee) {
		return <>{children}</>;
	}

	return null; // Não mostra nada se não tiver permissão
};

export default Can;

