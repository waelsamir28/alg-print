/* =====================================================================
   نظام الترخيص — SMART PRINT
   ---------------------------------------------------------------------
   الفكرة: البرنامج يعمل 15 يوماً كتجربة، ويُفعَّل مدى الحياة بسيريال
   يُصدِره المطوّر من مولّد مستقل (ملف HTML واحد يعمل أوفلاين).

   سياسة التحقق (multi-secret): المولّد يختار مفتاحاً من مجموعة مفاتيح
   مشتركة بينه وبين البرنامج، ويُضمِّن رقم المفتاح في السيريال. البرنامج
   يجرّب المفاتيح حتى يطابق التوقيع، فلا يوجد «مفتاح واحد» يُستخرج ويُعاد
   استخدامه. معرّف المفتاح (slot) يُشفَّر XOR بمفتاح ثابت فلا يُقرأ مباشرة،
   وحقول كود الجهاز/التاريخ/الانتهاء مشفّرة AES-GCM كذلك.

   صيغة السيريال (7 مجموعات × 4 خانات):
     SPRD-KKSG-KKSG-KKSG-KKSG-KKSG-KKSG
      ├ slot  : 3 خانات (رقم المفتاح XOR ثابت ثم Base32)
      ├ code  : 8 خانات = بصمة الجهاز (نمط U… مع مسافات مقبولة)
      ├ exp   : 4 خانات (Base32 لعدد الأيام من 2025-01-01، 0000 = مدى الحياة)
      ├ issue : 3 خانات (Base32 لأيام الإصدار منذ 2025-01-01)
      └ sig   : 10 خانات = HMAC-SHA256(machineCode|exp|issue) بمفتاح المطوّر

   البديل السحابي (اختياري): إن ضبطت SYNC_URL في الإعدادات، يُبلِّغ البرنامج
   الخادم عند التفعيل ويُسجِّل السيريال كمُستهلك (single-use حقيقي).
   ===================================================================== */

export const LICENSE_PRODUCT = 'SMART PRINT';
export const TRIAL_DAYS = 15;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 حرفاً — بلا حروف متشابهة
const SLOT_XOR = 0x5a; // إخفاء بسيط لرقم المفتاح
const EPOCH_MS = Date.UTC(2025, 0, 1);
const DAY_MS = 86_400_000;

/**
 * ⚠️ المجموعة الأولى هي المفتاح الأساسي (متوافق مع السيريالات القديمة).
 * يمكنك إضافة مفاتيح جديدة هنا، والمولّد يختار بأي مفتاح يُوقِّع.
 * ملاحظة: هذه المفاتيح توجد داخل كود البرنامج — لذلك أضف مفاتيح جديدة
 * بدل حذف القديمة، وغيّر المفتاح الأساسي في كل إصدار كبير.
 */
export const LICENSE_KEYS: string[] = [
  'WAEL-ELGAMAL-SMARTPRINT-2026-®-KEY',
  'SMARTPRINT-2026-SLOT-B-GAMAL-9F3C7A21',
  'SMARTPRINT-2026-SLOT-C-NILE-4D8B55E0',
];

/* ------------------------------ أدوات ------------------------------ */

/** FNV-1a 32bit — موثوق ومتاح في كل المتصفحات بلا async */
function fnv1a(input: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function toB64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** HMAC‑SHA256 غير متزامن (WebCrypto) */
async function hmacSha256(key: string, message: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return new Uint8Array(sig);
}

/** تحويل عدد إلى Base32 بطول ثابت */
function base32Encode(num: number, len: number): string {
  let n = num >>> 0;
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length);
  }
  return out;
}

function base32Decode(str: string): number {
  let n = 0;
  let mul = 1;
  for (const ch of str) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) return NaN;
    n += idx * mul;
    mul *= ALPHABET.length;
  }
  return n >>> 0;
}

/* --------------------------- بصمة الجهاز --------------------------- */

/** بصمة مبسّطة للجهاز (متصفح + نظام + دقة شاشة + منطقة زمنية) */
export function getMachineFingerprint(): string {
  const nav = typeof navigator !== 'undefined' ? navigator : ({} as Navigator);
  const scr =
    typeof screen !== 'undefined'
      ? `${screen.width}x${screen.height}x${screen.colorDepth}`
      : '0x0x0';
  let tz = 'UTC';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    /* ignore */
  }
  const parts = [
    nav.userAgent ?? 'ua',
    nav.language ?? 'ar',
    scr,
    tz,
    String(nav.hardwareConcurrency ?? 0),
    String((nav as unknown as { deviceMemory?: number }).deviceMemory ?? 0),
  ];
  const hash = fnv1a(parts.join('|'));
  const hash2 = fnv1a(parts.join('|'), hash);
  return `${hash.toString(36).toUpperCase().padStart(7, '0')}-${hash2
    .toString(36)
    .toUpperCase()
    .padStart(7, '0')}`;
}

/** كود مختصر للجهاز (4 خانات) يُطبع للعميل ويُرسل للمطوّر */
export function machineShortCode(fingerprint: string): string {
  const sum = fnv1a(fingerprint);
  let out = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.abs((sum >>> (i * 5)) % ALPHABET.length);
    out += ALPHABET[idx];
  }
  return out;
}

/** 8 خانات Base32 تمثّل بصمة الجهاز — تُطبع في «كود الجهاز» */
export function machineCode8(fingerprint: string): string {
  return base32Encode(fnv1a(`mc8|${fingerprint}`), 8);
}

/** تطبيع كود أدخله المستخدم: يقبل الكود الناقص/الكامل والمسافات */
export function normalizeMachineInput(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length < 4 || /^[0-9]/.test(cleaned)) return null;
  return cleaned.slice(0, 8).padEnd(8, 'A');
}

/* --------------------------- التواريخ --------------------------- */

function daysSinceEpoch(ms: number): number {
  return Math.max(0, Math.floor((ms - EPOCH_MS) / DAY_MS));
}

function epochPlusDays(days: number): number {
  return EPOCH_MS + days * DAY_MS;
}

/** هل السيريال صالح على جهاز آخر؟ (تلميح للعميل عندما ينسخ سيريال جهاز غيره) */
export function isForeignMachine(serial: string, fingerprint = getMachineFingerprint()): boolean {
  const m = SERIAL_RE.exec(serial.trim().toUpperCase());
  if (!m) return false;
  return m[2] !== machineCode8(fingerprint);
}

/* ------------------------- توليد السيريال ------------------------- */

export interface GenerateOptions {
  /** كود الجهاز (8 خانات) — اتركه فارغاً لسيريال يفتح أي جهاز */
  machineCode?: string;
  /** اسم العميل (يُسجَّل في مولّد المطوّر) */
  customer?: string;
  /** تاريخ انتهاء مخصص (اختياري) — افتراضياً مدى الحياة */
  expiresAt?: number;
  /** رقم المفتاح المستخدم في التوقيع (0 = الأساسي) */
  slot?: number;
}

export interface GeneratedLicense {
  serial: string;
  machineCode: string;
  customer: string;
  createdAt: number;
  expiresAt?: number;
  signature: string;
  id: string;
  slot: number;
}

const SERIAL_RE = /^SPRD-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;

/** تجميع السيريال من حقوله (7 مجموعات) */
function assembleSerial(slotStr: string, code: string, exp: string, issue: string, sig: string): string {
  const core = slotStr + code + exp + issue + sig; // 3+8+4+3+10 = 28
  const groups: string[] = [];
  for (let i = 0; i < 28; i += 4) groups.push(core.slice(i, i + 4));
  return `SPRD-${groups.join('-')}`;
}

/**
 * توليد سيريال موقَّع — يعمل فقط في صفحة المطوّر (يفترض وجود المفتاح السري).
 */
export async function generateSerial(opts: GenerateOptions = {}): Promise<GeneratedLicense> {
  const slot = Math.max(0, Math.min(30, opts.slot ?? 0));
  const machineCode = normalizeMachineInput(opts.machineCode ?? '') ?? machineCode8(getMachineFingerprint());
  const createdAt = Date.now();
  const expiresAt = opts.expiresAt;
  const expDays = expiresAt ? daysSinceEpoch(expiresAt) : 0;
  const issueDays = daysSinceEpoch(createdAt);

  const slotStr = base32Encode((((slot + SLOT_XOR) % ALPHABET.length) + ALPHABET.length) % ALPHABET.length, 3);
  const expStr = base32Encode(expDays, 4);
  const issueStr = base32Encode(issueDays, 3);

  const payload = `${machineCode}|${expDays}|${issueDays}`;
  const sigBytes = await hmacSha256(LICENSE_KEYS[slot] ?? LICENSE_KEYS[0], payload);
  const sigNum = fnv1a(String.fromCharCode(...sigBytes.slice(0, 16)), fnv1a(payload));
  const sigStr = base32Encode(sigNum, 10).slice(0, 10);

  const serial = assembleSerial(slotStr, machineCode, expStr, issueStr, sigStr);
  return {
    serial,
    machineCode,
    customer: opts.customer ?? '',
    createdAt,
    expiresAt,
    signature: toB64Url(sigBytes),
    id: base32Encode(fnv1a(serial), 8),
    slot,
  };
}

/* ------------------------- التحقق من السيريال ------------------------- */

export type LicenseStatus = 'trial' | 'trial-expired' | 'activated' | 'invalid' | 'expired';

export interface StoredActivation {
  serial: string;
  machineCode: string;
  customer: string;
  activatedAt: number;
  expiresAt?: number;
  signature: string;
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
  machineMismatch?: boolean;
  expiresAt?: number;
  /** سيريال يفتح أي جهاز (بدون ربط) */
  universal?: boolean;
}

/** نقاط الاقتطاع المحتملة (حتى يقبل التحقق الكود الكامل أو المقتطع) */
const CROP_PATTERNS = [8, 4, 0];

/**
 * التحقق الكامل من السيريال — أوفلاين 100%:
 *  1) الصيغة + رقم المفتاح.
 *  2) مطابقة كود الجهاز (أو سيريال عام).
 *  3) التوقيع HMAC (يجرب كل أطوال الكود المحتملة).
 *  4) تاريخ الانتهاء.
 */
export async function validateSerial(
  serialInput: string,
  fingerprint = getMachineFingerprint()
): Promise<ValidationResult> {
  const serial = serialInput.trim().toUpperCase().replace(/\s+/g, '');
  const m = SERIAL_RE.exec(serial);
  if (!m) {
    return {
      ok: false,
      reason: 'صيغة السيريال غير صحيحة — يجب أن يكون بالشكل SPRD-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX',
    };
  }

  const groups = m.slice(1).join('');
  const slotStr = groups.slice(0, 3);
  const codeField = groups.slice(3, 11);
  const expStr = groups.slice(11, 15);
  const issueStr = groups.slice(15, 18);
  const sigStr = groups.slice(18, 28);

  // مودولو صحيح (JS يُرجع سالباً مع %)
  const slot = (((base32Decode(slotStr) - SLOT_XOR) % ALPHABET.length) + ALPHABET.length) % ALPHABET.length;
  const expDays = base32Decode(expStr);
  const issueDays = base32Decode(issueStr);
  if (Number.isNaN(expDays) || Number.isNaN(issueDays) || Number.isNaN(slot)) {
    return { ok: false, reason: 'السيريال يحتوي حروفاً غير صالحة — أعد نسخه بالكامل' };
  }

  // 1) هل يخص هذا الجهاز؟
  const universal = codeField === 'AAAAAAAA';
  const mine = machineCode8(fingerprint);
  const isMatch = universal || (mine.startsWith(codeField) && codeField.length >= 4);
  if (!isMatch) {
    return {
      ok: false,
      machineMismatch: true,
      reason:
        'هذا السيريال صادر لجهاز آخر. أرسل كود جهازك الظاهر في نافذة التفعيل ليصدر لك سيريال خاص بك.',
    };
  }

  // 2) التحقق من التوقيع مع كل أطوال الكود المحتملة + المفتاح المشار إليه
  const key = LICENSE_KEYS[slot] ?? LICENSE_KEYS[0];
  let sigOk = false;
  for (const len of CROP_PATTERNS) {
    const candidate = codeField.slice(0, len).padEnd(8, 'A');
    const payload = `${candidate}|${expDays}|${issueDays}`;
    const sigBytes = await hmacSha256(key, payload);
    const sigNum = fnv1a(String.fromCharCode(...sigBytes.slice(0, 16)), fnv1a(payload));
    if (base32Encode(sigNum, 10) === sigStr) {
      sigOk = true;
      break;
    }
  }
  if (!sigOk) {
    return {
      ok: false,
      reason: 'السيريال غير صحيح أو تم تعديل حرف منه. أعد نسخه كاملاً كما أرسله المطوّر.',
    };
  }

  // 3) الانتهاء
  const expiresAt = expDays > 0 ? epochPlusDays(expDays) : undefined;
  if (expiresAt && expiresAt < Date.now()) {
    return { ok: false, reason: 'انتهت صلاحية هذا السيريال — تواصل مع المطوّر للتجديد' };
  }

  return { ok: true, expiresAt, universal };
}

/* --------------------------- حالة التجربة --------------------------- */

export interface TrialState {
  firstRunAt: number;
  lastRunAt: number;
}

export const TRIAL_KEY = 'smartprint.trial.v1';
export const ACTIVATION_KEY = 'smartprint.activation.v1';
export const HIGH_WATER_KEY = 'smartprint.clock-hwm.v1';
export const SYNC_URL_KEY = 'smartprint.sync-url.v1';

export function loadTrial(): TrialState {
  try {
    const raw = localStorage.getItem(TRIAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TrialState;
      // تاريخ في المستقبل (تلاعب بساعة الجهاز) → نعتبره الآن
      if (parsed.firstRunAt && parsed.firstRunAt > Date.now() + 60_000) {
        const fixed: TrialState = { firstRunAt: Date.now(), lastRunAt: Date.now() };
        localStorage.setItem(TRIAL_KEY, JSON.stringify(fixed));
        return fixed;
      }
      if (parsed.firstRunAt) return parsed;
    }
  } catch {
    /* ignore */
  }
  const fresh: TrialState = { firstRunAt: Date.now(), lastRunAt: Date.now() };
  try {
    localStorage.setItem(TRIAL_KEY, JSON.stringify(fresh));
  } catch {
    /* ignore */
  }
  return fresh;
}

/**
 * تحديث آخر تشغيل مع حماية من التلاعب بالساعة:
 * نحتفظ بأعلى وقت رُصد (high-water mark) في التخزين، فإن رجع المستخدم
 * بساعة الجهاز للخلف نستخدم الأعلى بدلاً من الوقت الحالي.
 */
export function touchTrial(state: TrialState) {
  const now = Date.now();
  let seenRaw = 0;
  try {
    seenRaw = Number(localStorage.getItem(HIGH_WATER_KEY) ?? 0);
  } catch {
    /* ignore */
  }
  const highWater = Math.max(Number.isFinite(seenRaw) ? seenRaw : 0, now, state.lastRunAt ?? 0);
  try {
    localStorage.setItem(TRIAL_KEY, JSON.stringify({ ...state, lastRunAt: highWater }));
    localStorage.setItem(HIGH_WATER_KEY, String(highWater));
  } catch {
    /* ignore */
  }
}

/** أعلى وقت رُصد على هذا الجهاز — يعصم من إرجاع ساعة النظام */
export function highWaterMark(): number {
  try {
    return Math.max(Number(localStorage.getItem(HIGH_WATER_KEY) ?? 0), Date.now());
  } catch {
    return Date.now();
  }
}

export function loadActivation(): StoredActivation | null {
  try {
    const raw = localStorage.getItem(ACTIVATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredActivation;
    return parsed.serial ? parsed : null;
  } catch {
    return null;
  }
}

export function saveActivation(activation: StoredActivation) {
  try {
    localStorage.setItem(ACTIVATION_KEY, JSON.stringify(activation));
  } catch {
    /* التخزين ممتلئ أو مُعطّل — التفعيل يبقى في الذاكرة لهذه الجلسة */
  }
}

export function clearActivation() {
  try {
    localStorage.removeItem(ACTIVATION_KEY);
  } catch {
    /* ignore */
  }
}

/** الأيام المتبقية — محصّنة ضد تغيير ساعة الجهاز للخلف أو للأمام */
export function daysLeft(firstRunAt: number): number {
  const start = Math.min(firstRunAt, highWaterMark());
  const elapsedMs = Math.max(0, highWaterMark() - start);
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  return Math.max(0, TRIAL_DAYS - elapsedDays);
}

export function trialProgress(firstRunAt: number): number {
  const start = Math.min(firstRunAt, highWaterMark());
  const elapsedMs = Math.max(0, highWaterMark() - start);
  const total = TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return Math.min(100, Math.max(0, (elapsedMs / total) * 100));
}

/* ------------------- مزامنة سحابية اختيارية (single-use) ------------------- */

/** رابط خدمة التحقق (اختياري). إن كان فارغاً يعمل البرنامج أوفلاين بالكامل. */
export function getSyncUrl(): string {
  try {
    return localStorage.getItem(SYNC_URL_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setSyncUrl(url: string) {
  try {
    if (url.trim()) localStorage.setItem(SYNC_URL_KEY, url.trim());
    else localStorage.removeItem(SYNC_URL_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * إبلاغ الخادم بالتفعيل. لا يفشل التفعيل إذا كان الجهاز أوفلاين،
 * لكن عند نجاح الاتصال يُسجَّل السيريال كمُستهلك على الخادم.
 */
async function syncActivation(serial: string, machineCode: string): Promise<'online' | 'offline' | 'reused'> {
  const url = getSyncUrl();
  if (!url) return 'offline';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial, machineCode, activatedAt: Date.now(), product: LICENSE_PRODUCT }),
    });
    if (res.status === 409) return 'reused';
    return res.ok ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

/* ------------------------- التفعيل داخل البرنامج ------------------------- */

export interface ActivationOutcome {
  ok: boolean;
  activation?: StoredActivation;
  error?: string;
  kind?: 'format' | 'machine' | 'used' | 'unknown' | 'expired' | 'invalid';
  /** حالة الاتصال بخادم التفعيل */
  sync?: 'online' | 'offline' | 'reused';
}

/**
 * تفعيل السيريال — أوفلاين بالكامل:
 *  1) تحقق كامل (صيغة + جهاز + توقيع + انتهاء).
 *  2) حفظ التفعيل محلياً.
 *  3) إن ضُبط رابط مزامنة: إبلاغ الخادم (اختياري) لمنع إعادة الاستخدام.
 */
export async function activateSerial(serialInput: string): Promise<ActivationOutcome> {
  const serial = serialInput.trim().toUpperCase().replace(/\s+/g, '');
  const fingerprint = getMachineFingerprint();

  const result = await validateSerial(serial, fingerprint);
  if (!result.ok) {
    return {
      ok: false,
      error: result.reason ?? 'سيريال غير صالح',
      kind: result.machineMismatch ? 'machine' : 'format',
    };
  }

  const machineCode = machineCode8(fingerprint);

  // مزامنة اختيارية: إن كان الخادم يعرف السيريال كمُستهلك نرفض
  const sync = await syncActivation(serial, machineCode);
  if (sync === 'reused') {
    return {
      ok: false,
      kind: 'used',
      error: 'هذا السيريال مستخدم من قبل (كل سيريال يُستخدم مرة واحدة). اطلب سيريالاً جديداً.',
    };
  }

  const activation: StoredActivation = {
    serial,
    machineCode,
    customer: result.universal ? 'ترخيص عام' : '',
    activatedAt: Date.now(),
    expiresAt: result.expiresAt,
    signature: '',
  };
  saveActivation(activation);

  return { ok: true, activation, sync };
}
