/**
 * Dyau.ai — In-Browser Tokenization Demo Engine
 * ------------------------------------------------------------------
 * A self-contained, standards-based reference engine for the public demo:
 *   - AES (FIPS 197) block cipher, forward direction only
 *   - FF1 format-preserving encryption (NIST SP 800-38G), integer-only (BigInt)
 *   - Minimum domain rule radix^len >= 1,000,000 enforced on every call
 *   - SHA-256 (FIPS 180-4) for audit value hashes and key fingerprints
 *
 * Demo-only: keys are generated randomly in this browser tab, held in memory,
 * and never stored or transmitted. This file makes no network calls.
 * It is NOT the production engine and contains no production code or keys.
 */
(function (root) {
  'use strict';

  // ==========================================================================
  // AES (encryption only — FF1 uses only the forward cipher)
  // ==========================================================================
  const SBOX = new Uint8Array(256);
  (function buildSbox() {
    // Build S-box from GF(2^8) inverse + affine transform
    let p = 1, q = 1;
    do {
      p = p ^ ((p << 1) & 0xff) ^ (p & 0x80 ? 0x1b : 0);
      q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff;
      if (q & 0x80) q ^= 0x09;
      const x = q ^ ((q << 1) | (q >> 7)) ^ ((q << 2) | (q >> 6)) ^ ((q << 3) | (q >> 5)) ^ ((q << 4) | (q >> 4));
      SBOX[p] = (x ^ 0x63) & 0xff;
    } while (p !== 1);
    SBOX[0] = 0x63;
  })();

  const xtime = (a) => ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff;

  function expandKey(key) {
    const nk = key.length / 4;
    if (![4, 6, 8].includes(nk)) throw new Error('AES key must be 16, 24 or 32 bytes');
    const nr = nk + 6;
    const w = new Uint8Array(16 * (nr + 1));
    w.set(key);
    let rcon = 1;
    for (let i = nk; i < 4 * (nr + 1); i++) {
      let t0 = w[4 * i - 4], t1 = w[4 * i - 3], t2 = w[4 * i - 2], t3 = w[4 * i - 1];
      if (i % nk === 0) {
        const tmp = t0;
        t0 = SBOX[t1] ^ rcon; t1 = SBOX[t2]; t2 = SBOX[t3]; t3 = SBOX[tmp];
        rcon = xtime(rcon);
      } else if (nk > 6 && i % nk === 4) {
        t0 = SBOX[t0]; t1 = SBOX[t1]; t2 = SBOX[t2]; t3 = SBOX[t3];
      }
      const j = 4 * (i - nk);
      w[4 * i] = w[j] ^ t0; w[4 * i + 1] = w[j + 1] ^ t1;
      w[4 * i + 2] = w[j + 2] ^ t2; w[4 * i + 3] = w[j + 3] ^ t3;
    }
    return { w, nr };
  }

  function aesEncryptBlock(ks, input) {
    const { w, nr } = ks;
    const s = new Uint8Array(16);
    for (let i = 0; i < 16; i++) s[i] = input[i] ^ w[i];
    const t = new Uint8Array(16);
    for (let round = 1; round <= nr; round++) {
      // SubBytes + ShiftRows
      for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 4; r++) t[4 * c + r] = SBOX[s[4 * ((c + r) % 4) + r]];
      }
      if (round !== nr) {
        // MixColumns
        for (let c = 0; c < 4; c++) {
          const a0 = t[4 * c], a1 = t[4 * c + 1], a2 = t[4 * c + 2], a3 = t[4 * c + 3];
          const all = a0 ^ a1 ^ a2 ^ a3;
          s[4 * c] = a0 ^ all ^ xtime(a0 ^ a1);
          s[4 * c + 1] = a1 ^ all ^ xtime(a1 ^ a2);
          s[4 * c + 2] = a2 ^ all ^ xtime(a2 ^ a3);
          s[4 * c + 3] = a3 ^ all ^ xtime(a3 ^ a0);
        }
      } else {
        s.set(t);
      }
      const off = 16 * round;
      for (let i = 0; i < 16; i++) s[i] ^= w[off + i];
    }
    return s;
  }

  // ==========================================================================
  // FF1 (NIST SP 800-38G) — integer-only arithmetic via BigInt
  // ==========================================================================
  const MIN_DOMAIN = 1000000n;

  class DomainError extends Error {
    constructor(radix, len) {
      super(`Domain too small: ${radix}^${len} < 1,000,000 (NIST minimum). Use masking for this field.`);
      this.name = 'DomainError';
      this.radix = radix; this.len = len;
    }
  }

  function bytesToBig(bytes) {
    let x = 0n;
    for (const b of bytes) x = (x << 8n) | BigInt(b);
    return x;
  }

  function bigToBytes(x, len) {
    const out = new Uint8Array(len);
    for (let i = len - 1; i >= 0; i--) { out[i] = Number(x & 0xffn); x >>= 8n; }
    return out;
  }

  function byteLen(x) {
    let n = 0;
    while (x > 0n) { x >>= 8n; n++; }
    return n;
  }

  class FF1 {
    constructor(key, radix) {
      if (!(radix >= 2 && radix <= 65536)) throw new Error('Bad radix');
      this.ks = expandKey(key);
      this.radix = radix;
      this.R = BigInt(radix);
    }

    checkDomain(n) {
      if (n < 2 || this.R ** BigInt(n) < MIN_DOMAIN) throw new DomainError(this.radix, n);
    }

    num(x) { let v = 0n; for (const d of x) v = v * this.R + BigInt(d); return v; }

    str(v, m) {
      const out = new Array(m);
      for (let i = m - 1; i >= 0; i--) { out[i] = Number(v % this.R); v /= this.R; }
      return out;
    }

    prf(data) {
      // CBC-MAC with zero IV
      let y = new Uint8Array(16);
      for (let off = 0; off < data.length; off += 16) {
        const blk = new Uint8Array(16);
        for (let k = 0; k < 16; k++) blk[k] = y[k] ^ data[off + k];
        y = aesEncryptBlock(this.ks, blk);
      }
      return y;
    }

    run(tweak, x, encrypt) {
      const n = x.length;
      this.checkDomain(n);
      for (const d of x) if (d < 0 || d >= this.radix) throw new Error('Numeral out of range');
      const u = Math.floor(n / 2), v = n - u;
      // b = byte length of radix^v - 1 (replaces the floating-point ceil/log2 formula)
      const b = Math.max(1, byteLen(this.R ** BigInt(v) - 1n));
      const d = 4 * Math.ceil(b / 4) + 4;
      const t = tweak.length;
      const P = new Uint8Array(16);
      P[0] = 1; P[1] = 2; P[2] = 1;
      P[3] = (this.radix >> 16) & 0xff; P[4] = (this.radix >> 8) & 0xff; P[5] = this.radix & 0xff;
      P[6] = 10; P[7] = u & 0xff;
      P[8] = (n >>> 24) & 0xff; P[9] = (n >>> 16) & 0xff; P[10] = (n >>> 8) & 0xff; P[11] = n & 0xff;
      P[12] = (t >>> 24) & 0xff; P[13] = (t >>> 16) & 0xff; P[14] = (t >>> 8) & 0xff; P[15] = t & 0xff;
      const pad = ((-t - b - 1) % 16 + 16) % 16;
      const qLen = t + pad + 1 + b;
      const buf = new Uint8Array(16 + qLen);
      buf.set(P, 0);
      buf.set(tweak, 16);

      let A = x.slice(0, u), B = x.slice(u);
      const round = (i, half) => {
        buf[16 + t + pad] = i;
        buf.set(bigToBytes(this.num(half), b), 16 + t + pad + 1);
        const R = this.prf(buf);
        const S = new Uint8Array(Math.ceil(d / 16) * 16);
        S.set(R, 0);
        for (let j = 1; j * 16 < d; j++) {
          const blk = new Uint8Array(R);
          const jb = bigToBytes(BigInt(j), 16);
          for (let k = 0; k < 16; k++) blk[k] ^= jb[k];
          S.set(aesEncryptBlock(this.ks, blk), 16 * j);
        }
        return bytesToBig(S.subarray(0, d));
      };

      if (encrypt) {
        for (let i = 0; i < 10; i++) {
          const y = round(i, B);
          const m = i % 2 === 0 ? u : v;
          const mod = this.R ** BigInt(m);
          const c = (this.num(A) + y) % mod;
          A = B; B = this.str(c, m);
        }
      } else {
        for (let i = 9; i >= 0; i--) {
          const y = round(i, A);
          const m = i % 2 === 0 ? u : v;
          const mod = this.R ** BigInt(m);
          const c = (((this.num(B) - y) % mod) + mod) % mod;
          B = A; A = this.str(c, m);
        }
      }
      return A.concat(B);
    }

    encrypt(tweak, x) { return this.run(tweak, x, true); }
    decrypt(tweak, x) { return this.run(tweak, x, false); }
  }

  // ==========================================================================
  // SHA-256 (sync) — used for audit value hashes, chain hashes, key fingerprints
  // ==========================================================================
  const K256 = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);

  function sha256(bytes) {
    const l = bytes.length;
    const withPad = new Uint8Array(Math.ceil((l + 9) / 64) * 64);
    withPad.set(bytes); withPad[l] = 0x80;
    const bits = l * 8;
    const dv = new DataView(withPad.buffer);
    dv.setUint32(withPad.length - 8, Math.floor(bits / 0x100000000));
    dv.setUint32(withPad.length - 4, bits >>> 0);
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const W = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < withPad.length; off += 64) {
      for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + 4 * i);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
        const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K256[i] + W[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    let hex = '';
    for (const v of H) hex += v.toString(16).padStart(8, '0');
    return hex;
  }

  const utf8 = (s) => new TextEncoder().encode(s);
  const sha256Hex = (s) => sha256(typeof s === 'string' ? utf8(s) : s);
  const hexToBytes = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

  // ==========================================================================
  // Format-preserving wrapper
  // ==========================================================================
  const ALPHABETS = {
    digits: '0123456789',
    alnumLower: '0123456789abcdefghijklmnopqrstuvwxyz',
    alnumUpper: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  };

  /**
   * Transform the characters of `value` that belong to `alphabet`; every other
   * character (dashes, spaces, '@', '+') stays exactly where it is.
   * `keepPrefix` leading alphabet characters are preserved (e.g. country code).
   */
  function fpTransform(key, alphabet, tweakStr, value, encrypt, keepPrefix = 0) {
    const chars = Array.from(value);
    const pos = [], nums = [];
    chars.forEach((c, i) => {
      const k = alphabet.indexOf(c);
      if (k >= 0) { pos.push(i); nums.push(k); }
    });
    const kept = pos.slice(0, keepPrefix);
    const work = pos.slice(keepPrefix), workNums = nums.slice(keepPrefix);
    const ctx = kept.map((p) => chars[p]).join('');
    const f = new FF1(key, alphabet.length);
    const out = encrypt ? f.encrypt(utf8(tweakStr + '|' + ctx), workNums) : f.decrypt(utf8(tweakStr + '|' + ctx), workNums);
    work.forEach((p, i) => { chars[p] = alphabet[out[i]]; });
    void kept;
    return chars.join('');
  }

  // ==========================================================================
  // PAN profile: keep BIN + last 4, FF1 the middle, both bound into the tweak
  // ==========================================================================
  function luhnValid(digits) {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      let d = digits[digits.length - 1 - i];
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  function panProfile(len) {
    if (len === 15) return { keepPrefix: 4, keepSuffix: 4, luhn: true, label: '15-digit (Amex-style): keep first 4 + last 4, Luhn preserved' };
    if (len === 16) return { keepPrefix: 6, keepSuffix: 4, luhn: false, label: '16-digit: keep BIN 6 + last 4, middle 6 at the NIST floor, Luhn not preserved' };
    if (len >= 17 && len <= 19) return { keepPrefix: 8, keepSuffix: 4, luhn: true, label: `${len}-digit: keep BIN 8 + last 4, Luhn preserved` };
    if (len >= 13 && len <= 14) return null;
    return null;
  }

  function panOp(key, tweakStr, pan, encrypt) {
    const digits = Array.from(pan).filter((c) => c >= '0' && c <= '9').map(Number);
    if (digits.length < 13 || digits.length > 19) throw new Error('Card number must have 13–19 digits');
    const p = panProfile(digits.length);
    if (!p) throw new DomainError(10, digits.length - 8);
    if (encrypt && p.luhn && !luhnValid(digits)) throw new Error('Input card number fails the Luhn check');
    const head = digits.slice(0, p.keepPrefix);
    const tail = digits.slice(digits.length - p.keepSuffix);
    let mid = digits.slice(p.keepPrefix, digits.length - p.keepSuffix);
    const tw = utf8(tweakStr + '|' + head.join('') + tail.join(''));
    const f = new FF1(key, 10);
    let full, walks = 0;
    for (;;) {
      mid = encrypt ? f.encrypt(tw, mid) : f.decrypt(tw, mid);
      walks++;
      full = head.concat(mid, tail);
      if (!p.luhn || luhnValid(full)) break;
      if (walks > 500) throw new Error('Cycle walk did not converge');
    }
    // Re-insert original separators
    let i = 0;
    const out = Array.from(pan).map((c) => (c >= '0' && c <= '9' ? String(full[i++]) : c)).join('');
    return { value: out, profile: p, walks };
  }

  // ==========================================================================
  // NIST SP 800-38G FF1 sample vectors 1–9 (public test data)
  // ==========================================================================
  const NIST_VECTORS = [
    ['2B7E151628AED2A6ABF7158809CF4F3C', 10, '', '0123456789', '2433477484'],
    ['2B7E151628AED2A6ABF7158809CF4F3C', 10, '39383736353433323130', '0123456789', '6124200773'],
    ['2B7E151628AED2A6ABF7158809CF4F3C', 36, '3737373770717273373737', '0123456789abcdefghi', 'a9tv40mll9kdu509eum'],
    ['2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F', 10, '', '0123456789', '2830668132'],
    ['2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F', 10, '39383736353433323130', '0123456789', '2496655549'],
    ['2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F', 36, '3737373770717273373737', '0123456789abcdefghi', 'xbj3kv35jrawxv32ysr'],
    ['2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F7F036D6F04FC6A94', 10, '', '0123456789', '6657667009'],
    ['2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F7F036D6F04FC6A94', 10, '39383736353433323130', '0123456789', '1001623463'],
    ['2B7E151628AED2A6ABF7158809CF4F3CEF4359D8D580AA4F7F036D6F04FC6A94', 36, '3737373770717273373737', '0123456789abcdefghi', 'xs8a0azh2avyalyzuwd']
  ];

  function runNistSelfTest() {
    const alpha = ALPHABETS.alnumLower;
    return NIST_VECTORS.map(([k, radix, tw, pt, ct], i) => {
      const f = new FF1(hexToBytes(k), radix);
      const tweak = tw ? hexToBytes(tw) : new Uint8Array(0);
      const x = Array.from(pt).map((c) => alpha.indexOf(c));
      const enc = f.encrypt(tweak, x).map((d) => alpha[d]).join('');
      const dec = f.decrypt(tweak, Array.from(enc).map((c) => alpha.indexOf(c))).map((d) => alpha[d]).join('');
      return { sample: i + 1, aes: k.length * 4, radix, expected: ct, got: enc, pass: enc === ct && dec === pt };
    });
  }

  function randomKey() {
    const k = new Uint8Array(32);
    (root.crypto || globalThis.crypto).getRandomValues(k);
    return k;
  }

  const api = {
    FF1, DomainError, MIN_DOMAIN, ALPHABETS,
    sha256Hex, luhnValid, panProfile, panOp, fpTransform,
    runNistSelfTest, randomKey, utf8
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DyauFPE = api;
})(typeof window !== 'undefined' ? window : globalThis);
