// src/components/clientes/ImportacaoModal.jsx

import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { X, UploadCloud, FileText, Download, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';

const ImportacaoModal = ({ onClose, onComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const CSV_HEADERS = [
    'nome_fantasia', 'razao_social', 'cnpj', 'status', 
    'email_principal', 'telefone_principal'
  ];

  const handleDownloadTemplate = () => {
    const csv = Papa.unparse([CSV_HEADERS]);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_importacao_empresas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setFeedback({ type: '', message: '' });
    } else {
      setFile(null);
      setFeedback({ type: 'error', message: 'Por favor, selecione um ficheiro no formato CSV.' });
    }
  };

  const handleImport = async () => {
    if (!file) {
      setFeedback({ type: 'error', message: 'Nenhum ficheiro selecionado.' });
      return;
    }

    setLoading(true);
    setFeedback({ type: '', message: '' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        
        if (!data.length || !results.meta.fields.includes('nome_fantasia')) {
          setFeedback({ type: 'error', message: 'Ficheiro inválido ou vazio. Verifique se a coluna "nome_fantasia" existe.' });
          setLoading(false);
          return;
        }

        const empresasParaInserir = data
          .map((row, index) => {
            if (!row.nome_fantasia || !row.status) {
              setFeedback({ type: 'error', message: `Erro na linha ${index + 2}: As colunas "nome_fantasia" e "status" são obrigatórias.` });
              return null;
            }
            return {
              nome_fantasia: row.nome_fantasia,
              razao_social: row.razao_social || null,
              cnpj: row.cnpj ? String(row.cnpj).replace(/\D/g, '') : null,
              status: row.status,
              email_principal: row.email_principal || null,
              telefone_principal: row.telefone_principal ? String(row.telefone_principal).replace(/\D/g, '') : null,
            };
          })
          .filter(Boolean); // Filtra as linhas nulas (com erros)

        if (feedback.type === 'error') {
            setLoading(false);
            return;
        }

        if (empresasParaInserir.length > 0) {
          const { error } = await supabase.from('crm_empresas').insert(empresasParaInserir);

          if (error) {
            setFeedback({ type: 'error', message: `Falha na importação: ${error.message}` });
          } else {
            setFeedback({ type: 'success', message: `${empresasParaInserir.length} empresas importadas com sucesso!` });
            setTimeout(() => {
                onComplete(); // Fecha o modal e atualiza a lista de empresas
            }, 2000);
          }
        }
        setLoading(false);
      },
      error: (error) => {
        setFeedback({ type: 'error', message: `Erro ao ler o ficheiro: ${error.message}` });
        setLoading(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl animate-fade-in-up">
        <header className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Importar Empresas via CSV</h2>
          <button onClick={onClose} disabled={loading} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={24} />
          </button>
        </header>

        <main className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Instruções</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>Clique em <strong>"Baixar Modelo"</strong> para obter a planilha no formato correto.</li>
              <li>Preencha a planilha com os dados das empresas. As colunas <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">nome_fantasia</code> e <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">status</code> são <strong>obrigatórias</strong>.</li>
              <li>Os valores para a coluna <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">status</code> devem ser: <strong>Cliente Ativo</strong>, <strong>Potencial</strong> ou <strong>Inativo</strong>.</li>
              <li>Salve o ficheiro no formato CSV (separado por vírgulas).</li>
              <li>Selecione o ficheiro abaixo para iniciar a importação.</li>
            </ol>
          </div>

          <div className="text-center">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center gap-2 mx-auto py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download size={18} />
              Baixar Modelo (.csv)
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecione o ficheiro CSV
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {file ? (
                  <FileText className="mx-auto h-12 w-12 text-green-500" />
                ) : (
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                )}
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Carregar um ficheiro</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">{!file && "ou arraste e solte"}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {file ? `Ficheiro selecionado: ${file.name}` : "Apenas ficheiros CSV"}
                </p>
              </div>
            </div>
          </div>
          
          {feedback.message && (
            <div className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                {feedback.message}
            </div>
          )}

        </main>

        <footer className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="py-2 px-4 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-600">
            Cancelar
          </button>
          <button 
            onClick={handleImport} 
            disabled={!file || loading || feedback.type === 'success'}
            className="py-2 px-6 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? 'A importar...' : 'Importar'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ImportacaoModal;