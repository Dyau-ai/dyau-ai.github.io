/**
 * Dyau.ai — Tokenization demo: sign-in gate, session chrome and live-status ribbon.
 * Depends on js/tk-client.js (window.TkClient).
 */
(function () {
  'use strict';

  const C = window.TkClient;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const gate = $('#auth-gate');
  const app = $('#tk-app');
  const steps = { email: $('#auth-email-form'), code: $('#auth-code-form'), unconfigured: $('#auth-unconfigured'), checking: $('#auth-checking') };
  let pendingEmail = '';
  let resendTimer = null;
  let started = false;

  function showStep(name) {
    Object.entries(steps).forEach(([k, el]) => { el.hidden = k !== name; });
    const focus = { email: '#auth-email', code: '#auth-otp-0' }[name];
    if (focus) setTimeout(() => $(focus).focus(), 30);
  }

  function setBusy(btn, busy) {
    btn.disabled = busy;
    btn.classList.toggle('is-busy', busy);
    $('.auth-spinner', btn).classList.toggle('is-on', busy);
  }

  function showError(el, msg) {
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  // ---------------------------------------------------------------- OTP boxes
  const boxes = $$('.otp-box');
  const codeValue = () => boxes.map((b) => b.value).join('');
  function fillCode(str) {
    const digits = String(str).replace(/\D/g, '').slice(0, 6).split('');
    boxes.forEach((b, i) => { b.value = digits[i] || ''; });
    const next = boxes.find((b) => !b.value) || boxes[5];
    next.focus();
    if (digits.length === 6) $('#auth-code-form').requestSubmit();
  }
  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      const v = box.value.replace(/\D/g, '');
      if (v.length > 1) { fillCode(v); return; }   // paste / autofill into one box
      box.value = v;
      if (v && i < 5) boxes[i + 1].focus();
      if (codeValue().length === 6) $('#auth-code-form').requestSubmit();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) { boxes[i - 1].focus(); boxes[i - 1].value = ''; e.preventDefault(); }
      if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && i < 5) boxes[i + 1].focus();
    });
    box.addEventListener('paste', (e) => {
      const t = (e.clipboardData || window.clipboardData).getData('text');
      if (t) { e.preventDefault(); fillCode(t); }
    });
    box.addEventListener('focus', () => box.select());
  });

  function startResendCountdown(sec = 45) {
    const btn = $('#auth-resend');
    clearInterval(resendTimer);
    let left = sec;
    btn.disabled = true;
    btn.textContent = `Resend code in ${left}s`;
    resendTimer = setInterval(() => {
      left -= 1;
      if (left <= 0) { clearInterval(resendTimer); btn.disabled = false; btn.textContent = 'Resend code'; }
      else btn.textContent = `Resend code in ${left}s`;
    }, 1000);
  }

  async function sendCode(email, btn) {
    const r = await C.auth.requestCode(email);
    if (r.token) return;   // email-only mode: already signed in
    pendingEmail = email;
    $('#auth-code-sub').innerHTML = `If <strong></strong> is on the invite list, a code is on its way. It expires in 10 minutes.`;
    $('#auth-code-sub strong').textContent = email;
    const dev = $('#auth-dev-code');
    if (r.dev_code) { dev.hidden = false; dev.textContent = `Development mode: your code is ${r.dev_code}`; }
    else dev.hidden = true;
    boxes.forEach((b) => { b.value = ''; });
    showError($('#auth-code-error'), '');
    showStep('code');
    startResendCountdown();
    void btn;
  }

  $('#auth-email-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#auth-email');
    const email = input.value.trim();
    const errEl = $('#auth-email-error');
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) { showError(errEl, 'Enter a valid email address.'); input.focus(); return; }
    showError(errEl, '');
    const btn = $('#auth-email-btn');
    setBusy(btn, true);
    try { await sendCode(email, btn); }
    catch (err) { showError(errEl, err.message); }
    finally { setBusy(btn, false); }
  });

  $('#auth-code-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = codeValue();
    const errEl = $('#auth-code-error');
    if (code.length !== 6) { showError(errEl, 'Enter all 6 digits.'); return; }
    const btn = $('#auth-code-btn');
    if (btn.disabled) return;
    setBusy(btn, true);
    showError(errEl, '');
    try {
      await C.auth.verify(pendingEmail, code);
    } catch (err) {
      showError(errEl, err.message);
      boxes.forEach((b) => { b.value = ''; });
      boxes[0].focus();
    } finally { setBusy(btn, false); }
  });

  $('#auth-back').addEventListener('click', () => { clearInterval(resendTimer); showStep('email'); });
  $('#auth-resend').addEventListener('click', async () => {
    const errEl = $('#auth-code-error');
    try { await sendCode(pendingEmail); showError(errEl, ''); }
    catch (err) { showError(errEl, err.message); }
  });

  // ---------------------------------------------------------------- app chrome
  function enterApp(session) {
    gate.hidden = true;
    app.hidden = false;
    $('#tk-user-email').textContent = session.email;
    $('#tk-user-avatar').textContent = (session.email || '?')[0].toUpperCase();
    $('#tk-user').title = `Signed in until ${new Date(session.exp * 1000).toLocaleString()}`;
    document.title = 'Vaultless Data Tokenization | Dyau.ai Demo';
    C.probe();
    if (!started) {
      started = true;
      document.dispatchEvent(new CustomEvent('tk:ready', { detail: session }));
    }
    window.scrollTo(0, 0);
  }

  function leaveApp(reason) {
    app.hidden = true;
    gate.hidden = false;
    showStep('email');
    if (reason) showError($('#auth-email-error'), reason);
  }

  C.on('signedin', enterApp);
  C.on('signedout', (d) => leaveApp(d && d.reason));
  $('#btn-signout').addEventListener('click', () => C.auth.signOut());

  // Live-status ribbon + fallback banner
  C.on('status', (s) => {
    const pill = $('#ribbon-live');
    const text = $('#ribbon-live-text');
    pill.dataset.mode = s.mode;
    const host = C.auth.gatewayHost();
    text.textContent = {
      live: 'Live REST service: connected',
      ready: 'Live REST service: ready',
      fallback: 'Live REST service: unavailable · using fallback',
      unknown: 'Live REST service: checking…'
    }[s.mode] || s.mode;
    pill.title = host ? `Calls go to the Dyau.ai gateway (${host}); the token service itself is never exposed.` : '';
    const banner = $('#tk-fallback-banner');
    banner.hidden = s.mode !== 'fallback';
    $('#tk-fallback-reason').textContent = s.reason ? s.reason.replace(/\.?$/, '.') : '';
  });
  $('#btn-retry-live').addEventListener('click', () => C.probe());

  // Context notice + lab-only controls follow the active tab
  const LIVE_TABS = new Set(['tab-medallion', 'tab-api']);
  function onTab(id) {
    const live = LIVE_TABS.has(id);
    $('#region-switch').hidden = live;
    $('#btn-reset-tk').hidden = live;
    $('#tk-notice').classList.toggle('is-lab', !live);
    $('#tk-notice-text').innerHTML = live
      ? '<strong>Live service.</strong> Tokenize and detokenize calls on these tabs go to the real token service through Dyau.ai\'s secure gateway: your session is checked, the service address stays hidden, and every call is audited. All data is synthetic.'
      : '<strong>Concept lab, running in your browser.</strong> These labs use an in-browser reference engine with a throwaway key so each mechanism can be inspected step by step. Nothing typed here leaves the page.';
  }
  $$('.ws-tab-btn').forEach((b) => b.addEventListener('click', () => onTab(b.dataset.tab)));
  onTab('tab-medallion');

  // ---------------------------------------------------------------- boot
  (async function boot() {
    if (!C.auth.configured()) { showStep('unconfigured'); return; }
    showStep('checking');
    if ((await C.auth.mode()) === 'email') {
      $('.auth-btn-label', $('#auth-email-btn')).textContent = 'Continue';
      $('#auth-email-form .auth-sub').textContent = 'Enter your invited work email to open the demo.';
    }
    const s = await C.auth.restore();
    if (s) enterApp(s);
    else showStep('email');
  })();
})();
