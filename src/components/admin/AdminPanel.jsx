// src/components/admin/AdminPanel.jsx
import React, { useState } from 'react';
import CrmSettings from './CrmSettings.jsx';
// Futuramente, importaremos os outros componentes de admin aqui
// import GestaoDeEquipa from './GestaoDeEquipa';
// import CargosEPermissoes from './CargosEPermissoes';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('crm');

  const tabs = [
    { id: 'crm', label: 'CRM' },
    { id: 'equipa', label: 'Gestão de Equipa' },
    { id: 'permissoes', label: 'Cargos e Permissões' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'crm':
        return <CrmSettings />;
      case 'equipa':
        // return <GestaoDeEquipa />;
        return <p className="mt-6">Componente de Gestão de Equipa virá aqui.</p>;
      case 'permissoes':
        // return <CargosEPermissoes />;
        return <p className="mt-6">Componente de Cargos e Permissões virá aqui.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configurações Gerais</h1>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

export default AdminPanel;
