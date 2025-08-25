export const getSlaStatus = (dataAbertura, slaHoras) => {
    if (!slaHoras) return { text: 'Sem SLA', color: 'bg-gray-200 text-gray-600' };
    const agora = new Date();
    const dataPrazo = new Date(new Date(dataAbertura).getTime() + slaHoras * 60 * 60 * 1000);
    const tempoRestanteMs = dataPrazo - agora;
    if (tempoRestanteMs < 0) return { text: 'Atrasado', color: 'bg-red-100 text-red-700', isAtrasado: true };
    if (tempoRestanteMs < 24 * 60 * 60 * 1000) return { text: 'Vence hoje', color: 'bg-yellow-100 text-yellow-700' };
    const diasRestantes = Math.ceil(tempoRestanteMs / (1000 * 60 * 60 * 24));
    return { text: `Vence em ${diasRestantes} dias`, color: 'bg-green-100 text-green-700' };
};
