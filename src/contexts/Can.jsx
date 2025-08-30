import { useAuth } from './AuthContext';

/**
 * Documentação do Componente Can (Versão 4 - com Debug)
 * * Adicionamos uma linha de `console.log` para "espiar" os dados do perfil
 * que este componente recebe. Isto vai nos dizer exatamente quais 'roles'
 * o sistema está a ver para o seu utilizador.
 */
const Can = ({ children }) => {
	const { profile } = useAuth();

	// --- PASSO DE DEBUG ---
	// Esta linha vai imprimir o conteúdo do 'profile' na consola do navegador.
	// Ajuda-nos a ver exatamente quais 'roles' o sistema está a receber.
	console.log("DEBUG [Can.jsx]: Perfil recebido:", profile);


	// Verificação segura para ver se o perfil existe e se 'roles' é uma lista
	const hasRoles = profile && Array.isArray(profile.roles);

	// Verificação robusta e insensível a maiúsculas/minúsculas.
	const isUserAdmin = hasRoles && profile.roles.some(role => role.toLowerCase() === 'admin');


	if (isUserAdmin) {
		return <>{children}</>;
	}

	return null; // Não mostra nada se não tiver permissão
};

export default Can;

