// ── State ─────────────────────────────────────────────────────────────────────
let currentBoard = null;
let parsedConfig = null;
let lastDetectionResults = null;
let currentIssues = [];

// ── Render functions ──────────────────────────────────────────────────────────
function renderDetectionDebug(results, selectedId) {
    const container = document.getElementById('detectionDebug');
    document.getElementById('detectionCard').style.display = 'block';
    container.innerHTML = results.slice(0, 5).map(r => {
        const isWinner = r.boardId === selectedId;
        return `<div class="detection-score ${isWinner ? 'winner' : ''}">
            <span class="board-name">${BOARDS[r.boardId].name}</span>
            <span class="score">${r.score.toFixed(1)}%</span>
        </div>`;
    }).join('');
}

function renderIncludes(includes) {
    const card = document.getElementById('includesCard');
    if (!includes.length) { card.style.display = 'none'; return; }
    card.style.display = 'block';
    document.getElementById('includesCount').textContent = includes.length;
    document.getElementById('includesList').innerHTML = includes.map(i => `<div class="include-item">${i}</div>`).join('');
}

function renderConflicts(conflicts) {
    const card = document.getElementById('conflictsCard');
    if (!conflicts.length) { card.style.display = 'none'; return; }
    card.style.display = 'block';
    document.getElementById('conflictsCount').textContent = conflicts.length;
    document.getElementById('conflictsList').innerHTML = conflicts.map(c => `
        <div class="conflict-item">
            <div class="conflict-pin">${c.pin}</div>
            <div class="conflict-uses">Used by: ${c.uses.map(u => `${u.section} (${u.function})`).join(', ')}</div>
        </div>`).join('');
}

function renderBoardViz(board, slotMap, issues, externalMotors) {
    const issueSlots = new Set(issues.filter(i => i.type === 'mismatch').map(i => i.slot));
    const checkPin = (configPin, expectedPin) => configPin ? (normalizePin(expectedPin) === configPin ? 'ok' : 'warn') : '';

    let html = `<div class="board-outline"><div class="board-label">${board.name} · ${board.mcu}</div><div class="driver-slots">`;

    for (let i = 0; i < board.driverCount; i++) {
        const slot = board.drivers[i];
        const motor = slotMap[i];
        const hasIssue = issueSlots.has(slot.id);

        const displayStep = motor ? motor.stepPinRaw : slot.step;
        const displayDir  = motor ? motor.dirPinRaw  : slot.dir;
        const displayEn   = motor ? motor.enablePinRaw : slot.enable;
        const displayCs   = motor?.driverConfig ? (motor.driverConfig.csPinRaw || motor.driverConfig.uartPinRaw) : (slot.cs || slot.uart);

        const currentHtml = motor?.driverConfig?.runCurrent
            ? `<span class="slot-current ${MAX_CURRENT[motor.driver] && motor.driverConfig.runCurrent > MAX_CURRENT[motor.driver] * 0.9 ? 'high' : ''}">${motor.driverConfig.runCurrent}A</span>` : '';
        const motorInfoHtml = motor?.autotuneMotor ? `<div class="slot-motor-info" title="${motor.autotuneMotor}">${motor.autotuneMotor}</div>` : '';

        html += `<div class="driver-slot ${motor ? 'active' : ''} ${hasIssue ? 'has-issue' : ''}">
            <div class="slot-header">
                <span class="slot-id">${slot.id}</span>
                ${motor?.driver ? `<span class="slot-driver">${motor.driver}</span>` : ''}
                ${currentHtml}
            </div>
            <div class="slot-motor ${motor ? '' : 'empty'}">${motor ? capitalizeMotorName(motor.name) : 'Empty'}</div>
            ${motorInfoHtml}
            <div class="slot-pins">
                <div class="pin-item"><span class="pin-label">STEP</span><span class="pin-value">${displayStep}</span>${motor ? `<span class="pin-status ${checkPin(motor.stepPin, slot.step)}"></span>` : ''}</div>
                <div class="pin-item"><span class="pin-label">DIR</span><span class="pin-value">${displayDir}</span>${motor ? `<span class="pin-status ${checkPin(motor.dirPin, slot.dir)}"></span>` : ''}</div>
                <div class="pin-item"><span class="pin-label">EN</span><span class="pin-value">${displayEn}</span>${motor ? `<span class="pin-status ${checkPin(motor.enablePin, slot.enable)}"></span>` : ''}</div>
                <div class="pin-item"><span class="pin-label">${slot.cs ? 'CS' : 'UART'}</span><span class="pin-value">${displayCs}</span>${motor?.driverConfig ? `<span class="pin-status ${checkPin(motor.driverConfig.csPin || motor.driverConfig.uartPin, slot.cs || slot.uart)}"></span>` : ''}</div>
            </div>
        </div>`;
    }
    html += '</div>';

    if (externalMotors.length > 0) {
        const mcuGroups = {};
        for (const motor of externalMotors) {
            if (!mcuGroups[motor.mcuName]) mcuGroups[motor.mcuName] = [];
            mcuGroups[motor.mcuName].push(motor);
        }
        for (const [mcuName, mcuMotors] of Object.entries(mcuGroups)) {
            html += `<div class="mcu-section"><div class="mcu-section-label">${mcuName}</div><div class="external-motors">`;
            for (const motor of mcuMotors) {
                const currHtml = motor.driverConfig?.runCurrent ? `<span class="slot-current">${motor.driverConfig.runCurrent}A</span>` : '';
                const infoHtml = motor.autotuneMotor ? `<div class="slot-motor-info">${motor.autotuneMotor}</div>` : '';
                html += `<div class="driver-slot active external-mcu">
                    <div class="slot-header"><span class="slot-id">EXT</span>${motor.driver ? `<span class="slot-driver">${motor.driver}</span>` : ''}${currHtml}</div>
                    <div class="slot-motor">${capitalizeMotorName(motor.name)}</div>${infoHtml}
                    <div class="slot-pins">
                        <div class="pin-item"><span class="pin-label">STEP</span><span class="pin-value">${motor.stepPinRaw}</span></div>
                        <div class="pin-item"><span class="pin-label">DIR</span><span class="pin-value">${motor.dirPinRaw}</span></div>
                    </div>
                </div>`;
            }
            html += '</div></div>';
        }
    }
    html += '</div>';
    document.getElementById('boardViz').innerHTML = html;
}

function renderIssues(issues, board) {
    const issuesCard = document.getElementById('issuesCard');
    const issuesList = document.getElementById('issuesList');
    currentIssues = issues;

    issuesCard.style.display = 'block';
    document.getElementById('issueCount').textContent = issues.length || '';

    const hasFixes = issues.some(i => i.fix);
    document.getElementById('exportSection').style.display = hasFixes ? 'block' : 'none';

    if (!issues.length) {
        issuesList.innerHTML = `<div class="no-issues">All pins match ${board.name}</div>`;
        return;
    }

    issuesList.innerHTML = issues.map(issue => {
        const cls = issue.type === 'mismatch' ? '' : (issue.type === 'info' ? 'info' : 'warning');
        if (issue.fix) return `<div class="issue-item ${cls}">
            <div class="issue-header"><div>
                <div class="issue-title">${issue.motor} → ${issue.slot}: ${issue.pin}</div>
                <div class="issue-detail">Expected ${issue.expected}, found ${issue.found}</div>
            </div></div>
            <div class="issue-fix"><code>${issue.fix}</code><button class="btn-small btn-copy" onclick="copyToClipboard('${issue.fix}', this)">Copy</button></div>
        </div>`;
        return `<div class="issue-item ${cls}">
            <div class="issue-title">${issue.motor}</div>
            <div class="issue-detail">${issue.message}</div>
        </div>`;
    }).join('');
}

function renderComparisonTable(board, motors, slotMap) {
    const container = document.getElementById('tableContainer');
    const mainMcuMotors = motors.filter(m => !m.isExternal);
    if (!mainMcuMotors.length) { container.innerHTML = `<div class="empty-state"><p>No motors on main MCU</p></div>`; return; }

    let html = `<table class="comparison-table"><thead><tr><th>Motor</th><th>Slot</th><th>Pin</th><th>Config</th><th>Board</th><th>Status</th></tr></thead><tbody>`;

    for (const motor of mainMcuMotors) {
        let matchedSlot = null;
        for (let i = 0; i < board.drivers.length; i++) {
            if (normalizePin(board.drivers[i].step) === motor.stepPin) { matchedSlot = board.drivers[i]; break; }
        }

        const pins = [
            { label: 'STEP',   config: motor.stepPinRaw,              configNorm: motor.stepPin,              expected: matchedSlot?.step },
            { label: 'DIR',    config: motor.dirPinRaw,               configNorm: motor.dirPin,               expected: matchedSlot?.dir },
            { label: 'EN',     config: motor.enablePinRaw,            configNorm: motor.enablePin,            expected: matchedSlot?.enable },
        ];
        if (motor.driverConfig.uartPin) pins.push({ label: 'UART', config: motor.driverConfig.uartPinRaw, configNorm: motor.driverConfig.uartPin, expected: matchedSlot?.uart });
        if (motor.driverConfig.csPin)   pins.push({ label: 'CS',   config: motor.driverConfig.csPinRaw,  configNorm: motor.driverConfig.csPin,  expected: matchedSlot?.cs });

        for (let i = 0; i < pins.length; i++) {
            const pin = pins[i];
            const isMatch = pin.expected && normalizePin(pin.expected) === pin.configNorm;
            html += `<tr class="${pin.expected && !isMatch ? 'mismatch-row' : ''}">
                ${i === 0 ? `<td rowspan="${pins.length}">${motor.name}</td><td rowspan="${pins.length}">${matchedSlot ? matchedSlot.id : '—'}</td>` : ''}
                <td><span class="pin-badge">${pin.label}</span></td>
                <td>${pin.config || '—'}</td>
                <td>${pin.expected || '—'}</td>
                <td>${pin.expected ? `<span class="status-chip ${isMatch ? 'match' : 'mismatch'}">${isMatch ? 'OK' : 'MISMATCH'}</span>` : '—'}</td>
            </tr>`;
        }
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

function updateStats(motors, slotMap, issues, externalMotors) {
    const statsCard = document.getElementById('statsCard');
    const axisCounts = { x: 0, y: 0, z: 0, e: 0 };
    motors.forEach(m => axisCounts[m.axis]++);
    const usedSlots = slotMap.filter(s => s !== null).length;
    const isAwd = axisCounts.x > 1 || axisCounts.y > 1;
    const errorCount = issues.filter(i => i.type === 'mismatch').length;
    const warnCount = issues.filter(i => i.type === 'warning').length;

    let html = `
        <div class="stat-chip"><span class="value">${motors.length}</span> motors</div>
        <div class="stat-chip"><span class="value">${usedSlots}/${currentBoard.driverCount}</span> slots</div>
        <div class="stat-chip"><span class="value">${axisCounts.x}</span> X</div>
        <div class="stat-chip"><span class="value">${axisCounts.y}</span> Y</div>
        <div class="stat-chip"><span class="value">${axisCounts.z}</span> Z</div>
        <div class="stat-chip"><span class="value">${axisCounts.e}</span> E</div>
        ${isAwd ? '<div class="stat-chip awd"><span class="value">AWD</span></div>' : ''}
        ${externalMotors.length ? `<div class="stat-chip"><span class="value">${externalMotors.length}</span> external</div>` : ''}
        ${errorCount > 0 ? `<div class="stat-chip"><span class="value" style="color:var(--error)">${errorCount}</span> errors</div>` : ''}
        ${warnCount > 0 ? `<div class="stat-chip"><span class="value" style="color:var(--warning)">${warnCount}</span> warnings</div>` : ''}
        ${errorCount === 0 && warnCount === 0 ? '<div class="stat-chip"><span class="value" style="color:var(--success)">0</span> issues</div>' : ''}`;

    document.getElementById('statsRow').innerHTML = html;

    // Endstops
    let endstopHtml = '';
    for (const motor of motors) {
        if (motor.axis === 'e') continue;
        const endstop = getEndstopType(motor.endstopPin);
        if (endstop.type === 'none' && motor.num) continue;
        endstopHtml += `<div class="endstop-item"><span class="motor">${capitalizeMotorName(motor.name)}</span><span class="type ${endstop.type}">${endstop.label}</span></div>`;
    }

    const endstopLabel = document.getElementById('endstopLabel');
    const endstopList = document.getElementById('endstopList');
    endstopLabel.style.display = endstopHtml ? 'block' : 'none';
    endstopList.style.display = endstopHtml ? 'flex' : 'none';
    endstopList.innerHTML = endstopHtml;
    statsCard.style.display = 'block';
}

// ── Actions ───────────────────────────────────────────────────────────────────
function parseConfig() {
    const text = document.getElementById('configInput').value;
    if (!text.trim()) return;

    const sections = parseKlipperConfig(text);
    const motors = extractMotors(sections);
    const includes = extractIncludes(text);
    const conflicts = detectPinConflicts(sections);

    if (!motors.length) { alert('No stepper motors found.'); return; }

    const boardSelect = document.getElementById('boardSelect');
    let boardId = boardSelect.value;

    if (boardId === 'auto') {
        const detection = detectBoard(sections);
        if (detection.boardId && detection.confidence > 0.2) {
            boardId = detection.boardId;
            boardSelect.value = boardId;
            const badge = document.getElementById('detectedBadge');
            badge.style.display = 'inline-flex';
            badge.className = `detected-badge ${detection.clearWinner ? '' : 'low-confidence'}`;
            document.getElementById('detectedText').textContent = BOARDS[boardId].name.split(' ').slice(-2).join(' ');
            renderDetectionDebug(detection.results, boardId);
        } else {
            alert('Could not detect board. Please select manually.');
            if (detection.results) renderDetectionDebug(detection.results, null);
            return;
        }
    } else {
        document.getElementById('detectionCard').style.display = 'none';
    }

    currentBoard = BOARDS[boardId];
    parsedConfig = { sections, motors, includes, conflicts };

    const { slotMap, issues, externalMotors } = mapMotorsToSlots(motors, currentBoard);

    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('boardViz').style.display = 'block';
    document.getElementById('vizTitle').textContent = currentBoard.name;

    renderIncludes(includes);
    renderConflicts(conflicts);
    renderBoardViz(currentBoard, slotMap, issues, externalMotors);
    renderIssues(issues, currentBoard);
    renderComparisonTable(currentBoard, motors, slotMap);
    updateStats(motors, slotMap, issues, externalMotors);
}

function onBoardChange() {
    document.getElementById('detectedBadge').style.display = 'none';
    document.getElementById('detectionCard').style.display = 'none';

    if (parsedConfig && document.getElementById('boardSelect').value !== 'auto') {
        currentBoard = BOARDS[document.getElementById('boardSelect').value];
        const { slotMap, issues, externalMotors } = mapMotorsToSlots(parsedConfig.motors, currentBoard);
        document.getElementById('vizTitle').textContent = currentBoard.name;
        renderBoardViz(currentBoard, slotMap, issues, externalMotors);
        renderIssues(issues, currentBoard);
        renderComparisonTable(currentBoard, parsedConfig.motors, slotMap);
        updateStats(parsedConfig.motors, slotMap, issues, externalMotors);
    }
}

function toggleExport() {
    const textarea = document.getElementById('exportTextarea');
    if (textarea.style.display === 'none') {
        textarea.value = currentIssues.filter(i => i.fix).map(i => `# ${i.motor} [${i.slot}]\n${i.fix}`).join('\n\n');
        textarea.style.display = 'block';
    } else {
        textarea.style.display = 'none';
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tabId + 'Tab').classList.add('active');
}

function clearAll() {
    document.getElementById('configInput').value = '';
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('boardViz').style.display = 'none';
    ['statsCard','issuesCard','detectionCard','includesCard','conflictsCard'].forEach(id => document.getElementById(id).style.display = 'none');
    document.getElementById('boardSelect').value = 'auto';
    document.getElementById('detectedBadge').style.display = 'none';
    document.getElementById('tableContainer').innerHTML = `<div class="empty-state"><p>No data</p></div>`;
    document.getElementById('exportTextarea').style.display = 'none';
    currentBoard = null; parsedConfig = null; lastDetectionResults = null; currentIssues = [];
}
