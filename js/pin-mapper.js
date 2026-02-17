// ── Utilities ────────────────────────────────────────────────────────────────
function normalizePin(pin) {
    if (!pin) return null;
    return pin.replace(/^[!^]+/, '').replace(/[!^]+$/, '').trim().toUpperCase().replace(/[._]/g, '');
}

function getModifiers(pin) {
    if (!pin) return '';
    let mods = '';
    if (pin.includes('!')) mods += '!';
    if (pin.includes('^')) mods += '^';
    return mods;
}

function formatPinWithMods(pin) {
    if (!pin) return null;
    return getModifiers(pin) + normalizePin(pin);
}

function isExternalMcu(pin) { return pin ? pin.includes(':') : false; }
function getMcuName(pin) { return (pin && pin.includes(':')) ? pin.split(':')[0].trim() : 'mcu'; }

// ── Config parsing ────────────────────────────────────────────────────────────
function parseKlipperConfig(text) {
    const sections = {};
    const lines = text.split('\n');
    let currentSection = null, currentSectionName = null;

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        const sectionMatch = line.match(/^\[([^\]]+)\]/);
        if (sectionMatch) {
            currentSectionName = sectionMatch[1].trim();
            sections[currentSectionName] = {};
            currentSection = sections[currentSectionName];
            continue;
        }
        if (currentSection && line.includes(':')) {
            const idx = line.indexOf(':');
            const key = line.substring(0, idx).trim();
            let value = line.substring(idx + 1).trim();
            const commentIdx = value.indexOf('#');
            if (commentIdx > -1) value = value.substring(0, commentIdx).trim();
            currentSection[key] = value;
        }
    }
    return sections;
}

function extractPinInfo(sections) {
    const info = { stepPins: new Set(), dirPins: new Set(), enablePins: new Set(), uartPins: new Set(), csPins: new Set(), allPins: new Set(), stepDirCombos: [] };

    for (const [name, cfg] of Object.entries(sections)) {
        if (!name.includes('stepper') && !name.includes('tmc') && !name.includes('extruder')) continue;
        const stepPin = normalizePin(cfg.step_pin), dirPin = normalizePin(cfg.dir_pin);
        const enablePin = normalizePin(cfg.enable_pin), uartPin = normalizePin(cfg.uart_pin), csPin = normalizePin(cfg.cs_pin);

        if (stepPin && !isExternalMcu(cfg.step_pin)) { info.stepPins.add(stepPin); info.allPins.add(stepPin); }
        if (dirPin && !isExternalMcu(cfg.dir_pin)) { info.dirPins.add(dirPin); info.allPins.add(dirPin); }
        if (enablePin && !isExternalMcu(cfg.enable_pin)) { info.enablePins.add(enablePin); info.allPins.add(enablePin); }
        if (uartPin && !isExternalMcu(cfg.uart_pin)) { info.uartPins.add(uartPin); info.allPins.add(uartPin); }
        if (csPin && !isExternalMcu(cfg.cs_pin)) { info.csPins.add(csPin); info.allPins.add(csPin); }
        if (stepPin && dirPin && !isExternalMcu(cfg.step_pin)) info.stepDirCombos.push({ step: stepPin, dir: dirPin });
    }
    return info;
}

function extractAutotuneInfo(sections) {
    const autotune = {};
    for (const [name, cfg] of Object.entries(sections)) {
        const match = name.match(/^autotune_tmc\s+(.+)$/);
        if (match) autotune[match[1]] = { motor: cfg.motor || null, tuningGoal: cfg.tuning_goal || null };
    }
    return autotune;
}

function extractSpiInfo(sections) {
    const spiPins = {};
    for (const [name, cfg] of Object.entries(sections)) {
        if (name.startsWith('tmc')) {
            const { spi_software_sclk_pin: sclk, spi_software_mosi_pin: mosi, spi_software_miso_pin: miso } = cfg;
            if (sclk || mosi || miso) spiPins[name] = { sclk, mosi, miso };
        }
    }
    return spiPins;
}

function extractIncludes(text) {
    const includes = [];
    for (const line of text.split('\n')) {
        const t = line.trim();
        if (t.startsWith('[include ') && t.endsWith(']')) includes.push(t.slice(9, -1).trim());
    }
    return includes;
}

function detectPinConflicts(sections) {
    const pinUsage = {};
    const pinKeys = ['step_pin','dir_pin','enable_pin','uart_pin','cs_pin','endstop_pin','heater_pin','sensor_pin','fan_pin','pin','pwm_pin','tach_pin','diag_pin','diag0_pin','diag1_pin','spi_software_sclk_pin','spi_software_mosi_pin','spi_software_miso_pin','tx_pin','rx_pin','scl_pin','sda_pin','shutdown_pin'];

    for (const [sectionName, cfg] of Object.entries(sections)) {
        for (const [key, value] of Object.entries(cfg)) {
            if (!pinKeys.includes(key) || !value) continue;
            if (value.includes('virtual_endstop') || value.includes('probe:')) continue;
            const pin = normalizePin(value);
            if (!pin || isExternalMcu(value)) continue;
            if (!pinUsage[pin]) pinUsage[pin] = [];
            pinUsage[pin].push({ section: sectionName, function: key, raw: value });
        }
    }

    const conflicts = [];
    for (const [pin, uses] of Object.entries(pinUsage)) {
        if (uses.length <= 1) continue;
        const spiPins = ['spi_software_sclk_pin','spi_software_mosi_pin','spi_software_miso_pin'];
        if (uses.every(u => spiPins.includes(u.function))) continue;
        const uartCsPins = ['uart_pin','cs_pin'];
        if (uses.length === 2 && uses[0].section === uses[1].section && uartCsPins.includes(uses[0].function) && uartCsPins.includes(uses[1].function)) continue;
        conflicts.push({ pin, uses });
    }
    return conflicts;
}

function detectBoard(sections) {
    const pinInfo = extractPinInfo(sections);
    const results = [];

    let octopusProVersion = null;
    if (pinInfo.enablePins.has('PA2') && !pinInfo.enablePins.has('PA0')) octopusProVersion = 'v1.1';
    else if (pinInfo.enablePins.has('PA0') && !pinInfo.enablePins.has('PA2')) octopusProVersion = 'v1.0';

    for (const [boardId, board] of Object.entries(BOARDS)) {
        let score = 0, maxScore = 0;

        if (octopusProVersion) {
            if (boardId === 'octopus_pro_v1.0' && octopusProVersion === 'v1.1') { results.push({ boardId, score: 0, maxScore: 100, excluded: true }); continue; }
            if (boardId === 'octopus_pro_v1.1' && octopusProVersion === 'v1.0') { results.push({ boardId, score: 0, maxScore: 100, excluded: true }); continue; }
        }

        if (board.excludePins) {
            if (board.excludePins.some(p => pinInfo.stepPins.has(normalizePin(p)))) { results.push({ boardId, score: 0, maxScore: 100, excluded: true }); continue; }
        }

        if (board.uniqueIdentifiers) {
            const matches = board.uniqueIdentifiers.filter(p => pinInfo.stepPins.has(normalizePin(p))).length;
            score += (matches / board.uniqueIdentifiers.length) * 40; maxScore += 40;
        }

        if (board.requiredCombos) {
            const matches = board.requiredCombos.filter(combo =>
                pinInfo.stepDirCombos.some(c => c.step === normalizePin(combo.step) && c.dir === normalizePin(combo.dir))
            ).length;
            score += (matches / board.requiredCombos.length) * 35; maxScore += 35;
        }

        const sigMatches = board.signaturePins.filter(p => pinInfo.stepPins.has(normalizePin(p))).length;
        score += (sigMatches / board.signaturePins.length) * 25; maxScore += 25;

        let totalDriverPins = 0, matchedDriverPins = 0;
        for (const driver of board.drivers) {
            if (pinInfo.stepPins.has(normalizePin(driver.step))) {
                totalDriverPins++; matchedDriverPins++;
                if (pinInfo.dirPins.has(normalizePin(driver.dir))) { matchedDriverPins += 0.5; totalDriverPins += 0.5; }
            }
        }
        if (totalDriverPins > 0) { score += (matchedDriverPins / totalDriverPins) * 20; maxScore += 20; }

        results.push({ boardId, score: maxScore > 0 ? (score / maxScore) * 100 : 0, maxScore: 100 });
    }

    results.sort((a, b) => b.score - a.score);
    const best = results[0], secondBest = results[1];
    const clearWinner = best.score > 30 && (!secondBest || best.score - secondBest.score > 10);
    return { boardId: best.score > 20 ? best.boardId : null, confidence: best.score / 100, clearWinner, results };
}

function extractMotors(sections) {
    const motors = [];
    const autotune = extractAutotuneInfo(sections);
    const spiInfo = extractSpiInfo(sections);

    for (const [name, cfg] of Object.entries(sections)) {
        const stepperMatch = name.match(/^stepper_([xyz])(\d*)$/) || name.match(/^(extruder)(\d*)$/);
        if (!stepperMatch) continue;

        let axis = stepperMatch[1], num = stepperMatch[2] || '';
        if (axis === 'extruder') axis = 'e';

        const isExternal = isExternalMcu(cfg.step_pin);
        const motor = {
            name, axis, num,
            stepPin: normalizePin(cfg.step_pin), dirPin: normalizePin(cfg.dir_pin), enablePin: normalizePin(cfg.enable_pin),
            stepPinRaw: formatPinWithMods(cfg.step_pin), dirPinRaw: formatPinWithMods(cfg.dir_pin), enablePinRaw: formatPinWithMods(cfg.enable_pin),
            endstopPin: cfg.endstop_pin || null,
            isExternal, mcuName: getMcuName(cfg.step_pin),
            driver: null, driverConfig: {},
            autotuneMotor: autotune[name]?.motor || null,
            autotuneTuning: autotune[name]?.tuningGoal || null,
        };

        for (const [drvName, drvCfg] of Object.entries(sections)) {
            if (drvName.match(/^tmc\d+/) && drvName.includes(name)) {
                motor.driver = drvName.split(' ')[0].toUpperCase();
                motor.driverConfig = {
                    uartPin: normalizePin(drvCfg.uart_pin), csPin: normalizePin(drvCfg.cs_pin),
                    uartPinRaw: formatPinWithMods(drvCfg.uart_pin), csPinRaw: formatPinWithMods(drvCfg.cs_pin),
                    runCurrent: parseFloat(drvCfg.run_current) || null,
                    senseResistor: parseFloat(drvCfg.sense_resistor) || null,
                    spiPins: spiInfo[drvName] || null,
                };
                break;
            }
        }
        motors.push(motor);
    }
    return motors;
}

function mapMotorsToSlots(motors, board) {
    const slotMap = new Array(board.driverCount).fill(null);
    const issues = [], externalMotors = [];

    for (const motor of motors) {
        if (motor.isExternal) { externalMotors.push(motor); continue; }

        let matched = false;
        for (let i = 0; i < board.drivers.length; i++) {
            const slot = board.drivers[i];
            if (normalizePin(slot.step) !== motor.stepPin) continue;
            slotMap[i] = motor;
            matched = true;

            if (motor.dirPin && normalizePin(slot.dir) !== motor.dirPin)
                issues.push({ type: 'mismatch', motor: motor.name, slot: slot.id, pin: 'dir_pin', expected: slot.dir, found: motor.dirPinRaw, fix: `dir_pin: ${slot.dir}` });
            if (motor.enablePin && normalizePin(slot.enable) !== motor.enablePin)
                issues.push({ type: 'mismatch', motor: motor.name, slot: slot.id, pin: 'enable_pin', expected: slot.enable, found: motor.enablePinRaw, fix: `enable_pin: !${slot.enable}` });
            if (motor.driverConfig.uartPin && slot.uart && normalizePin(slot.uart) !== motor.driverConfig.uartPin)
                issues.push({ type: 'mismatch', motor: motor.name, slot: slot.id, pin: 'uart_pin', expected: slot.uart, found: motor.driverConfig.uartPinRaw, fix: `uart_pin: ${slot.uart}` });
            if (motor.driverConfig.csPin && slot.cs && normalizePin(slot.cs) !== motor.driverConfig.csPin)
                issues.push({ type: 'mismatch', motor: motor.name, slot: slot.id, pin: 'cs_pin', expected: slot.cs, found: motor.driverConfig.csPinRaw, fix: `cs_pin: ${slot.cs}` });

            if (motor.driver && motor.driverConfig.senseResistor) {
                const expected = SENSE_RESISTORS[motor.driver];
                if (expected && Math.abs(motor.driverConfig.senseResistor - expected) > 0.01)
                    issues.push({ type: 'warning', motor: motor.name, message: `Sense resistor ${motor.driverConfig.senseResistor}Ω unusual for ${motor.driver} (typical: ${expected}Ω)` });
            }
            if (motor.driver && motor.driverConfig.runCurrent) {
                const maxCurrent = MAX_CURRENT[motor.driver];
                if (maxCurrent && motor.driverConfig.runCurrent > maxCurrent)
                    issues.push({ type: 'warning', motor: motor.name, message: `Run current ${motor.driverConfig.runCurrent}A exceeds ${motor.driver} max (${maxCurrent}A)` });
            }
            if (motor.driver) {
                const usesUart = ['TMC2209','TMC2208','TMC2225','TMC2226'].includes(motor.driver);
                const usesSpi  = ['TMC5160','TMC5161','TMC2130','TMC2160'].includes(motor.driver);
                if (usesUart && motor.driverConfig.csPin && !motor.driverConfig.uartPin)
                    issues.push({ type: 'warning', motor: motor.name, message: `${motor.driver} uses UART, but cs_pin found instead of uart_pin` });
                if (usesSpi && motor.driverConfig.uartPin && !motor.driverConfig.csPin)
                    issues.push({ type: 'warning', motor: motor.name, message: `${motor.driver} uses SPI, but uart_pin found instead of cs_pin` });
            }
            break;
        }

        if (!matched)
            issues.push({ type: 'warning', motor: motor.name, pin: 'step_pin', found: motor.stepPinRaw, message: `Step pin ${motor.stepPinRaw} doesn't match any driver slot` });
    }

    // SPI bus consistency
    const spiConfigs = motors.filter(m => m.driverConfig.spiPins).map(m => ({ motor: m.name, ...m.driverConfig.spiPins }));
    if (spiConfigs.length > 1) {
        const first = spiConfigs[0];
        for (let i = 1; i < spiConfigs.length; i++) {
            const curr = spiConfigs[i];
            if (curr.sclk !== first.sclk || curr.mosi !== first.mosi || curr.miso !== first.miso) {
                issues.push({ type: 'info', motor: curr.motor, message: `SPI pins differ from ${first.motor} - verify this is intentional` });
                break;
            }
        }
    }
    return { slotMap, issues, externalMotors };
}

function capitalizeMotorName(name) {
    return name.split('_').map((part, i) => i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part.toUpperCase()).join(' ');
}

function getEndstopType(pin) {
    if (!pin) return { type: 'none', label: 'None' };
    if (pin.includes('virtual_endstop')) return { type: 'sensorless', label: 'Sensorless' };
    if (pin.includes('probe:')) return { type: 'probe', label: 'Probe' };
    return { type: 'physical', label: formatPinWithMods(pin) };
}

function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied');
        btn.textContent = 'Copied';
        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = 'Copy'; }, 1500);
    });
}
