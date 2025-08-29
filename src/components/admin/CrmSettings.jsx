// src/components/admin/CrmSettings.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

const CrmSettings = () => {
  const [funis, setFunis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // A lógica para buscar os funis e etapas virá aqui
    setLoading(false);
  }, []);

  if (loading) {
    return <div>A carregar configurações do CRM...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-semibold mb-4">Gerir Funis de Venda</h2>
      {/* A interface para adicionar e editar funis e etapas será construída aqui */}
      <p>Em breve: aqui poderá criar, editar e apagar os seus funis e as respetivas etapas.</p>
    </div>
  );
};

export default CrmSettings;
