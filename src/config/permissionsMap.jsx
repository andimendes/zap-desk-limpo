// Este ficheiro define todas as ações possíveis dentro do sistema.
// É o nosso dicionário de permissões.
export const PERMISSIONS_MAP = [
  {
    module: 'Chamados (Tickets)',
    permissions: [
      { id: 'tickets:read:all', label: 'Ver todos os chamados' },
      { id: 'tickets:read:own', label: 'Ver apenas os seus chamados' },
      { id: 'tickets:create', label: 'Criar novos chamados' },
      { id: 'tickets:assign', label: 'Atribuir chamados a outros' },
      { id: 'tickets:update', label: 'Editar chamados' },
      { id: 'tickets:delete', label: 'Apagar chamados' },
    ]
  },
  {
    module: 'Clientes',
    permissions: [
      { id: 'clients:read:all', label: 'Ver todos os clientes' },
      { id: 'clients:create', label: 'Criar novos clientes' },
      { id: 'clients:update', label: 'Editar clientes' },
      { id: 'clients:delete', label: 'Apagar clientes' },
    ]
  },
  {
    module: 'Sistema',
    permissions: [
      { id: 'system:admin:access', label: 'Aceder à Central de Controle' },
      { id: 'system:users:manage', label: 'Gerir utilizadores (convidar, apagar)' },
      { id: 'system:roles:manage', label: 'Gerir cargos e permissões' },
    ]
  }
];
