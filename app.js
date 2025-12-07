// app.js - gerencia UI e localStorage com sistema de múltiplas igrejas
// Dependências: rotation.js

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function el(id) { return document.getElementById(id); }

// Estado global
let state = {
    churches: [],  // array de igrejas
    organists: []  // array de organistas (cada uma com churchIds[])
};

// UI inicial - criar checkboxes de dias
function createDayCheckboxes(containerId) {
    const container = el(containerId);
    container.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const label = document.createElement('label');
        label.className = 'day-checkbox';
        label.innerHTML = `<input type="checkbox" value="${i}" class="me-2"> <span>${dayNames[i]}</span>`;
        container.appendChild(label);
    }
}

// localStorage
function loadState() {
    try {
        const raw = localStorage.getItem('rota_state_v2');
        if (raw) state = JSON.parse(raw);
        // migração de versão antiga se necessário
        if (!state.churches) state.churches = [];
        if (!state.organists) state.organists = [];
    } catch (e) {
        console.error('Erro ao carregar estado:', e);
    }
}

function saveState() {
    localStorage.setItem('rota_state_v2', JSON.stringify(state));
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    createDayCheckboxes('churchDays');
    createDayCheckboxes('organistDays');
    
    loadState();
    console.log('Estado carregado:', state); // Debug
    
    updateChurchSelects();
    renderChurchesList();
    renderOrganistsList();
    
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // === IGREJAS ===
    el('saveChurch').addEventListener('click', () => {
        const name = el('churchName').value.trim();
        const color = el('churchColor').value;
        const days = [...el('churchDays').querySelectorAll('input:checked')].map(i => Number(i.value));
        
        if (!name) {
            showAlert('danger', 'Informe o nome da igreja');
            return;
        }
        if (days.length === 0) {
            showAlert('warning', 'Selecione pelo menos um dia de culto');
            return;
        }
        
        const id = 'church_' + Date.now();
        state.churches.push({ id, name, days, color });
        saveState();
        
        el('churchName').value = '';
        el('churchColor').value = '#667eea';
        [...el('churchDays').querySelectorAll('input')].forEach(i => i.checked = false);
        
        updateChurchSelects();
        renderChurchesList();
        showAlert('success', `Igreja "${name}" adicionada com sucesso!`);
    });

    // === ORGANISTAS ===
    el('addOrganist').addEventListener('click', () => {
        const name = el('organistName').value.trim();
        const churchIds = [...el('organistChurches').selectedOptions].map(opt => opt.value);
        const days = [...el('organistDays').querySelectorAll('input:checked')].map(i => Number(i.value));
        
        if (!name) {
            showAlert('danger', 'Informe o nome da organista');
            return;
        }
        if (churchIds.length === 0) {
            showAlert('warning', 'Selecione pelo menos uma igreja');
            return;
        }
        if (days.length === 0) {
            showAlert('warning', 'Selecione pelo menos um dia de preferência');
            return;
        }
        
        const id = 'org_' + Date.now();
        state.organists.push({ id, name, churchIds, days, playCount: 0 });
        saveState();
        
        el('organistName').value = '';
        [...el('organistDays').querySelectorAll('input')].forEach(i => i.checked = false);
        
        renderOrganistsList();
        showAlert('success', `Organista "${name}" adicionada com sucesso!`);
    });

    // === GERAR RODÍZIO ===
    el('generate').addEventListener('click', () => {
        const churchId = el('selectedChurch').value;
        const start = el('startDate').value;
        const end = el('endDate').value;
        const perService = Number(el('perService').value) || 1;
        
        if (!churchId) {
            showAlert('danger', 'Selecione uma igreja');
            return;
        }
        if (!start || !end) {
            showAlert('danger', 'Informe o período inicial e final');
            return;
        }
        
        const church = state.churches.find(c => c.id === churchId);
        const churchOrganists = state.organists.filter(o => o.churchIds && o.churchIds.includes(churchId));
        
        if (churchOrganists.length === 0) {
            showAlert('warning', 'Não há organistas vinculadas a esta igreja');
            return;
        }
        
        try {
            const res = generateRotation(church, churchOrganists, start, end, perService);
            
            // Atualizar contadores
            res.updatedCounts.forEach(u => {
                const org = state.organists.find(o => o.id === u.id);
                if (org) org.playCount = u.playCount;
            });
            
            saveState();
            renderOrganistsList();
            renderSchedule(res.schedule, church);
            renderStats(res.stats, church);
            
            lastSchedule = res.schedule;
            lastExportMeta = { 
                church, 
                perService, 
                generatedAt: new Date().toISOString(),
                stats: res.stats
            };
            
            showAlert('success', 'Rodízio gerado com sucesso!');
        } catch (e) {
            showAlert('danger', 'Erro ao gerar rodízio: ' + e.message);
        }
    });

    // === EXPORT ===
    el('exportBtn').addEventListener('click', () => {
        if (!lastSchedule) {
            showAlert('warning', 'Gere o rodízio primeiro');
            return;
        }
        exportScheduleToExcel(lastSchedule, lastExportMeta);
    });

    // === LIMPAR DADOS ===
    el('clearData').addEventListener('click', () => {
        if (confirm('⚠️ ATENÇÃO: Isso irá apagar TODAS as igrejas, organistas e rodízios salvos. Deseja continuar?')) {
            localStorage.removeItem('rota_state_v2');
            location.reload();
        }
    });
}

// === VARIÁVEIS GLOBAIS ===
let lastSchedule = null;
let lastExportMeta = null;
    const name = el('churchName').value.trim();
    const color = el('churchColor').value;
    const days = [...el('churchDays').querySelectorAll('input:checked')].map(i => Number(i.value));
    
    if (!name) {
        showAlert('danger', 'Informe o nome da igreja');
        return;
    }
    if (days.length === 0) {
        showAlert('warning', 'Selecione pelo menos um dia de culto');
        return;
    }
    
    const id = 'church_' + Date.now();
    state.churches.push({ id, name, days, color });
    saveState();
    
    el('churchName').value = '';
    el('churchColor').value = '#667eea';
    [...el('churchDays').querySelectorAll('input')].forEach(i => i.checked = false);
    
    updateChurchSelects();
    renderChurchesList();
    showAlert('success', `Igreja "${name}" adicionada com sucesso!`);
});

function renderChurchesList() {
    const div = el('churchesList');
    if (state.churches.length === 0) {
        div.innerHTML = '<div class="alert alert-info alert-custom"><i class="bi bi-info-circle"></i> Nenhuma igreja cadastrada</div>';
        return;
    }
    
    let html = '<h5 class="mt-4 mb-3">Igrejas Cadastradas</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Igreja</th><th>Dias de Culto</th><th>Organistas</th><th>Ações</th></tr></thead><tbody>';
    
    state.churches.forEach(church => {
        const daysText = church.days.map(d => dayNames[d]).join(', ');
        const organistCount = state.organists.filter(o => o.churchIds && o.churchIds.includes(church.id)).length;
        html += `
            <tr>
                <td>
                    <span class="badge badge-organist" style="background: ${church.color}">${church.name}</span>
                </td>
                <td>${daysText}</td>
                <td><span class="badge bg-secondary">${organistCount} organista(s)</span></td>
                <td>
                    <button class="btn btn-sm btn-danger delete-church" data-id="${church.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    div.innerHTML = html;
    
    [...div.querySelectorAll('.delete-church')].forEach(btn => {
        btn.addEventListener('click', () => deleteChurch(btn.dataset.id));
    });
}

function deleteChurch(churchId) {
    const church = state.churches.find(c => c.id === churchId);
    if (!confirm(`Deseja remover a igreja "${church.name}"?`)) return;
    
    state.churches = state.churches.filter(c => c.id !== churchId);
    // remover vínculo das organistas
    state.organists.forEach(o => {
        if (o.churchIds) {
            o.churchIds = o.churchIds.filter(id => id !== churchId);
        }
    });
    
    saveState();
    updateChurchSelects();
    renderChurchesList();
    renderOrganistsList();
    showAlert('info', 'Igreja removida');
}

function updateChurchSelects() {
    // Atualizar select de organistas
    const selectOrg = el('organistChurches');
    selectOrg.innerHTML = state.churches.length === 0 
        ? '<option disabled>Cadastre igrejas primeiro</option>'
        : state.churches.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    // Atualizar select de geração
    const selectGen = el('selectedChurch');
    selectGen.innerHTML = '<option value="">Selecione uma igreja</option>' + 
        state.churches.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

// === ORGANISTAS ===
el('addOrganist').addEventListener('click', () => {
    const name = el('organistName').value.trim();
    const churchIds = [...el('organistChurches').selectedOptions].map(opt => opt.value);
    const days = [...el('organistDays').querySelectorAll('input:checked')].map(i => Number(i.value));
    
    if (!name) {
        showAlert('danger', 'Informe o nome da organista');
        return;
    }
    if (churchIds.length === 0) {
        showAlert('warning', 'Selecione pelo menos uma igreja');
        return;
    }
    if (days.length === 0) {
        showAlert('warning', 'Selecione pelo menos um dia de preferência');
        return;
    }
    
    const id = 'org_' + Date.now();
    state.organists.push({ id, name, churchIds, days, playCount: 0 });
    saveState();
    
    el('organistName').value = '';
    [...el('organistDays').querySelectorAll('input')].forEach(i => i.checked = false);
    
    renderOrganistsList();
    showAlert('success', `Organista "${name}" adicionada com sucesso!`);
});

function renderOrganistsList() {
    const div = el('organistsList');
    if (state.organists.length === 0) {
        div.innerHTML = '<div class="alert alert-info alert-custom mt-3"><i class="bi bi-info-circle"></i> Nenhuma organista cadastrada</div>';
        return;
    }
    
    let html = '<h5 class="mt-4 mb-3">Organistas Cadastradas</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Nome</th><th>Igrejas</th><th>Preferências</th><th>Total Tocado</th><th>Ações</th></tr></thead><tbody>';
    
    state.organists.forEach(org => {
        const churches = org.churchIds.map(cId => {
            const church = state.churches.find(c => c.id === cId);
            return church ? `<span class="badge badge-organist" style="background: ${church.color}">${church.name}</span>` : '';
        }).join(' ');
        
        const daysText = org.days.map(d => dayNames[d]).join(', ');
        
        html += `
            <tr>
                <td><strong>${org.name}</strong></td>
                <td>${churches}</td>
                <td><small class="text-muted">${daysText}</small></td>
                <td><span class="badge bg-info">${org.playCount || 0}x</span></td>
                <td>
                    <button class="btn btn-sm btn-danger delete-organist" data-id="${org.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    div.innerHTML = html;
    
    [...div.querySelectorAll('.delete-organist')].forEach(btn => {
        btn.addEventListener('click', () => deleteOrganist(btn.dataset.id));
    });
}

function deleteOrganist(orgId) {
    const org = state.organists.find(o => o.id === orgId);
    if (!confirm(`Deseja remover "${org.name}"?`)) return;
    
    state.organists = state.organists.filter(o => o.id !== orgId);
    saveState();
    renderOrganistsList();
    showAlert('info', 'Organista removida');
}

// === FUNÇÕES DE RENDERIZAÇÃO E HELPERS ===
function renderStats(stats, church) {
    const area = el('statsArea');
    if (!stats) return;
    
    let html = '<h5 class="mb-3">Estatísticas do Rodízio</h5><div class="row">';
    
    html += `
        <div class="col-md-3">
            <div class="stats-card">
                <h6><i class="bi bi-calendar-event"></i> Total de Cultos</h6>
                <h3>${stats.totalServices}</h3>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <h6><i class="bi bi-person"></i> Organistas</h6>
                <h3>${stats.organistCount}</h3>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <h6><i class="bi bi-graph-up"></i> Média/Organista</h6>
                <h3>${stats.avgPerOrganist.toFixed(1)}</h3>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stats-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                <h6><i class="bi bi-activity"></i> Desvio Padrão</h6>
                <h3>${stats.stdDeviation.toFixed(2)}</h3>
            </div>
        </div>
    `;
    
    html += '</div>';
    area.innerHTML = html;
}

function renderSchedule(schedule, church) {
    const area = el('scheduleArea');
    if (!schedule || schedule.length === 0) {
        area.innerHTML = '<div class="alert alert-warning alert-custom">Nenhum culto encontrado no período selecionado</div>';
        return;
    }
    
    let html = '<h5 class="mb-3 mt-4">Escala Gerada</h5><div class="table-responsive"><table class="table table-striped table-hover"><thead><tr><th>Data</th><th>Dia da Semana</th><th>Organistas</th><th>Status</th></tr></thead><tbody>';
    
    schedule.forEach(s => {
        const organists = s.chosen.map(c => {
            let icon = '';
            let badges = [];
            
            // Ícone de disponibilidade
            if (c.wasAvailable) {
                icon = '<i class="bi bi-check-circle-fill text-success"></i>';
            } else {
                icon = '<i class="bi bi-exclamation-triangle-fill text-warning"></i>';
                badges.push('<small class="badge bg-warning">Fora Preferência</small>');
            }
            
            // Ícone de consecutivo
            if (c.wasConsecutive) {
                icon += ' <i class="bi bi-arrow-repeat text-info" title="Tocou no culto anterior"></i>';
                badges.push('<small class="badge bg-info">Consecutivo</small>');
            }
            
            const badgesHtml = badges.length > 0 ? ' ' + badges.join(' ') : '';
            return `${icon} ${c.name}${badgesHtml}`;
        }).join('<br>');
        
        // Status geral do culto
        const hasConsecutive = s.chosen.some(c => c.wasConsecutive);
        const hasOutOfPreference = s.chosen.some(c => !c.wasAvailable);
        
        let statusBadge = '';
        if (!hasConsecutive && !hasOutOfPreference) {
            statusBadge = '<span class="badge bg-success">OK</span>';
        } else {
            const badges = [];
            if (hasOutOfPreference) badges.push('<span class="badge bg-warning">Fora Preferência</span>');
            if (hasConsecutive) badges.push('<span class="badge bg-info">Consecutivo</span>');
            statusBadge = badges.join(' ');
        }
        
        html += `
            <tr>
                <td><strong>${formatDate(s.date)}</strong></td>
                <td><span class="badge badge-organist" style="background: ${church.color}">${dayNames[s.weekday]}</span></td>
                <td>${organists}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    area.innerHTML = html;
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
}

// === HELPER: ALERTS ===
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}