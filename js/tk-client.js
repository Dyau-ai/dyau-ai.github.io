/**
 * Dyau.ai — Tokenization demo: secure-gateway client
 * ------------------------------------------------------------------
 *  - Email one-time-code sign-in against the Dyau.ai gateway (Cloudflare Worker)
 *  - REST calls: POST {gateway}/api/tokenize | /api/detokenize
 *  - Automatic fallback to the in-browser NIST FF1 reference engine when the live
 *    service is unreachable or rate-limited (clearly reported to the UI).
 *
 * The browser only ever talks to the gateway. The token service address, its
 * identities and credentials live server-side and are never sent to the page.
 * Depends on: js/config.js (window.DYAU_CONFIG), js/fpe-engine.js (window.DyauFPE)
 */
(function () {
  'use strict';

  const E = window.DyauFPE;
  const CFG = window.DYAU_CONFIG || {};
  const API = String(CFG.apiBase || '').replace(/\/$/, '');
  const STORE_KEY = 'dyau-tok-session';

  // Same field policy the gateway enforces (labels for the UI only)
  const FIELDS = {
    customer_id:    { label: 'Customer ID',    domain: 'ssn',         kind: 'digits', target: 'customers.customer_id',   min: 6,  max: 19 },
    national_id:    { label: 'National ID',    domain: 'ssn',         kind: 'digits', target: 'customers.national_id',   min: 6,  max: 19 },
    account_number: { label: 'Account number', domain: 'ssn',         kind: 'digits', target: 'accounts.account_number', min: 6,  max: 19 },
    card_pan:       { label: 'Card number',    domain: 'pan_primary', kind: 'pan',    target: null,                      min: 13, max: 19 }
  };

  class ApiError extends Error {
    constructor(status, code, message, retryAfter) {
      super(message || code);
      this.status = status; this.code = code; this.retryAfter = retryAfter;
    }
  }

  // ------------------------------------------------------------------ session
  let session = null;
  function loadSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
      if (s && s.token && s.exp * 1000 > Date.now()) return s;
    } catch (e) { /* storage blocked */ }
    return null;
  }
  function saveSession(s) {
    session = s;
    try { s ? sessionStorage.setItem(STORE_KEY, JSON.stringify(s)) : sessionStorage.removeItem(STORE_KEY); } catch (e) { /* in-memory only */ }
  }

  const listeners = {};
  const on = (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); };
  const emit = (evt, data) => (listeners[evt] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } });

  async function request(path, { method = 'POST', body, auth = true } = {}) {
    if (!API) throw new ApiError(0, 'not_configured', 'The demo gateway is not configured for this site.');
    const headers = { 'Content-Type': 'application/json' };
    if (auth && session) headers.Authorization = 'Bearer ' + session.token;
    let r;
    try {
      r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined, credentials: 'omit', cache: 'no-store' });
    } catch (e) {
      throw new ApiError(0, 'network_error', 'Could not reach the Dyau.ai gateway.');
    }
    let data = {};
    try { data = await r.json(); } catch (e) { /* empty */ }
    if (!r.ok) {
      const err = new ApiError(r.status, data.error || 'http_' + r.status, data.message || 'Request failed.', r.headers.get('Retry-After'));
      if (r.status === 401 || (r.status === 403 && err.code === 'not_invited')) {
        saveSession(null);
        emit('signedout', { reason: err.message });
      }
      throw err;
    }
    return data;
  }

  // ------------------------------------------------------------------ auth API
  const auth = {
    configured: () => Boolean(API),
    gatewayHost: () => { try { return new URL(API).host; } catch (e) { return ''; } },
    current: () => session,
    async restore() {
      session = loadSession();
      if (!session) return null;
      try {
        const me = await request('/auth/me', { method: 'GET' });
        session.me = me;
        return session;
      } catch (e) {
        if (e.status === 401 || e.status === 403) return null;
        return session; // gateway briefly unreachable: keep the session, calls will fall back
      }
    },
    async requestCode(email) {
      const d = await request('/auth/request-code', { body: { email }, auth: false });
      if (d.token) {   // email-only mode: signed in straight away
        saveSession({ token: d.token, email: d.email, exp: d.expires_at });
        try { session.me = await request('/auth/me', { method: 'GET' }); } catch (e) { /* ok */ }
        emit('signedin', session);
      }
      return d;
    },
    async mode() {
      try { const r = await fetch(API + '/health', { cache: 'no-store', credentials: 'omit' }); return (await r.json()).auth || 'code'; }
      catch (e) { return 'code'; }
    },
    async verify(email, code) {
      const d = await request('/auth/verify', { body: { email, code }, auth: false });
      saveSession({ token: d.token, email: d.email, exp: d.expires_at });
      try { session.me = await request('/auth/me', { method: 'GET' }); } catch (e) { /* ok */ }
      emit('signedin', session);
      return session;
    },
    async signOut() {
      try { await request('/auth/logout', {}); } catch (e) { /* ignore */ }
      saveSession(null);
      emit('signedout', { reason: 'You have signed out.' });
    }
  };

  // ------------------------------------------------------------------ fallback engine
  const fb = { key: E.randomKey(), registry: {} };
  Object.keys(FIELDS).forEach((f) => { fb.registry[f] = new Map(); });

  function fbOp(field, value, encrypt) {
    const f = FIELDS[field];
    const tweak = `${f.domain}|${f.target || ''}`;
    return f.kind === 'pan' ? E.panOp(fb.key, tweak, value, encrypt).value : E.fpTransform(fb.key, E.ALPHABETS.digits, tweak, value, encrypt);
  }

  function browserCall(op, field, values) {
    const t0 = performance.now();
    let out, decision;
    if (op === 'tokenize') {
      out = values.map((v) => { const t = fbOp(field, v, true); fb.registry[field].set(t, v); return t; });
      decision = 'tokenized';
    } else {
      // Only tokens this browser session produced can be verified offline
      out = values.map((t) => (fb.registry[field].has(t) ? fbOp(field, t, false) : null));
      decision = out.every((v) => v !== null) ? 'clear' : (out.some((v) => v !== null) ? 'partial' : 'unknown_offline');
    }
    return { values: out, decision, engine: 'browser', request_id: 'local-' + Math.random().toString(16).slice(2, 10), ms: performance.now() - t0 };
  }

  // ------------------------------------------------------------------ status
  const status = { mode: 'unknown', reason: '', lastLiveOk: null, quota: null };
  function setStatus(mode, reason) {
    status.mode = mode; status.reason = reason || '';
    emit('status', { ...status });
  }

  const FALLBACK_CODES = new Set(['network_error', 'live_service_unavailable', 'live_rate_limited', 'user_quota_exceeded', 'demo_quota_exceeded', 'http_502', 'http_504', 'internal_error']);

  /**
   * Tokenize / detokenize.
   * opts.engine: 'auto' (live, fall back if unavailable) | 'live' (no fallback) | 'browser'
   * Returns { values, decision, engine, request_id, ms, fallbackReason? }
   */
  async function call(op, field, values, opts = {}) {
    if (!FIELDS[field]) throw new ApiError(400, 'unknown_field', 'Unknown field');
    const mode = opts.engine || 'auto';
    if (mode === 'browser') return browserCall(op, field, values);

    const per = (session && session.me && session.me.limits && session.me.limits.per_call) || 1000;
    try {
      const out = { values: [], decision: null, engine: 'tokcore', request_ids: [], ms: 0 };
      for (let i = 0; i < values.length; i += per) {
        const d = await request('/api/' + op, { body: { field, values: values.slice(i, i + per) } });
        out.values.push(...d.values);
        out.decision = d.decision;
        out.request_ids.push(d.request_id);
        out.ms += d.ms || 0;
        if (d.quota) status.quota = d.quota;
      }
      out.request_id = out.request_ids.filter(Boolean).join(', ');
      status.lastLiveOk = Date.now();
      setStatus('live', '');
      return out;
    } catch (e) {
      if (mode === 'auto' && FALLBACK_CODES.has(e.code)) {
        setStatus('fallback', e.message);
        const r = browserCall(op, field, values);
        r.fallbackReason = e.message;
        return r;
      }
      throw e;
    }
  }

  /** Lightweight health probe so the ribbon can show live/fallback before the first call. */
  async function probe() {
    if (!API) { setStatus('fallback', 'Gateway not configured'); return; }
    try {
      const r = await fetch(API + '/health', { cache: 'no-store', credentials: 'omit' });
      if (!r.ok) throw new Error();
      const live = session && session.me ? session.me.live : true;
      setStatus(live ? 'ready' : 'fallback', live ? '' : 'Live token service not configured on the gateway');
    } catch (e) {
      setStatus('fallback', 'Gateway unreachable');
    }
  }

  window.TkClient = { FIELDS, ApiError, auth, call, probe, on, status: () => ({ ...status }), apiBase: API };
})();
