/**
 * Dyau.ai — Tokenization demo: REST API console (tokenize / detokenize through the gateway)
 * Depends on js/tk-client.js (window.TkClient); optionally reads window.TkMedallion samples.
 */
(function () {
  'use strict';

  const C = window.TkClient;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Synthetic values in the PoC's shapes, and tokens produced by the PoC run (from its test queries)
  const SAMPLES = {
    customer_id:    { raw: ['7100000192', '7100000010'], poc: ['8130093563', '8136515831'] },
    national_id:    { raw: ['991234567', '997654321'], poc: [] },
    account_number: { raw: ['901319886542', '901863955037'], poc: ['860202738761', '507172782050'] },
    card_pan:       { raw: ['9178395884394249', '9270902535800099'], poc: ['9178395438324249', '9270907190970099'] }
  };

  const st = { op: 'tokenize', field: 'card_pan', engine: 'auto', history: [], last: null, busy: false };

  function render() {
    $('#tab-api').innerHTML = `
      <div class="tk-intro">
        <span class="section-tag">REST API · Secure gateway</span>
        <h3>Call the token service yourself: tokenize, then detokenize</h3>
        <p>Every request goes from your browser to Dyau.ai's gateway, which checks your session, applies the field policy and quotas, and forwards it to the token service. The service's address and identities never reach the browser.</p>
      </div>

      <div class="api-path" aria-label="Request path">
        <div class="api-hop"><span class="api-hop-ico">💻</span><strong>Your browser</strong><small>Signed-in session</small></div>
        <div class="api-arrow"><span>HTTPS</span></div>
        <div class="api-hop is-gw"><span class="api-hop-ico">🛡️</span><strong>Dyau.ai gateway</strong><small>Session · field policy · quotas · audit</small></div>
        <div class="api-arrow"><span>private</span></div>
        <div class="api-hop is-svc"><span class="api-hop-ico">🔑</span><strong>Token service</strong><small>Address never exposed</small></div>
      </div>

      <div class="tk-grid-2">
        <section class="tk-card" aria-labelledby="api-req-title">
          <div class="tk-card-head"><h4 id="api-req-title">Request</h4><span class="tk-chip" id="api-endpoint">POST /api/tokenize</span></div>
          <div class="api-form">
            <div class="filter-field-box">
              <label>Operation</label>
              <div class="sim-toggle-btn-group api-ops" role="radiogroup" aria-label="Operation">
                <button class="sim-toggle-btn active" data-op="tokenize" role="radio" aria-checked="true">Tokenize</button>
                <button class="sim-toggle-btn" data-op="detokenize" role="radio" aria-checked="false">Detokenize</button>
              </div>
            </div>
            <div class="api-form-row">
              <div class="filter-field-box">
                <label for="api-field">Field</label>
                <select id="api-field" class="filter-select">${Object.entries(C.FIELDS).map(([k, f]) => `<option value="${k}" ${k === st.field ? 'selected' : ''}>${f.label}</option>`).join('')}</select>
              </div>
              <div class="filter-field-box">
                <label for="api-engine">Engine</label>
                <select id="api-engine" class="filter-select">
                  <option value="auto">Live, with fallback</option>
                  <option value="live">Live only</option>
                  <option value="browser">In-browser only</option>
                </select>
              </div>
            </div>
            <div class="filter-field-box">
              <label for="api-values">Values <span class="tk-muted">(one per line, up to 100)</span></label>
              <textarea id="api-values" class="tk-textarea api-values" spellcheck="false" autocomplete="off"></textarea>
            </div>
            <div class="tk-samples" id="api-samples"></div>
            <div id="api-validate" class="tk-error" hidden></div>
            <button id="api-send" class="btn btn-proceed api-send"><span class="auth-btn-label">Send request</span><span class="auth-spinner" aria-hidden="true"></span></button>
          </div>
          <div class="tk-subhead">Request body</div>
          <pre id="api-req-preview" class="payload-json-box tk-pre tk-pre-sm"></pre>
        </section>

        <section class="tk-card" aria-labelledby="api-res-title" aria-live="polite">
          <div class="tk-card-head"><h4 id="api-res-title">Response</h4><span class="tk-chip" id="api-res-chip">No request yet</span></div>
          <div id="api-res-empty" class="api-empty">
            <span aria-hidden="true">⚡</span>
            <p>Pick a field, load a sample and send. Then press <strong>Detokenize these</strong> to reverse the tokens you just made.</p>
          </div>
          <div id="api-res" hidden>
            <div class="med-stat-row api-stats" id="api-stats"></div>
            <div class="tk-table-wrap"><table class="master-table tk-table tk-table-compact"><thead><tr><th>#</th><th>Input</th><th>Output</th><th>Check</th></tr></thead><tbody id="api-res-rows"></tbody></table></div>
            <div class="tk-row api-res-actions">
              <button id="api-swap" class="btn btn-primary tk-btn-sm">Detokenize these →</button>
              <button id="api-copy" class="btn btn-outline tk-btn-sm">Copy output</button>
            </div>
            <details class="api-raw"><summary>Raw JSON response</summary><pre id="api-res-json" class="output-code-container tk-pre tk-pre-sm"></pre></details>
          </div>
        </section>
      </div>

      <section class="tk-card" style="margin-top:24px" aria-labelledby="api-hist-title">
        <div class="tk-card-head"><div><h4 id="api-hist-title">Call history (this session)</h4><p class="tk-muted">The gateway writes an audit line for each call: who, field, count, decision. Values are never logged.</p></div><span class="tk-chip" id="api-quota">Quota: —</span></div>
        <div class="tk-table-wrap"><table class="master-table tk-table tk-table-compact"><thead><tr><th>Time</th><th>Operation</th><th>Field</th><th>Values</th><th>Engine</th><th>Decision</th><th>Request ID</th></tr></thead><tbody id="api-hist"><tr><td colspan="7" class="tk-muted">No calls yet.</td></tr></tbody></table></div>
      </section>`;

    $$('.api-ops [data-op]').forEach((b) => b.addEventListener('click', () => setOp(b.dataset.op)));
    $('#api-field').addEventListener('change', (e) => { st.field = e.target.value; renderSamples(); loadSample('raw'); });
    $('#api-engine').addEventListener('change', (e) => { st.engine = e.target.value; });
    $('#api-values').addEventListener('input', preview);
    $('#api-samples').addEventListener('click', (e) => { const b = e.target.closest('[data-sample]'); if (b) loadSample(b.dataset.sample); });
    $('#api-send').addEventListener('click', send);
    $('#api-swap').addEventListener('click', swap);
    $('#api-copy').addEventListener('click', () => {
      const out = (st.last && st.last.values || []).filter((v) => v != null).join('\n');
      if (navigator.clipboard) navigator.clipboard.writeText(out).catch(() => {});
    });
    renderSamples();
    loadSample('raw');
  }

  function setOp(op) {
    st.op = op;
    $$('.api-ops [data-op]').forEach((b) => { const on = b.dataset.op === op; b.classList.toggle('active', on); b.setAttribute('aria-checked', on); });
    $('#api-endpoint').textContent = `POST /api/${op}`;
    renderSamples();
    preview();
  }

  function renderSamples() {
    const s = SAMPLES[st.field];
    const pipe = window.TkMedallion && window.TkMedallion.samples();
    const chips = [];
    if (st.op === 'tokenize') {
      chips.push(['raw', 'PoC sample values']);
      if (pipe) chips.push(['pipe-raw', 'From my pipeline run']);
    } else {
      if (st.last && st.last.op === 'tokenize' && st.last.field === st.field) chips.push(['last', 'Tokens I just made']);
      if (pipe) chips.push(['pipe-tok', `Tokens from my pipeline${pipe.engine === 'browser' ? ' (fallback)' : ''}`]);
      if (s.poc.length) chips.push(['poc', 'Tokens from the bank PoC run']);
    }
    $('#api-samples').innerHTML = chips.length ? `<span class="tk-muted">Load:</span>${chips.map(([k, l]) => `<button class="tk-sample" data-sample="${k}">${l}</button>`).join('')}` : '';
  }

  function loadSample(kind) {
    const s = SAMPLES[st.field];
    const pipe = window.TkMedallion && window.TkMedallion.samples();
    let vals = [];
    if (kind === 'raw') vals = s.raw;
    if (kind === 'poc') vals = s.poc;
    if (kind === 'last' && st.last) vals = st.last.values.filter(Boolean);
    if (kind === 'pipe-raw' && pipe) vals = pipe[st.field].raw;
    if (kind === 'pipe-tok' && pipe) vals = pipe.tokens[st.field];
    $('#api-values').value = vals.join('\n');
    preview();
  }

  function parseValues() {
    const f = C.FIELDS[st.field];
    const lines = $('#api-values').value.split('\n').map((l) => l.trim()).filter(Boolean);
    const values = lines.map((l) => l.replace(/[\s-]/g, ''));
    const bad = values.map((v, i) => [v, i]).filter(([v]) => !new RegExp(`^\\d{${f.min},${f.max}}$`).test(v));
    return { values, bad, f };
  }

  function preview() {
    const { values } = parseValues();
    $('#api-req-preview').textContent = JSON.stringify({ field: st.field, values: values.slice(0, 100) }, null, 2);
  }

  async function send() {
    if (st.busy) return;
    const { values, bad, f } = parseValues();
    const v = $('#api-validate');
    if (!values.length) { v.hidden = false; v.textContent = 'Add at least one value.'; return; }
    if (values.length > 100) { v.hidden = false; v.textContent = 'The console sends up to 100 values at a time.'; return; }
    if (bad.length) { v.hidden = false; v.textContent = `Line ${bad[0][1] + 1}: ${f.label} must be ${f.min}–${f.max} digits.`; return; }
    v.hidden = true;
    const btn = $('#api-send');
    st.busy = true; btn.disabled = true; $('.auth-spinner', btn).classList.add('is-on');
    const started = performance.now();
    try {
      const res = await C.call(st.op, st.field, values, { engine: st.engine });
      st.last = { op: st.op, field: st.field, inputs: values, ...res, rtt: performance.now() - started };
      showResult();
      addHistory(st.last);
    } catch (e) {
      $('#api-res-empty').hidden = true;
      $('#api-res').hidden = true;
      $('#api-res-chip').className = 'tk-chip tk-chip-warn';
      $('#api-res-chip').textContent = `HTTP ${e.status || '—'} · ${e.code}`;
      v.hidden = false; v.textContent = e.message;
      addHistory({ op: st.op, field: st.field, inputs: values, engine: '—', decision: e.code, request_id: '' });
    } finally {
      st.busy = false; btn.disabled = false; $('.auth-spinner', btn).classList.remove('is-on');
      renderSamples();
    }
  }

  function showResult() {
    const r = st.last;
    $('#api-res-empty').hidden = true;
    $('#api-res').hidden = false;
    const live = r.engine === 'tokcore';
    $('#api-res-chip').className = 'tk-chip ' + (live ? 'tk-chip-ok' : 'tk-chip-warn');
    $('#api-res-chip').textContent = live ? 'HTTP 200 · live service' : 'Fallback · in-browser engine';
    $('#api-stats').innerHTML = `
      <div><span>Engine</span><strong>${live ? 'Live REST' : 'Browser'}</strong></div>
      <div><span>Round trip</span><strong>${Math.round(r.rtt)} ms</strong></div>
      <div><span>Decision</span><strong>${esc(r.decision || '—')}</strong></div>
      <div><span>Request ID</span><strong class="api-rid" title="${esc(r.request_id)}">${esc(r.request_id || '—')}</strong></div>`;
    const pan = st.field === 'card_pan';
    $('#api-res-rows').innerHTML = r.inputs.map((inp, i) => {
      const out = r.values[i];
      let check = '';
      if (out == null) check = '<span class="tk-bad">Not reversible here</span>';
      else if (r.op === 'tokenize') {
        const keep = pan && inp.length === 16 ? (inp.slice(0, 6) === out.slice(0, 6) && inp.slice(-4) === out.slice(-4)) : null;
        check = `<span class="tk-ok">${out.length === inp.length ? '✓ same length' : 'length ' + out.length}</span>${keep === null ? '' : keep ? ' · <span class="tk-ok">BIN + last 4 kept</span>' : ''}`;
      } else {
        check = `<span class="tk-dec tk-dec-${r.decision === 'clear' ? 'clear' : r.decision === 'mask' ? 'mask' : 'token'}">${esc(r.decision || 'clear')}</span>`;
      }
      return `<tr><td>${i + 1}</td><td><code class="${r.op === 'tokenize' ? 'med-pii' : 'tk-token'}">${esc(inp)}</code></td><td>${out == null ? '<span class="tk-muted">null</span>' : `<code class="${r.op === 'tokenize' ? 'tk-token' : 'med-pii'}">${esc(out)}</code>`}</td><td>${check}</td></tr>`;
    }).join('');
    const body = { values: r.values, decision: r.decision, request_id: r.request_id, engine: r.engine };
    if (r.fallbackReason) body.fallback_reason = r.fallbackReason;
    $('#api-res-json').textContent = JSON.stringify(body, null, 2);
    $('#api-swap').hidden = r.op !== 'tokenize' || r.values.some((x) => x == null);
    if (r.op === 'detokenize' && r.decision === 'unknown_offline') {
      $('#api-validate').hidden = false;
      $('#api-validate').textContent = 'The live service is unavailable, and the in-browser engine can only reverse tokens it made in this tab.';
    }
    const q = C.status().quota;
    if (q) $('#api-quota').textContent = `Hourly quota: ${q.used.toLocaleString()} / ${q.limit.toLocaleString()} values`;
  }

  function swap() {
    if (!st.last) return;
    $('#api-values').value = st.last.values.join('\n');
    setOp('detokenize');
    send();
  }

  function addHistory(r) {
    st.history.unshift({ t: new Date().toLocaleTimeString(), ...r });
    $('#api-hist').innerHTML = st.history.slice(0, 25).map((h) => `<tr><td>${h.t}</td><td>${h.op}</td><td>${C.FIELDS[h.field].label}</td><td>${h.inputs.length}</td><td>${h.engine === 'tokcore' ? '<span class="tk-ok">Live</span>' : h.engine === 'browser' ? '<span class="tk-warn">Browser</span>' : '—'}</td><td>${esc(h.decision || '—')}</td><td><code class="api-rid">${esc(h.request_id || '—')}</code></td></tr>`).join('');
  }

  document.addEventListener('tk:pipeline', () => { if ($('#api-samples')) renderSamples(); });
  render();
})();
