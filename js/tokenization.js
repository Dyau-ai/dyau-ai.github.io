/**
 * Dyau.ai — Vaultless Data Tokenization: interactive demo controller
 * Runs entirely client-side on synthetic data. No network requests are made.
 * Depends on js/fpe-engine.js (window.DyauFPE).
 */
(function () {
  'use strict';

  const E = window.DyauFPE;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => (window.performance ? performance.now() : Date.now());
  const fmtInt = (n) => n.toLocaleString('en-US');

  // ==========================================================================
  // STATE
  // ==========================================================================
  const state = {
    region: 'my',
    keys: {},          // kv -> Uint8Array(32); lives only in this tab's memory
    kv: 1,
    store: null,       // tokenized tables (what the "lakehouse" holds)
    plain: null,       // synthetic originals, kept only to prove results match
    audit: [],
    role: 'fraud_ops',
    storeView: 'customers',
    busy: false
  };

  function newKeys() {
    state.keys = { 1: E.randomKey() };
    state.kv = 1;
  }
  const keyFingerprint = (kv) => (state.keys[kv] ? E.sha256Hex(state.keys[kv]).slice(0, 8) : '—');

  // ==========================================================================
  // FIELD DEFINITIONS (per region)
  // ==========================================================================
  const FIELD_ORDER = ['id', 'pan', 'acct', 'email', 'phone'];

  const FIELDS = {
    my: {
      id: { key: 'nric', label: 'MyKad / NRIC', kind: 'digits', domain: 'my-nric', sample: '900101-14-5678',
        pattern: /^\d{6}-?\d{2}-?\d{4}$/, patternHint: '12 digits, e.g. 900101-14-5678', domainText: '10<sup>12</sup>' },
      pan: { key: 'card_number', label: 'Card number', kind: 'pan', domain: 'pan', sample: '4111 1111 1111 1111', domainText: '10<sup>6</sup> (16-digit)' },
      acct: { key: 'bank_account', label: 'Bank account no.', kind: 'digits', domain: 'my-account', sample: '5642 1234 5678',
        pattern: /^[\d ]{10,19}$/, patternHint: '10–16 digits, e.g. 5642 1234 5678', domainText: '10<sup>12</sup>' },
      email: { key: 'email', label: 'Email', kind: 'email', domain: 'email', sample: 'aisyah.rahman@example.my', domainText: '36<sup>n</sup>, n ≥ 4' },
      phone: { key: 'mobile', label: 'Mobile', kind: 'digits', keepPrefix: 2, domain: 'my-phone', sample: '+60 12-345 6789',
        pattern: /^\+60[\d -]{9,13}$/, patternHint: 'Malaysian mobile, e.g. +60 12-345 6789', domainText: '10<sup>9</sup>' }
    },
    us: {
      id: { key: 'ssn', label: 'SSN', kind: 'digits', domain: 'us-ssn', sample: '123-45-6789',
        pattern: /^\d{3}-?\d{2}-?\d{4}$/, patternHint: '9 digits, e.g. 123-45-6789', domainText: '10<sup>9</sup>' },
      pan: { key: 'card_number', label: 'Card number', kind: 'pan', domain: 'pan', sample: '5555 5555 5555 4444', domainText: '10<sup>6</sup> (16-digit)' },
      acct: { key: 'member_id', label: 'Member ID', kind: 'alnumUpper', keepPrefix: 3, domain: 'us-member', sample: 'MBR-7Q4K2X9',
        pattern: /^MBR-[0-9A-Za-z]{7}$/, patternHint: 'MBR- followed by 7 letters/digits', domainText: '36<sup>7</sup>' },
      email: { key: 'email', label: 'Email', kind: 'email', domain: 'email', sample: 'emma.carter@example.com', domainText: '36<sup>n</sup>, n ≥ 4' },
      phone: { key: 'phone', label: 'Phone', kind: 'digits', keepPrefix: 1, domain: 'us-phone', sample: '+1 415-555-0132',
        pattern: /^\+1[\d -]{10,14}$/, patternHint: 'US number, e.g. +1 415-555-0132', domainText: '10<sup>10</sup>' }
    }
  };
  const F = () => FIELDS[state.region];

  class PolicyError extends Error {}

  function transform(def, value, kv, encrypt) {
    const key = state.keys[kv];
    if (!key) throw new PolicyError(`Key v${kv} has been destroyed; this token can no longer be reversed.`);
    const v = String(value).trim();
    if (!v) throw new PolicyError('Empty value');
    const tweak = `${def.domain}|v${kv}`;
    switch (def.kind) {
      case 'digits': {
        if (encrypt && def.pattern && !def.pattern.test(v)) throw new PolicyError(`Format check failed: expected ${def.patternHint}`);
        return E.fpTransform(key, E.ALPHABETS.digits, tweak, v, encrypt, def.keepPrefix || 0);
      }
      case 'alnumUpper': {
        const up = v.toUpperCase();
        if (encrypt && def.pattern && !def.pattern.test(up)) throw new PolicyError(`Format check failed: expected ${def.patternHint}`);
        return E.fpTransform(key, E.ALPHABETS.alnumUpper, tweak, up, encrypt, def.keepPrefix || 0);
      }
      case 'email': {
        const at = v.lastIndexOf('@');
        if (at < 1 || at === v.length - 1) throw new PolicyError('Format check failed: not an email address');
        const local = v.slice(0, at).toLowerCase();
        const domain = v.slice(at);
        const usable = Array.from(local).filter((c) => E.ALPHABETS.alnumLower.includes(c)).length;
        if (usable < 4) throw new E.DomainError(36, usable);
        return E.fpTransform(key, E.ALPHABETS.alnumLower, tweak, local, encrypt) + domain;
      }
      case 'pan':
        return E.panOp(key, tweak, v, encrypt).value;
      default:
        throw new PolicyError('Unknown field type');
    }
  }
  const tokenize = (def, v, kv = state.kv) => transform(def, v, kv, true);
  const detokenize = (def, v, kv) => transform(def, v, kv, false);

  function mask(def, token) {
    switch (def.kind) {
      case 'pan': {
        const digits = token.replace(/\D/g, '');
        const p = E.panProfile(digits.length) || { keepPrefix: 6, keepSuffix: 4 };
        let i = 0;
        return token.replace(/\d/g, (d) => {
          const keep = i < p.keepPrefix || i >= digits.length - p.keepSuffix;
          i++;
          return keep ? d : '•';
        });
      }
      case 'email': return '•••••' + token.slice(token.lastIndexOf('@'));
      case 'alnumUpper': return token.slice(0, 4) + '•'.repeat(Math.max(0, token.length - 4));
      default: {
        let i = 0;
        const keep = def.keepPrefix || 0;
        return token.replace(/\d/g, (d) => (i++ < keep ? d : '•'));
      }
    }
  }

  // ==========================================================================
  // SYNTHETIC DATA (seeded so each region always looks the same)
  // ==========================================================================
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const digitsN = (r, n) => Array.from({ length: n }, () => Math.floor(r() * 10)).join('');
  const pad2 = (n) => String(n).padStart(2, '0');

  function luhnComplete(prefixDigits) {
    for (let d = 0; d <= 9; d++) {
      const all = (prefixDigits + d).split('').map(Number);
      if (E.luhnValid(all)) return prefixDigits + d;
    }
    return prefixDigits + '0';
  }
  const group4 = (s) => s.replace(/(.{4})/g, '$1 ').trim();

  function genPan(r) {
    const bin = pick(r, ['411111', '555555', '400000', '520082']);
    return group4(luhnComplete(bin + digitsN(r, 9)));
  }

  const MY_NAMES = ['aisyah.rahman', 'weiling.tan', 'ravi.kumar', 'nurul.huda', 'jason.lim', 'meiling.ong', 'arjun.nair', 'farah.zainal', 'hafiz.ismail', 'siew.chen', 'priya.devi', 'daniel.wong', 'amirul.hakim', 'kavitha.raj'];
  const US_NAMES = ['emma.carter', 'liam.brooks', 'olivia.reed', 'noah.patel', 'ava.morgan', 'mason.lee', 'sofia.garcia', 'ethan.kim', 'mia.turner', 'lucas.price', 'chloe.diaz', 'owen.hughes', 'zoe.bennett', 'jack.rivera'];
  const SEGMENTS = ['Retail', 'Premier', 'SME', 'Private'];
  const MERCHANTS = {
    my: ['Kedai Runcit Maju', 'Petronas Station', 'Grab Malaysia', 'Mydin Mall', 'Shopee MY', 'Kopitiam Sentral', 'AirAsia Booking', 'Watsons Pavilion'],
    us: ['Corner Grocery', 'Shell Station', 'Rideshare Co.', 'Target Store', 'Online Marketplace', 'Coffee House', 'Airline Booking', 'Pharmacy Plus']
  };

  function genId(region, r) {
    if (region === 'my') {
      const yy = pad2(60 + Math.floor(r() * 40)), mm = pad2(1 + Math.floor(r() * 12)), dd = pad2(1 + Math.floor(r() * 28));
      return `${yy}${mm}${dd}-${pick(r, ['14', '10', '08', '01', '07', '12'])}-${digitsN(r, 4)}`;
    }
    const area = String(100 + Math.floor(r() * 565)).padStart(3, '0');
    return `${area}-${pad2(10 + Math.floor(r() * 89))}-${String(1000 + Math.floor(r() * 8999))}`;
  }

  function genCustomer(region, r, i) {
    const name = (region === 'my' ? MY_NAMES : US_NAMES)[i % 14];
    if (region === 'my') {
      return {
        id: genId('my', r), pan: genPan(r),
        acct: `${digitsN(r, 4)} ${digitsN(r, 4)} ${digitsN(r, 4)}`,
        email: `${name}@example.my`,
        phone: `+60 1${Math.floor(r() * 9) + 1}-${digitsN(r, 3)} ${digitsN(r, 4)}`
      };
    }
    const al = E.ALPHABETS.alnumUpper;
    return {
      id: genId('us', r), pan: genPan(r),
      acct: 'MBR-' + Array.from({ length: 7 }, () => al[Math.floor(r() * 36)]).join(''),
      email: `${name}@example.com`,
      phone: `+1 ${200 + Math.floor(r() * 700)}-555-${digitsN(r, 4)}`
    };
  }

  function buildStore() {
    const region = state.region;
    const r = rng(region === 'my' ? 20261029 : 19760704);
    const defs = F();
    const plainCustomers = [], customers = [];
    for (let i = 0; i < 12; i++) {
      const p = genCustomer(region, r, i);
      plainCustomers.push(p);
      const tok = {};
      FIELD_ORDER.forEach((f) => { tok[f] = tokenize(defs[f], p[f]); });
      customers.push({ customer_id: `CUST-${1001 + i}`, segment: pick(r, SEGMENTS), tok, kv: state.kv });
    }
    // Walk-in / non-customer payers: present in transactions, absent from customers
    const outsiders = Array.from({ length: 3 }, () => genId(region, r));
    const plainTxns = [], txns = [];
    for (let i = 0; i < 36; i++) {
      const external = r() < 0.12;
      const custIdx = external ? -1 : Math.floor(r() * 10); // customers 11–12 have no transactions
      const idPlain = external ? pick(r, outsiders) : plainCustomers[custIdx].id;
      plainTxns.push({ custIdx, idPlain });
      txns.push({
        txn_id: `TXN-${String(50001 + i)}`,
        id_tok: tokenize(defs.id, idPlain),
        amount: Math.round((12 + r() * 2400) * 100) / 100,
        merchant: pick(r, MERCHANTS[region]),
        date: `2026-10-${pad2(1 + Math.floor(r() * 28))}`,
        kv: state.kv
      });
    }
    state.store = { customers, txns };
    state.plain = { customers: plainCustomers, txns: plainTxns, outsiders };
  }

  // ==========================================================================
  // UI HELPERS
  // ==========================================================================
  function showToast(message) {
    const toast = $('#demo-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function highlightJSON(obj, tokenSet) {
    const json = esc(JSON.stringify(obj, null, 2));
    return json.replace(/(&quot;(?:\\.|(?!&quot;)[^\\])*&quot;)(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, (m, str, colon, kw) => {
      if (str) {
        if (colon) return `<span class="json-key">${str}</span>${colon}`;
        const raw = str.slice(6, -6);
        const cls = tokenSet && tokenSet.has(raw) ? 'json-str tk-hl' : 'json-str';
        return `<span class="${cls}">${str}</span>`;
      }
      if (kw) return `<span class="json-bool">${m}</span>`;
      return `<span class="json-num">${m}</span>`;
    });
  }

  const decisionBadge = (d) => `<span class="tk-dec tk-dec-${d}">${{ clear: 'Clear', mask: 'Masked', token: 'Token', deny: 'Denied', rotate: 'Rotated' }[d] || esc(d)}</span>`;
  const shortErr = (e) => (e && e.message ? e.message : String(e));

  // ==========================================================================
  // TAB 1: EDGE INTERCEPTION
  // ==========================================================================
  function samplePayload() {
    if (state.region === 'my') {
      return {
        request_id: 'req-7f3a91',
        channel: 'mobile_banking',
        customer: { full_name: 'Nur Aisyah Rahman', nric: '900101-14-5678', email: 'aisyah.rahman@example.my', mobile: '+60 12-345 6789', dob: '1990-01-01' },
        payment: { card_number: '4111 1111 1111 1111', cvv: '123', expiry: '12/28', amount_myr: 1250.0, merchant: 'Kedai Elektronik Sdn Bhd' },
        payout: { bank_account: '5642 1234 5678', bank: 'Example Bank Berhad' }
      };
    }
    return {
      request_id: 'req-2c8e40',
      channel: 'web_checkout',
      customer: { full_name: 'Emma Carter', ssn: '123-45-6789', email: 'emma.carter@example.com', phone: '+1 415-555-0132', dob: '1988-07-15' },
      payment: { card_number: '5555 5555 5555 4444', cvv: '737', expiry: '09/29', amount_usd: 318.4, merchant: 'Example Outdoor Co.' },
      loyalty: { member_id: 'MBR-7Q4K2X9', tier: 'Gold' }
    };
  }

  function edgeRules() {
    const d = F();
    const my = state.region === 'my';
    return [
      { path: 'customer.full_name', op: 'mask', note: 'Free text: masked at the edge' },
      { path: `customer.${d.id.key}`, op: 'tokenize', field: 'id' },
      { path: 'customer.email', op: 'tokenize', field: 'email' },
      { path: `customer.${d.phone.key}`, op: 'tokenize', field: 'phone' },
      { path: 'customer.dob', op: 'generalize', note: 'Kept as a valid date, year only' },
      { path: 'payment.card_number', op: 'tokenize', field: 'pan' },
      { path: 'payment.cvv', op: 'drop', note: 'Never stored after authorization' },
      { path: my ? 'payout.bank_account' : 'loyalty.member_id', op: 'tokenize', field: 'acct' }
    ];
  }

  const OP_LABEL = { tokenize: 'Tokenize', mask: 'Mask', drop: 'Drop', generalize: 'Generalize' };

  function renderRules() {
    const d = F();
    $('#edge-rules').innerHTML = edgeRules().map((r) => `
      <div class="tk-rule">
        <code>${esc(r.path)}</code>
        <span class="tk-op tk-op-${r.op}">${OP_LABEL[r.op]}</span>
        <span class="tk-rule-note">${r.field ? esc(d[r.field].label) + ' profile' : esc(r.note)}</span>
      </div>`).join('') + `<div class="tk-rule tk-rule-pass"><code>everything else</code><span class="tk-op tk-op-pass">Pass</span><span class="tk-rule-note">Amounts, merchant, IDs flow unchanged</span></div>`;
  }

  function loadSample() {
    $('#edge-input').value = JSON.stringify(samplePayload(), null, 2);
  }

  function resolve(obj, path) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur || typeof cur !== 'object') return null;
      cur = cur[parts[i]];
    }
    if (!cur || typeof cur !== 'object' || !(parts[parts.length - 1] in cur)) return null;
    return { parent: cur, key: parts[parts.length - 1] };
  }

  function setPipeline(stage, status) {
    const order = ['client', 'edge', 'engine', 'lake'];
    $$('.tk-node', $('#edge-pipeline')).forEach((n) => {
      const idx = order.indexOf(n.dataset.node);
      n.classList.remove('is-active', 'is-done', 'is-fail');
      if (stage === null) return;
      const sIdx = order.indexOf(stage);
      if (idx < sIdx) n.classList.add('is-done');
      else if (idx === sIdx) n.classList.add(status === 'fail' ? 'is-fail' : (status === 'done' ? 'is-done' : 'is-active'));
    });
  }

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  async function sendEdge() {
    if (state.busy) return;
    state.busy = true;
    const btn = $('#btn-edge-send');
    btn.disabled = true;
    $('#edge-result').hidden = true;

    const raw = $('#edge-input').value;
    const outage = $('#edge-outage').checked;
    const reqId = 'gw-' + Math.random().toString(16).slice(2, 8);

    setPipeline('client'); await wait(220);
    setPipeline('edge'); await wait(260);

    let body;
    try {
      body = JSON.parse(raw);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object');
    } catch (e) {
      setPipeline('edge', 'fail');
      finishEdge('rejected', '400 Bad Request — body is not valid JSON', 'The gateway refused the request before reading any field. Nothing was forwarded downstream.', 'Nothing forwarded', null, [], { request: reqId, status: 400 });
      return;
    }

    setPipeline('engine'); await wait(260);
    if (outage) {
      setPipeline('engine', 'fail');
      finishEdge('rejected', '503 Service Unavailable — failed closed', 'The token engine did not answer, so the gateway blocked the request instead of letting untokenized data through. The client can safely retry; no sensitive value reached any log, queue or table.', 'Nothing forwarded', null, [], { request: reqId, status: 503, reason: 'token_engine_unavailable' });
      return;
    }

    const d = F();
    const out = JSON.parse(JSON.stringify(body));
    const rows = [];
    const tokens = new Set();
    const t0 = now();
    let tokenizedCount = 0;
    for (const rule of edgeRules()) {
      const loc = resolve(out, rule.path);
      if (!loc) { rows.push({ path: rule.path, op: rule.op, result: '<span class="tk-muted">not in request</span>' }); continue; }
      const val = loc.parent[loc.key];
      if (val === null || val === undefined || typeof val === 'object') continue;
      const s = String(val);
      try {
        if (rule.op === 'tokenize') {
          const tok = tokenize(d[rule.field], s);
          loc.parent[loc.key] = tok; tokens.add(tok); tokenizedCount++;
          rows.push({ path: rule.path, op: 'tokenize', result: `<code class="tk-token">${esc(tok)}</code>` });
        } else if (rule.op === 'mask') {
          const m = s.split(/\s+/).map((w) => (w ? w[0] + '•••' : w)).join(' ');
          loc.parent[loc.key] = m; tokens.add(m);
          rows.push({ path: rule.path, op: 'mask', result: `<code>${esc(m)}</code>` });
        } else if (rule.op === 'drop') {
          delete loc.parent[loc.key];
          rows.push({ path: rule.path, op: 'drop', result: '<span class="tk-muted">removed from payload</span>' });
        } else if (rule.op === 'generalize') {
          const g = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.slice(0, 4) + '-01-01' : null;
          if (!g) throw new PolicyError('Format check failed: expected YYYY-MM-DD');
          loc.parent[loc.key] = g; tokens.add(g);
          rows.push({ path: rule.path, op: 'generalize', result: `<code>${esc(g)}</code>` });
        }
      } catch (e) {
        setPipeline('engine', 'fail');
        const why = e instanceof E.DomainError ? 'value too short to encrypt safely (below the NIST minimum domain)' : shortErr(e);
        finishEdge('rejected', `422 Unprocessable — ${rule.path} failed the field policy`, `Reason: ${esc(why)}. The whole request was rejected, so nothing was forwarded. The rejected value is never echoed back or logged.`, 'Nothing forwarded', null, [], { request: reqId, status: 422, field: rule.path });
        return;
      }
    }
    const elapsed = now() - t0;

    setPipeline('lake'); await wait(260);
    setPipeline('lake', 'done');
    const dropped = rows.filter((r) => r.op === 'drop' && !r.result.includes('not in request')).length;
    finishEdge('success', `200 Accepted — ${tokenizedCount} field${tokenizedCount === 1 ? '' : 's'} tokenized${dropped ? ', CVV dropped' : ''}`,
      'Plaintext existed only inside the gateway for a few milliseconds. Queues, logs, traces and the lakehouse receive the payload on the left. Formats are unchanged, so existing validations and schemas keep working.',
      'Tokens only', { out, tokens }, rows,
      { request: reqId, route: '/v1/payments', status: 200, tokenized_fields: rows.filter((r) => r.op === 'tokenize' && !r.result.includes('not in request')).map((r) => r.path), dropped_fields: rows.filter((r) => r.op === 'drop' && !r.result.includes('not in request')).map((r) => r.path), engine_ms: Number(elapsed.toFixed(2)) });
    $('#edge-timing').textContent = `${elapsed.toFixed(1)} ms in the token engine`;
  }

  function finishEdge(kind, title, text, chip, payload, rows, log) {
    const banner = $('#edge-banner');
    banner.className = 'outcome-detail-banner ' + (kind === 'success' ? 'res-success' : 'res-rejected');
    $('#edge-banner-title').textContent = title;
    $('#edge-banner-text').innerHTML = text;
    $('#edge-banner-chip').textContent = chip;
    const grid = $('#edge-output-grid');
    if (payload) {
      grid.hidden = false;
      $('#edge-output').innerHTML = highlightJSON(payload.out, payload.tokens);
      $('#edge-fields').innerHTML = rows.map((r) => `<tr><td><code>${esc(r.path)}</code></td><td><span class="tk-op tk-op-${r.op}">${OP_LABEL[r.op]}</span></td><td>${r.result}</td></tr>`).join('');
    } else {
      grid.hidden = true;
    }
    $('#edge-log').textContent = JSON.stringify(Object.assign({ ts: new Date().toISOString() }, log), null, 2);
    if (!payload) {
      // Still show the sanitized log line for failures
      grid.hidden = false;
      $('#edge-output').innerHTML = '<span class="tk-muted">— no payload was forwarded —</span>';
      $('#edge-fields').innerHTML = '<tr><td colspan="3" class="tk-muted">Request stopped at the gateway.</td></tr>';
      $('#edge-timing').textContent = 'Fail-closed';
    }
    $('#edge-result').hidden = false;
    $('#btn-edge-send').disabled = false;
    state.busy = false;
    $('#edge-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---------- Quick tokenizer ----------
  function renderQuickOptions() {
    const d = F();
    $('#quick-field').innerHTML = FIELD_ORDER.map((f) => `<option value="${f}">${esc(d[f].label)}</option>`).join('');
    $('#quick-value').value = d.id.sample;
    $('#quick-out').hidden = true;
  }

  function runQuick() {
    const d = F()[$('#quick-field').value];
    const v = $('#quick-value').value;
    const out = $('#quick-out');
    out.hidden = false;
    try {
      const t0 = now();
      const tok = tokenize(d, v);
      const t1 = now();
      const back = detokenize(d, tok, state.kv);
      const again = tokenize(d, v);
      const raw = v.trim();
      const expected = d.kind === 'email' ? raw.slice(0, raw.lastIndexOf('@')).toLowerCase() + raw.slice(raw.lastIndexOf('@')) : (d.kind === 'alnumUpper' ? raw.toUpperCase() : raw);
      const skeleton = (x) => x.replace(/[0-9A-Za-z]/g, '#');
      const sameShape = skeleton(tok) === skeleton(expected);
      out.innerHTML = `
        <div class="tk-quick-row"><span>Token</span><code class="tk-token tk-big">${esc(tok)}</code></div>
        <div class="tk-quick-checks">
          <span class="${back === expected ? 'tk-ok' : 'tk-bad'}">${back === expected ? '✓' : '✗'} Detokenizes back to <code>${esc(back)}</code></span>
          <span class="${again === tok ? 'tk-ok' : 'tk-bad'}">${again === tok ? '✓' : '✗'} Same input → same token (joinable)</span>
          <span class="${sameShape ? 'tk-ok' : 'tk-bad'}">${sameShape ? '✓' : '✗'} Length and separators preserved</span>
          <span class="tk-muted">${((t1 - t0) * 1000).toFixed(0)} µs · key v${state.kv}</span>
        </div>`;
    } catch (e) {
      const msg = e instanceof E.DomainError ? 'Refused: too few characters to encrypt safely (below the NIST minimum of one million possible values). In production this field would be masked instead.' : shortErr(e);
      out.innerHTML = `<div class="tk-error">⚠️ ${esc(msg)}</div>`;
    }
  }

  // ==========================================================================
  // TAB 2: ACCESS & AUDIT
  // ==========================================================================
  const ROLES = [
    { id: 'fraud_ops', name: 'Fraud Investigator', desc: 'Works flagged cases; may see clear-text with a reason', policy: { id: 'clear', pan: 'clear', acct: 'clear', email: 'clear', phone: 'clear' } },
    { id: 'customer_service', name: 'Customer Service', desc: 'Verifies callers; contact details only', policy: { id: 'mask', pan: 'mask', acct: 'mask', email: 'clear', phone: 'clear' } },
    { id: 'analyst', name: 'Data Analyst', desc: 'Counts, joins and trends on tokens; never clear-text', policy: { id: 'token', pan: 'token', acct: 'token', email: 'token', phone: 'token' } },
    { id: 'marketing', name: 'Marketing', desc: 'Consented email only', policy: { id: 'deny', pan: 'deny', acct: 'deny', email: 'clear', phone: 'mask' } },
    { id: 'auditor', name: 'Compliance Auditor', desc: 'Checks records exist; sees masks only', policy: { id: 'mask', pan: 'mask', acct: 'mask', email: 'mask', phone: 'mask' } }
  ];
  const roleById = (id) => ROLES.find((r) => r.id === id);

  function renderRoles() {
    $('#role-list').innerHTML = ROLES.map((r) => `
      <button class="tk-role ${r.id === state.role ? 'active' : ''}" data-role="${r.id}">
        <strong>${esc(r.name)}</strong><span>${esc(r.desc)}</span>
      </button>`).join('');
    const d = F();
    const role = roleById(state.role);
    $('#policy-table').innerHTML = `
      <thead><tr><th>Column</th><th>${esc(role.name)} sees</th></tr></thead>
      <tbody>${FIELD_ORDER.map((f) => `<tr><td>${esc(d[f].label)}</td><td>${decisionBadge(role.policy[f])}${role.policy[f] === 'clear' ? ' <span class="tk-muted">with a reason</span>' : ''}</td></tr>`).join('')}</tbody>`;
  }

  function appendAudit(evt) {
    const prev = state.audit.length ? state.audit[state.audit.length - 1].hash : '0'.repeat(64);
    const body = Object.assign({ seq: state.audit.length + 1, ts: new Date().toISOString() }, evt, { prev });
    body.hash = E.sha256Hex(prev + JSON.stringify(body));
    state.audit.push(body);
  }

  function runQuery() {
    const role = roleById(state.role);
    const reason = $('#access-reason').value.trim();
    const d = F();
    const cust = state.store.customers;
    const decisions = {};
    FIELD_ORDER.forEach((f) => {
      let dec = role.policy[f];
      if (dec === 'clear' && !reason) dec = 'deny';
      decisions[f] = dec;
    });

    const cell = (f, row) => {
      const tok = row.tok[f];
      const dec = decisions[f];
      try {
        if (dec === 'clear') return `<td class="tk-cell tk-cell-clear">${esc(detokenize(d[f], tok, row.kv))}</td>`;
        if (dec === 'mask') return `<td class="tk-cell tk-cell-mask">${esc(mask(d[f], tok))}</td>`;
        if (dec === 'token') return `<td class="tk-cell tk-cell-token">${esc(tok)}</td>`;
      } catch (e) {
        return `<td class="tk-cell tk-cell-deny">error</td>`;
      }
      return `<td class="tk-cell tk-cell-deny">— denied —</td>`;
    };

    $('#access-table').innerHTML = `
      <thead><tr><th>customer_id</th><th>segment</th>${FIELD_ORDER.map((f) => `<th>${esc(d[f].label)} ${decisionBadge(decisions[f])}</th>`).join('')}</tr></thead>
      <tbody>${cust.map((row) => `<tr><td><strong>${row.customer_id}</strong></td><td>${row.segment}</td>${FIELD_ORDER.map((f) => cell(f, row)).join('')}</tr>`).join('')}</tbody>`;

    const missingReason = !reason && FIELD_ORDER.some((f) => role.policy[f] === 'clear');
    $('#access-title').textContent = `Query result as ${role.name}`;
    $('#access-chip').textContent = missingReason ? 'Clear-text blocked: no access reason given' : `${cust.length} rows · ${FIELD_ORDER.filter((f) => decisions[f] === 'clear').length} clear-text columns`;
    $('#access-chip').className = 'tk-chip' + (missingReason ? ' tk-chip-warn' : '');

    const kvs = [...new Set(cust.map((r) => r.kv))];
    FIELD_ORDER.forEach((f) => {
      appendAudit({
        user_principal: `${role.id}@bank.example`,
        target_column: `lake.pii.customers.${d[f].key}`,
        access_reason: reason || null,
        decision: decisions[f],
        note: missingReason && role.policy[f] === 'clear' ? 'purpose_missing' : undefined,
        row_count: cust.length,
        key_versions: kvs,
        batch_hash: E.sha256Hex(cust.map((r) => r.tok[f]).join('|')).slice(0, 16),
        policy_version: 'demo-policy-1'
      });
    });
    renderAudit();
    $('#chain-status').hidden = true;
    showToast(`${FIELD_ORDER.length} audit events written for ${role.name}`);
  }

  function renderAudit() {
    const list = $('#audit-list');
    if (!state.audit.length) { list.innerHTML = '<div class="tk-empty">No events yet. Run a query above.</div>'; return; }
    list.innerHTML = state.audit.slice().reverse().slice(0, 60).map((e) => {
      const clean = Object.fromEntries(Object.entries(e).filter(([, v]) => v !== undefined));
      return `
      <details class="tk-audit ${e._tampered ? 'is-tampered' : ''}">
        <summary>
          <span class="tk-audit-seq">#${e.seq}</span>
          ${decisionBadge(e.decision)}
          <span class="tk-audit-main"><code>${esc(e.target_column)}</code> · ${esc(e.user_principal)}</span>
          <span class="tk-audit-hash" title="Chain hash">${esc(e.hash.slice(0, 12))}…</span>
        </summary>
        <pre class="output-code-container tk-pre tk-pre-sm">${esc(JSON.stringify(Object.assign({}, clean, { _tampered: undefined }), null, 2))}</pre>
      </details>`;
    }).join('');
  }

  function verifyChain() {
    const status = $('#chain-status');
    status.hidden = false;
    if (!state.audit.length) { status.className = 'tk-chain-status'; status.textContent = 'Nothing to verify yet.'; return; }
    let prev = '0'.repeat(64);
    for (const e of state.audit) {
      const { hash, _tampered, ...rest } = e;
      void _tampered;
      const body = Object.assign({}, rest, { prev });
      const ok = rest.prev === prev && E.sha256Hex(prev + JSON.stringify(body)) === hash;
      if (!ok) {
        status.className = 'tk-chain-status is-bad';
        status.innerHTML = `✗ Chain broken at event <strong>#${e.seq}</strong>: the record was changed after it was written. Every later event is now suspect.`;
        return;
      }
      prev = hash;
    }
    status.className = 'tk-chain-status is-ok';
    status.innerHTML = `✓ Chain intact: all <strong>${state.audit.length}</strong> events verified in order.`;
  }

  function tamper() {
    const candidates = state.audit.filter((e) => e.decision !== 'clear' && e.decision !== 'rotate');
    const target = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : state.audit[0];
    if (!target) { showToast('Run a query first so there is something to tamper with.'); return; }
    target.decision = 'clear';
    target.access_reason = 'edited after the fact';
    target._tampered = true;
    renderAudit();
    $('#chain-status').hidden = true;
    showToast(`Event #${target.seq} edited to read "clear". Now click Verify chain.`);
  }

  // ==========================================================================
  // TAB 3: SEARCH & JOIN
  // ==========================================================================
  function renderSearchSamples() {
    const d = F();
    $$('.js-id-label').forEach((el) => { el.textContent = d.id.label; });
    const p = state.plain;
    const samples = [p.customers[2].id, p.customers[7].id, p.customers[11].id, p.outsiders[0]];
    $('#search-samples').innerHTML = samples.map((s, i) => `<button class="tk-sample" data-search="${esc(s)}">${esc(s)}${i === 3 ? ' <em>(not a customer)</em>' : ''}</button>`).join('');
    $('#search-input').value = samples[0];
    $('#search-input').placeholder = d.id.sample;
    $('#search-out').hidden = true;
    $('#join-out').hidden = true;
  }

  function storedCells() {
    const cells = [];
    state.store.customers.forEach((r) => { cells.push(r.customer_id, r.segment, ...FIELD_ORDER.map((f) => r.tok[f])); });
    state.store.txns.forEach((t) => { cells.push(t.txn_id, t.id_tok, String(t.amount), t.merchant, t.date); });
    return cells;
  }

  function runSearch() {
    const d = F();
    const v = $('#search-input').value;
    const out = $('#search-out');
    out.hidden = false;
    let tok;
    try { tok = tokenize(d.id, v); } catch (e) { out.innerHTML = `<div class="tk-error">⚠️ ${esc(shortErr(e))}</div>`; return; }
    const t0 = now();
    const hits = state.store.customers.filter((r) => r.tok.id === tok);
    const txHits = state.store.txns.filter((t) => t.id_tok === tok);
    const ms = now() - t0;
    const needle = v.replace(/\D/g, '');
    const plainHits = storedCells().filter((c) => c === v.trim() || (needle.length >= 6 && c.replace(/\D/g, '') === needle)).length;
    out.innerHTML = `
      <ol class="tk-steps">
        <li><span>Search literal tokenized</span><code class="tk-token">${esc(tok)}</code></li>
        <li><span>Equality match on <code>customers.${esc(d.id.key)}</code></span><strong>${hits.length ? hits.map((h) => h.customer_id).join(', ') : 'no customer'}</strong></li>
        <li><span>Matching transactions</span><strong>${txHits.length}</strong></li>
        <li><span>Plaintext occurrences in stored data</span><strong class="tk-ok">${plainHits}</strong></li>
        <li><span>Values detokenized to answer this</span><strong class="tk-ok">0</strong></li>
      </ol>
      <div class="tk-muted">${hits.length ? `Found by token in ${ms.toFixed(2)} ms. The stored row never left tokenized form.` : 'No match: this person is not in the customers table (they may still appear as a payer in transactions).'}</div>`;
  }

  function joinCounts() {
    const byTok = new Map(state.store.customers.map((c) => [c.tok.id, c]));
    const tokenPairs = [];
    state.store.txns.forEach((t) => { const c = byTok.get(t.id_tok); if (c) tokenPairs.push(`${t.txn_id}>${c.customer_id}`); });
    const byPlain = new Map(state.plain.customers.map((c, i) => [c.id, state.store.customers[i].customer_id]));
    const plainPairs = [];
    state.plain.txns.forEach((t, i) => { const cid = byPlain.get(t.idPlain); if (cid) plainPairs.push(`${state.store.txns[i].txn_id}>${cid}`); });
    const same = tokenPairs.length === plainPairs.length && tokenPairs.every((p, i) => p === plainPairs[i]);
    return { byTok, tokenCount: tokenPairs.length, plainCount: plainPairs.length, same };
  }

  function runJoin() {
    const t0 = now();
    const j = joinCounts();
    const ms = now() - t0;
    const agg = new Map();
    state.store.txns.forEach((t) => {
      const c = j.byTok.get(t.id_tok);
      if (!c) return;
      const a = agg.get(c.customer_id) || { c, n: 0, sum: 0 };
      a.n++; a.sum += t.amount;
      agg.set(c.customer_id, a);
    });
    const cur = state.region === 'my' ? 'MYR' : 'USD';
    const rows = [...agg.values()].sort((a, b) => b.sum - a.sum).slice(0, 8);
    const out = $('#join-out');
    out.hidden = false;
    out.innerHTML = `
      <div class="tk-join-stats">
        <div><span>Tokenized join</span><strong>${j.tokenCount} rows</strong></div>
        <div><span>Plaintext join (proof)</span><strong>${j.plainCount} rows</strong></div>
        <div><span>Same row pairs</span><strong class="${j.same ? 'tk-ok' : 'tk-bad'}">${j.same ? '✓ Identical' : '✗ Mismatch'}</strong></div>
        <div><span>Detokenized</span><strong class="tk-ok">0 values</strong></div>
      </div>
      <p class="tk-muted">${state.store.txns.length - j.tokenCount} of ${state.store.txns.length} transactions belong to payers who are not customers and correctly drop out. Ran in ${ms.toFixed(2)} ms.</p>
      <div class="tk-subhead">Spend per customer, grouped by token</div>
      <div class="tk-table-wrap">
        <table class="master-table tk-table tk-table-compact">
          <thead><tr><th>customer_id</th><th>${esc(F().id.label)} (token)</th><th>Txns</th><th style="text-align:right;">Total ${cur}</th></tr></thead>
          <tbody>${rows.map((a) => `<tr><td><strong>${a.c.customer_id}</strong></td><td><code class="tk-token">${esc(a.c.tok.id)}</code></td><td>${a.n}</td><td style="text-align:right;">${a.sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`).join('')}</tbody>
        </table>
      </div>`;
  }

  function renderStore() {
    const d = F();
    const t = $('#store-table');
    if (state.storeView === 'customers') {
      t.innerHTML = `
        <thead><tr><th>customer_id</th><th>segment</th>${FIELD_ORDER.map((f) => `<th>${esc(d[f].key)}</th>`).join('')}<th>_kv</th></tr></thead>
        <tbody>${state.store.customers.map((r) => `<tr><td>${r.customer_id}</td><td>${r.segment}</td>${FIELD_ORDER.map((f) => `<td><code class="tk-token">${esc(r.tok[f])}</code></td>`).join('')}<td>v${r.kv}</td></tr>`).join('')}</tbody>`;
    } else {
      const cur = state.region === 'my' ? 'amount_myr' : 'amount_usd';
      t.innerHTML = `
        <thead><tr><th>txn_id</th><th>${esc(d.id.key)}</th><th>${cur}</th><th>merchant</th><th>date</th><th>_kv</th></tr></thead>
        <tbody>${state.store.txns.map((r) => `<tr><td>${r.txn_id}</td><td><code class="tk-token">${esc(r.id_tok)}</code></td><td>${r.amount.toFixed(2)}</td><td>${esc(r.merchant)}</td><td>${r.date}</td><td>v${r.kv}</td></tr>`).join('')}</tbody>`;
    }
  }

  // ==========================================================================
  // TAB 4: FORMATS, PAN, ROTATION, SELF-TEST
  // ==========================================================================
  const TREATMENT = {
    id: 'FF1 on the digits, separators kept, deterministic',
    pan: 'Keep BIN + last 4, FF1 the middle digits',
    acct: (d) => (d.kind === 'alnumUpper' ? 'Keep MBR- prefix, FF1 on 7 letters/digits' : 'FF1 on the digits, spacing kept'),
    email: 'FF1 on the local part (a–z, 0–9); domain kept',
    phone: 'Country code kept, FF1 on the national number'
  };

  function renderProfiles() {
    const d = F();
    const rows = FIELD_ORDER.map((f) => {
      const def = d[f];
      let example;
      try { example = `<code>${esc(def.sample)}</code> → <code class="tk-token">${esc(tokenize(def, def.sample))}</code>`; }
      catch (e) { example = `<span class="tk-bad">${esc(shortErr(e))}</span>`; }
      const tr = typeof TREATMENT[f] === 'function' ? TREATMENT[f](def) : TREATMENT[f];
      return `<tr><td><strong>${esc(def.label)}</strong></td><td>${esc(tr)}</td><td class="tk-nowrap">${example}</td><td>${def.domainText}</td><td><span class="tk-ok">Yes</span></td></tr>`;
    });
    const dob = state.region === 'my' ? '1990-07-15' : '1988-07-15';
    rows.push(`<tr><td><strong>Date of birth</strong></td><td>Generalized to year (a realistic date range has fewer than 10<sup>6</sup> values, below the safe floor)</td><td class="tk-nowrap"><code>${dob}</code> → <code>${dob.slice(0, 4)}-01-01</code></td><td>n/a</td><td><span class="tk-muted">No</span></td></tr>`);
    rows.push('<tr><td><strong>Card CVV / CVC</strong></td><td>Never stored, not even as a token. Dropped at the edge after authorization</td><td class="tk-nowrap"><code>123</code> → <span class="tk-muted">removed</span></td><td>n/a</td><td><span class="tk-muted">No</span></td></tr>');
    rows.push('<tr><td><strong>Full name</strong></td><td>Masked at the edge (free text has no fixed format)</td><td class="tk-nowrap"><code>Nur Aisyah</code> → <code>N••• A•••</code></td><td>n/a</td><td><span class="tk-muted">No</span></td></tr>');
    $('#profiles-table').innerHTML = `<thead><tr><th>Field</th><th>Treatment</th><th>Live example</th><th>FF1 domain</th><th>Joinable</th></tr></thead><tbody>${rows.join('')}</tbody>`;
  }

  function renderDomain() {
    const radix = Number($('#dom-radix').value);
    const len = Number($('#dom-len').value);
    $('#dom-len-val').textContent = len;
    const size = BigInt(radix) ** BigInt(len);
    const ok = size >= E.MIN_DOMAIN;
    const pct = Math.min(100, (len * Math.log10(radix)) / 6 * 100);
    const minLen = radix === 10 ? 6 : 4;
    let example = '';
    if (ok) {
      const alpha = radix === 10 ? E.ALPHABETS.digits : E.ALPHABETS.alnumLower;
      const sample = Array.from({ length: len }, (_, i) => alpha[(i * 7 + 3) % radix]).join('');
      const tok = E.fpTransform(state.keys[state.kv], alpha, 'domain-check|v' + state.kv, sample, true);
      example = `<div class="tk-dom-example"><code>${sample}</code> → <code class="tk-token">${tok}</code></div>`;
    }
    $('#dom-out').innerHTML = `
      <div class="tk-dom-meter"><div class="tk-dom-fill ${ok ? 'is-ok' : 'is-bad'}" style="width:${pct}%"></div><div class="tk-dom-floor" title="1,000,000"></div></div>
      <div class="tk-dom-line"><strong>${radix}<sup>${len}</sup> = ${size > 10n ** 15n ? '≈ 10<sup>' + Math.floor(len * Math.log10(radix)) + '</sup>' : fmtInt(Number(size))}</strong> possible values</div>
      <div class="${ok ? 'tk-ok' : 'tk-bad'}">${ok ? '✓ Accepted: large enough for FF1.' : `✗ Refused: below one million. Fields this short (under ${minLen} ${radix === 10 ? 'digits' : 'characters'}) are masked or replaced with a keyed surrogate instead.`}</div>
      ${example}`;
  }

  let PAN19 = '';
  function renderPanSamples() {
    PAN19 = luhnComplete('621234567890123456').replace(/(\d{4})(\d{4})(\d{4})(\d{4})(\d{3})/, '$1 $2 $3 $4 $5');
    const samples = [['4111 1111 1111 1111', 'Visa 16'], ['5555 5555 5555 4444', 'Mastercard 16'], ['3782 822463 10005', 'Amex 15'], [PAN19, '19-digit']];
    $('#pan-samples').innerHTML = samples.map(([v, l]) => `<button class="tk-sample" data-pan="${v}">${l}</button>`).join('');
    $('#pan-input').value = samples[0][0];
  }

  function runPan() {
    const v = $('#pan-input').value;
    const out = $('#pan-out');
    out.hidden = false;
    try {
      const key = state.keys[state.kv];
      const tw = `pan|v${state.kv}`;
      const r = E.panOp(key, tw, v, true);
      const back = E.panOp(key, tw, r.value, false).value;
      const din = v.replace(/\D/g, ''), dout = r.value.replace(/\D/g, '');
      const p = r.profile;
      const binOk = din.slice(0, p.keepPrefix) === dout.slice(0, p.keepPrefix);
      const l4Ok = din.slice(-4) === dout.slice(-4);
      const luhnIn = E.luhnValid(din.split('').map(Number)), luhnOut = E.luhnValid(dout.split('').map(Number));
      out.innerHTML = `
        <div class="tk-quick-row"><span>Token</span><code class="tk-token tk-big">${esc(r.value)}</code></div>
        <div class="tk-muted" style="margin-bottom:8px;">Profile: ${esc(p.label)}</div>
        <div class="tk-quick-checks">
          <span class="${binOk ? 'tk-ok' : 'tk-bad'}">${binOk ? '✓' : '✗'} First ${p.keepPrefix} digits kept (card routing still works)</span>
          <span class="${l4Ok ? 'tk-ok' : 'tk-bad'}">${l4Ok ? '✓' : '✗'} Last 4 kept (receipts, customer service)</span>
          <span>Luhn check: input ${luhnIn ? '<span class="tk-ok">passes</span>' : '<span class="tk-bad">fails</span>'}, token ${luhnOut ? '<span class="tk-ok">passes</span>' : '<span class="tk-warn">fails</span>'}${p.luhn ? ` (re-encrypted ${r.walks}× to land on a valid number)` : ''}</span>
          <span class="${back === v ? 'tk-ok' : 'tk-bad'}">${back === v ? '✓' : '✗'} Detokenizes back to the original</span>
        </div>`;
    } catch (e) {
      out.innerHTML = `<div class="tk-error">⚠️ ${esc(e instanceof E.DomainError ? 'This card length leaves too few middle digits to encrypt safely. Supported: 15, 16 and 17–19 digits.' : shortErr(e))}</div>`;
    }
  }

  function luhnExperiment(len) {
    const key = state.keys[state.kv];
    const r = rng(len * 7919 + Date.now() % 1000);
    let pass = 0;
    const t0 = now();
    for (let i = 0; i < 1000; i++) {
      const pan = luhnComplete((len === 16 ? '411111' : '62123456') + digitsN(r, len - (len === 16 ? 7 : 9)));
      const tok = E.panOp(key, `pan|v${state.kv}`, pan, true).value;
      if (E.luhnValid(tok.split('').map(Number))) pass++;
    }
    const ms = now() - t0;
    $('#luhn-out').innerHTML = len === 16
      ? `<strong>${(pass / 10).toFixed(1)}%</strong> of 16-digit tokens pass Luhn (${ms.toFixed(0)} ms). Keeping BIN + last 4 leaves exactly 6 digits, the NIST minimum, so there is no room to also force a valid check digit. Upside: tokens are easy to tell from real cards. Apps that Luhn-validate stored numbers need a flag.`
      : `<strong>${(pass / 10).toFixed(1)}%</strong> of 19-digit tokens pass Luhn (${ms.toFixed(0)} ms). With 7 middle digits there is room to re-encrypt until the check digit is valid, without dropping below the safe floor.`;
  }

  function renderKeyStatus() {
    const kvs = Object.keys(state.keys).map(Number);
    const counts = {};
    state.store.customers.forEach((r) => { counts[r.kv] = (counts[r.kv] || 0) + 1; });
    state.store.txns.forEach((r) => { counts[r.kv] = (counts[r.kv] || 0) + 1; });
    $('#kv-chip').textContent = `Active key: v${state.kv}`;
    $('#ribbon-key').textContent = `Session key v${state.kv} · fingerprint ${keyFingerprint(state.kv)}`;
    $('#kv-status').innerHTML = `
      <div class="tk-kv-row"><span>Active key</span><strong>v${state.kv}</strong><code>fingerprint ${keyFingerprint(state.kv)}</code></div>
      <div class="tk-kv-row"><span>Rows by key version</span><strong>${Object.entries(counts).map(([k, n]) => `v${k}: ${n}`).join(' · ')}</strong></div>
      <div class="tk-kv-row"><span>Keys held in this tab</span><strong>${kvs.map((k) => 'v' + k).join(', ')}</strong></div>
      <p class="tk-muted">Only a fingerprint (a hash) of the key is ever shown. Each row records its key version in a one-byte <code>_kv</code> column, so rotation can run in batches.</p>`;
  }

  async function rotateKey() {
    if (state.busy) return;
    state.busy = true;
    const btn = $('#btn-rotate');
    btn.disabled = true;
    const d = F();
    const oldKv = state.kv, newKv = oldKv + 1;
    state.keys[newKv] = E.randomKey();

    const sample = state.plain.customers[0].id;
    const before = tokenize(d.id, sample, oldKv);
    const after = tokenize(d.id, sample, newKv);

    const prog = $('#rotate-progress'), fill = $('#rotate-fill');
    prog.hidden = false; fill.style.width = '0%';
    const out = $('#rotate-out');
    out.hidden = false;
    out.innerHTML = '<div class="tk-muted">Re-tokenizing stored rows in batches…</div>';

    const jobs = [];
    state.store.customers.forEach((row) => jobs.push(() => {
      FIELD_ORDER.forEach((f) => { row.tok[f] = tokenize(d[f], detokenize(d[f], row.tok[f], row.kv), newKv); });
      row.kv = newKv;
    }));
    state.store.txns.forEach((row) => jobs.push(() => {
      row.id_tok = tokenize(d.id, detokenize(d.id, row.id_tok, row.kv), newKv);
      row.kv = newKv;
    }));
    for (let i = 0; i < jobs.length; i += 6) {
      jobs.slice(i, i + 6).forEach((fn) => fn());
      fill.style.width = `${Math.round(Math.min(jobs.length, i + 6) / jobs.length * 100)}%`;
      renderStore();
      await wait(40);
    }
    state.kv = newKv;
    delete state.keys[oldKv]; // crypto-shred: old tokens anywhere else are now unreadable
    const j = joinCounts();

    appendAudit({
      user_principal: 'key-admin@bank.example', target_column: 'lake.pii.*', access_reason: 'Scheduled key rotation',
      decision: 'rotate', row_count: jobs.length, key_versions: [oldKv, newKv], batch_hash: E.sha256Hex(String(newKv) + keyFingerprint(newKv)).slice(0, 16), policy_version: 'demo-policy-1'
    });

    let staleOk = false;
    try { detokenize(d.id, before, oldKv); } catch (e) { staleOk = true; }

    out.innerHTML = `
      <div class="tk-rot-compare">
        <div><span>Same ${esc(d.id.label)} under v${oldKv}</span><code class="tk-token">${esc(before)}</code></div>
        <div><span>…and under v${newKv}</span><code class="tk-token">${esc(after)}</code></div>
      </div>
      <div class="tk-quick-checks">
        <span class="tk-ok">✓ ${jobs.length} rows re-tokenized to v${newKv} in ${Math.ceil(jobs.length / 6)} batches</span>
        <span class="${j.same ? 'tk-ok' : 'tk-bad'}">${j.same ? '✓' : '✗'} Joins still match the plaintext baseline (${j.tokenCount} rows) — both tables moved in one campaign</span>
        <span class="${staleOk ? 'tk-ok' : 'tk-bad'}">${staleOk ? '✓' : '✗'} Key v${oldKv} destroyed: any old copy of a v${oldKv} token (backups, exports) is now permanently unreadable</span>
      </div>`;
    prog.hidden = true;
    btn.disabled = false;
    state.busy = false;

    renderKeyStatus(); renderProfiles(); renderDomain(); renderSearchSamples(); renderAudit();
    $('#access-table').innerHTML = ''; $('#access-chip').textContent = 'Store re-keyed. Run the query again.'; $('#access-chip').className = 'tk-chip';
    $('#edge-result').hidden = true; $('#quick-out').hidden = true; $('#pan-out').hidden = true;
    showToast(`Rotated to key v${newKv}. Old key destroyed.`);
  }

  function runSelfTest() {
    const res = E.runNistSelfTest();
    const passed = res.filter((r) => r.pass).length;
    $('#selftest-table').innerHTML = `
      <thead><tr><th>#</th><th>AES</th><th>Radix</th><th>Expected (NIST)</th><th>Got</th><th></th></tr></thead>
      <tbody>${res.map((r) => `<tr><td>${r.sample}</td><td>${r.aes}</td><td>${r.radix}</td><td><code>${r.expected}</code></td><td><code>${r.got}</code></td><td class="${r.pass ? 'tk-ok' : 'tk-bad'}">${r.pass ? '✓' : '✗'}</td></tr>`).join('')}</tbody>`;
    const all = passed === res.length;
    $('#selftest-chip').textContent = `${passed}/${res.length} passed`;
    $('#selftest-chip').className = 'tk-chip ' + (all ? 'tk-chip-ok' : 'tk-chip-warn');
    const pill = $('#ribbon-selftest');
    pill.textContent = all ? `NIST FF1 self-test: ${passed}/${res.length} passed ✓` : `NIST FF1 self-test: ${passed}/${res.length} — FAILED`;
    pill.classList.toggle('tk-pill-ok', all);
    pill.classList.toggle('tk-pill-bad', !all);
  }

  function runBench() {
    const d = F().id;
    const r = rng(42);
    const vals = Array.from({ length: 5000 }, () => genId(state.region, r));
    const t0 = now();
    vals.forEach((v) => tokenize(d, v));
    const ms = now() - t0;
    $('#bench-out').innerHTML = `Tokenized <strong>5,000</strong> ${esc(d.label)} values in <strong>${ms.toFixed(0)} ms</strong> — ${(ms * 1000 / 5000).toFixed(0)} µs each, about ${fmtInt(Math.round(5000 / (ms / 1000)))} per second on one browser thread.`;
  }

  // ==========================================================================
  // WIRING
  // ==========================================================================
  function renderAll() {
    renderRules(); loadSample(); renderQuickOptions();
    renderRoles(); renderAudit();
    renderSearchSamples(); renderStore();
    renderProfiles(); renderDomain(); renderPanSamples(); renderKeyStatus();
    $('#edge-result').hidden = true;
    $('#pan-out').hidden = true; $('#luhn-out').innerHTML = ''; $('#rotate-out').hidden = true; $('#bench-out').innerHTML = '';
    $('#access-table').innerHTML = '';
    $('#access-title').textContent = 'Query result';
    $('#access-chip').textContent = 'Run a query to see results';
    $('#access-chip').className = 'tk-chip';
  }

  function init() {
    const mobileToggle = $('.mobile-toggle'), navMenu = $('.nav-menu');
    if (mobileToggle && navMenu) mobileToggle.addEventListener('click', () => navMenu.classList.toggle('mobile-open'));

    // Workspace tabs
    $$('.ws-tab-btn').forEach((btn) => btn.addEventListener('click', () => {
      $$('.ws-tab-btn').forEach((b) => b.classList.remove('active'));
      $$('.tab-content-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      $('#' + btn.dataset.tab).classList.add('active');
    }));

    // Region switch
    $$('[data-region]').forEach((btn) => btn.addEventListener('click', () => {
      if (state.busy || btn.dataset.region === state.region) return;
      state.region = btn.dataset.region;
      $$('[data-region]').forEach((b) => b.classList.toggle('active', b === btn));
      buildStore(); renderAll();
      showToast(state.region === 'my' ? 'Malaysian sample data loaded (MyKad, MYR).' : 'US sample data loaded (SSN, USD).');
    }));

    $('#btn-reset-tk').addEventListener('click', () => {
      if (state.busy) return;
      newKeys(); state.audit = []; buildStore(); renderAll();
      $('#chain-status').hidden = true;
      $('#edge-outage').checked = false;
      setPipeline(null);
      showToast('Demo reset: new session key generated, audit trail cleared.');
    });

    // Tab 1
    $('#btn-edge-send').addEventListener('click', sendEdge);
    $('#btn-edge-sample').addEventListener('click', () => { loadSample(); setPipeline(null); $('#edge-result').hidden = true; });
    $('#quick-field').addEventListener('change', () => { $('#quick-value').value = F()[$('#quick-field').value].sample; $('#quick-out').hidden = true; });
    $('#btn-quick-tok').addEventListener('click', runQuick);
    $('#quick-value').addEventListener('keydown', (e) => { if (e.key === 'Enter') runQuick(); });

    // Tab 2
    const chooseRole = (id) => { state.role = id; renderRoles(); };
    $('#role-list').addEventListener('click', (e) => { const b = e.target.closest('[data-role]'); if (b) chooseRole(b.dataset.role); });
    $('#btn-run-query').addEventListener('click', runQuery);
    $('#btn-verify-chain').addEventListener('click', verifyChain);
    $('#btn-tamper').addEventListener('click', tamper);

    // Tab 3
    $('#btn-search').addEventListener('click', runSearch);
    $('#search-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });
    $('#search-samples').addEventListener('click', (e) => { const b = e.target.closest('[data-search]'); if (b) { $('#search-input').value = b.dataset.search; runSearch(); } });
    $('#btn-join').addEventListener('click', runJoin);
    $$('[data-store]').forEach((b) => b.addEventListener('click', () => {
      state.storeView = b.dataset.store;
      $$('[data-store]').forEach((x) => x.classList.toggle('active', x === b));
      renderStore();
    }));

    // Tab 4
    $('#dom-radix').addEventListener('change', renderDomain);
    $('#dom-len').addEventListener('input', renderDomain);
    $('#btn-pan').addEventListener('click', runPan);
    $('#pan-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') runPan(); });
    $('#pan-samples').addEventListener('click', (e) => { const b = e.target.closest('[data-pan]'); if (b) { $('#pan-input').value = b.dataset.pan; runPan(); } });
    $('#btn-luhn-16').addEventListener('click', () => luhnExperiment(16));
    $('#btn-luhn-19').addEventListener('click', () => luhnExperiment(19));
    $('#btn-rotate').addEventListener('click', rotateKey);
    $('#btn-bench').addEventListener('click', runBench);

    newKeys();
    runSelfTest();
    buildStore();
    renderAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
