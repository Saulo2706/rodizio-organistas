// rotation.js
// Lógica de geração de rodízio
// Dados esperados:
// church = { name: string, days: [0..6] } // 0-domingo .. 6-sábado
// organists = [ { id, name, days: [0..6], playCount: number } ]

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function generateRotation(church, organists, startDateStr, endDateStr, perService) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start) || isNaN(end) || start > end) throw new Error('Período inválido');
    const schedule = [];
    // Use clone to avoid mutating original until confirmed
    const pool = clone(organists);

    // normalize playCount
    pool.forEach(p => p.playCount = Number(p.playCount || 0));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const weekday = d.getDay(); // 0-6
        if (!church.days.includes(weekday)) continue; // dia sem culto
        // candidates who are available that weekday
        let candidates = pool.filter(o => o.days.includes(weekday));
        let fallback = false;
        if (candidates.length === 0) {
            // fallback: consider all organists (indicate not available)
            candidates = pool.slice();
            fallback = true;
        }
        // sort by playCount ascending, then random to break ties
        candidates.sort((a, b) => {
            if (a.playCount !== b.playCount) return a.playCount - b.playCount;
            return Math.random() - 0.5;
        });
        // choose top N
        const chosen = candidates.slice(0, perService).map(c => ({ id: c.id, name: c.name, wasAvailable: c.days.includes(weekday) }));
        // increment playCount for chosen in pool
        chosen.forEach(ch => {
            const p = pool.find(x => x.id === ch.id);
            if (p) p.playCount++;
        });
        schedule.push({
            date: new Date(d).toISOString().slice(0, 10),
            weekday,
            chosen
        });
    }

    // return schedule and updated counts
    const updatedCounts = pool.map(p => ({ id: p.id, name: p.name, playCount: p.playCount }));
    return { schedule, updatedCounts };
}
window.generateRotation = generateRotation;