// src/components/admin/CrmSettings.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

const CrmSettings = () => {
  const [funis, setFunis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Lógica para buscar os funis e etapas virá aqui
    setLoading(false);
  }, []);

  if (loading) {
    return <div>A carregar configurações...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configurações do CRM</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Gerir Funis de Venda</h2>
        {/* A interface para adicionar e editar funis e etapas será construída aqui */}
        <p>Em breve: aqui poderá criar, editar e apagar os seus funis e as respetivas etapas.</p>
      </div>
    </div>
  );
};

export default CrmSettings;