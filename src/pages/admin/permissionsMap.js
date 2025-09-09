/**
 * Mapa de Permissões Centralizado
 * -------------------------------
 * Este ficheiro é a "fonte da verdade" para todas as permissões do seu sistema.
 * Para adicionar novas permissões ou módulos, basta editar este ficheiro.
 *
 * A estrutura é:
 * [
 * {
 * module: "Nome do Módulo Visível para o Utilizador",
 * permissions: [
 * { id: "permissao-unica-no-sistema", label: "O que esta permissão permite fazer." },
 * ...
 * ]
 * },
 * ...
 * ]
 */
export const PERMISSIONS_MAP = [
    {
        module: "Chamados (Tickets)",
        permissions: [
            { id: "tickets:read:all", label: "Ver todos os chamados da empresa" },
            { id: "tickets:read:own", label: "Ver apenas os seus próprios chamados" },
            { id: "tickets:create", label: "Criar novos chamados" },
            { id: "tickets:assign", label: "Atribuir chamados a outros utilizadores" },
            { id: "tickets:delete", label: "Apagar chamados" },
        ],
    },
    {
        module: "Clientes",
        permissions: [
            { id: "clients:read", label: "Ver todos os clientes" },
            { id: "clients:create", label: "Criar novos clientes" },
            { id: "clients:edit", label: "Editar clientes existentes" },
            { id: "clients:delete", label: "Apagar clientes" },
        ],
    },
    {
        module: "CRM",
        permissions: [
            { id: "crm:read", label: "Aceder à área do CRM" },
            { id: "crm:manage:leads", label: "Gerir todos os leads" },
            { id: "crm:admin", label: "Aceder às configurações do CRM (funis, etc.)" },
        ],
    },
    {
        module: "Financeiro",
        permissions: [
            { id: "finance:read", label: "Ver dados financeiros" },
            { id: "finance:manage", label: "Gerir faturas e pagamentos" },
        ],
    },
    {
        module: "Sistema",
        permissions: [
            { id: "system:admin:access", label: "Aceder ao Painel de Administração" },
            { id: "system:admin:users", label: "Gerir utilizadores (convidar, apagar)" },
            { id: "system:admin:roles", label: "Gerir cargos e permissões" },
        ],
    },
];