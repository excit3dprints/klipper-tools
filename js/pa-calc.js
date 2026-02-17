// PA Calculator logic

const PA_STATE = {
    speeds: [100, 150, 300, 600],
    accels: [7500, 15000, 35000],
    lineWidth: 0.525,
    layerHeight: 0.2,
    // pa[accelIdx][speedIdx]
    pa: [
        [0.3, 0.3, 0.3, 0.3],
        [0.2, 0.2, 0.2, 0.2],
        [0.1, 0.1, 0.1, 0.1],
    ]
};

// Flow = speed * line_width * layer_height (mm/s * mm * mm = mm³/s)
function calcFlow(speed, lineWidth, layerHeight) {
    return parseFloat((speed * lineWidth * layerHeight).toFixed(4));
}

function buildPaTable() {
    const container = document.getElementById('paTableWrap');
    const lw = PA_STATE.lineWidth;
    const lh = PA_STATE.layerHeight;

    // Build HTML
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

    // Header row 2: Flow (auto-calc)
    html += `<tr>`;
    PA_STATE.speeds.forEach((spd, si) => {
        const flow = calcFlow(spd, lw, lh);
        html += `<th class="pa-flow-header"><span class="pa-flow-label">Flow</span> <span class="pa-flow-val" id="paFlowHeader_${si}">${flow}</span> <span class="pa-flow-unit">mm³/s</span></th>`;
    });
    html += `<th></th></tr></thead>`;

    // Body rows: one per accel
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

    // Add accel button
    html += `<button class="btn-secondary btn-small" style="margin-top:0.5rem" onclick="paAddAccel()">+ Accel Row</button>`;

    container.innerHTML = html;

    // Attach listeners
    container.querySelectorAll('.pa-speed-input').forEach(inp => inp.addEventListener('change', e => {
        PA_STATE.speeds[+e.target.dataset.si] = parseFloat(e.target.value) || 0;
        buildPaOutput();
        updateFlowHeaders();
    }));
    container.querySelectorAll('.pa-accel-input').forEach(inp => inp.addEventListener('change', e => {
        PA_STATE.accels[+e.target.dataset.ai] = parseFloat(e.target.value) || 0;
        buildPaOutput();
    }));
    container.querySelectorAll('.pa-val-input').forEach(inp => inp.addEventListener('input', e => {
        PA_STATE.pa[+e.target.dataset.ai][+e.target.dataset.si] = parseFloat(e.target.value) || 0;
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

    // Build all strings (no spaces, OrcaSlicer format)
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
    buildPaTable();
}

function paAddAccel() {
    const lastAccel = PA_STATE.accels[PA_STATE.accels.length - 1] || 7500;
    PA_STATE.accels.push(Math.round(lastAccel * 1.5 / 500) * 500);
    PA_STATE.pa.push(new Array(PA_STATE.speeds.length).fill(0.3));
    buildPaTable();
}

function paRemoveAccel(ai) {
    if (PA_STATE.accels.length <= 1) return;
    PA_STATE.accels.splice(ai, 1);
    PA_STATE.pa.splice(ai, 1);
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
    // Line width
    const lwInput = document.getElementById('paLineWidth');
    const lhInput = document.getElementById('paLayerHeight');
    if (lwInput) {
        lwInput.value = PA_STATE.lineWidth;
        lwInput.addEventListener('input', e => {
            PA_STATE.lineWidth = parseFloat(e.target.value) || 0.4;
            updateFlowHeaders();
            buildPaOutput();
        });
    }
    if (lhInput) {
        lhInput.value = PA_STATE.layerHeight;
        lhInput.addEventListener('input', e => {
            PA_STATE.layerHeight = parseFloat(e.target.value) || 0.2;
            updateFlowHeaders();
            buildPaOutput();
        });
    }
    buildPaTable();
}
