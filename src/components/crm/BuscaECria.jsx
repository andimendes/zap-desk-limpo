import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { Loader2, PlusCircle } from 'lucide-react';

export default function BuscaECria({ tabela, coluna, placeholder, valorInicial = '', onSelecao }) {
    const [termo, setTermo] = useState(valorInicial);
    const [sugestoes, setSugestoes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFocado, setIsFocado] = useState(false);
    const wrapperRef = useRef(null);

    const buscarSugestoes = useCallback(async (termoBusca) => {
        if (!termoBusca || termoBusca.length < 2) {
            setSugestoes([]);
            return;
        }
        setLoading(true);
        const { data } = await supabase
            .from(tabela)
            .select(`id, ${coluna}`)
            .ilike(coluna, `%${termoBusca}%`)
            .limit(5);
        setSugestoes(data || []);
        setLoading(false);
    }, [tabela, coluna]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (isFocado) buscarSugestoes(termo);
        }, 500);
        return () => clearTimeout(handler);
    }, [termo, isFocado, buscarSugestoes]);
    
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsFocado(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);


    const handleSelecao = (sugestao) => {
        setTermo(sugestao[coluna]);
        onSelecao(sugestao[coluna]);
        setIsFocado(false);
    };

    const handleCriarNovo = () => {
        onSelecao(termo);
        setIsFocado(false);
    }
    
    const handleInputChange = (e) => {
        setTermo(e.target.value);
        onSelecao(e.target.value);
    }

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input
                type="text"
                value={termo}
                onChange={handleInputChange}
                onFocus={() => setIsFocado(true)}
                placeholder={placeholder}
                className="w-full p-2 border rounded-lg"
            />
            {isFocado && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                    {loading && <div className="p-2"><Loader2 className="animate-spin" /></div>}
                    {!loading && sugestoes.length > 0 && (
                        <ul>
                            {sugestoes.map((sugestao) => (
                                <li key={sugestao.id} onClick={() => handleSelecao(sugestao)} className="p-2 hover:bg-gray-100 cursor-pointer">
                                    {sugestao[coluna]}
                                </li>
                            ))}
                        </ul>
                    )}
                     {!loading && termo.length > 1 && (
                        <div onClick={handleCriarNovo} className="p-2 flex items-center gap-2 text-sm text-blue-600 hover:bg-gray-100 cursor-pointer">
                            <PlusCircle size={16}/> Criar "{termo}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}