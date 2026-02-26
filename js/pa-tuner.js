/* PA Tuner — Kalico nonlinear pressure advance fitter
   Created by Shoeys · Excit3D Community
   ─────────────────────────────────────────────────── */

// ── Constants ─────────────────────────────────────────────────────────────────
const FILAMENT_AREA = Math.PI / 4 * 1.75 * 1.75;

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  tab: 'calc',
  inputMode: 'triplets',
  analyzeMode: 'compare',
  results: null,
  calcAnalysis: null,
  apiKey: '',
  seqSessions: [],
  seqImages: [],       // { url, base64, mediaType }[]
  cmpImages: { recipr: [], tanh: [] },
  cmpAnalysis: null,
};

// ── Storage ───────────────────────────────────────────────────────────────────
function storageGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Math ──────────────────────────────────────────────────────────────────────
function reciprAdvance(v, la, offset, vLin) {
  if (!vLin || vLin <= 0) return la * v;
  return la * v + offset * (1 - 1 / (1 + v / vLin));
}

function tanhAdvance(v, la, offset, vLin) {
  if (!vLin || vLin <= 0) return la * v;
  return la * v + offset * Math.tanh(v / vLin);
}

function levenbergMarquardt(fn, p0, xs, ys) {
  let p = [...p0];
  let lam = 0.01;
  const N = xs.length, M = p.length;
  const res = pp => xs.map((x, i) => ys[i] - fn(x, ...pp));
  const sse = pp => res(pp).reduce((s, r) => s + r * r, 0);

  for (let iter = 0; iter < 2000; iter++) {
    const r = res(p);
    const h = 1e-7;
    const J = Array.from({ length: M }, (_, j) => {
      const pp = [...p]; pp[j] += h;
      return res(pp).map((v, i) => (v - r[i]) / h);
    });
    const JtJ = Array.from({ length: M }, (_, i) =>
      Array.from({ length: M }, (_, j) => J[i].reduce((s, _, k) => s + J[i][k] * J[j][k], 0))
    );
    const Jtr = Array.from({ length: M }, (_, i) => J[i].reduce((s, v, k) => s + v * r[k], 0));
    const A = JtJ.map((row, i) => row.map((v, j) => i === j ? v * (1 + lam) : v));
    const aug = A.map((row, i) => [...row, Jtr[i]]);

    for (let i = 0; i < M; i++) {
      let max = i;
      for (let k = i + 1; k < M; k++) if (Math.abs(aug[k][i]) > Math.abs(aug[max][i])) max = k;
      [aug[i], aug[max]] = [aug[max], aug[i]];
      for (let k = i + 1; k < M; k++) {
        const f = aug[k][i] / aug[i][i];
        for (let j = i; j <= M; j++) aug[k][j] -= f * aug[i][j];
      }
    }

    const dp = new Array(M).fill(0);
    for (let i = M - 1; i >= 0; i--) {
      dp[i] = aug[i][M];
      for (let j = i + 1; j < M; j++) dp[i] -= aug[i][j] * dp[j];
      dp[i] /= aug[i][i];
    }

    const pNew = p.map((v, i) => v + dp[i]);
    if (sse(pNew) < sse(p)) { p = pNew; lam /= 10; } else { lam *= 10; }
    if (dp.reduce((s, d) => s + d * d, 0) < 1e-12) break;
  }

  const r = res(p);
  const mean = ys.reduce((a, b) => a + b, 0) / N;
  const ssTot = ys.reduce((s, y) => s + (y - mean) ** 2, 0);
  const r2 = 1 - r.reduce((s, v) => s + v * v, 0) / ssTot;
  return { la: p[0], offset: p[1], vLin: p[2], r2 };
}

function parseTriplets(text) {
  const pts = [];
  text.trim().split('\n').forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('//')) return;
    const parts = t.split(',').map(s => parseFloat(s.trim()));
    if (parts.length >= 2 && !parts.some(isNaN) && parts[0] > 0 && parts[1] > 0) {
      const fv = parts[1] / FILAMENT_AREA;
      pts.push({ fv, adv: parts[0] * fv });
    }
  });
  const buckets = {};
  pts.forEach(p => {
    const k = Math.round(p.fv * 2) / 2;
    if (!buckets[k] || p.adv > buckets[k].adv) buckets[k] = p;
  });
  return Object.values(buckets).sort((a, b) => a.fv - b.fv);
}

function fitModels(pts) {
  const xs = pts.map(p => p.fv);
  const ys = pts.map(p => p.adv);
  const recipr = levenbergMarquardt((v, la, off, vl) => reciprAdvance(v, la, off, vl), [0.003, 0.2, 10], xs, ys);
  const tanh   = levenbergMarquardt((v, la, off, vl) => tanhAdvance(v, la, off, vl),   [0.003, 0.15, 10], xs, ys);
  return { recipr, tanh };
}

// ── Claude API ────────────────────────────────────────────────────────────────
async function callClaude(messages, system, maxTokens = 1000) {
  if (!state.apiKey) throw new Error('NO_KEY');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': state.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.content?.map(b => b.text || '').join('') || 'No response.';
}

// ── DOM helpers ───────────────────────────────────────────────────────────────
const el = id => document.getElementById(id);
const show = id => { el(id).style.display = ''; };
const hide = id => { el(id).style.display = 'none'; };

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function setAnalysisBlock(id, text) {
  const div = el(id);
  if (!text) { div.style.display = 'none'; return; }
  div.innerHTML = text.split('\n\n').filter(Boolean)
    .map(p => `<p>${escHtml(p)}</p>`).join('');
  div.style.display = '';
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(tabId) {
  state.tab = tabId;
  document.querySelectorAll('.pat-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tabId)
  );
  document.querySelectorAll('.pat-panel').forEach(p =>
    p.classList.toggle('active', p.id === 'panel-' + tabId)
  );
}

// ── Input / analyze mode toggles ──────────────────────────────────────────────
function setInputMode(mode) {
  state.inputMode = mode;
  el('modeTripletsBtn').classList.toggle('active', mode === 'triplets');
  el('modeSingleBtn').classList.toggle('active', mode === 'single');
  el('inputTriplets').style.display  = mode === 'triplets' ? '' : 'none';
  el('inputSingle').style.display    = mode === 'single'   ? '' : 'none';
  storageSet('pat:inputMode', mode);
}

function setAnalyzeMode(mode) {
  state.analyzeMode = mode;
  el('analyzeCmpBtn').classList.toggle('active', mode === 'compare');
  el('analyzeSeqBtn').classList.toggle('active', mode === 'seq');
  el('panelCompare').style.display = mode === 'compare' ? '' : 'none';
  el('panelSeq').style.display     = mode === 'seq'     ? '' : 'none';
  storageSet('pat:analyzeMode', mode);
}

// ── Config helpers ─────────────────────────────────────────────────────────────
function readConfig() {
  return {
    extruder:    el('cfgExtruder').value,
    nozzle:      el('cfgNozzle').value,
    layerHeight: el('cfgLayerHeight').value,
    lineWidth:   el('cfgLineWidth').value,
    outerSpeed:  el('cfgOuterSpeed').value,
    infillSpeed: el('cfgInfillSpeed').value,
    minAccel:    el('cfgMinAccel').value,
    maxAccel:    el('cfgMaxAccel').value,
  };
}

function applyConfig(cfg) {
  el('cfgExtruder').value    = cfg.extruder    || 'direct';
  el('cfgNozzle').value      = cfg.nozzle      || '0.4';
  el('cfgLayerHeight').value = cfg.layerHeight || '0.2';
  el('cfgLineWidth').value   = cfg.lineWidth   || '0.4';
  el('cfgOuterSpeed').value  = cfg.outerSpeed  || '150';
  el('cfgInfillSpeed').value = cfg.infillSpeed || '200';
  el('cfgMinAccel').value    = cfg.minAccel    || '3000';
  el('cfgMaxAccel').value    = cfg.maxAccel    || '10000';
}

function printerCtx() {
  const c = readConfig();
  return `${c.extruder} drive, ${c.nozzle}mm nozzle, ${c.layerHeight}mm layer, ` +
    `outer wall ${c.outerSpeed}mm/s, infill ${c.infillSpeed}mm/s, ` +
    `accel ${c.minAccel}–${c.maxAccel}mm/s²`;
}

function buildConfigStr(model, p) {
  return `pressure_advance_model: ${model === 'recipr' ? 'reciprocal' : 'tanh'}\n` +
    `linear_advance: ${p.la}\n` +
    `nonlinear_offset: ${p.offset}\n` +
    `linearization_velocity: ${p.vLin}\n` +
    `pressure_advance_smooth_time: 0.02`;
}

function paramsStr(p) {
  return `la=${p.la}, offset=${p.offset}, vLin=${p.vLin}` +
    (p.timeOffset ? `, t_off=${p.timeOffset}` : '');
}

// ── Render results ─────────────────────────────────────────────────────────────
function renderResults(r) {
  for (const model of ['recipr', 'tanh']) {
    const p = r[model];
    el(`res-${model}-la`).textContent     = p.la;
    el(`res-${model}-offset`).textContent = p.offset;
    el(`res-${model}-vlin`).textContent   = `${p.vLin} mm/s fil.`;
    el(`res-${model}-r2`).textContent     = `R² = ${p.r2.toFixed(4)}`;
    el(`res-${model}-cfg`).textContent    = buildConfigStr(model, p);
  }
  show('calcResults');
  updateSeqFillBtns();
  updateCmpParamsHint();
  renderSpeedTable();
  hide('tableEmpty');
  show('tableContent');
}

// ── Speed table ────────────────────────────────────────────────────────────────
function renderSpeedTable() {
  const r = state.results;
  if (!r) return;
  const c = readConfig();
  const lw = parseFloat(c.lineWidth);
  const lh = parseFloat(c.layerHeight);
  const rows = [10, 20, 50, 100, 150, 200, 300, 400, 500].map(th => {
    const fv = th * lw * lh / FILAMENT_AREA;
    const aR = reciprAdvance(fv, r.recipr.la, r.recipr.offset, r.recipr.vLin);
    const aT = tanhAdvance(fv,  r.tanh.la,   r.tanh.offset,   r.tanh.vLin);
    return { th, fv: fv.toFixed(2), paR: (aR / fv).toFixed(5), paT: (aT / fv).toFixed(5) };
  });
  el('speedTable').innerHTML =
    `<thead><tr>
      <th>Speed (mm/s)</th>
      <th>Fil. speed</th>
      <th class="col-recipr">PA Reciprocal</th>
      <th class="col-tanh">PA Tanh</th>
    </tr></thead>
    <tbody>${rows.map(row =>
      `<tr>
        <td>${row.th}</td>
        <td class="col-dim">${row.fv}</td>
        <td class="col-recipr">${row.paR}</td>
        <td class="col-tanh">${row.paT}</td>
      </tr>`
    ).join('')}</tbody>`;
}

// ── Calculate ──────────────────────────────────────────────────────────────────
async function handleCalc() {
  const cfg = readConfig();
  storageSet('pat:config', cfg);

  el('calcBtn').disabled = true;
  el('calcBtn').textContent = 'Calculating…';
  show('calcSpinner');
  hide('calcResults');

  try {
    const lw = parseFloat(cfg.lineWidth);
    const lh = parseFloat(cfg.layerHeight);
    let pts;

    if (state.inputMode === 'triplets') {
      const raw = el('paTripletsInput').value;
      storageSet('pat:triplets', raw);
      pts = parseTriplets(raw);
    } else {
      const pa = parseFloat(el('paSingleInput').value);
      storageSet('pat:singlePA', el('paSingleInput').value);
      pts = [20, 50, 100, 150, 200, 300].map(th => {
        const fv = (th * lw * lh) / FILAMENT_AREA;
        return { fv, adv: pa * fv };
      });
    }

    if (pts.length < 3) throw new Error('Need at least 3 data points.');

    const fits = fitModels(pts);
    const r = {
      recipr: {
        la:     Math.round(fits.recipr.la     * 10000) / 10000,
        offset: Math.round(fits.recipr.offset * 1000)  / 1000,
        vLin:   Math.round(fits.recipr.vLin   * 10)    / 10,
        r2:     fits.recipr.r2,
      },
      tanh: {
        la:     Math.round(fits.tanh.la     * 10000) / 10000,
        offset: Math.round(fits.tanh.offset * 1000)  / 1000,
        vLin:   Math.round(fits.tanh.vLin   * 10)    / 10,
        r2:     fits.tanh.r2,
      },
      pts,
    };

    state.results = r;
    renderResults(r);

    // Claude analysis
    const sys = 'You are an expert in Kalico 3D printer nonlinear pressure advance. Give concise, practical analysis in 2–3 short paragraphs. Plain text only, no markdown.';
    const msg = `Fitted nonlinear PA for: ${printerCtx()}. ` +
      `Reciprocal: la=${r.recipr.la}, offset=${r.recipr.offset}, vLin=${r.recipr.vLin}, R²=${r.recipr.r2.toFixed(4)}. ` +
      `Tanh: la=${r.tanh.la}, offset=${r.tanh.offset}, vLin=${r.tanh.vLin}, R²=${r.tanh.r2.toFixed(4)}. ` +
      'Explain what these mean, which model looks better and why, and what to watch for when testing.';

    setAnalysisBlock('calcAnalysis', null);
    try {
      const analysis = await callClaude([{ role: 'user', content: msg }], sys);
      state.calcAnalysis = analysis;
      setAnalysisBlock('calcAnalysis', analysis);
      storageSet('pat:results', { r, a: analysis });
    } catch (e) {
      storageSet('pat:results', { r, a: null });
      if (e.message === 'NO_KEY') {
        setAnalysisBlock('calcAnalysis', 'Add an Anthropic API key at the top of the page to enable AI analysis.');
        show('apiSetup');
      } else {
        setAnalysisBlock('calcAnalysis', 'AI analysis unavailable: ' + e.message);
      }
    }

  } catch (e) {
    alert('Error: ' + e.message);
  }

  el('calcBtn').disabled = false;
  el('calcBtn').textContent = 'Calculate';
  hide('calcSpinner');
}

// ── Copy config ────────────────────────────────────────────────────────────────
function copyConfig(model) {
  if (!state.results) return;
  const text = buildConfigStr(model, state.results[model]);
  navigator.clipboard.writeText(text).catch(() => {});
  const btnId = model === 'recipr' ? 'copyReciprBtn' : 'copyTanhBtn';
  const btn = el(btnId);
  const orig = btn.textContent;
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
}

// ── Image upload ───────────────────────────────────────────────────────────────
const ZONE_IDS = { recipr: 'zoneRecipr', tanh: 'zoneTanh', seq: 'zoneSeq' };

function loadFiles(files, zone) {
  Array.from(files).filter(f => f.type.startsWith('image/')).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target.result;
      const entry = { url, base64: url.split(',')[1], mediaType: file.type };
      if (zone === 'seq') {
        state.seqImages.push(entry);
      } else {
        state.cmpImages[zone].push(entry);
      }
      renderThumbs(zone);
    };
    reader.readAsDataURL(file);
  });
}

function onDragOver(e, zone) {
  e.preventDefault();
  el(ZONE_IDS[zone]).classList.add('drag-over');
}
function onDragLeave(zone) {
  el(ZONE_IDS[zone]).classList.remove('drag-over');
}
function onDrop(e, zone) {
  e.preventDefault();
  onDragLeave(zone);
  loadFiles(e.dataTransfer.files, zone);
}

function removeImage(zone, idx) {
  if (zone === 'seq') {
    state.seqImages.splice(idx, 1);
  } else {
    state.cmpImages[zone].splice(idx, 1);
  }
  renderThumbs(zone);
}

function renderThumbs(zone) {
  const images = zone === 'seq' ? state.seqImages : state.cmpImages[zone];
  const thumbIds = { recipr: 'thumbsRecipr', tanh: 'thumbsTanh', seq: 'thumbsSeq' };
  el(thumbIds[zone]).innerHTML = images.map((img, i) =>
    `<div class="pat-img-thumb">
      <img src="${img.url}" alt="">
      <button class="pat-img-remove" onclick="removeImage('${zone}',${i})" title="Remove">&times;</button>
    </div>`
  ).join('');
  if (zone === 'seq') {
    el('seqClearPhotosBtn').style.display = images.length ? '' : 'none';
  }
}

function clearSeqPhotos() {
  state.seqImages = [];
  renderThumbs('seq');
}

// ── Sequential tuning ─────────────────────────────────────────────────────────
function updateSeqCubeLabel() {
  const n = state.seqSessions.length;
  el('seqCubeLabel').textContent = n === 0 ? 'First Cube' : `Cube ${n + 1}`;
  el('seqBtn').textContent = n === 0 ? 'Analyze First Cube' : 'Analyze and Continue';
}

function updateSeqFillBtns() {
  el('seqFillBtns').style.display = state.results ? '' : 'none';
}

function fillSeqFromCalc(model) {
  if (!state.results) return;
  const p = state.results[model];
  el('seqModel').value  = model;
  el('seqLa').value     = p.la;
  el('seqOffset').value = p.offset;
  el('seqVlin').value   = p.vLin;
}

async function handleSeqAnalyze() {
  const la    = el('seqLa').value.trim();
  const offset = el('seqOffset').value.trim();
  const vlin  = el('seqVlin').value.trim();
  const timeOffset = el('seqTimeOffset').value.trim();
  const model = el('seqModel').value;

  if (!la || !offset || !vlin) { alert('Fill in la, offset, and vLin first.'); return; }
  if (!state.seqImages.length) { alert('Upload at least one photo first.'); return; }
  if (!state.apiKey) { show('apiSetup'); alert('Add an Anthropic API key first.'); return; }

  el('seqBtn').disabled = true;
  el('seqBtn').textContent = 'Analyzing…';
  show('seqSpinner');

  const params = { model, la, offset, vLin: vlin, timeOffset };
  const label  = `Cube ${state.seqSessions.length + 1}`;
  const sys = 'You are an expert in Kalico nonlinear pressure advance tuning guiding iterative single-model tuning. ' +
    'For each cube: describe what you see (seam, corners, surface), diagnose root cause, give exact adjusted parameter values. ' +
    '3–4 short paragraphs, plain text only.';

  const messages = [];
  for (const s of state.seqSessions) {
    const imgs = s.imagesRaw || [];
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: `${s.label}: ${s.model} model, ${paramsStr(s.params)}. Printer: ${printerCtx()}.` },
        ...imgs.map(img => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } })),
      ],
    });
    messages.push({ role: 'assistant', content: s.analysis });
  }

  const isFirst = state.seqSessions.length === 0;
  messages.push({
    role: 'user',
    content: [
      { type: 'text', text: `${label}: ${model} model, ${paramsStr(params)}. Printer: ${printerCtx()}. ` +
        (isFirst ? 'Analyze and recommend adjustments.' : 'Analyze and recommend further adjustments or confirm if dialed in.') },
      ...state.seqImages.map(img => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } })),
    ],
  });

  try {
    const analysis = await callClaude(messages, sys, 1500);
    state.seqSessions.push({
      id: Date.now(), label, model, params,
      images:     state.seqImages.map(i => ({ url: i.url })),
      imagesRaw:  state.seqImages.map(i => ({ url: i.url, base64: i.base64, mediaType: i.mediaType })),
      analysis,
    });
    saveSeqSessions();
    clearSeqPhotos();
    el('seqLa').value = '';
    el('seqOffset').value = '';
    el('seqVlin').value = '';
    el('seqTimeOffset').value = '';
    renderSeqHistory();
    updateSeqCubeLabel();
  } catch (e) {
    alert('Error: ' + e.message);
  }

  el('seqBtn').disabled = false;
  updateSeqCubeLabel();
  hide('seqSpinner');
}

function saveSeqSessions() {
  // Don't persist raw image data — only URLs + text
  const storable = state.seqSessions.map(({ imagesRaw, ...rest }) => rest);
  storageSet('pat:seq', storable);
}

function renderSeqHistory() {
  const container = el('seqHistory');
  if (!state.seqSessions.length) {
    container.innerHTML = '';
    hide('seqClearRow');
    return;
  }
  show('seqClearRow');
  container.innerHTML = `
    <div class="card" style="margin-bottom:1rem;">
      <div class="card-header">
        <span class="card-title">Tuning History (${state.seqSessions.length} cube${state.seqSessions.length !== 1 ? 's' : ''})</span>
      </div>
      <div class="card-body">
        ${state.seqSessions.map(s => `
          <div class="pat-seq-session model-${s.model}">
            <div class="pat-seq-header">${escHtml(s.label)} &mdash; ${s.model} &mdash; ${escHtml(paramsStr(s.params))}</div>
            ${s.images && s.images.length ? `
              <div class="pat-img-grid" style="margin-bottom:0.5rem;">
                ${s.images.map(img => `<div class="pat-img-thumb"><img src="${img.url}" alt=""></div>`).join('')}
              </div>` : ''}
            <div class="pat-seq-text">
              ${s.analysis.split('\n\n').filter(Boolean).map(p => `<p>${escHtml(p)}</p>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function clearSeqHistory() {
  if (!confirm('Clear all tuning history?')) return;
  state.seqSessions = [];
  saveSeqSessions();
  renderSeqHistory();
  updateSeqCubeLabel();
}

// ── Model comparison ───────────────────────────────────────────────────────────
function updateCmpParamsHint() {
  const r = state.results;
  const hint = el('cmpParamsHint');
  if (!r) { hint.style.display = 'none'; return; }
  hint.textContent =
    `Reciprocal: la=${r.recipr.la}  offset=${r.recipr.offset}  vLin=${r.recipr.vLin}` +
    `  —  Tanh: la=${r.tanh.la}  offset=${r.tanh.offset}  vLin=${r.tanh.vLin}`;
  hint.style.display = '';
}

async function handleCmpAnalyze() {
  if (!state.cmpImages.recipr.length && !state.cmpImages.tanh.length) return;
  if (!state.apiKey) { show('apiSetup'); alert('Add an Anthropic API key first.'); return; }

  el('cmpBtn').disabled = true;
  el('cmpBtn').textContent = 'Analyzing…';
  show('cmpSpinner');
  setAnalysisBlock('cmpAnalysis', null);

  const sys = 'You are an expert in Kalico nonlinear PA tuning. Compare reciprocal and tanh model test cubes side by side. ' +
    'Give a clear, decisive recommendation on which model suits this machine and why. 4 short paragraphs, plain text only.';
  const r = state.results;
  const rP = r ? `Reciprocal: la=${r.recipr.la}, offset=${r.recipr.offset}, vLin=${r.recipr.vLin}` : 'Reciprocal: parameters not calculated';
  const tP = r ? `Tanh: la=${r.tanh.la}, offset=${r.tanh.offset}, vLin=${r.tanh.vLin}` : 'Tanh: parameters not calculated';

  const content = [{ type: 'text', text: `Model comparison for: ${printerCtx()}. ${rP}. ${tP}.` }];
  if (state.cmpImages.recipr.length) {
    content.push({ type: 'text', text: 'RECIPROCAL MODEL:' });
    state.cmpImages.recipr.forEach(img =>
      content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } })
    );
  }
  if (state.cmpImages.tanh.length) {
    content.push({ type: 'text', text: 'TANH MODEL:' });
    state.cmpImages.tanh.forEach(img =>
      content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } })
    );
  }

  try {
    const analysis = await callClaude([{ role: 'user', content }], sys);
    state.cmpAnalysis = analysis;
    setAnalysisBlock('cmpAnalysis', analysis);
  } catch (e) {
    setAnalysisBlock('cmpAnalysis', 'Error: ' + e.message);
  }

  el('cmpBtn').disabled = false;
  el('cmpBtn').textContent = 'Compare Models';
  hide('cmpSpinner');
}

function clearComparison() {
  state.cmpImages = { recipr: [], tanh: [] };
  state.cmpAnalysis = null;
  renderThumbs('recipr');
  renderThumbs('tanh');
  setAnalysisBlock('cmpAnalysis', null);
}

// ── API key ────────────────────────────────────────────────────────────────────
function saveApiKey() {
  const key = el('apiKeyInput').value.trim();
  if (!key) return;
  state.apiKey = key;
  storageSet('pat:apiKey', key);
  hide('apiSetup');
  el('apiKeyInput').value = '';
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Restore config
  const cfg = storageGet('pat:config');
  if (cfg) applyConfig(cfg);

  // Restore inputs
  const triplets = storageGet('pat:triplets');
  if (triplets) el('paTripletsInput').value = triplets;
  const singlePA = storageGet('pat:singlePA');
  if (singlePA) el('paSingleInput').value = singlePA;

  // Restore modes
  const inputMode = storageGet('pat:inputMode');
  if (inputMode) setInputMode(inputMode);
  const analyzeMode = storageGet('pat:analyzeMode');
  if (analyzeMode) setAnalyzeMode(analyzeMode);

  // Restore results
  const saved = storageGet('pat:results');
  if (saved && saved.r) {
    state.results = saved.r;
    state.calcAnalysis = saved.a;
    renderResults(saved.r);
    setAnalysisBlock('calcAnalysis', saved.a);
  }

  // Restore seq sessions (no raw images after reload)
  const seq = storageGet('pat:seq');
  if (seq && seq.length) {
    state.seqSessions = seq;
    renderSeqHistory();
    updateSeqCubeLabel();
  }

  // Restore API key
  const key = storageGet('pat:apiKey');
  if (key) {
    state.apiKey = key;
  } else {
    show('apiSetup');
  }

  updateSeqFillBtns();
  updateCmpParamsHint();

  // Auto-save config on change
  ['cfgExtruder','cfgNozzle','cfgLayerHeight','cfgLineWidth',
   'cfgOuterSpeed','cfgInfillSpeed','cfgMinAccel','cfgMaxAccel'].forEach(id => {
    el(id).addEventListener('change', () => storageSet('pat:config', readConfig()));
  });
});
