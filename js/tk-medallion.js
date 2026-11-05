/**
 * Dyau.ai — Tokenization demo: Medallion pipeline (RAW → Bronze → Silver → Gold → Disclosure)
 * ---------------------------------------------------------------------------------------------
 * A browser port of the banking PoC notebooks, run at demo scale on synthetic data:
 *   01_generate_files   → RAW     CSV files (seeded, same every run)
 *   02_landing_raw      → BRONZE  typed, de-duplicated "landing" tables + integrity checks
 *   03_silver_tokenize  → SILVER  identifiers tokenized via the live REST service; PII dropped
 *   04_gold             → GOLD    fraud rules, customer risk, case summary (tokens only)
 *   07_disclosure       → DISCLOSURE  police requests: tokenize → match → detokenize → evidence + audit
 * Depends on js/tk-client.js (window.TkClient).
 */
(function () {
  'use strict';

  const C = window.TkClient;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt = (n) => Number(n).toLocaleString('en-US');

  const SCALE = { customers: 40, accounts: 60, transactions: 400, seed: 20261015 };

  // =========================================================================
  // 01 · Synthetic data (port of 01_generate_files.py at demo scale)
  // =========================================================================
  function rngFrom(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generate({ customers: nC, accounts: nA, transactions: nT, seed }) {
    const r = rngFrom(seed);
    const randint = (a, b) => a + Math.floor(r() * (b - a + 1));
    const uniform = (a, b) => a + r() * (b - a);
    const choice = (arr) => arr[Math.floor(r() * arr.length)];
    const sample = (arr, k) => { const c = arr.slice(); for (let i = 0; i < k; i++) { const j = i + Math.floor(r() * (c.length - i)); [c[i], c[j]] = [c[j], c[i]]; } return c.slice(0, k); };
    const weighted = (items, w) => { const tot = w.reduce((a, b) => a + b, 0); let x = r() * tot; for (let i = 0; i < items.length; i++) { x -= w[i]; if (x < 0) return items[i]; } return items[items.length - 1]; };
    const used = new Set();
    const unique = (make) => { for (;;) { const v = make(); if (!used.has(v)) { used.add(v); return v; } } };
    const digits = (n) => Array.from({ length: n }, () => String(Math.floor(r() * 10))).join('');
    const luhn = (partial) => {
      let total = 0;
      partial.split('').reverse().forEach((ch, i) => { const d = Number(ch) * (i % 2 === 0 ? 2 : 1); total += d > 9 ? d - 9 : d; });
      return partial + String((10 - (total % 10)) % 10);
    };
    const pad = (n, w) => String(n).padStart(w, '0');
    const isoDate = (d) => d.toISOString().slice(0, 10);
    const isoTs = (d) => d.toISOString().slice(0, 19);

    const first = ['Wei Ming', 'Siti', 'Arjun', 'Mei Ling', 'Daniel', 'Nur Aisyah', 'Rajesh', 'Hui Min', 'Farah', 'Kai Wen'];
    const last = ['Tan', 'Lim', 'Ng', 'Rahman', 'Nair', 'Lee', 'Goh', 'Chua', 'Ismail', 'Teo'];

    const customers = [];
    for (let i = 0; i < nC; i++) {
      const f = choice(first), l = choice(last);
      customers.push({
        customer_id: `71${pad(i + 1, 8)}`,
        full_name: `${l} ${f}`,
        national_id: unique(() => '99' + digits(7)),
        date_of_birth: isoDate(new Date(Date.UTC(1955, 0, 1) + randint(0, 18000) * 86400000)),
        email: unique(() => (f + l).replace(/ /g, '').toLowerCase() + digits(3)) + '@example.com',
        phone: unique(() => '+650' + digits(7))
      });
    }

    let owners = customers.map((c) => c.customer_id);
    const pool = owners.slice(0, Math.max(1, Math.floor(nC * 0.4)));
    owners = owners.concat(Array.from({ length: nA - nC }, () => choice(pool)));
    const accounts = owners.map((cid) => ({
      account_number: unique(() => '90' + digits(10)),
      customer_id: cid,
      account_type: choice(['SAVINGS', 'CURRENT']),
      card_pan: unique(() => luhn('9' + digits(14)))
    }));

    const start = Date.UTC(2026, 6, 1, 8, 0);
    const txns = [];
    const txn = (acct, day, ttype, direction, amount, cp = '', tag = 'NORMAL') => {
      txns.push({
        transaction_id: `TXN${pad(txns.length + 1, 8)}`,
        account_number: acct.account_number,
        txn_ts: isoTs(new Date(start + day * 86400000 + randint(0, 720) * 60000)),
        txn_type: ttype, direction, amount: amount.toFixed(2),
        counterparty_account: cp,
        card_pan: ttype === 'CARD_PURCHASE' ? acct.card_pan : '',
        scenario_tag: tag
      });
    };

    const special = sample(accounts, 12);
    const mules = special.slice(0, 4), structurers = special.slice(4, 7), big = special.slice(7);
    mules.forEach((m) => {
      const d = randint(5, 80);
      let total = 0;
      const n = randint(8, 12);
      for (let k = 0; k < n; k++) { const amt = uniform(800, 4000); total += amt; txn(m, d + randint(0, 2), 'TRANSFER_IN', 'CREDIT', amt, unique(() => '80' + digits(10)), 'MULE'); }
      txn(m, d + 3, 'TRANSFER_OUT_INTL', 'DEBIT', total * 0.9, unique(() => '80' + digits(10)), 'MULE');
    });
    structurers.forEach((s) => {
      const d = randint(5, 80);
      const n = randint(5, 7);
      for (let k = 0; k < n; k++) txn(s, d + k, 'TRANSFER_OUT', 'DEBIT', uniform(9000, 9950), unique(() => '80' + digits(10)), 'STRUCTURING');
    });
    big.forEach((b) => txn(b, randint(0, 90), 'TRANSFER_OUT_INTL', 'DEBIT', uniform(60000, 200000), unique(() => '80' + digits(10)), 'HIGH_VALUE'));
    const normal = accounts.filter((a) => !special.includes(a));
    while (txns.length < nT) {
      const a = choice(normal), d = randint(0, 91);
      const kind = weighted(['SALARY', 'CARD_PURCHASE', 'ATM', 'TRANSFER_OUT', 'TRANSFER_IN'], [8, 50, 12, 15, 15]);
      if (kind === 'SALARY') txn(a, d, 'SALARY', 'CREDIT', uniform(3000, 12000));
      else if (kind === 'CARD_PURCHASE') txn(a, d, 'CARD_PURCHASE', 'DEBIT', uniform(5, 400));
      else if (kind === 'ATM') txn(a, d, 'ATM', 'DEBIT', choice([50, 100, 200, 500]));
      else {
        const cp = r() < 0.4 ? choice(accounts).account_number : unique(() => '80' + digits(10));
        txn(a, d, kind, kind === 'TRANSFER_OUT' ? 'DEBIT' : 'CREDIT', uniform(20, 3000), cp);
      }
    }
    const txFinal = txns.slice(0, nT);
    const landingRows = txFinal.concat(sample(txFinal, 3).map((t) => ({ ...t })));

    const owner = Object.fromEntries(accounts.map((a) => [a.account_number, a.customer_id]));
    const cases = mules.concat(structurers).map((a, i) => ({
      case_id: `CASE-${pad(i + 1, 3)}`, case_type: mules.includes(a) ? 'MULE' : 'STRUCTURING',
      account_number: a.account_number, customer_id: owner[a.account_number], status: 'OPEN'
    }));

    const windowOf = (acct) => {
      const days = txFinal.filter((t) => t.account_number === acct.account_number && t.scenario_tag !== 'NORMAL').map((t) => t.txn_ts.slice(0, 10)).sort();
      return [days[0], days[days.length - 1]];
    };
    const request = (n, acct, from, to, customerId) => ({
      request_id: `REQ-${pad(n, 3)}`, agency: 'Demo Police Unit (fictional)', legal_reference: `DEMO-ORDER-${pad(n, 3)} (fictional)`,
      requested_by: 'investigator.ivan', customer_id: customerId || owner[acct.account_number], account_number: acct.account_number, date_from: from, date_to: to
    });
    const [mFrom, mTo] = windowOf(mules[0]);
    const [sFrom, sTo] = windowOf(structurers[0]);
    const otherCustomer = customers.find((c) => c.customer_id !== owner[mules[1].account_number]).customer_id;
    const requests = [
      request(1, mules[0], mFrom, mTo),
      request(2, structurers[0], sFrom, sTo),
      request(3, mules[1], '2026-07-01', '2026-09-30', otherCustomer)
    ];

    return { customers, accounts, transactions: landingRows, investigation_cases: cases, disclosure_requests: requests };
  }

  function toCsv(rows) {
    const cols = Object.keys(rows[0]);
    return [cols.join(',')].concat(rows.map((r) => cols.map((c) => r[c]).join(','))).join('\n') + '\n';
  }
  function parseCsv(text) {
    const lines = text.trim().split('\n');
    const cols = lines[0].split(',');
    return lines.slice(1).map((l) => { const v = l.split(','); return Object.fromEntries(cols.map((c, i) => [c, v[i] === undefined ? '' : v[i]])); });
  }

  // =========================================================================
  // Pipeline state
  // =========================================================================
  const S = { raw: null, bronze: null, silver: null, gold: null, disclosure: null, engine: null, running: false };
  const STEPS = ['raw', 'bronze', 'silver', 'gold', 'disclosure'];
  const LAYER = {
    raw: { n: 1, name: 'RAW', title: 'Source files' },
    bronze: { n: 2, name: 'BRONZE', title: 'Landing tables' },
    silver: { n: 3, name: 'SILVER', title: 'Tokenized tables' },
    gold: { n: 4, name: 'GOLD', title: 'Fraud analytics' },
    disclosure: { n: 5, name: 'DISCLOSURE', title: 'Police requests' }
  };

  // -------------------------------------------------------------- RAW
  async function runRaw() {
    const data = generate(SCALE);
    const files = {};
    for (const [name, rows] of Object.entries(data)) files[`${name}.csv`] = toCsv(rows);
    S.raw = { files };
  }

  // -------------------------------------------------------------- BRONZE (02_landing_raw)
  async function runBronze() {
    const f = S.raw.files;
    const loadedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const customers = parseCsv(f['customers.csv']);
    const accounts = parseCsv(f['accounts.csv']);
    let transactions = parseCsv(f['transactions.csv']).map((t) => ({ ...t, value_date: t.txn_ts.slice(0, 10), amount: Math.round(Number(t.amount) * 100) / 100 }));
    const cases = parseCsv(f['investigation_cases.csv']);
    const requests = parseCsv(f['disclosure_requests.csv']);

    const rowsInFile = transactions.length;
    const seen = new Set();
    transactions = transactions.filter((t) => (seen.has(t.transaction_id) ? false : (seen.add(t.transaction_id), true)));
    const acctSet = new Set(accounts.map((a) => a.account_number));
    const custSet = new Set(customers.map((c) => c.customer_id));
    const orphans = transactions.filter((t) => !acctSet.has(t.account_number)).length;
    const unknownCust = accounts.filter((a) => !custSet.has(a.customer_id)).length;
    if (orphans || unknownCust) throw new Error('Bronze integrity check failed');

    const stamp = (rows) => rows.map((r) => ({ ...r, _loaded_at: loadedAt }));
    S.bronze = {
      tables: {
        'landing.customers': stamp(customers),
        'landing.accounts': stamp(accounts),
        'landing.transactions': stamp(transactions),
        'landing.investigation_cases': stamp(cases),
        'disclosure.requests': requests
      },
      checks: [
        { name: 'Duplicate transactions removed', detail: `${fmt(rowsInFile)} rows in file → ${fmt(transactions.length)} after de-duplication on transaction_id`, ok: true },
        { name: 'Every transaction points to a known account', detail: `${orphans} orphan transactions`, ok: orphans === 0 },
        { name: 'Every account belongs to a known customer', detail: `${unknownCust} orphan accounts`, ok: unknownCust === 0 },
        { name: 'Types cast', detail: 'txn_ts → timestamp, value_date derived, amount → decimal(18,2)', ok: true }
      ],
      loadedAt
    };
  }

  // -------------------------------------------------------------- SILVER (03_silver_tokenize_rest)
  async function runSilver(log) {
    const B = S.bronze.tables;
    const customers = B['landing.customers'], accounts = B['landing.accounts'], txns = B['landing.transactions'], cases = B['landing.investigation_cases'];
    const distinct = (...lists) => [...new Set(lists.flat().filter((v) => v !== '' && v != null))].sort();
    const plan = [
      ['customer_id', distinct(customers.map((c) => c.customer_id)), 'customers.customer_id'],
      ['national_id', distinct(customers.map((c) => c.national_id)), 'customers.national_id'],
      ['account_number', distinct(accounts.map((a) => a.account_number), txns.map((t) => t.counterparty_account)), 'accounts.account_number + transactions.counterparty_account'],
      ['card_pan', distinct(accounts.map((a) => a.card_pan)), 'accounts.card_pan']
    ];

    let engine = 'auto';
    let maps, calls;
    for (let attempt = 0; attempt < 2; attempt++) {
      maps = {}; calls = [];
      let fellBack = false;
      for (const [field, values, source] of plan) {
        log(`Tokenizing ${fmt(values.length)} distinct ${C.FIELDS[field].label.toLowerCase()} values…`);
        const res = await C.call('tokenize', field, values, { engine });
        if (engine === 'auto' && res.engine === 'browser') { fellBack = true; break; }
        const tokens = res.values;
        if (new Set(tokens).size !== tokens.length) throw new Error(`${field}: two values got the same token`);
        maps[field] = new Map(values.map((v, i) => [v, tokens[i]]));
        calls.push({ field, source, count: values.length, engine: res.engine, ms: res.ms, request_id: res.request_id, sample: [values[0], tokens[0]] });
      }
      if (!fellBack) break;
      // Never mix engines inside one Silver build: tokens must be joinable across tables
      engine = 'browser';
      log('Live service unavailable — rebuilding Silver consistently with the in-browser engine.');
    }
    S.engine = calls[0] ? calls[0].engine : 'browser';

    const tok = (field, v) => (v ? maps[field].get(v) : null);
    const ownerOf = Object.fromEntries(accounts.map((a) => [a.account_number, a.customer_id]));
    const sCustomers = customers.map((c) => ({ customer_tok: tok('customer_id', c.customer_id), national_id_tok: tok('national_id', c.national_id), birth_year: c.date_of_birth.slice(0, 4) }));
    const sAccounts = accounts.map((a) => ({ account_tok: tok('account_number', a.account_number), customer_tok: tok('customer_id', a.customer_id), account_type: a.account_type, card_pan_tok: tok('card_pan', a.card_pan) }));
    const sTxns = txns.map((t) => ({
      transaction_id: t.transaction_id, account_tok: tok('account_number', t.account_number), customer_tok: tok('customer_id', ownerOf[t.account_number]),
      txn_ts: t.txn_ts, value_date: t.value_date, txn_type: t.txn_type, direction: t.direction, amount: t.amount,
      counterparty_account_tok: tok('account_number', t.counterparty_account), card_pan_tok: tok('card_pan', t.card_pan)
    }));
    const sCases = cases.map((k) => ({ case_id: k.case_id, case_type: k.case_type, status: k.status, account_tok: tok('account_number', k.account_number), customer_tok: tok('customer_id', k.customer_id) }));

    const checks = [
      { name: 'Row count unchanged', detail: `${fmt(sTxns.length)} Silver vs ${fmt(txns.length)} Bronze transactions`, ok: sTxns.length === txns.length },
      { name: 'No untokenized account', detail: `${sTxns.filter((t) => !t.account_tok).length} rows with a null account_tok`, ok: sTxns.every((t) => t.account_tok) },
      { name: 'One token per value (no collisions)', detail: 'Checked for every field', ok: true },
      { name: 'No PII column survives', detail: 'full_name, email, phone dropped · date_of_birth → birth_year', ok: true }
    ];
    S.silver = { tables: { 'silver.customers': sCustomers, 'silver.accounts': sAccounts, 'silver.transactions': sTxns, 'silver.investigation_cases': sCases }, calls, maps, checks, engine: S.engine };
  }

  // -------------------------------------------------------------- GOLD (04_gold)
  function runGold() {
    const T = S.silver.tables;
    const t = T['silver.transactions'];
    const day = (d) => Math.round(Date.parse(d + 'T00:00:00Z') / 86400000);

    const windows = (rows, span, min) => {
      const out = [];
      const starts = [...new Map(rows.map((r) => [`${r.account_tok}|${r.value_date}`, r])).values()];
      starts.forEach((s) => {
        const hits = rows.filter((i) => i.account_tok === s.account_tok && day(i.value_date) >= day(s.value_date) && day(i.value_date) <= day(s.value_date) + span);
        if (hits.length >= min) out.push({ account_tok: s.account_tok, customer_tok: s.customer_tok, window_start: s.value_date, events: hits.length, amount: hits.reduce((a, h) => a + h.amount, 0) });
      });
      return out;
    };
    const inb = t.filter((x) => x.txn_type === 'TRANSFER_IN');
    const mule = windows(inb, 3, 8).filter((w) => {
      const outs = t.filter((o) => o.account_tok === w.account_tok && o.txn_type === 'TRANSFER_OUT_INTL' && day(o.value_date) >= day(w.window_start) && day(o.value_date) <= day(w.window_start) + 5);
      return outs.length > 0 && outs.reduce((a, o) => a + o.amount, 0) >= w.amount / 2;
    }).map((w) => ({ rule: 'MULE', ...w }));
    const dom = t.filter((x) => x.txn_type === 'TRANSFER_OUT' && x.amount >= 9000 && x.amount < 10000);
    const structuring = windows(dom, 6, 4).map((w) => ({ rule: 'STRUCTURING', ...w }));
    const high = t.filter((x) => x.txn_type === 'TRANSFER_OUT_INTL' && x.amount >= 50000)
      .map((x) => ({ rule: 'HIGH_VALUE', account_tok: x.account_tok, customer_tok: x.customer_tok, window_start: x.value_date, events: 1, amount: x.amount }));
    const alerts = mule.concat(structuring, high);

    const accountsByRule = (rule) => new Set(alerts.filter((a) => a.rule === rule).map((a) => a.account_tok)).size;
    const rules = [
      { rule: 'MULE', logic: '≥ 8 inbound transfers in 4 days, then an international outflow ≥ 50% of them within 5 days', expected: 4, hits: accountsByRule('MULE') },
      { rule: 'STRUCTURING', logic: '≥ 4 outbound transfers of S$9,000–9,999.99 within 7 days', expected: 3, hits: accountsByRule('STRUCTURING') },
      { rule: 'HIGH_VALUE', logic: 'An international outbound transfer ≥ S$50,000', expected: 5, hits: accountsByRule('HIGH_VALUE') }
    ];

    const byCust = new Map();
    t.forEach((x) => {
      const c = byCust.get(x.customer_tok) || { n: 0, debit: 0, credit: 0 };
      c.n++; if (x.direction === 'DEBIT') c.debit += x.amount; else c.credit += x.amount;
      byCust.set(x.customer_tok, c);
    });
    const rulesHit = new Map();
    alerts.forEach((a) => { const s = rulesHit.get(a.customer_tok) || new Set(); s.add(a.rule); rulesHit.set(a.customer_tok, s); });
    const customerRisk = T['silver.customers'].map((c) => {
      const x = byCust.get(c.customer_tok) || { n: 0, debit: 0, credit: 0 };
      return { customer_tok: c.customer_tok, birth_year: c.birth_year, txn_count: x.n, debit_total: x.debit, credit_total: x.credit, rules_hit: (rulesHit.get(c.customer_tok) || new Set()).size };
    }).sort((a, b) => b.rules_hit - a.rules_hit || b.debit_total - a.debit_total);

    const caseSummary = T['silver.investigation_cases'].map((k) => {
      const tx = t.filter((x) => x.account_tok === k.account_tok);
      return { ...k, txn_count: tx.length, total_amount: tx.reduce((a, x) => a + x.amount, 0), rules_hit: [...new Set(alerts.filter((a) => a.account_tok === k.account_tok).map((a) => a.rule))].join(',') };
    });

    // Equivalence check: Bronze (raw identifiers) vs Silver (tokens) give the same totals
    const B = S.bronze.tables;
    const owner = Object.fromEntries(B['landing.accounts'].map((a) => [a.account_number, a.customer_id]));
    const bt = B['landing.transactions'];
    const raw = { n: bt.length, total: bt.reduce((a, x) => a + x.amount, 0), customers: new Set(bt.map((x) => owner[x.account_number])).size };
    const toks = { n: t.length, total: t.reduce((a, x) => a + x.amount, 0), customers: new Set(t.map((x) => x.customer_tok)).size };
    const equivalent = raw.n === toks.n && Math.abs(raw.total - toks.total) < 0.005 && raw.customers === toks.customers;

    S.gold = { alerts, rules, customerRisk, caseSummary, equivalence: { raw, toks, equivalent } };
  }

  // -------------------------------------------------------------- DISCLOSURE (07_authorized_investigation_disclosure_rest)
  async function runDisclosure(log) {
    const T = S.silver.tables;
    const requests = S.bronze.tables['disclosure.requests'];
    const engine = S.engine === 'browser' ? 'browser' : 'live';
    const me = (C.auth.current() || {}).email || 'demo.user';
    const evidence = [];
    const auditLog = [];
    const truth = Object.fromEntries(S.bronze.tables['landing.accounts'].map((a) => [a.account_number, a]));

    for (const req of requests) {
      const ids = [];
      const steps = [];
      try {
        log(`${req.request_id}: tokenizing the identifiers supplied by the requester…`);
        const c = await C.call('tokenize', 'customer_id', [req.customer_id], { engine });
        const a = await C.call('tokenize', 'account_number', [req.account_number], { engine });
        ids.push(c.request_id, a.request_id);
        const custTok = c.values[0], acctTok = a.values[0];
        steps.push(`Tokenized customer ${req.customer_id} → ${custTok} and account ${req.account_number} → ${acctTok}`);

        const acct = T['silver.accounts'].find((x) => x.account_tok === acctTok && x.customer_tok === custTok);
        if (!acct) {
          steps.push('No Silver account matches this customer + account pair → nothing is detokenized');
          auditLog.push({ request_id: req.request_id, agency: req.agency, legal_reference: req.legal_reference, requested_by: req.requested_by, executed_by: me, date_from: req.date_from, date_to: req.date_to, outcome: 'NO_MATCH', detail: 'account not found for this customer', transactions_disclosed: 0, decisions: '', token_service_request_ids: ids.filter(Boolean).join(';'), method: 'REST', logged_at: new Date().toISOString(), steps });
          continue;
        }
        const txns = T['silver.transactions'].filter((x) => x.account_tok === acctTok && x.value_date >= req.date_from && x.value_date <= req.date_to).sort((x, y) => (x.txn_ts < y.txn_ts ? -1 : 1));
        steps.push(`Matched in Silver; ${txns.length} transactions between ${req.date_from} and ${req.date_to} (still tokens)`);

        log(`${req.request_id}: detokenizing ${txns.length} transactions' identifiers under the disclosure identity…`);
        const dA = await C.call('detokenize', 'account_number', [acctTok], { engine });
        const dC = await C.call('detokenize', 'customer_id', [custTok], { engine });
        let cardPan = null, cardDec = null;
        if (acct.card_pan_tok) { const dP = await C.call('detokenize', 'card_pan', [acct.card_pan_tok], { engine }); cardPan = dP.values[0]; cardDec = dP.decision; ids.push(dP.request_id); }
        ids.push(dA.request_id, dC.request_id);
        const cpTokens = [...new Set(txns.map((x) => x.counterparty_account_tok).filter(Boolean))].sort();
        let cpMap = {}, cpDec = null;
        if (cpTokens.length) { const dCp = await C.call('detokenize', 'account_number', cpTokens, { engine }); cpMap = Object.fromEntries(cpTokens.map((tk, i) => [tk, dCp.values[i]])); cpDec = dCp.decision; ids.push(dCp.request_id); }
        const accountNumber = dA.values[0], customerId = dC.values[0];
        const verified = accountNumber === req.account_number && customerId === req.customer_id && (!cardPan || cardPan === truth[req.account_number].card_pan);
        steps.push(`Detokenized account, customer, card${cpTokens.length ? ` and ${cpTokens.length} counterparty account(s)` : ''} · ${verified ? 'values match the Bronze source ✓' : 'values differ from Bronze ✗'}`);

        txns.forEach((x) => evidence.push({
          request_id: req.request_id, date_from: req.date_from, date_to: req.date_to,
          account_number: accountNumber, customer_id: customerId, card_pan: cardPan,
          transaction_id: x.transaction_id, txn_ts: x.txn_ts, value_date: x.value_date, txn_type: x.txn_type, direction: x.direction, amount: x.amount,
          counterparty_account: cpMap[x.counterparty_account_tok] || null, txn_card_pan: x.card_pan_tok ? cardPan : null,
          account_decision: dA.decision, customer_decision: dC.decision, card_pan_decision: cardDec, counterparty_decision: cpDec
        }));
        const decisions = `account=${dA.decision}; customer=${dC.decision}; card_pan=${cardDec}; counterparty=${cpDec}`;
        auditLog.push({ request_id: req.request_id, agency: req.agency, legal_reference: req.legal_reference, requested_by: req.requested_by, executed_by: me, date_from: req.date_from, date_to: req.date_to, outcome: 'DISCLOSED', detail: `${txns.length} transactions`, transactions_disclosed: txns.length, decisions, token_service_request_ids: ids.filter(Boolean).join(';'), method: 'REST', logged_at: new Date().toISOString(), steps, verified });
      } catch (e) {
        steps.push(`Failed: ${e.message}`);
        auditLog.push({ request_id: req.request_id, agency: req.agency, legal_reference: req.legal_reference, requested_by: req.requested_by, executed_by: me, date_from: req.date_from, date_to: req.date_to, outcome: 'FAILED', detail: String(e.message).slice(0, 200), transactions_disclosed: 0, decisions: '', token_service_request_ids: ids.filter(Boolean).join(';'), method: 'REST', logged_at: new Date().toISOString(), steps });
      }
    }
    S.disclosure = { evidence, auditLog, requests };
  }

  // =========================================================================
  // Rendering
  // =========================================================================
  const tableHtml = (rows, cols, opts = {}) => {
    if (!rows.length) return '<div class="tk-empty">No rows.</div>';
    const fmtCell = (c, v) => {
      if (v == null || v === '') return '<span class="tk-muted">null</span>';
      if (opts.token && opts.token.includes(c)) return `<code class="tk-token">${esc(v)}</code>`;
      if (opts.pii && opts.pii.includes(c)) return `<code class="med-pii">${esc(v)}</code>`;
      if (opts.money && opts.money.includes(c)) return money(v);
      return esc(v);
    };
    return `<div class="tk-table-wrap${opts.scroll ? ' tk-table-scroll' : ''}"><table class="master-table tk-table tk-table-compact">
      <thead><tr>${cols.map((c) => `<th${opts.money && opts.money.includes(c) ? ' class="num"' : ''}>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td${opts.money && opts.money.includes(c) ? ' class="num"' : ''}>${fmtCell(c, r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };
  const checksHtml = (checks) => `<ul class="med-checks">${checks.map((c) => `<li class="${c.ok ? 'ok' : 'bad'}"><span class="med-check-ico">${c.ok ? '✓' : '✗'}</span><div><strong>${esc(c.name)}</strong><span>${esc(c.detail)}</span></div></li>`).join('')}</ul>`;
  const engineChip = (e) => (e === 'tokcore' ? '<span class="tk-chip tk-chip-ok">Live REST service</span>' : '<span class="tk-chip tk-chip-warn">In-browser fallback</span>');

  function renderShell() {
    $('#tab-medallion').innerHTML = `
      <div class="tk-intro">
        <span class="section-tag">Medallion architecture · Banking PoC</span>
        <h3>From raw files to fraud insight, with personal data tokenized at the Silver boundary</h3>
        <p>This is the same pipeline the bank proof-of-concept runs in Databricks, scaled down and run here step by step. Identifiers are tokenized by the live REST service as data moves from Bronze to Silver. Gold analytics never see a real identifier, and detokenization happens only in a separate, audited Disclosure zone.</p>
      </div>

      <section class="tk-card med-arch-card" aria-labelledby="med-arch-title">
        <div class="tk-card-head"><h4 id="med-arch-title">Architecture at a glance</h4><span class="tk-chip">Unity Catalog: banking_poc</span></div>
        <div class="med-arch">
          ${archLayer('raw', 'RAW', 'Source files', '/Volumes/…/landing/raw_files', ['5 CSV files as delivered', 'Seeded synthetic bank data'], 'pii', 'Data engineers', '01_generate_files')}
          <div class="med-flow" aria-hidden="true"><span>load</span></div>
          ${archLayer('bronze', 'BRONZE', 'Landing tables', 'banking_poc.landing', ['Typed, de-duplicated Delta', 'Integrity checks · _loaded_at'], 'pii', 'Data engineers only', '02_landing_raw')}
          <div class="med-flow med-flow-key" aria-hidden="true"><span>🔑 tokenize</span></div>
          ${archLayer('silver', 'SILVER', 'Tokenized tables', 'banking_poc.silver', ['IDs → format-preserving tokens', 'Names, emails, phones dropped'], 'tok', 'Analysts', '03_silver_tokenize_rest')}
          <div class="med-flow" aria-hidden="true"><span>aggregate</span></div>
          ${archLayer('gold', 'GOLD', 'Fraud analytics', 'banking_poc.gold', ['Suspicious activity rules', 'Customer risk · case summary'], 'tok', 'Analysts · BI', '04_gold')}
        </div>
        <div class="med-disclosure-row">
          <div class="med-branch" aria-hidden="true"><span>🔓 detokenize · audited</span></div>
          ${archLayer('disclosure', 'DISCLOSURE', 'Restricted side zone', 'banking_poc.disclosure', ['Police requests → evidence', 'Every request in audit_log'], 'clear', 'Authorized investigators', '07_disclosure_rest')}
        </div>
        <div class="med-boundary-note"><span class="med-legend med-legend-pii"></span>Contains personal data <span class="med-legend med-legend-tok"></span>Tokens only <span class="med-legend med-legend-clear"></span>Clear values, case by case, audited</div>
      </section>

      <section class="tk-card med-why" aria-labelledby="med-why-title">
        <div class="tk-card-head"><h4 id="med-why-title">How this pipeline follows the Medallion architecture</h4></div>
        <div class="med-why-grid">
          ${why('📶', 'Quality improves at every hop', 'RAW files become typed, de-duplicated Bronze tables, then conformed Silver tables, then business-ready Gold. Each layer has one clear job.')}
          ${why('🧾', 'Bronze keeps source fidelity', 'Data lands as delivered, with a _loaded_at stamp for lineage. Silver and Gold can always be rebuilt from Bronze.')}
          ${why('🔗', 'Silver is the trusted, joinable layer', 'One deterministic token per identity, so customers, accounts, transactions and cases still join, now on tokens.')}
          ${why('📊', 'Gold is consumption-ready', 'Fraud rules, customer risk and case summaries are built for analysts and dashboards, never from raw identifiers.')}
          ${why('🔐', 'Access widens as sensitivity drops', 'Bronze is limited to data engineers. Silver and Gold are open to analysts because they hold tokens only.')}
          ${why('✅', 'Quality gates between layers', 'Integrity checks, row-count and null-token asserts, and a Gold proof that totals match the raw data.')}
        </div>
        <p class="med-why-extra"><strong>What Dyau.ai adds:</strong> a tokenization boundary between Bronze and Silver, so personal data never flows past Bronze, and a separate Disclosure zone where detokenization is case-by-case, policy-checked and written to an audit log.</p>
      </section>

      <section class="tk-card med-run" aria-labelledby="med-run-title">
        <div class="tk-card-head">
          <div>
            <h4 id="med-run-title">Run the pipeline</h4>
            <p class="tk-muted">${fmt(SCALE.customers)} customers · ${fmt(SCALE.accounts)} accounts · ${fmt(SCALE.transactions)} transactions (+3 planted duplicates) · seed ${SCALE.seed}. 12 accounts carry planted mule, structuring and high-value patterns.</p>
          </div>
          <div class="tk-row">
            <button id="med-reset" class="btn btn-outline tk-btn-sm">↺ Reset</button>
            <button id="med-run-all" class="btn btn-primary">▶ Run full pipeline</button>
          </div>
        </div>
        <ol class="med-steps" id="med-steps">
          ${STEPS.map((k) => `<li class="med-step" data-step="${k}" data-layer="${k}"><button type="button" class="med-step-btn" data-goto="${k}"><span class="med-step-n">${LAYER[k].n}</span><span class="med-step-text"><strong>${LAYER[k].name}</strong><small>${LAYER[k].title}</small></span><span class="med-step-state" data-state-for="${k}">Not run</span></button></li>`).join('')}
        </ol>
        <div class="med-log" id="med-log" aria-live="polite" hidden></div>
        <div id="med-panels">
          ${STEPS.map((k) => `<div class="med-panel" data-panel="${k}" hidden></div>`).join('')}
        </div>
      </section>

      <section class="tk-card med-trace" id="med-trace" aria-labelledby="med-trace-title" hidden>
        <div class="tk-card-head">
          <div><h4 id="med-trace-title">Trace one account end to end</h4><p class="tk-muted">The same record as it appears in each layer: the round trip the bank's test queries check.</p></div>
          <select id="med-trace-select" class="filter-select" aria-label="Investigation case to trace"></select>
        </div>
        <div id="med-trace-out"></div>
      </section>`;
    $('#med-run-all').addEventListener('click', runAll);
    $('#med-reset').addEventListener('click', reset);
    $('#med-steps').addEventListener('click', (e) => {
      const b = e.target.closest('[data-goto]');
      if (!b) return;
      const k = b.dataset.goto;
      if (isDone(k)) showPanel(k);
      else if (canRun(k)) runStep(k);
    });
    $('#med-panels').addEventListener('click', (e) => {
      const r = e.target.closest('[data-run]');
      if (r) runStep(r.dataset.run);
      const ev = e.target.closest('[data-evidence]');
      if (ev) renderEvidence(ev.dataset.evidence);
    });
    $('#med-trace-select').addEventListener('change', renderTrace);
    updateSteps();
    showPanel('raw', true);
  }

  function archLayer(key, chip, title, store, bullets, kind, access, nb) {
    const kindLabel = { pii: 'Personal data', tok: 'Tokens only', clear: 'Clear on approval' }[kind];
    return `<div class="med-layer" data-layer="${key}">
      <div class="med-layer-top"><span class="med-chip">${chip}</span><span class="med-kind med-kind-${kind}">${kindLabel}</span></div>
      <h5>${title}</h5>
      <code class="med-store">${store}</code>
      <ul>${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
      <div class="med-layer-foot"><span>👤 ${access}</span><span class="med-nb">${nb}</span></div>
    </div>`;
  }
  const why = (ico, t, d) => `<div class="med-why-item"><span class="med-why-ico" aria-hidden="true">${ico}</span><div><strong>${t}</strong><p>${d}</p></div></div>`;

  const isDone = (k) => Boolean(S[k]);
  const canRun = (k) => { const i = STEPS.indexOf(k); return !S.running && (i === 0 || isDone(STEPS[i - 1])); };

  function updateSteps() {
    STEPS.forEach((k) => {
      const li = $(`.med-step[data-step="${k}"]`);
      const state = S.running === k ? 'running' : isDone(k) ? 'done' : canRun(k) ? 'ready' : 'locked';
      li.dataset.state = state;
      $(`[data-state-for="${k}"]`).textContent = { running: 'Running…', done: 'Done', ready: 'Ready', locked: 'Waiting' }[state];
      $('.med-step-btn', li).disabled = state === 'locked' || state === 'running';
    });
    $('#med-run-all').disabled = Boolean(S.running);
    $('#med-reset').disabled = Boolean(S.running);
  }

  function showPanel(k, initial) {
    $$('.med-panel').forEach((p) => { p.hidden = p.dataset.panel !== k; });
    $$('.med-step').forEach((li) => li.classList.toggle('is-current', li.dataset.step === k));
    const p = $(`.med-panel[data-panel="${k}"]`);
    if (!isDone(k)) p.innerHTML = pendingPanel(k);
    if (!initial) p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function pendingPanel(k) {
    const blurb = {
      raw: 'Generate the five synthetic CSV files exactly as notebook 01 does (fake shapes: national IDs start 99, phones +650, cards 9…, emails @example.com).',
      bronze: 'Load the files into typed landing tables, remove the planted duplicate transactions and run the integrity checks (notebook 02).',
      silver: 'Send each distinct identifier to the live REST service once, then join the tokens back. Personal columns are dropped (notebook 03).',
      gold: 'Run the fraud rules on tokens only and prove the totals match the raw data (notebook 04).',
      disclosure: 'Process three fictional police requests: tokenize what they supply, match in Silver, then detokenize under the disclosure identity and log every request (notebook 07).'
    }[k];
    return `<div class="med-pending"><div class="med-pending-badge" data-layer="${k}">${LAYER[k].name}</div><p>${blurb}</p>
      <button class="btn btn-proceed" data-run="${k}" ${canRun(k) ? '' : 'disabled'}>${btnLabel(k)}</button></div>`;
  }

  function btnLabel(k) {
    if (S.running) return 'Pipeline running…';
    if (canRun(k)) return `Run ${LAYER[k].name} step →`;
    const prev = STEPS[STEPS.indexOf(k) - 1];
    return prev ? `Run ${LAYER[prev].name} first` : 'Waiting';
  }

  function log(msg) {
    const el = $('#med-log');
    el.hidden = false;
    el.textContent = msg;
  }

  async function runStep(k) {
    if (!canRun(k)) return;
    S.running = k;
    updateSteps();
    showPanel(k);
    $(`.med-panel[data-panel="${k}"]`).innerHTML = `<div class="med-pending"><span class="auth-spinner is-on"></span><p>Running ${LAYER[k].name}…</p></div>`;
    // Re-running a step invalidates everything downstream
    STEPS.slice(STEPS.indexOf(k)).forEach((x) => { S[x] = null; });
    const t0 = performance.now();
    try {
      if (k === 'raw') { log('Generating synthetic source files…'); await wait(250); await runRaw(); }
      if (k === 'bronze') { log('Loading landing tables…'); await wait(250); await runBronze(); }
      if (k === 'silver') await runSilver(log);
      if (k === 'gold') { log('Running fraud rules on tokens…'); await wait(250); runGold(); }
      if (k === 'disclosure') await runDisclosure(log);
      S[k].ms = performance.now() - t0;
      $('#med-log').hidden = true;
      S.running = false;
      renderPanel(k);
      if (k === 'silver' || k === 'gold' || k === 'disclosure') renderTraceOptions();
      document.dispatchEvent(new CustomEvent('tk:pipeline', { detail: { step: k } }));
    } catch (e) {
      S.running = false;
      S[k] = null;
      $('#med-log').hidden = true;
      $(`.med-panel[data-panel="${k}"]`).innerHTML = `<div class="tk-error">⚠️ ${esc(e.message || e)}</div>${pendingPanel(k)}`;
      if (e.code === 'unauthenticated' || e.status === 401) return;
    }
    updateSteps();
  }

  async function runAll() {
    for (const k of STEPS) {
      if (!isDone(k) || k === 'raw') {
        if (k === 'raw') STEPS.forEach((x) => { S[x] = null; });
        await runStep(k);
        if (!isDone(k)) return;
        await wait(350);
      }
    }
    showPanel('disclosure');
  }

  function reset() {
    STEPS.forEach((x) => { S[x] = null; });
    S.engine = null;
    $('#med-trace').hidden = true;
    updateSteps();
    showPanel('raw', true);
  }

  // -------------------------------------------------------------- panels
  function panelHead(k, sub, chips = '') {
    return `<div class="med-panel-head" data-layer="${k}"><div><span class="med-chip">${LAYER[k].name}</span><h5>${sub}</h5></div><div class="tk-row">${chips}<span class="tk-chip">${(S[k].ms / 1000).toFixed(2)} s</span>${STEPS.indexOf(k) < 4 && isDone(k) ? `<button class="btn btn-outline tk-btn-sm" data-run="${STEPS[STEPS.indexOf(k) + 1]}" ${isDone(STEPS[STEPS.indexOf(k) + 1]) ? 'hidden' : ''}>Next: ${LAYER[STEPS[STEPS.indexOf(k) + 1]].name} →</button>` : ''}</div></div>`;
  }

  function renderPanel(k) {
    const p = $(`.med-panel[data-panel="${k}"]`);
    if (k === 'raw') {
      const files = S.raw.files;
      const rows = Object.entries(files).map(([name, text]) => ({ file: name, rows: text.trim().split('\n').length - 1, size: `${(text.length / 1024).toFixed(1)} KB` }));
      const preview = files['customers.csv'].split('\n').slice(0, 6).join('\n');
      p.innerHTML = panelHead('raw', 'Five CSV files landed in the raw-files volume') + `
        <div class="tk-grid-2 med-gap">
          <div><div class="tk-subhead">Files</div>${tableHtml(rows, ['file', 'rows', 'size'])}
            <p class="tk-muted med-note">transactions.csv carries 3 exact duplicate rows on purpose, to show the clean-up in Bronze.</p></div>
          <div><div class="tk-subhead">customers.csv (first 5 rows · synthetic personal data)</div><pre class="output-code-container tk-pre tk-pre-sm med-csv">${esc(preview)}</pre></div>
        </div>`;
    }
    if (k === 'bronze') {
      const T = S.bronze.tables;
      const rows = Object.entries(T).map(([name, r]) => ({ table: name, rows: r.length, columns: Object.keys(r[0]).length, personal_data: /customers|accounts|transactions|requests/.test(name) ? 'Yes' : 'IDs' }));
      const schema = Object.keys(T['landing.customers'][0]);
      const pii = ['customer_id', 'full_name', 'national_id', 'date_of_birth', 'email', 'phone'];
      p.innerHTML = panelHead('bronze', 'Typed landing tables, de-duplicated and checked') + `
        <div class="tk-grid-2 med-gap">
          <div><div class="tk-subhead">Quality gates</div>${checksHtml(S.bronze.checks)}</div>
          <div><div class="tk-subhead">Tables written (counts only: Bronze holds raw PII)</div>${tableHtml(rows, ['table', 'rows', 'columns'])}
            <div class="tk-subhead">landing.customers schema</div>
            <div class="med-cols">${schema.map((c) => `<span class="med-col ${pii.includes(c) ? 'is-pii' : ''}">${esc(c)}</span>`).join('')}</div>
            <p class="tk-muted med-note">🔒 Restricted to data engineers. Following the notebook's rule, Bronze rows are never displayed in a demo.</p></div>
        </div>`;
    }
    if (k === 'silver') {
      const Sv = S.silver;
      const totalVals = Sv.calls.reduce((a, c) => a + c.count, 0);
      const callRows = Sv.calls.map((c) => ({ field: C.FIELDS[c.field].label, source: c.source, distinct_values: c.count, engine: c.engine === 'tokcore' ? 'Live REST' : 'Browser', example: `${c.sample[0]} → ${c.sample[1]}` }));
      const colRows = [
        ['customer_id', 'customer_tok', 'Tokenized (ssn · digits)'], ['national_id', 'national_id_tok', 'Tokenized (ssn · digits)'],
        ['account_number', 'account_tok', 'Tokenized (ssn · digits)'], ['card_pan', 'card_pan_tok', 'Tokenized (pan_primary · keeps BIN + last 4)'],
        ['counterparty_account', 'counterparty_account_tok', 'Tokenized (same domain as accounts → joinable)'],
        ['date_of_birth', 'birth_year', 'Generalized to year'], ['full_name', '—', 'Dropped'], ['email', '—', 'Dropped'], ['phone', '—', 'Dropped']
      ].map(([a, b, c]) => ({ bronze: a, silver: b, treatment: c }));
      p.innerHTML = panelHead('silver', 'Identifiers tokenized by the REST service; personal columns removed', engineChip(Sv.engine)) + `
        <div class="med-stat-row">
          <div><span>Distinct values tokenized</span><strong>${fmt(totalVals)}</strong></div>
          <div><span>REST calls</span><strong>${Sv.calls.length}</strong></div>
          <div><span>Token service time</span><strong>${Sv.engine === 'tokcore' ? Math.round(Sv.calls.reduce((a, c) => a + (c.ms || 0), 0)) + ' ms' : 'local'}</strong></div>
          <div><span>Identity used</span><strong>ingest <small>(tokenize only)</small></strong></div>
        </div>
        <div class="tk-subhead">Token maps: only distinct values are sent, once each, then joined back</div>
        ${tableHtml(callRows, ['field', 'source', 'distinct_values', 'engine', 'example'])}
        <div class="tk-grid-2 med-gap">
          <div><div class="tk-subhead">Column decisions, Bronze → Silver</div>${tableHtml(colRows, ['bronze', 'silver', 'treatment'])}</div>
          <div><div class="tk-subhead">Quality gates</div>${checksHtml(Sv.checks)}</div>
        </div>
        <div class="tk-subhead">silver.transactions: tokens only, safe to display</div>
        ${tableHtml(Sv.tables['silver.transactions'].slice(0, 6), ['transaction_id', 'account_tok', 'customer_tok', 'value_date', 'txn_type', 'amount', 'counterparty_account_tok', 'card_pan_tok'], { token: ['account_tok', 'customer_tok', 'counterparty_account_tok', 'card_pan_tok'], money: ['amount'] })}`;
    }
    if (k === 'gold') {
      const G = S.gold;
      const eq = G.equivalence;
      p.innerHTML = panelHead('gold', 'Fraud indicators built only from Silver tokens') + `
        <div class="tk-subhead">Rules (demo thresholds)</div>
        <div class="med-rules">${G.rules.map((r) => `<div class="med-rule ${r.hits === r.expected ? 'ok' : 'bad'}"><div class="med-rule-top"><strong>${r.rule}</strong><span>${r.hits} / ${r.expected} accounts</span></div><p>${esc(r.logic)}</p></div>`).join('')}</div>
        <div class="tk-grid-2 med-gap">
          <div><div class="tk-subhead">gold.case_summary</div>${tableHtml(G.caseSummary, ['case_id', 'case_type', 'account_tok', 'txn_count', 'total_amount', 'rules_hit'], { token: ['account_tok'], money: ['total_amount'] })}</div>
          <div><div class="tk-subhead">gold.customer_risk (top 6)</div>${tableHtml(G.customerRisk.slice(0, 6), ['customer_tok', 'birth_year', 'txn_count', 'debit_total', 'rules_hit'], { token: ['customer_tok'], money: ['debit_total'] })}</div>
        </div>
        <div class="med-equiv ${eq.equivalent ? 'ok' : 'bad'}">
          <div class="med-equiv-title">${eq.equivalent ? '✓ PASS' : '✗ FAIL'}: Bronze (raw identifiers) and Silver (tokens) give the same totals</div>
          <div class="med-equiv-grid">
            <div></div><div class="h">Transactions</div><div class="h">Total amount</div><div class="h">Customers</div>
            <div class="h">Raw</div><div>${fmt(eq.raw.n)}</div><div>${money(eq.raw.total)}</div><div>${eq.raw.customers}</div>
            <div class="h">Tokens</div><div>${fmt(eq.toks.n)}</div><div>${money(eq.toks.total)}</div><div>${eq.toks.customers}</div>
          </div>
        </div>
        <div class="tk-subhead">gold.suspicious_activity (${G.alerts.length} alert windows)</div>
        ${tableHtml(G.alerts.slice(0, 8), ['rule', 'account_tok', 'customer_tok', 'window_start', 'events', 'amount'], { token: ['account_tok', 'customer_tok'], money: ['amount'] })}`;
    }
    if (k === 'disclosure') {
      const D = S.disclosure;
      const outcomeChip = (o) => `<span class="tk-dec tk-dec-${o === 'DISCLOSED' ? 'clear' : o === 'NO_MATCH' ? 'mask' : 'deny'}">${o}</span>`;
      p.innerHTML = panelHead('disclosure', 'Fictional police requests: tokenize → match → detokenize → evidence', engineChip(S.engine === 'browser' ? 'browser' : 'tokcore')) + `
        <div class="med-requests">${D.auditLog.map((a) => `
          <div class="med-req ${a.outcome.toLowerCase()}">
            <div class="med-req-top"><strong>${a.request_id}</strong>${outcomeChip(a.outcome)}</div>
            <div class="med-req-meta">${esc(a.legal_reference)} · ${a.date_from} → ${a.date_to}</div>
            <ol class="med-req-steps">${a.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
            ${a.outcome === 'DISCLOSED' ? `<button class="btn btn-outline tk-btn-sm" data-evidence="${a.request_id}">View ${a.transactions_disclosed} evidence rows</button>` : ''}
          </div>`).join('')}</div>
        <div id="med-evidence"></div>
        <div class="tk-subhead">disclosure.audit_log</div>
        ${tableHtml(D.auditLog.map((a) => ({ ...a, token_service_request_ids: a.token_service_request_ids ? a.token_service_request_ids.split(';').length + ' ids' : '' })), ['request_id', 'outcome', 'detail', 'executed_by', 'decisions', 'token_service_request_ids', 'method', 'logged_at'])}
        <p class="tk-muted med-note">Simulated demo: the police unit, orders and requests are fictional. Evidence rows are restricted output.</p>`;
      const first = D.auditLog.find((a) => a.outcome === 'DISCLOSED');
      if (first) renderEvidence(first.request_id);
    }
    showPanel(k, true);
    updateSteps();
  }

  function renderEvidence(id) {
    const rows = S.disclosure.evidence.filter((e) => e.request_id === id);
    $('#med-evidence').innerHTML = `<div class="tk-subhead">disclosure.evidence · ${id} (detokenized, restricted)</div>` +
      tableHtml(rows, ['transaction_id', 'value_date', 'txn_type', 'direction', 'amount', 'account_number', 'customer_id', 'card_pan', 'counterparty_account', 'account_decision'], { pii: ['account_number', 'customer_id', 'card_pan', 'counterparty_account'], money: ['amount'], scroll: true });
  }

  // -------------------------------------------------------------- lineage trace
  function renderTraceOptions() {
    if (!S.silver) return;
    const sel = $('#med-trace-select');
    const keep = sel.value;
    sel.innerHTML = S.bronze.tables['landing.investigation_cases'].map((k) => `<option value="${k.case_id}">${k.case_id} · ${k.case_type}</option>`).join('');
    if (keep) sel.value = keep;
    $('#med-trace').hidden = false;
    renderTrace();
  }

  function renderTrace() {
    const id = $('#med-trace-select').value;
    const k = S.bronze.tables['landing.investigation_cases'].find((c) => c.case_id === id);
    const acct = S.bronze.tables['landing.accounts'].find((a) => a.account_number === k.account_number);
    const rawLine = S.raw.files['accounts.csv'].split('\n').find((l) => l.startsWith(acct.account_number + ','));
    const sAcct = S.silver.tables['silver.accounts'].find((a) => a.account_tok === S.silver.maps.account_number.get(acct.account_number));
    const gCase = S.gold && S.gold.caseSummary.find((c) => c.case_id === id);
    const ev = S.disclosure && S.disclosure.evidence.find((e) => e.account_number === acct.account_number);
    const stage = (layer, title, body) => `<div class="med-trace-step" data-layer="${layer}"><span class="med-chip">${LAYER[layer].name}</span><div><strong>${title}</strong>${body}</div></div>`;
    $('#med-trace-out').innerHTML = `<div class="med-trace-flow">
      ${stage('raw', 'accounts.csv', `<code class="med-pii">${esc(rawLine)}</code>`)}
      ${stage('bronze', 'landing.accounts', `<div class="med-kv"><span>account_number</span><code class="med-pii">${acct.account_number}</code><span>customer_id</span><code class="med-pii">${acct.customer_id}</code><span>card_pan</span><code class="med-pii">${acct.card_pan}</code></div>`)}
      ${stage('silver', 'silver.accounts', `<div class="med-kv"><span>account_tok</span><code class="tk-token">${sAcct.account_tok}</code><span>customer_tok</span><code class="tk-token">${sAcct.customer_tok}</code><span>card_pan_tok</span><code class="tk-token">${sAcct.card_pan_tok}</code></div>`)}
      ${gCase ? stage('gold', 'gold.case_summary', `<div class="med-kv"><span>case</span><code>${gCase.case_id} · ${gCase.case_type}</code><span>txn_count</span><code>${gCase.txn_count}</code><span>rules_hit</span><code>${esc(gCase.rules_hit || 'none')}</code></div>`) : stage('gold', 'gold.case_summary', '<span class="tk-muted">Run the Gold step to see this account\'s case summary.</span>')}
      ${ev ? stage('disclosure', 'disclosure.evidence', `<div class="med-kv"><span>account_number</span><code class="med-pii">${ev.account_number}</code><span>card_pan</span><code class="med-pii">${ev.card_pan}</code><span>round trip</span><code class="${ev.account_number === acct.account_number && ev.card_pan === acct.card_pan ? 'tk-ok' : 'tk-bad'}">${ev.account_number === acct.account_number && ev.card_pan === acct.card_pan ? '✓ matches Bronze' : '✗ mismatch'}</code></div>`)
        : stage('disclosure', 'disclosure.evidence', '<span class="tk-muted">Only accounts named in a police request are ever detokenized. This one was not requested, so it stays tokenized.</span>')}
    </div>`;
  }

  // -------------------------------------------------------------- public API for the console tab
  window.TkMedallion = {
    samples() {
      if (!S.silver) return null;
      const B = S.bronze.tables;
      const pick = (arr, n) => arr.slice(0, n);
      return {
        customer_id: { raw: pick(B['landing.customers'].map((c) => c.customer_id), 3) },
        national_id: { raw: pick(B['landing.customers'].map((c) => c.national_id), 3) },
        account_number: { raw: pick(B['landing.accounts'].map((a) => a.account_number), 3) },
        card_pan: { raw: pick(B['landing.accounts'].map((a) => a.card_pan), 3) },
        tokens: {
          customer_id: pick(S.silver.tables['silver.customers'].map((c) => c.customer_tok), 3),
          national_id: pick(S.silver.tables['silver.customers'].map((c) => c.national_id_tok), 3),
          account_number: pick(S.silver.tables['silver.accounts'].map((a) => a.account_tok), 3),
          card_pan: pick(S.silver.tables['silver.accounts'].map((a) => a.card_pan_tok), 3)
        },
        engine: S.engine
      };
    }
  };

  document.addEventListener('tk:ready', () => { if (!$('#med-steps')) renderShell(); });
  if (!$('#tab-medallion').children.length) renderShell();
})();
