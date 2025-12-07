// export.js - Exporta schedule como XLSX no formato de grade mensal
// Formato: Organistas nas linhas, dias do mês nas colunas

function exportScheduleToExcel(schedule, meta) {
    if (!window.XLSX) {
        alert('Biblioteca de exportação não carregada. Recarregue a página.');
        return;
    }

    const dayAbbrev = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Dom, Seg, Ter, Qua, Qui, Sex, Sab
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const churchName = (meta && meta.church && meta.church.name) || 'Igreja';
    const year = new Date().getFullYear();
    
    // Agrupar por mês
    const scheduleByMonth = {};
    schedule.forEach(s => {
        const date = new Date(s.date + 'T00:00:00');
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!scheduleByMonth[monthKey]) {
            scheduleByMonth[monthKey] = {
                month: date.getMonth(),
                year: date.getFullYear(),
                services: []
            };
        }
        
        scheduleByMonth[monthKey].services.push({
            day: date.getDate(),
            weekday: s.weekday,
            organists: s.chosen.map(c => c.name)
        });
    });

    const wb = XLSX.utils.book_new();

    // Criar uma aba para cada mês
    Object.values(scheduleByMonth).forEach(monthData => {
        const monthName = monthNames[monthData.month];
        const data = [];
        
        // Título
        data.push([`${churchName.toUpperCase()} - ${monthName.toUpperCase()} ${monthData.year}`]);
        data.push([]);
        
        // Coletar todas organistas únicas deste mês
        const organistSet = new Set();
        monthData.services.forEach(s => {
            s.organists.forEach(org => organistSet.add(org));
        });
        const organists = Array.from(organistSet).sort();
        
        // Encontrar maior dia do mês
        const maxDay = Math.max(...monthData.services.map(s => s.day));
        
        // Cabeçalho: ORGANISTA | 1 | 2 | 3 | ... | 31
        const headerRow = ['ORGANISTA'];
        for (let day = 1; day <= maxDay; day++) {
            headerRow.push(String(day));
        }
        data.push(headerRow);
        
        // Linhas de organistas
        organists.forEach(organist => {
            const row = [organist];
            
            for (let day = 1; day <= maxDay; day++) {
                // Verificar se esta organista toca neste dia
                const service = monthData.services.find(s => s.day === day);
                
                if (service && service.organists.includes(organist)) {
                    // Formato: 4.D (dia 4, Domingo)
                    const dayAbbreviation = dayAbbrev[service.weekday];
                    row.push(`${day}.${dayAbbreviation}`);
                } else {
                    row.push('');
                }
            }
            
            data.push(row);
        });
        
        data.push([]);
        data.push(['Legenda: D=Domingo, S=Segunda, T=Terça, Q=Quarta, Q=Quinta, S=Sexta, S=Sábado']);
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Larguras das colunas
        const colWidths = [{ wch: 25 }]; // Coluna de organista
        for (let i = 0; i < maxDay; i++) {
            colWidths.push({ wch: 6 }); // Colunas de dias
        }
        ws['!cols'] = colWidths;
        
        // Mesclar título
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: maxDay } }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, monthName);
    });

    // Nome do arquivo
    const firstMonth = Object.values(scheduleByMonth)[0];
    const filename = `Escala_${churchName.replace(/\s+/g, '_')}_${monthNames[firstMonth.month]}_${firstMonth.year}.xlsx`;
    
    XLSX.writeFile(wb, filename);
}

window.exportScheduleToExcel = exportScheduleToExcel;