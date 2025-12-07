// app.js - gerencia UI e localStorage
// Dependências: rotation.js

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function el(id) { return document.getElementById(id); }

// UI inicial
function createDayCheckboxes(containerId) {
    const container = el(containerId);
    container.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const cb = document.createElement('label');
        cb.innerHTML = `<input type="checkbox" value="${i}"> ${dayNames[i]}`;
        container.appendChild(cb);
    }
}

createDayCheckboxes('churchDays');
createDayCheckboxes('organistDays');

let state = {
    church: null,
    organists: []
};

// carregar do localStorage
function loadState() {
    try {
        const raw = localStorage.getItem('rota_state');
        if (raw) state = JSON.parse(raw);
    } catch (e) {}
}

function saveState() {
    localStorage.setItem('rota_state', JSON.stringify(state));
}

loadState();
renderOrganistsList();
if (state.church) {
    el('churchName').value = state.church.name || '';
    // marcar dias se houver
    (state.church.days || []).forEach(d => {
        [...el('churchDays').querySelectorAll('input')].forEach(i => {
            if (Number(i.value) === d) i.checked = true;
        });
    });
}

el('saveChurch').addEventListener('click', () => {
    const name = el('churchName').value.trim();
    const days = [...el('churchDays').querySelectorAll('input')].filter(i => i.checked).map(i => Number(i.value));
    if (!name) return alert('Informe nome da igreja');
    state.church = { name, days };
    saveState();
    alert('Igreja salva');
});

el('addOrganist').addEventListener('click', () => {
    const name = el('organistName').value.trim();
    if (!name) return alert('Informe nome da organista');
    const days = [...el('organistDays').querySelectorAll('input')].filter(i => i.checked).map(i => Number(i.value));
    const id = 'o_' + Date.now();
    state.organists.push({ id, name, days, playCount: 0 });
    saveState();
    el('organistName').value = '';
    [...el('organistDays').querySelectorAll('input')].forEach(i => i.checked = false);
    renderOrganistsList();
});

function renderOrganistsList() {
    const div = el('organistsList');
    if (state.organists.length === 0) { div.innerHTML = '<p class="small">Nenhuma organista cadastrada</p>'; return; }
    let html = '<table><tr><th>Nome</th><th>Disponibilidade</th><th>Vezes</th><th>Ações</th></tr>';
    state.organists.forEach(o => {
        const days = o.days.map(d => dayNames[d]).join(', ');
        html += `<tr><td>${o.name}</td><td>${days}</td><td>${o.playCount||0}</td><td><button data-id="${o.id}" class="del">Excluir</button></td></tr>`;
    });
    html += '</table>';
    div.innerHTML = html;
    [...div.querySelectorAll('.del')].forEach(b => {
        b.addEventListener('click', () => {
            const id = b.getAttribute('data-id');
            state.organists = state.organists.filter(x => x.id !== id);
            saveState();
            renderOrganistsList();
        });
    });
}

el('generate').addEventListener('click', () => {
    if (!state.church) return alert('Cadastre a igreja primeiro');
    if (state.organists.length === 0) return alert('Cadastre pelo menos uma organista');
    const start = el('startDate').value;
    const end = el('endDate').value;
    const perService = Number(el('perService').value) || 1;
    try {
        const res = generateRotation(state.church, state.organists, start, end, perService);
        // aplicar updatedCounts ao state.organists
        res.updatedCounts.forEach(u => {
            const p = state.organists.find(x => x.id === u.id);
            if (p) p.playCount = u.playCount;
        });
        saveState();
        renderOrganistsList();
        renderSchedule(res.schedule);
        // armazenar última schedule para export
        lastSchedule = res.schedule;
        lastExportMeta = { church: state.church, perService, generatedAt: new Date().toISOString() };
        alert('Rodízio gerado');
    } catch (e) {
        alert('Erro: ' + e.message);
    }
});

el('clearData').addEventListener('click', () => {
    if (confirm('Deseja limpar TODOS os dados salvos localmente?')) {
        localStorage.removeItem('rota_state');
        state = { church: null, organists: [] };
        location.reload();
    }
});

let lastSchedule = null;
let lastExportMeta = null;

function renderSchedule(schedule) {
    const area = el('scheduleArea');
    if (!schedule || schedule.length === 0) { area.innerHTML = '<p>Nenhuma data no período com culto.</p>'; return; }
    let html = '<table><tr><th>Data</th><th>Dia</th><th>Organistas</th></tr>';
    schedule.forEach(s => {
        const names = s.chosen.map(c => c.wasAvailable ? c.name : `${c.name} (não disponível)`).join('<br>');
        html += `<tr><td>${s.date}</td><td>${dayNames[s.weekday]}</td><td>${names}</td></tr>`;
    });
    html += '</table>';
    area.innerHTML = html;
}

// Export
el('exportBtn').addEventListener('click', () => {
    if (!lastSchedule) return alert('Gere o rodízio primeiro');
    exportScheduleToExcel(lastSchedule, lastExportMeta);
});