// export.js - Exporta schedule no formato tradicional da Congregação
// Formato: Organistas nas linhas, MESES nas colunas

function exportScheduleToExcel(schedule, meta) {
    if (!window.XLSX) {
        alert('Biblioteca de exportação não carregada. Recarregue a página.');
        return;
    }

    const monthAbbrev = ['JAN', 'FEV', 'MAR', 'ABRI', 'MAIO', 'JUN', 'JUL', 'AG', 'SET', 'OUT', 'NOV', 'DEZ'];
    const dayAbbrev = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Dom, Seg, Ter, Qua, Qui, Sex, Sab

    const churchName = (meta && meta.church && meta.church.name) || 'CONGREGAÇÃO CRISTÃ NO BRASIL';
    const year = new Date(schedule[0] ? .date + 'T00:00:00').getFullYear();

    // Organizar por organista e mês
    const organistSchedule = {};

    schedule.forEach(s => {
        const date = new Date(s.date + 'T00:00:00');
        const month = date.getMonth();

        s.chosen.forEach(chosen => {
            if (!organistSchedule[chosen.name]) {
                organistSchedule[chosen.name] = {};
            }
            if (!organistSchedule[chosen.name][month]) {
                organistSchedule[chosen.name][month] = [];
            }

            organistSchedule[chosen.name][month].push({
                day: date.getDate(),
                weekday: dayAbbrev[s.weekday]
            });
        });
    });

    const data = [];

    // Título
    data.push([churchName.toUpperCase()]);
    data.push([`RODÍZIO DOS CULTOS OFICIAIS - ${year} - JD. SANTA REGINA`]);
    data.push([]);

    // Cabeçalho
    const header = ['ORGANISTA', 'JAN', 'FEV', 'MAR', 'ABRI', 'MAIO', 'JUN', 'JUL', 'AG', 'SET', 'OUT', 'NOV', 'DEZ'];
    data.push(header);

    // Linhas de organistas
    const organistNames = Object.keys(organistSchedule).sort();
    organistNames.forEach(name => {
        const row = [name.toUpperCase()];

        // Para cada mês
        for (let month = 0; month < 12; month++) {
            const monthDays = organistSchedule[name][month] || [];

            if (monthDays.length > 0) {
                // Formato: Q 12 (apenas letra + número, SEM zero à esquerda)
                // Se múltiplos dias: Q 12/D 8/T 24
                const daysStr = monthDays.map(d => {
                    return `${d.weekday} ${d.day}`;
                }).join('/');
                row.push(daysStr);
            } else {
                row.push('');
            }
        }

        data.push(row);
    });

    // Linha de separação
    data.push([]);

    // Rodapé com horários
    data.push(['Dom/Ter/Qui', '', '', '', '', '', '', '', '', '', '', '', '']);
    data.push(['Meia hora', '19:00-19:20', '', '', '', '', '', '', '', '', '', '', '']);
    data.push(['Afinação', '19:23', '', '', '', '', '', '', '', '', '', '', '']);
    data.push(['Silêncio', '19:25', '', '', '', '', '', '', '', '', '', '', '']);

    data.push([]);

    // Santa Ceia - selecionar 2 organistas aleatórias
    const shuffled = [...organistNames].sort(() => Math.random() - 0.5);
    const santaCeia1 = shuffled[0] ? .toUpperCase() || '';
    const santaCeia2 = shuffled[1] ? .toUpperCase() || '';

    data.push(['Santa Ceia', 'Introduções/Meia-hora', 'Organista Principal', '', '', '', '', '', '', '', '', '', '']);
    data.push(['', santaCeia1, santaCeia2, '', '', '', '', '', '', '', '', '', '']);

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Larguras das colunas
    ws['!cols'] = [
        { wch: 20 }, // Organista
        { wch: 12 }, // JAN
        { wch: 12 }, // FEV
        { wch: 12 }, // MAR
        { wch: 12 }, // ABRI
        { wch: 12 }, // MAIO
        { wch: 12 }, // JUN
        { wch: 12 }, // JUL
        { wch: 12 }, // AG
        { wch: 12 }, // SET
        { wch: 12 }, // OUT
        { wch: 12 }, // NOV
        { wch: 12 } // DEZ
    ];

    // Mesclar células do título
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // Título igreja
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } } // Título rodízio
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Rodízio ${year}`);

    const filename = `Rodizio_Cultos_Oficiais_${year}.xlsx`;
    XLSX.writeFile(wb, filename);
}

window.exportScheduleToExcel = exportScheduleToExcel;