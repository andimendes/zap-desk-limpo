// src/components/clientes/EmpresaFormUnificado.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Building, Landmark, MapPin, User, FileText, Briefcase, PlusCircle, Trash2, Mail, Phone, Star, X, Search } from 'lucide-react';
import InputMask from 'react-input-mask';


const InputField = ({ icon, mask, ...props }) => {
    const inputComponent = mask ? (
        <InputMask mask={mask} {...props}>
            {(inputProps) => <input {...inputProps} />}
        </InputMask>
    ) : (
        <input {...props} />
    );

    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                {icon}
            </div>
            <div className="w-full pl-10 border rounded-lg transition bg-gray-50 border-gray-300 text-gray-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus-within:bg-gray-600 dark:focus-within:ring-blue-400 dark:focus-within:border-blue-400">
                {React.cloneElement(inputComponent, { className: "w-full p-2 bg-transparent border-none focus:ring-0" })}
            </div>
        </div>
    );
};


const PLANOS = ['Plano Essencial', 'Plano Estratégico'];
const MODULOS_ESTRATEGICO = [
    'Assessoria em Importação', 'Assessoria em Levantamento de Capital', 'Gestão de Endividamento',
    'Assessoria em Processos', 'Assessoria Tributária', 'Assessoria Estratégica'
];

const EmpresaFormUnificado = ({ onSave, initialData = {}, onClose, tabelaAlvo }) => {
    const [formData, setFormData] = useState({});
    const [contatosVinculados, setContatosVinculados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cnpjError, setCnpjError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [todosContatos, setTodosContatos] = useState([]);
    const [showContactList, setShowContactList] = useState(false);

    useEffect(() => {
        const defaultData = {
            razao_social: '', nome_fantasia: '', cnpj: '', status: 'Potencial',
            inscricao_estadual: '', inscricao_municipal: '', enquadramento_fiscal: '',
            plano: '', modulos_contratados: [],
            email_principal: '', telefone_principal: '',
            rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: ''
        };
        const validInitialData = initialData || {};
        const mergedData = { ...defaultData, ...validInitialData };
        setFormData(mergedData);
        if (validInitialData.id) {
            const fetchContatosVinculados = async () => {
                const { data, error } = await supabase.from('empresa_contato_junction').select('*, crm_contatos(*)').eq('empresa_id', validInitialData.id);
                if (!error) {
                    const contatosFormatados = data.map(item => ({...item.crm_contatos, is_principal: item.is_principal}));
                    setContatosVinculados(contatosFormatados);
                }
            };
            fetchContatosVinculados();
        } else {
            setContatosVinculados([]);
        }
        const fetchTodosContatos = async () => {
            const { data, error } = await supabase.from('crm_contatos').select('*');
            if (!error) setTodosContatos(data);
        };
        fetchTodosContatos();
    }, [initialData]);
    
    const handleCnpjBlur = async (e) => {
        const cnpjLimpo = e.target.value.replace(/\D/g, '');
        setCnpjError('');

        if (cnpjLimpo.length === 0) return;

        if (cnpjLimpo.length !== 14) {
            setCnpjError('O CNPJ deve ter 14 dígitos.');
            return;
        }

        setLoading(true);

        try {
            let query = supabase.from('crm_empresas').select('id').eq('cnpj', cnpjLimpo).single();
            
            if (initialData.id) {
                query = query.neq('id', initialData.id);
            }

            const { data: existingCnpj, error: cnpjCheckError } = await query;

            if (cnpjCheckError && cnpjCheckError.code !== 'PGRST116') { 
                throw cnpjCheckError;
            }

            if (existingCnpj) {
                setCnpjError('Este CNPJ já está cadastrado no sistema.');
                setLoading(false);
                return;
            }

            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, razao_social: data.razao_social || '', nome_fantasia: data.nome_fantasia || '', cep: data.cep || '', rua: data.logradouro || '', numero: data.numero || '', complemento: data.complemento || '', bairro: data.bairro || '', cidade: data.municipio || '', estado: data.uf || '', email_principal: data.email || '', telefone_principal: `${data.ddd_telefone_1 || ''}` }));
            } else { setCnpjError('CNPJ inválido ou não encontrado na API externa.'); }

        } catch (error) {
            console.error("Erro na validação do CNPJ:", error);
            setCnpjError('Erro ao validar o CNPJ. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'cnpj') {
            setCnpjError(''); 
        }
        if (name === 'plano' && value !== 'Plano Estratégico') {
            setFormData(prev => ({ ...prev, plano: value, modulos_contratados: [] }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleModuleChange = (modulo) => {
        setFormData(prev => {
            const newModules = (prev.modulos_contratados || []).includes(modulo) ? (prev.modulos_contratados || []).filter(m => m !== modulo) : [...(prev.modulos_contratados || []), modulo];
            return { ...prev, modulos_contratados: newModules };
        });
    };
    
    const addContatoVinculado = (contato) => {
        if (!contatosVinculados.find(c => c.id === contato.id)) {
            const isFirstContact = contatosVinculados.length === 0;
            setContatosVinculados([...contatosVinculados, { ...contato, is_principal: isFirstContact }]);
        }
        setSearchTerm('');
        setShowContactList(false);
    };

    const removeContatoVinculado = (contatoId) => {
        let newContatos = contatosVinculados.filter(c => c.id !== contatoId);
        if (newContatos.length > 0 && !newContatos.some(c => c.is_principal)) {
            newContatos[0].is_principal = true;
        }
        setContatosVinculados(newContatos);
    };

    const handleSetPrincipal = (contatoId) => {
        setContatosVinculados(contatosVinculados.map(c => ({...c, is_principal: c.id === contatoId })));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (cnpjError) {
            alert("Não é possível salvar. Por favor, corrija os erros no formulário.");
            return;
        }

        setLoading(true);

        // --- ALTERAÇÃO PRINCIPAL AQUI ---
        // Limpa o CNPJ e o telefone, removendo caracteres não numéricos.
        const cnpjLimpo = formData.cnpj ? formData.cnpj.replace(/\D/g, '') : '';
        const telefoneLimpo = formData.telefone_principal ? formData.telefone_principal.replace(/\D/g, '') : '';

        const dadosParaSalvar = { 
            id: formData.id, 
            razao_social: formData.razao_social, 
            nome_fantasia: formData.nome_fantasia, 
            // Se o CNPJ limpo tiver mais de 0 caracteres, usa o valor. Senão, envia null.
            cnpj: cnpjLimpo.length > 0 ? cnpjLimpo : null, 
            status: formData.status, 
            inscricao_estadual: formData.inscricao_estadual, 
            inscricao_municipal: formData.inscricao_municipal, 
            enquadramento_fiscal: formData.enquadramento_fiscal, 
            plano: formData.plano, 
            modulos_contratados: formData.modulos_contratados, 
            email_principal: formData.email_principal, 
            telefone_principal: telefoneLimpo.length > 0 ? telefoneLimpo : null,
            rua: formData.rua, 
            numero: formData.numero, 
            complemento: formData.complemento, 
            bairro: formData.bairro, 
            cidade: formData.cidade, 
            estado: formData.estado, 
            cep: formData.cep 
        };
        
        let empresaSalva;
        try {
            if (dadosParaSalvar.id) {
                const { data, error } = await supabase.from(tabelaAlvo).update(dadosParaSalvar).eq('id', dadosParaSalvar.id).select().single();
                if (error) throw error;
                empresaSalva = data;
            } else {
                const { id, ...dadosInserir } = dadosParaSalvar;
                const { data, error } = await supabase.from(tabelaAlvo).insert(dadosInserir).select().single();
                if (error) throw error;
                empresaSalva = data;
            }
            await supabase.from('empresa_contato_junction').delete().eq('empresa_id', empresaSalva.id);
            const junctionData = contatosVinculados.map(contato => ({ empresa_id: empresaSalva.id, contato_id: contato.id, is_principal: !!contato.is_principal }));
            if (junctionData.length > 0) {
                const { error: junctionError } = await supabase.from('empresa_contato_junction').insert(junctionData);
                if (junctionError) throw junctionError;
            }
            onSave();
        } catch (error) {
            console.error('Erro ao salvar empresa:', error);
            if (error.code === '23505') {
                 setCnpjError('Este CNPJ já está cadastrado no sistema.'); // Mostra o erro no campo CNPJ
                 alert('Erro ao salvar: O CNPJ informado já existe no sistema.');
            } else {
                 alert('Erro ao salvar empresa: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const filteredContacts = searchTerm ? todosContatos.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase())) : [];

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-sm p-8 rounded-lg max-h-[90vh] overflow-y-auto w-full max-w-4xl relative bg-white dark:bg-gray-800 border dark:border-gray-700">
             <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formData.id ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                <button type="button" onClick={onClose} className="p-2 rounded-full transition-colors text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={24} /></button>
            </div>
            <div>
                <h3 className="font-semibold mb-3 text-lg text-gray-700 dark:text-gray-300">Dados Principais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputField 
                            icon={<Landmark size={16} />} 
                            name="cnpj" 
                            value={formData.cnpj || ''} 
                            onChange={handleChange} 
                            onBlur={handleCnpjBlur} 
                            placeholder="CNPJ (preenche dados)"
                            mask="99.999.999/9999-99"
                        />
                        {cnpjError && <p className="text-xs text-red-500 mt-1">{cnpjError}</p>}
                    </div>
                    <InputField icon={<Building size={16} />} name="nome_fantasia" value={formData.nome_fantasia || ''} onChange={handleChange} placeholder="Nome Fantasia" required />
                    <InputField icon={<User size={16} />} name="razao_social" value={formData.razao_social || ''} onChange={handleChange} placeholder="Razão Social" />
                    <InputField icon={<FileText size={16} />} name="inscricao_estadual" value={formData.inscricao_estadual || ''} onChange={handleChange} placeholder="Inscrição Estadual" />
                    <InputField icon={<FileText size={16} />} name="inscricao_municipal" value={formData.inscricao_municipal || ''} onChange={handleChange} placeholder="Inscrição Municipal" />
                    <InputField icon={<Briefcase size={16} />} name="enquadramento_fiscal" value={formData.enquadramento_fiscal || ''} onChange={handleChange} placeholder="Enquadramento Fiscal" />
                    <InputField icon={<Mail size={16} />} name="email_principal" type="email" value={formData.email_principal || ''} onChange={handleChange} placeholder="E-mail Principal" />
                    <InputField 
                        icon={<Phone size={16} />} 
                        name="telefone_principal" 
                        value={formData.telefone_principal || ''} 
                        onChange={handleChange} 
                        placeholder="Telefone Principal"
                        mask="(99) 99999-9999"
                    />
                </div>
            </div>
            <div>
                <h3 className="font-semibold mb-3 text-lg text-gray-700 dark:text-gray-300">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                     <div className="md:col-span-2"><InputField icon={<MapPin size={16} />} name="cep" value={formData.cep || ''} onChange={handleChange} placeholder="CEP" /></div>
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
                <h3 className="font-semibold mb-3 text-lg text-gray-700 dark:text-gray-300">Contatos Vinculados</h3>
                <div className="space-y-3">
                    {contatosVinculados.map(contato => (
                        <div key={contato.id} className="p-3 border rounded-lg flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/50">
                           <div>
                                <p className="font-semibold">{contato.nome}</p>
                                <p className="text-xs text-gray-500">{contato.cargo || 'Sem cargo'}</p>
                           </div>
                           <div className="flex items-center gap-4">
                               <button type="button" onClick={() => handleSetPrincipal(contato.id)} className={`text-xs p-1 rounded-full flex items-center gap-1 ${contato.is_principal ? 'text-yellow-600 bg-yellow-100' : 'text-gray-500 hover:bg-gray-200'}`}>
                                   <Star size={14} /> {contato.is_principal ? 'Principal' : 'Tornar Principal'}
                               </button>
                               <button type="button" onClick={() => removeContatoVinculado(contato.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                           </div>
                        </div>
                    ))}
                </div>
                <div className="relative mt-4">
                    <InputField icon={<Search size={16} />} type="text" placeholder="Pesquisar e adicionar um contato existente..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowContactList(true); }} onFocus={() => setShowContactList(true)} />
                    {showContactList && filteredContacts.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg dark:bg-gray-900 dark:border-gray-700">
                            {filteredContacts.map(contato => (
                                <li key={contato.id} onClick={() => addContatoVinculado(contato)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                    {contato.nome}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
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