import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Building, Landmark, MapPin, User, FileText, Briefcase, PlusCircle, Trash2, Mail, Phone, Star, X } from 'lucide-react';

const InputField = ({ icon, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            {icon}
        </div>
        <input 
            {...props} 
            className="w-full p-2 pl-10 border rounded-lg transition bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:bg-gray-600 dark:focus:ring-blue-400 dark:focus:border-blue-400"
        />
    </div>
);

const PLANOS = ['Plano Essencial', 'Plano Estratégico'];
const MODULOS_ESTRATEGICO = [
    'Assessoria em Importação', 'Assessoria em Levantamento de Capital', 'Gestão de Endividamento',
    'Assessoria em Processos', 'Assessoria Tributária', 'Assessoria Estratégica'
];

const EmpresaFormUnificado = ({ onSave, initialData = {}, onClose, tabelaAlvo, tabelaContatosAlvo }) => {
    const [formData, setFormData] = useState({});
    const [contatos, setContatos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cnpjError, setCnpjError] = useState('');

    useEffect(() => {
        const defaultData = {
            razao_social: '', nome_fantasia: '', cnpj: '', status: 'Potencial',
            inscricao_estadual: '', inscricao_municipal: '', enquadramento_fiscal: '',
            cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
            plano: '', modulos_contratados: [],
            email_principal: '', telefone_principal: '',
            endereco: '', segmento: '', site: '', telefone: ''
        };
        const mergedData = { ...defaultData, ...initialData };
        setFormData(mergedData);
        setContatos(initialData.contatos || []);
    }, [initialData]);

    const maskCNPJ = (value) => value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18);
    
    const handleCepBlur = async (e) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) return;
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setFormData(prev => ({ ...prev, rua: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf, cep: data.cep }));
            }
        } catch (error) { console.error("Erro ao buscar CEP:", error); }
    };

    const handleCnpjBlur = async (e) => {
        const cnpj = e.target.value.replace(/\D/g, '');
        setCnpjError('');
        if (cnpj.length !== 14) return;
        setLoading(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    razao_social: data.razao_social || '', nome_fantasia: data.nome_fantasia || '',
                    cep: data.cep || '', rua: data.logradouro || '', numero: data.numero || '',
                    complemento: data.complemento || '', bairro: data.bairro || '',
                    cidade: data.municipio || '', estado: data.uf || '',
                    email_principal: data.email || '', telefone_principal: data.ddd_telefone_1 || '',
                }));
            } else { setCnpjError('CNPJ inválido ou não encontrado.'); }
        } catch (error) { console.error("Erro ao buscar CNPJ:", error); setCnpjError('Erro ao buscar CNPJ.'); }
        setLoading(false);
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'plano' && value !== 'Plano Estratégico') {
            setFormData(prev => ({ ...prev, plano: value, modulos_contratados: [] }));
        } else {
             setFormData(prev => ({ ...prev, [name]: name === 'cnpj' ? maskCNPJ(value) : value }));
        }
    };

    const handleModuleChange = (modulo) => {
        setFormData(prev => {
            const newModules = (prev.modulos_contratados || []).includes(modulo)
                ? (prev.modulos_contratados || []).filter(m => m !== modulo)
                : [...(prev.modulos_contratados || []), modulo];
            return { ...prev, modulos_contratados: newModules };
        });
    };

    const handleContatoChange = (index, e) => {
        const newContatos = [...contatos];
        newContatos[index][e.target.name] = e.target.value;
        setContatos(newContatos);
    };

    const handleSetPrincipal = (index) => setContatos(contatos.map((c, i) => ({ ...c, is_principal: i === index })));
    const addContato = () => setContatos([...contatos, { id: `novo-${Date.now()}`, nome: '', cargo: '', email: '', telefone: '', is_principal: contatos.length === 0 }]);
    const removeContato = (index) => {
        let newContatos = contatos.filter((_, i) => i !== index);
        if (newContatos.length > 0 && !newContatos.some(c => c.is_principal)) newContatos[0].is_principal = true;
        setContatos(newContatos);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // CORREÇÃO: Prepara os dados para salvar, removendo os contatos do objeto principal
        const { contatos: _, ...dadosParaSalvar } = formData;
        
        // Constrói o campo 'endereco' para fins de resumo, mas os campos individuais também serão salvos
        dadosParaSalvar.endereco = `${formData.rua || ''}, ${formData.numero || ''} - ${formData.bairro || ''}, ${formData.cidade || ''} - ${formData.estado || ''}`;
        
        let empresaSalva;
        if (dadosParaSalvar.id) {
            const { data, error } = await supabase.from(tabelaAlvo).update(dadosParaSalvar).eq('id', dadosParaSalvar.id).select().single();
            if (error) { alert('Erro ao atualizar empresa: ' + error.message); setLoading(false); return; }
            empresaSalva = data;
        } else {
            delete dadosParaSalvar.id;
            const { data, error } = await supabase.from(tabelaAlvo).insert(dadosParaSalvar).select().single();
            if (error) { alert('Erro ao criar empresa: ' + error.message); setLoading(false); return; }
            empresaSalva = data;
        }

        const idCampoFk = tabelaContatosAlvo === 'crm_contatos' ? 'empresa_id' : 'cliente_id';
        await supabase.from(tabelaContatosAlvo).delete().eq(idCampoFk, empresaSalva.id);
        
        const contatosParaInserir = contatos.map(c => {
            const { id, ...resto } = c;
            return { ...resto, [idCampoFk]: empresaSalva.id };
        });

        if (contatosParaInserir.length > 0) {
            const { error: contatosError } = await supabase.from(tabelaContatosAlvo).insert(contatosParaInserir);
            if (contatosError) alert('Erro ao guardar contatos: ' + contatosError.message);
        }

        onSave();
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 text-sm p-8 rounded-lg max-h-[90vh] overflow-y-auto w-full max-w-4xl relative bg-white dark:bg-gray-800 border dark:border-gray-700">
            <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formData.id ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full transition-colors text-gray-500 hover:bg-gray-100"><X size={24} /></button>
            </div>

            <div>
                <h3 className="font-semibold mb-3 text-lg text-gray-700 dark:text-gray-300">Dados Principais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField icon={<Landmark size={16} />} name="cnpj" value={formData.cnpj || ''} onChange={handleChange} onBlur={handleCnpjBlur} placeholder="CNPJ (para buscar dados)" />
                    <InputField icon={<Building size={16} />} name="nome_fantasia" value={formData.nome_fantasia || ''} onChange={handleChange} placeholder="Nome Fantasia" required />
                    <InputField icon={<User size={16} />} name="razao_social" value={formData.razao_social || ''} onChange={handleChange} placeholder="Razão Social" />
                    <InputField icon={<FileText size={16} />} name="inscricao_estadual" value={formData.inscricao_estadual || ''} onChange={handleChange} placeholder="Inscrição Estadual" />
                    <InputField icon={<FileText size={16} />} name="inscricao_municipal" value={formData.inscricao_municipal || ''} onChange={handleChange} placeholder="Inscrição Municipal" />
                    <InputField icon={<Briefcase size={16} />} name="enquadramento_fiscal" value={formData.enquadramento_fiscal || ''} onChange={handleChange} placeholder="Enquadramento Fiscal" />
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-3 text-lg text-gray-700 dark:text-gray-300">Dados de Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField icon={<Mail size={16} />} name="email_principal" type="email" value={formData.email_principal || ''} onChange={handleChange} placeholder="E-mail Principal" />
                    <InputField icon={<Phone size={16} />} name="telefone_principal" value={formData.telefone_principal || ''} onChange={handleChange} placeholder="Telefone Principal" />
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-3 text-lg text-gray-700 dark:text-gray-300">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2"><InputField icon={<MapPin size={16} />} name="cep" value={formData.cep || ''} onChange={handleChange} onBlur={handleCepBlur} placeholder="CEP" /></div>
                    <div className="md:col-span-4"><InputField icon={<MapPin size={16} />} name="rua" value={formData.rua || ''} onChange={handleChange} placeholder="Rua" /></div>
                    <div className="md:col-span-1"><InputField icon={<MapPin size={16} />} name="numero" value={formData.numero || ''} onChange={handleChange} placeholder="Nº" /></div>
                    <div className="md:col-span-2"><InputField icon={<MapPin size={16} />} name="complemento" value={formData.complemento || ''} onChange={handleChange} placeholder="Complemento" /></div>
                    <div className="md:col-span-3"><InputField icon={<MapPin size={16} />} name="bairro" value={formData.bairro || ''} onChange={handleChange} placeholder="Bairro" /></div>
                    <div className="md:col-span-3"><InputField icon={<MapPin size={16} />} name="cidade" value={formData.cidade || ''} onChange={handleChange} placeholder="Cidade" /></div>
                    <div className="md:col-span-3"><InputField icon={<MapPin size={16} />} name="estado" value={formData.estado || ''} onChange={handleChange} placeholder="Estado" /></div>
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-3 text-lg text-gray-700 dark:text-gray-300">Planos e Serviços</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-medium text-gray-600 dark:text-gray-400">Plano Contratado</label>
                        <select name="plano" value={formData.plano || ''} onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700"><option value="">Selecione um plano</option>{PLANOS.map(p => <option key={p} value={p}>{p}</option>)}</select>
                    </div>
                </div>
                {formData.plano === 'Plano Estratégico' && (
                    <div className="mt-4">
                        <label className="block mb-2 font-medium text-gray-600">Módulos do Plano Estratégico</label>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            {MODULOS_ESTRATEGICO.map(m => <label key={m} className="flex items-center space-x-2"><input type="checkbox" checked={(formData.modulos_contratados || []).includes(m)} onChange={() => handleModuleChange(m)} /><span>{m}</span></label>)}
                        </div>
                    </div>
                )}
            </div>
            
            <div>
                <h3 className="font-semibold mb-3 text-lg text-gray-700 dark:text-gray-300">Contatos Individuais</h3>
                <div className="space-y-4">
                    {contatos.map((contato, index) => (
                        <div key={contato.id || `novo-${index}`} className="p-4 border rounded-lg shadow-sm relative bg-gray-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <InputField icon={<User size={16} />} name="nome" placeholder="Nome" value={contato.nome || ''} onChange={(e) => handleContatoChange(index, e)} />
                                <InputField icon={<Briefcase size={16} />} name="cargo" placeholder="Cargo" value={contato.cargo || ''} onChange={(e) => handleContatoChange(index, e)} />
                                <InputField icon={<Mail size={16} />} name="email" placeholder="E-mail" type="email" value={contato.email || ''} onChange={(e) => handleContatoChange(index, e)} />
                                <InputField icon={<Phone size={16} />} name="telefone" placeholder="Telefone" value={contato.telefone || ''} onChange={(e) => handleContatoChange(index, e)} />
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <div>{contato.is_principal ? <span><Star size={14} className="inline mr-1 text-yellow-500" />Principal</span> : <button type="button" onClick={() => handleSetPrincipal(index)}>Tornar Principal</button>}</div>
                                <button type="button" onClick={() => removeContato(index)}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addContato} className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"><PlusCircle size={18} /> Adicionar Contato</button>
            </div>

            <div className="flex justify-between items-center pt-6 border-t dark:border-gray-700">
                 <div>
                    <label className="font-semibold text-gray-700 dark:text-gray-300">Status da Empresa:</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="ml-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700">
                        <option value="Potencial">Potencial</option>
                        <option value="Cliente Ativo">Cliente Ativo</option>
                        <option value="Inativo">Inativo</option>
                    </select>
                 </div>
                <button type="submit" disabled={loading} className="py-2 px-8 bg-blue-600 text-white rounded-lg font-semibold transition-colors hover:bg-blue-700 disabled:bg-blue-300">
                  {loading ? 'A guardar...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
};

export default EmpresaFormUnificado;