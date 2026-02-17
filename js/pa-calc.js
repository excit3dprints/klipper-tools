// PA Calculator logic

const PA_DEFAULTS = {
    speeds: [100, 150, 300, 600],
    accels: [7500, 15000, 35000],
    lineWidth: 0.525,
    layerHeight: 0.2,
    pa: [
        [0.3, 0.3, 0.3, 0.3],
        [0.2, 0.2, 0.2, 0.2],
        [0.1, 0.1, 0.1, 0.1],
    ]
};

function paLoadState() {
    try {
        const saved = localStorage.getItem('pa_state');
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return JSON.parse(JSON.stringify(PA_DEFAULTS));
}

function paSaveState() {
    try { localStorage.setItem('pa_state', JSON.stringify(PA_STATE)); } catch(e) {}
}

function paResetState() {
    if (!confirm('Reset all PA values to defaults?')) return;
    localStorage.removeItem('pa_state');
    Object.assign(PA_STATE, JSON.parse(JSON.stringify(PA_DEFAULTS)));
    const lwInput = document.getElementById('paLineWidth');
    const lhInput = document.getElementById('paLayerHeight');
    if (lwInput) lwInput.value = PA_STATE.lineWidth;
    if (lhInput) lhInput.value = PA_STATE.layerHeight;
    buildPaTable();
}

const PA_STATE = paLoadState();

// Flow = speed * line_width * layer_height (mm/s * mm * mm = mm³/s)
function calcFlow(speed, lineWidth, layerHeight) {
    return parseFloat((speed * lineWidth * layerHeight).toFixed(4));
}

function buildPaTable() {
    const container = document.getElementById('paTableWrap');
    const lw = PA_STATE.lineWidth;
    const lh = PA_STATE.layerHeight;

    let html = `<div class="pa-table-scroll"><table class="pa-table">`;

    // Header row 1: Speed
    html += `<thead><tr><th class="pa-corner" rowspan="2">Accel ↓</th>`;
    PA_STATE.speeds.forEach((spd, si) => {
        html += `<th class="pa-speed-col">
            <div class="pa-header-group">
                <div class="pa-header-label">Speed</div>
                <input class="pa-speed-input" type="number" value="${spd}" data-si="${si}" min="1" step="10">
            </div>
        </th>`;
    });
    html += `<th class="pa-add-col"><button class="btn-secondary btn-small pa-add-btn" onclick="paAddSpeed()">+ Speed</button></th>`;
    html += `</tr>`;

    // Header row 2: Flow
    html += `<tr>`;
    PA_STATE.speeds.forEach((spd, si) => {
        const flow = calcFlow(spd, lw, lh);
        html += `<th class="pa-flow-header"><span class="pa-flow-label">Flow</span> <span class="pa-flow-val" id="paFlowHeader_${si}">${flow}</span> <span class="pa-flow-unit">mm³/s</span></th>`;
    });
    html += `<th></th></tr></thead>`;

    // Body rows
    html += `<tbody>`;
    PA_STATE.accels.forEach((accel, ai) => {
        html += `<tr>
            <td class="pa-accel-cell">
                <input class="pa-accel-input" type="number" value="${accel}" data-ai="${ai}" min="1" step="500">
            </td>`;
        PA_STATE.speeds.forEach((spd, si) => {
            const pa = PA_STATE.pa[ai][si];
            html += `<td class="pa-cell">
                <input class="pa-val-input" type="number" step="0.001" min="0" max="2" value="${pa}" data-ai="${ai}" data-si="${si}">
            </td>`;
        });
        html += `<td class="pa-remove-col"><button class="btn-small pa-remove-btn" onclick="paRemoveAccel(${ai})" title="Remove row">✕</button></td>`;
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;

    html += `<button class="btn-secondary btn-small" style="margin-top:0.5rem" onclick="paAddAccel()">+ Accel Row</button>`;

    container.innerHTML = html;

    // Attach listeners — save on every change
    container.querySelectorAll('.pa-speed-input').forEach(inp => inp.addEventListener('change', e => {
        PA_STATE.speeds[+e.target.dataset.si] = parseFloat(e.target.value) || 0;
        paSaveState();
        buildPaOutput();
        updateFlowHeaders();
    }));
    container.querySelectorAll('.pa-accel-input').forEach(inp => inp.addEventListener('change', e => {
        PA_STATE.accels[+e.target.dataset.ai] = parseFloat(e.target.value) || 0;
        paSaveState();
        buildPaOutput();
    }));
    container.querySelectorAll('.pa-val-input').forEach(inp => inp.addEventListener('input', e => {
        PA_STATE.pa[+e.target.dataset.ai][+e.target.dataset.si] = parseFloat(e.target.value) || 0;
        paSaveState();
        buildPaOutput();
    }));

    buildPaOutput();
}

function updateFlowHeaders() {
    const lw = PA_STATE.lineWidth;
    const lh = PA_STATE.layerHeight;
    PA_STATE.speeds.forEach((spd, si) => {
        const el = document.getElementById(`paFlowHeader_${si}`);
        if (el) el.textContent = calcFlow(spd, lw, lh);
    });
}

function buildPaOutput() {
    const lw = PA_STATE.lineWidth;
    const lh = PA_STATE.layerHeight;
    const outputWrap = document.getElementById('paOutputWrap');

    const allStrings = [];
    PA_STATE.accels.forEach((accel, ai) => {
        PA_STATE.speeds.forEach((spd, si) => {
            const flow = calcFlow(spd, lw, lh);
            const pa = PA_STATE.pa[ai][si];
            allStrings.push(`${pa},${flow},${accel}`);
        });
    });

    let html = `<div class="pa-copy-all-row">
        <button class="btn-primary pa-copy-all-btn" onclick="copyAllPa(this)">Copy All (OrcaSlicer)</button>
        <span class="pa-copy-all-hint">${allStrings.length} values · one per line · PA,Flow,Accel</span>
    </div>`;

    html += `<div class="pa-table-scroll"><table class="pa-table pa-output-table">`;

    html += `<thead><tr><th class="pa-corner" rowspan="2">Accel ↓</th>`;
    PA_STATE.speeds.forEach((spd, si) => {
        const flow = calcFlow(spd, lw, lh);
        html += `<th class="pa-speed-col"><div class="pa-header-group"><div class="pa-header-label">Speed ${spd}</div><div class="pa-flow-sub">${flow} mm³/s</div></div></th>`;
    });
    html += `</tr><tr>`;
    PA_STATE.speeds.forEach(() => html += `<th class="pa-flow-header" style="font-size:0.6rem;color:var(--text-muted)">PA,Flow,Accel</th>`);
    html += `</tr></thead><tbody>`;

    PA_STATE.accels.forEach((accel, ai) => {
        html += `<tr><td class="pa-accel-cell" style="font-weight:600">${accel}</td>`;
        PA_STATE.speeds.forEach((spd, si) => {
            const flow = calcFlow(spd, lw, lh);
            const pa = PA_STATE.pa[ai][si];
            const str = `${pa},${flow},${accel}`;
            html += `<td class="pa-output-cell">
                <span class="pa-output-str">${str}</span>
                <button class="btn-small btn-copy pa-copy-btn" onclick="copyPaStr(this, '${str}')">Copy</button>
            </td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    outputWrap.innerHTML = html;
}

function copyAllPa(btn) {
    const lw = PA_STATE.lineWidth;
    const lh = PA_STATE.layerHeight;
    const lines = [];
    PA_STATE.accels.forEach((accel, ai) => {
        PA_STATE.speeds.forEach((spd, si) => {
            const flow = calcFlow(spd, lw, lh);
            const pa = PA_STATE.pa[ai][si];
            lines.push(`${pa},${flow},${accel}`);
        });
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        btn.textContent = 'Copied!';
        btn.style.background = 'var(--accent-dim)';
        setTimeout(() => { btn.textContent = 'Copy All (OrcaSlicer)'; btn.style.background = ''; }, 2000);
    });
}

function paAddSpeed() {
    const lastSpeed = PA_STATE.speeds[PA_STATE.speeds.length - 1] || 100;
    PA_STATE.speeds.push(lastSpeed * 2);
    PA_STATE.pa.forEach(row => row.push(row[row.length - 1] || 0.3));
    paSaveState();
    buildPaTable();
}

function paAddAccel() {
    const lastAccel = PA_STATE.accels[PA_STATE.accels.length - 1] || 7500;
    PA_STATE.accels.push(Math.round(lastAccel * 1.5 / 500) * 500);
    PA_STATE.pa.push(new Array(PA_STATE.speeds.length).fill(0.3));
    paSaveState();
    buildPaTable();
}

function paRemoveAccel(ai) {
    if (PA_STATE.accels.length <= 1) return;
    PA_STATE.accels.splice(ai, 1);
    PA_STATE.pa.splice(ai, 1);
    paSaveState();
    buildPaTable();
}

function copyPaStr(btn, str) {
    navigator.clipboard.writeText(str).then(() => {
        btn.classList.add('copied');
        btn.textContent = 'Copied';
        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = 'Copy'; }, 1500);
    });
}

function initPaCalc() {
    const lwInput = document.getElementById('paLineWidth');
    const lhInput = document.getElementById('paLayerHeight');
    if (lwInput) {
        lwInput.value = PA_STATE.lineWidth;
        lwInput.addEventListener('input', e => {
            PA_STATE.lineWidth = parseFloat(e.target.value) || 0.4;
            paSaveState();
            updateFlowHeaders();
            buildPaOutput();
        });
    }
    if (lhInput) {
        lhInput.value = PA_STATE.layerHeight;
        lhInput.addEventListener('input', e => {
            PA_STATE.layerHeight = parseFloat(e.target.value) || 0.2;
            paSaveState();
            updateFlowHeaders();
            buildPaOutput();
        });
    }
    buildPaTable();

    // Wire import textarea to show/hide Replace button dynamically
    const importTextarea = document.getElementById('paImportText');
    if (importTextarea) {
        importTextarea.addEventListener('input', paUpdateImportButtons);
    }
}

function paIsDefaultState() {
    return JSON.stringify(PA_STATE.speeds) === JSON.stringify(PA_DEFAULTS.speeds)
        && JSON.stringify(PA_STATE.accels) === JSON.stringify(PA_DEFAULTS.accels)
        && JSON.stringify(PA_STATE.pa) === JSON.stringify(PA_DEFAULTS.pa);
}

function paUpdateImportButtons() {
    const raw = document.getElementById('paImportText')?.value.trim() || '';
    const replaceBtn = document.getElementById('paBtnReplace');
    const hint = document.getElementById('paImportHint');
    if (!replaceBtn) return;
    // Show Replace only when there's content AND grid is not defaults
    const showReplace = raw.length > 0 && !paIsDefaultState();
    replaceBtn.style.display = showReplace ? '' : 'none';
    if (hint) hint.style.display = showReplace ? '' : 'none';
}

function paImport(replace = false) {
    const raw = document.getElementById('paImportText').value.trim();

    if (!raw) {
        showImportStatus('Paste some values first.', 'error');
        return;
    }

    // Parse lines: PA,Flow,Accel
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l);
    const parsed = [];
    const skipped = [];

    for (const line of lines) {
        const parts = line.split(',').map(s => parseFloat(s.trim()));
        if (parts.length !== 3 || parts.some(isNaN)) {
            skipped.push(line);
            continue;
        }
        const [pa, flow, accel] = parts;
        // Reverse-calculate speed from flow
        const speed = Math.round(flow / (PA_STATE.lineWidth * PA_STATE.layerHeight));
        parsed.push({ pa, flow, accel, speed });
    }

    if (!parsed.length) {
        showImportStatus('No valid lines found. Expected format: PA,Flow,Accel (e.g. 0.3,10.5,7500)', 'error');
        return;
    }

    const importedSpeeds = [...new Set(parsed.map(r => r.speed))].sort((a, b) => a - b);
    const importedAccels = [...new Set(parsed.map(r => r.accel))].sort((a, b) => a - b);

    if (replace) {
        // Button is only shown when grid is non-default, so no confirm needed
        PA_STATE.speeds = [...importedSpeeds];
        PA_STATE.accels = [...importedAccels];
        PA_STATE.pa = importedAccels.map(() => new Array(importedSpeeds.length).fill(0));
    } else {
        // Merge: add new speeds/accels only
        importedSpeeds.forEach(spd => {
            if (!PA_STATE.speeds.includes(spd)) {
                PA_STATE.speeds.push(spd);
                PA_STATE.pa.forEach(row => row.push(0));
            }
        });
        PA_STATE.speeds.sort((a, b) => a - b);

        importedAccels.forEach(accel => {
            if (!PA_STATE.accels.includes(accel)) {
                PA_STATE.accels.push(accel);
                PA_STATE.pa.push(new Array(PA_STATE.speeds.length).fill(0));
            }
        });
        PA_STATE.accels.sort((a, b) => a - b);
    }

    // Fill in PA values
    let filled = 0;
    for (const { pa, accel, speed } of parsed) {
        const ai = PA_STATE.accels.indexOf(accel);
        const si = PA_STATE.speeds.indexOf(speed);
        if (ai !== -1 && si !== -1) {
            PA_STATE.pa[ai][si] = pa;
            filled++;
        }
    }

    paSaveState();
    buildPaTable();
    paUpdateImportButtons();

    const mode = replace ? 'Replaced grid with' : 'Merged';
    const msg = `${mode} ${filled} value${filled !== 1 ? 's' : ''} · ${importedAccels.length} accel row${importedAccels.length !== 1 ? 's' : ''} · ${importedSpeeds.length} speed column${importedSpeeds.length !== 1 ? 's' : ''}.`
        + (skipped.length ? ` Skipped ${skipped.length} unreadable line${skipped.length !== 1 ? 's' : ''}.` : '');
    showImportStatus(msg, 'success');
}

function showImportStatus(msg, type) {
    const el = document.getElementById('paImportStatus');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.color = type === 'error' ? 'var(--error)' : 'var(--success)';
}
