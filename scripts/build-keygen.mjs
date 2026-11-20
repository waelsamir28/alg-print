/**
 * يبني ملف مولّد السيريالات الخاص من القالب + مفاتيح الـ Secrets.
 * الاستخدام:  LICENSE_KEYS="key1,key2,key3" KEYGEN_PIN=1234 node scripts/build-keygen.mjs
 *
 * الهدف: لا توجد المفاتيح داخل المستودع، بل في GitHub Secrets فقط،
 * والملف الناتج يُرفع كـ Artifact خاص أو على جهازك.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TEMPLATE = path.join(ROOT, 'scripts', 'keygen.template.html');
const OUT_DIR = path.join(ROOT, 'dist-private');
const OUT = path.join(OUT_DIR, 'smartprint-keygen.html');

const keysRaw = process.env.LICENSE_KEYS || '';
const pin = process.env.KEYGEN_PIN || '';

if (!keysRaw.trim()) {
  console.error('✖ لم يتم ضبط LICENSE_KEYS — أضِفه في GitHub Secrets أو كمتغير بيئة.');
  process.exit(1);
}

const keys = keysRaw
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

if (keys.length === 0) {
  console.error('✖ LICENSE_KEYS فارغ.');
  process.exit(1);
}
if (pin && !/^\d{4,8}$/.test(pin)) {
  console.error('✖ KEYGEN_PIN يجب أن يكون 4 إلى 8 أرقام.');
  process.exit(1);
}

if (!fs.existsSync(TEMPLATE)) {
  console.error('✖ القالب غير موجود: scripts/keygen.template.html');
  process.exit(1);
}

let html = fs.readFileSync(TEMPLATE, 'utf8');

// حقن المفاتيح
html = html.replace(
  /const LICENSE_KEYS = \[[\s\S]*?\];/,
  `const LICENSE_KEYS = ${JSON.stringify(keys, null, 2)};`
);

// حقن رمز الدخول
if (pin) {
  html = html.replace(/const PIN_CODE = '[^']*';/, `const PIN_CODE = '${pin}';`);
}

// تحقق نهائي
if (html.includes("'WAEL-ELGAMAL-SMARTPRINT-2026-®-KEY'")) {
  console.error('✖ فشل الحقن — المفاتيح الافتراضية ما زالت موجودة.');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
console.log(`✔ تم بناء المولّد الخاص: ${OUT} (${kb} KB, ${keys.length} مفاتيح)`);
console.log('  ⚠️ لا ترفع هذا الملف على أي مستودع عام.');
