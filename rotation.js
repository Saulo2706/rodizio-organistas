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
        p.monthlyCount = 0; // Contador do mês atual
        p.weekdayCount = {}; // Contador por dia da semana
        church.days.forEach(day => {
            p.weekdayCount[day] = 0;
        });
    });

    // Agrupar datas de culto por mês
    const servicesByMonth = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const weekday = d.getDay();
        if (church.days.includes(weekday)) {
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!servicesByMonth[monthKey]) {
                servicesByMonth[monthKey] = [];
            }
            servicesByMonth[monthKey].push({
                date: new Date(d).toISOString().slice(0, 10),
                weekday: weekday
            });
        }
    }

    if (Object.keys(servicesByMonth).length === 0) {
        throw new Error('Nenhum culto encontrado no período selecionado');
    }

    // Processar mês a mês
    Object.keys(servicesByMonth).sort().forEach(monthKey => {
        const monthServices = servicesByMonth[monthKey];
        
        // Resetar contador mensal
        pool.forEach(p => p.monthlyCount = 0);

        // Para cada culto do mês
        monthServices.forEach((serviceDate, index) => {
            const { date, weekday } = serviceDate;

            // Pegar organistas que tocaram no último culto
            const lastService = schedule.length > 0 ? schedule[schedule.length - 1] : null;
            const lastOrganistIds = lastService ? lastService.chosen.map(c => c.id) : [];

            let allCandidates = pool.slice();

            // Ordenar por prioridade
            allCandidates.sort((a, b) => {
                // Critério 1: PRIORIDADE - quem ainda não tocou neste mês
                if (a.monthlyCount !== b.monthlyCount) {
                    return a.monthlyCount - b.monthlyCount;
                }

                // Critério 2: Evitar consecutivos
                const aWasLast = lastOrganistIds.includes(a.id) ? 1 : 0;
                const bWasLast = lastOrganistIds.includes(b.id) ? 1 : 0;
                if (aWasLast !== bWasLast) {
                    return aWasLast - bWasLast;
                }

                // Critério 3: Total geral (para equilibrar ao longo dos meses)
                if (a.playCount !== b.playCount) {
                    return a.playCount - b.playCount;
                }

                // Critério 4: Dia da semana (rotacionar)
                const aWeekdayCount = a.weekdayCount[weekday] || 0;
                const bWeekdayCount = b.weekdayCount[weekday] || 0;
                if (aWeekdayCount !== bWeekdayCount) {
                    return aWeekdayCount - bWeekdayCount;
                }

                // Critério 5: Preferência
                const aAvailable = a.days.includes(weekday) ? 1 : 0;
                const bAvailable = b.days.includes(weekday) ? 1 : 0;
                if (aAvailable !== bAvailable) {
                    return bAvailable - aAvailable;
                }

                // Critério 6: Random
                return Math.random() - 0.5;
            });

            // Selecionar organistas
            const chosen = allCandidates.slice(0, perService).map(c => ({
                id: c.id,
                name: c.name,
                wasAvailable: c.days.includes(weekday),
                wasConsecutive: lastOrganistIds.includes(c.id)
            }));

            // Atualizar contadores
            chosen.forEach(ch => {
                const p = pool.find(x => x.id === ch.id);
                if (p) {
                    p.playCount++;
                    p.monthlyCount++;
                    p.weekdayCount[weekday]++;
                }
            });

            schedule.push({
                date,
                weekday,
                chosen
            });
        });
    });

    // Calcular estatísticas
    const totalServices = schedule.length;
    const organistCount = pool.length;
    const avgPerOrganist = (totalServices * perService) / organistCount;

    // Calcular desvio padrão
    const playCounts = pool.map(p => p.playCount);
    const variance = playCounts.reduce((sum, count) => sum + Math.pow(count - avgPerOrganist, 2), 0) / organistCount;
    const stdDeviation = Math.sqrt(variance);

    const stats = {
        totalServices: schedule.length,
        organistCount,
        avgPerOrganist,
        stdDeviation,
        churchDays: church.days,
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