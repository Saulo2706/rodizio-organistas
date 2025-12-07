// export.js - Exporta schedule como XLSX no padrão de rodízios de igreja
// Usa SheetJS (incluído via CDN no index.html)

function exportScheduleToExcel(schedule, meta) {
    if (!window.XLSX) {
        alert('Biblioteca de exportação não carregada. Recarregue a página.');
        return;
    }

    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // === ABA 1: ESCALA (Formato limpo para impressão) ===
    const churchName = (meta && meta.church && meta.church.name) || 'Igreja';
    const periodStart = schedule[0] ? .date || '';
    const periodEnd = schedule[schedule.length - 1] ? .date || '';

    const scheduleData = [];

    // Cabeçalho
    scheduleData.push([`ESCALA DE ORGANISTAS - ${churchName.toUpperCase()}`]);
    scheduleData.push([`Período: ${formatDateBR(periodStart)} a ${formatDateBR(periodEnd)}`]);
    scheduleData.push([]);

    // Tabela principal
    scheduleData.push(['DATA', 'DIA DA SEMANA', 'ORGANISTA(S)', 'OBSERVAÇÕES']);

    schedule.forEach(s => {
        const dateFormatted = formatDateBR(s.date);
        const dayName = dayNames[s.weekday];
        const organists = s.chosen.map(c => c.name).join(' e ');
        
        // Observações
        const obs = [];
        if (s.chosen.some(c => !c.wasAvailable)) {
            obs.push('Fora da preferência');
        }
        if (s.chosen.some(c => c.wasConsecutive)) {
            obs.push('Consecutivo');
        }
        const observations = obs.length > 0 ? obs.join(', ') : '';

        scheduleData.push([dateFormatted, dayName, organists, observations]);
    });

    const ws_schedule = XLSX.utils.aoa_to_sheet(scheduleData);

    // Ajustar largura das colunas
    ws_schedule['!cols'] = [
        { wch: 15 }, // Data
        { wch: 20 }, // Dia
        { wch: 40 }, // Organistas
        { wch: 25 }  // Observações
    ];

    // Mesclar células do cabeçalho
    ws_schedule['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Título
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }  // Período
    ];

    // === ABA 2: ESTATÍSTICAS ===
    const statsData = [];

    if (meta && meta.church) {
        statsData.push(['ESTATÍSTICAS - ' + meta.church.name]);
        statsData.push(['Período:', `${formatDateBR(periodStart)} a ${formatDateBR(periodEnd)}`]);
        statsData.push([]);
    }

    if (meta && meta.stats) {
        statsData.push(['RESUMO GERAL']);
        statsData.push(['Total de Cultos:', meta.stats.totalServices]);
        statsData.push(['Total de Organistas:', meta.stats.organistCount]);
        statsData.push(['Média por Organista:', meta.stats.avgPerOrganist.toFixed(1)]);
        statsData.push(['Desvio Padrão (equilíbrio):', meta.stats.stdDeviation.toFixed(2)]);
        statsData.push([]);

        // Cabeçalho dinâmico - apenas dias de culto da igreja
        const churchDays = meta.stats.churchDays || [];
        const headerRow = ['ORGANISTA', 'TOTAL'];
        const dayHeaders = [];

        churchDays.forEach(dayNum => {
            headerRow.push(dayNamesShort[dayNum]);
            dayHeaders.push(dayNum);
        });

        statsData.push(['DISTRIBUIÇÃO POR DIA DE CULTO']);
        statsData.push(headerRow);

        meta.stats.distribution.forEach(d => {
            const row = [d.name, d.total];

            // Adicionar apenas dias de culto
            dayHeaders.forEach(dayNum => {
                row.push(d.byWeekday[dayNum] || 0);
            });

            statsData.push(row);
        });
    }

    const ws_stats = XLSX.utils.aoa_to_sheet(statsData);
    const colWidths = [{ wch: 25 }, { wch: 12 }];
    if (meta && meta.stats && meta.stats.churchDays) {
        meta.stats.churchDays.forEach(() => colWidths.push({ wch: 10 }));
    }
    ws_stats['!cols'] = colWidths;

    // === CRIAR WORKBOOK ===
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws_schedule, 'Escala');
    XLSX.utils.book_append_sheet(wb, ws_stats, 'Estatísticas');

    // === GERAR ARQUIVO ===
    const date = new Date().toISOString().slice(0, 10);
    const filename = `Rodizio_${churchName.replace(/\s+/g, '_')}_${date}.xlsx`;

    XLSX.writeFile(wb, filename);
}

// Helper para formatar data em pt-BR
function formatDateBR(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
}

window.exportScheduleToExcel = exportScheduleToExcel;