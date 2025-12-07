// export.js - Exporta schedule como XLSX no padrão tradicional de rodízios
// Formato simples e limpo para impressão

function exportScheduleToExcel(schedule, meta) {
    if (!window.XLSX) {
        alert('Biblioteca de exportação não carregada. Recarregue a página.');
        return;
    }

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // === FORMATO SIMPLES E TRADICIONAL ===
    const churchName = (meta && meta.church && meta.church.name) || 'Igreja';
    const year = new Date().getFullYear();
    
    // Descobrir qual mês é o rodízio
    const firstDate = new Date(schedule[0]?.date + 'T00:00:00');
    const monthName = monthNames[firstDate.getMonth()];
    
    const scheduleData = [];

    // Título centralizado
    scheduleData.push([`ESCALA DE ORGANISTAS - ${monthName.toUpperCase()} ${year}`]);
    scheduleData.push([churchName.toUpperCase()]);
    scheduleData.push([]);

    // Cabeçalho da tabela
    scheduleData.push(['DATA', 'DIA', 'ORGANISTA']);

    // Dados
    schedule.forEach(s => {
        const date = new Date(s.date + 'T00:00:00');
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dateStr = `${day}/${month}`;
        
        const dayName = dayNames[s.weekday];
        const organists = s.chosen.map(c => c.name).join(' / ');

        scheduleData.push([dateStr, dayName, organists]);
    });

    scheduleData.push([]);
    scheduleData.push(['', '', '']);
    scheduleData.push(['Observações:']);
    scheduleData.push(['- Em caso de imprevistos, comunicar com antecedência']);

    const ws = XLSX.utils.aoa_to_sheet(scheduleData);

    // Larguras das colunas
    ws['!cols'] = [
        { wch: 12 },  // Data
        { wch: 15 },  // Dia
        { wch: 35 }   // Organista
    ];

    // Mesclar células do título
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },  // Título mês/ano
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }   // Nome igreja
    ];

    // === CRIAR WORKBOOK ===
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthName);

    // === GERAR ARQUIVO ===
    const filename = `Escala_${churchName.replace(/\s+/g, '_')}_${monthName}_${year}.xlsx`;
    
    XLSX.writeFile(wb, filename);
}

window.exportScheduleToExcel = exportScheduleToExcel;