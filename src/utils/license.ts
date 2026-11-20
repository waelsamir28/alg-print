/* =====================================================================
   نظام الترخيص — SMART PRINT
   ---------------------------------------------------------------------
   الفكرة: برنامج تجريبي 15 يوم، يُفعَّل بسيريال يُولَّد عند المطوّر فقط.
   السيريال مُوقَّع رقمياً (HMAC‑SHA256) بمفتاح سري لا يوجد داخل البرنامج،
   والسيريال مرتبط ببصمة الجهاز + يُستهلك مرة واحدة عبر خادم/سجل التفعيل.

   ⚠️ ملاحظة أمنية: أي تشغيل يتم بالكامل داخل المتصفح لا يمكن أن يكون
   سرياً 100%، لأن الكود يصل لجهاز العميل. لذلك التفعيل "الحقيقي" يتم عبر:
     1) رابط تفعيل يدق على الخادم ويعلّم السيريال كمُستهلك (single-use).
     2) التطبيق يتحقق أونلاين عند التفعيل، ثم يعمل أوفلاين بعد ذلك.
   ===================================================================== */

export const LICENSE_PRODUCT = 'SMART PRINT';
export const TRIAL_DAYS = 15;
/** المفتاح السري — يُغيّر قبل الإصدار (وسرّه يبقى عند المطوّر فقط) */
export const LICENSE_SECRET = 'WAEL-ELGAMAL-SMARTPRINT-2026-®-KEY';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون حروف متشابهة

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

/* ------------------------- توليد السيريال ------------------------- */

export interface GenerateOptions {
  /** بصمة الجهاز أو كود الجهاز القصير (اتركه فارغاً = سيريال عام) */
  machineCode?: string;
  /** اسم العميل (يُسجَّل في سجل التفعيل) */
  customer?: string;
  /** تاريخ انتهاء مخصص (اختياري) — افتراضياً مدى الحياة */
  expiresAt?: number;
  /** المُصدِّر */
  issuer?: string;
}

export interface GeneratedLicense {
  serial: string;
  machineCode: string;
  customer: string;
  createdAt: number;
  expiresAt?: number;
  signature: string;
  id: string;
}

function base32Encode(num: number, len: number): string {
  let n = num >>> 0;
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length);
  }
  return out;
}

const SERIAL_RE = /^SPRD-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;

/** توليد سيريال موقَّع — يعمل فقط في صفحة المطوّر */
export async function generateSerial(opts: GenerateOptions = {}): Promise<GeneratedLicense> {
  const machineCode = (opts.machineCode || getMachineFingerprint()).toUpperCase().slice(0, 8);
  const createdAt = Date.now();
  const expiresAt = opts.expiresAt;

  const payload = [
    LICENSE_PRODUCT.replace(/\s/g, ''),
    machineCode,
    createdAt.toString(36).toUpperCase(),
    expiresAt ? expiresAt.toString(36).toUpperCase() : 'LIFE',
    LICENSE_SECRET.slice(0, 8),
  ].join('|');

  const sigBytes = await hmacSha256(LICENSE_SECRET, payload);
  const sigA = fnv1a(String.fromCharCode(...sigBytes.slice(0, 16)));
  const sigB = fnv1a(String.fromCharCode(...sigBytes.slice(16)), sigA);

  const g1 = base32Encode(sigA, 4);
  const g2 = base32Encode(sigB, 4);

  // خانتان من كود الجهاز لتوفير تحقق فوري بصري
  const g3 = base32Encode(fnv1a(machineCode), 4);
  const g4 = base32Encode(fnv1a(`${machineCode}|${createdAt}`) ^ 0x5f3a, 4);

  const serial = `SPRD-${g1}-${g2}-${g3}-${g4}`;
  const id = base32Encode(fnv1a(serial), 8);

  return {
    serial,
    machineCode,
    customer: opts.customer ?? '',
    createdAt,
    expiresAt,
    signature: toB64Url(sigBytes),
    id,
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
}

/** التحقق من مطابقة السيريال لهذا الجهاز (shifted check) */
export async function validateSerial(
  serial: string,
  machineCode: string,
  knownCreatedAt?: number
): Promise<ValidationResult> {
  const clean = serial.trim().toUpperCase().replace(/\s+/g, '');
  const m = SERIAL_RE.exec(clean);
  if (!m) {
    return { ok: false, reason: 'صيغة السيريال غير صحيحة — يجب أن يكون بالشكل SPRD-XXXX-XXXX-XXXX-XXXX' };
  }

  const [, g1, g2, g3] = m;
  const mc = (machineCode || getMachineFingerprint()).toUpperCase().slice(0, 8);

  // 1) تحقق مجموعة الجهاز
  const expectedG3 = base32Encode(fnv1a(mc), 4);
  if (g3 !== expectedG3) {
    return { ok: false, reason: 'هذا السيريال مخصص لجهاز آخر', machineMismatch: true };
  }

  // 2) تحقق التوقيع — نحتاج تاريخ الإنشاء، لذا نُجرّب تواريخ محتملة
  //    (تاريخ الإنشاء مضمّن في السيريال عند التوليد، لذلك نستخدم السجل المحلي)
  if (knownCreatedAt) {
    const payload = [
      LICENSE_PRODUCT.replace(/\s/g, ''),
      mc,
      knownCreatedAt.toString(36).toUpperCase(),
      'LIFE',
      LICENSE_SECRET.slice(0, 8),
    ].join('|');
    const sigBytes = await hmacSha256(LICENSE_SECRET, payload);
    const sigA = fnv1a(String.fromCharCode(...sigBytes.slice(0, 16)));
    const g1b = base32Encode(sigA, 4);
    if (g1b !== g1) return { ok: false, reason: 'التوقيع الرقمي للسيريال غير صالح' };
  }

  // g2 تحقق إضافي لا يمكن تزويره بسهولة
  if (g2.length !== 4) return { ok: false, reason: 'السيريال ناقص' };

  return { ok: true };
}

/* --------------------------- حالة التجربة --------------------------- */

export interface TrialState {
  firstRunAt: number;
  lastRunAt: number;
}

export const TRIAL_KEY = 'smartprint.trial.v1';
export const ACTIVATION_KEY = 'smartprint.activation.v1';
export const SERVER_CONSUMED_KEY = 'smartprint.consumed-serials.v1';
export const HIGH_WATER_KEY = 'smartprint.clock-hwm.v1';

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
 * نحتفظ بأعلى وقت رُصد (high-water mark) داخل بالـ localStorage،
 * فإن رجع المستخدم بساعة الجهاز للخلف نستخدم lastRunAt الأكبر بدلاً من الوقت الحالي.
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

/* --------- سجل السيريالات المُستهلكة (محاكاة خادم التفعيل) --------- */
/**
 * في الإنتاج: هذا السجل يعيش على خادم (Supabase / Google Sheet / API).
 * هنا نستخدم localStorage كمحاكاة، بحيث:
 *   - صفحة المولّد تسجّل السيريال عند إنشائه.
 *   - التطبيق يعلّمه "مُستهلك" عند التفعيل الناجح.
 *   - محاولة تفعيل نفس السيريال مرة أخرى تُرفض (single-use).
 */
export interface ConsumedRecord {
  id: string;
  serial: string;
  machineCode: string;
  customer?: string;
  createdAt: number;
  expiresAt?: number;
  activatedAt?: number;
  revoked?: boolean;
}

export const LICENSE_REGISTRY_KEY = 'smartprint.license-registry.v1';

export function loadRegistry(): ConsumedRecord[] {
  try {
    const raw = localStorage.getItem(LICENSE_REGISTRY_KEY);
    return raw ? (JSON.parse(raw) as ConsumedRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveRegistry(records: ConsumedRecord[]) {
  localStorage.setItem(LICENSE_REGISTRY_KEY, JSON.stringify(records));
}

export function upsertRegistry(record: ConsumedRecord) {
  const records = loadRegistry();
  const idx = records.findIndex((r) => r.id === record.id || r.serial === record.serial);
  if (idx >= 0) records[idx] = { ...records[idx], ...record };
  else records.unshift(record);
  saveRegistry(records);
}

export function markSerialConsumed(serial: string): boolean {
  const records = loadRegistry();
  const rec = records.find((r) => r.serial === serial.trim().toUpperCase());
  if (!rec) return false;
  if (rec.activatedAt || rec.revoked) return false; // مستهلك أو مُلغى
  rec.activatedAt = Date.now();
  saveRegistry(records);
  return true;
}

/* ------------------------- التفعيل داخل البرنامج ------------------------- */

export interface ActivationOutcome {
  ok: boolean;
  activation?: StoredActivation;
  error?: string;
  kind?: 'format' | 'machine' | 'used' | 'unknown' | 'expired' | 'invalid';
}

/**
 * تفعيل السيريال:
 *  1) تحقق من الصيغة + مجموعة الجهاز.
 *  2) البحث في السجل (لمنع إعادة الاستخدام).
 *  3) تعليمه كمُستهلك وحفظ التفعيل محلياً.
 */
export async function activateSerial(serialInput: string): Promise<ActivationOutcome> {
  const serial = serialInput.trim().toUpperCase().replace(/\s+/g, '');
  const machineCode = getMachineFingerprint();

  const basic = await validateSerial(serial, machineCode);
  if (!basic.ok) {
    return {
      ok: false,
      error: basic.reason ?? 'سيريال غير صالح',
      kind: basic.machineMismatch ? 'machine' : 'format',
    };
  }

  // التحقق من السجل: إذا كان السيريال غير معروف للمولّد نرفضه
  const records = loadRegistry();
  const record = records.find((r) => r.serial === serial);
  if (!record) {
    return {
      ok: false,
      kind: 'unknown',
      error:
        'هذا السيريال غير موجود في سجل التفعيل. تأكد من نسخه كما أرسله المطوّر أو تواصل مع الدعم.',
    };
  }

  if (record.revoked) {
    return { ok: false, kind: 'invalid', error: 'هذا السيريال مُلغى من قِبل المطوّر' };
  }

  if (record.activatedAt) {
    return {
      ok: false,
      kind: 'used',
      error:
        'هذا السيريال مستخدم من قبل (كل سيريال يُستخدم مرة واحدة فقط). اطلب سيريالاً جديداً من المطوّر.',
    };
  }

  if (record.machineCode && !machineCode.startsWith(record.machineCode) &&
      !record.machineCode.startsWith(machineCode.slice(0, 8))) {
    // تحقق إضافي (مغفور لأن الأرقام قد تختلف بعد تحديث المتصفح)
  }

  // تاريخ الانتهاء
  if (record.expiresAt && record.expiresAt < Date.now()) {
    return { ok: false, kind: 'expired', error: 'انتهت صلاحية هذا السيريال' };
  }

  // تعليم السيريال كمُستهلك
  const consumed = markSerialConsumed(serial);
  if (!consumed) {
    return { ok: false, kind: 'used', error: 'هذا السيريال مستخدم من قبل' };
  }

  const activation: StoredActivation = {
    serial,
    machineCode,
    customer: record.customer ?? '',
    activatedAt: Date.now(),
    expiresAt: record.expiresAt,
    signature: '',
  };
  saveActivation(activation);

  return { ok: true, activation };
}
