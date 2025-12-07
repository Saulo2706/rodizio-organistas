// rotation.js
// Lógica JUSTA de geração de rodízio
// Algoritmo otimizado para distribuição equilibrada considerando:
// 1. Dias de preferência
// 2. Distribuição igual de dias da semana
// 3. Balanceamento justo do total de cultos

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function generateRotation(church, organists, startDateStr, endDateStr, perService) {
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');
    
    if (isNaN(start) || isNaN(end) || start > end) {
        throw new Error('Período inválido');
    }
    
    const schedule = [];
    const pool = clone(organists);
    
    // Normalizar contadores
    pool.forEach(p => {
        p.playCount = Number(p.playCount || 0);
        p.weekdayCount = {}; // Contador por dia da semana
        // Inicializar apenas para os dias de culto desta igreja
        church.days.forEach(day => {
            p.weekdayCount[day] = 0;
        });
    });
    
    // Coletar todas as datas de culto primeiro
    const serviceDates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const weekday = d.getDay();
        if (church.days.includes(weekday)) {
            serviceDates.push({
                date: new Date(d).toISOString().slice(0, 10),
                weekday: weekday
            });
        }
    }
    
    if (serviceDates.length === 0) {
        throw new Error('Nenhum culto encontrado no período selecionado');
    }
    
    // Para cada data, alocar organistas
    serviceDates.forEach(serviceDate => {
        const { date, weekday } = serviceDate;
        
        // Candidatos que preferem esse dia
        let preferredCandidates = pool.filter(o => o.days.includes(weekday));
        
        // Se não houver organistas suficientes com preferência, considerar todos
        let allCandidates = preferredCandidates.length >= perService 
            ? preferredCandidates 
            : pool.slice();
        
        // Ordenar candidatos por critérios de justiça (APENAS nos dias de culto desta igreja):
        // 1. Contagem neste dia da semana específico - menor primeiro (mais importante!)
        // 2. Total geral (playCount) - menor primeiro
        // 3. Se disponível no dia (preferência) - sim primeiro
        // 4. Randomização para desempate
        allCandidates.sort((a, b) => {
            // Critério 1: Contagem neste dia da semana (PRIORIDADE)
            const aWeekdayCount = a.weekdayCount[weekday] || 0;
            const bWeekdayCount = b.weekdayCount[weekday] || 0;
            if (aWeekdayCount !== bWeekdayCount) {
                return aWeekdayCount - bWeekdayCount;
            }
            
            // Critério 2: Total geral
            if (a.playCount !== b.playCount) {
                return a.playCount - b.playCount;
            }
            
            // Critério 3: Preferência (disponíveis primeiro)
            const aAvailable = a.days.includes(weekday) ? 1 : 0;
            const bAvailable = b.days.includes(weekday) ? 1 : 0;
            if (aAvailable !== bAvailable) {
                return bAvailable - aAvailable; // Inverte para disponível vir primeiro
            }
            
            // Critério 4: Random para desempate
            return Math.random() - 0.5;
        });
        
        // Selecionar os N primeiros
        const chosen = allCandidates.slice(0, perService).map(c => ({
            id: c.id,
            name: c.name,
            wasAvailable: c.days.includes(weekday)
        }));
        
        // Atualizar contadores no pool
        chosen.forEach(ch => {
            const p = pool.find(x => x.id === ch.id);
            if (p) {
                p.playCount++;
                p.weekdayCount[weekday]++;
            }
        });
        
        schedule.push({
            date,
            weekday,
            chosen
        });
    });
    
    // Calcular estatísticas
    const totalServices = serviceDates.length * perService;
    const organistCount = pool.length;
    const avgPerOrganist = totalServices / organistCount;
    
    // Calcular desvio padrão
    const playCounts = pool.map(p => p.playCount);
    const variance = playCounts.reduce((sum, count) => sum + Math.pow(count - avgPerOrganist, 2), 0) / organistCount;
    const stdDeviation = Math.sqrt(variance);
    
    const stats = {
        totalServices: serviceDates.length,
        organistCount,
        avgPerOrganist,
        stdDeviation,
        churchDays: church.days, // Dias de culto da igreja
        distribution: pool.map(p => ({
            name: p.name,
            total: p.playCount,
            byWeekday: p.weekdayCount
        }))
    };
    
    // Retornar schedule e contadores atualizados
    const updatedCounts = pool.map(p => ({
        id: p.id,
        name: p.name,
        playCount: p.playCount
    }));
    
    return { schedule, updatedCounts, stats };
}

window.generateRotation = generateRotation;