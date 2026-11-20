import React, { useMemo, useState } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  Trash2,
  Download,
  ShieldCheck,
  Search,
  Ban,
  RotateCcw,
  Lock,
  Unlock,
  AlertTriangle,
  User,
  Calendar,
  MonitorSmartphone,
  Sparkles,
} from 'lucide-react';
import {
  generateSerial,
  getMachineFingerprint,
  loadRegistry,
  saveRegistry,
  upsertRegistry,
  type ConsumedRecord,
  type GeneratedLicense,
  LICENSE_PRODUCT,
} from '../utils/license';
import { BrandLogo } from './BrandLogo';

/**
 * صفحة التفعيل الخاصة بالمطوّر — منفصلة تماماً عن البرنامج.
 * تُفتح من: /#/activate  أو بزر «صفحة التفعيل» داخل مستكشف الكود.
 * ⚠️ في الإنتاج: انشرها على نطاق خاص بك مع حماية بكلمة مرور/تسجيل دخول.
 */
export const ActivationSite: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [machine, setMachine] = useState('');
  const [customer, setCustomer] = useState('');
  const [expires, setExpires] = useState('');
  const [generated, setGenerated] = useState<GeneratedLicense | null>(null);
  const [busy, setBusy] = useState(false);
  const [registry, setRegistry] = useState<ConsumedRecord[]>(() => loadRegistry());
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');

  const computedCode = useMemo(() => {
    if (machine.trim().length >= 4) return machine.trim().toUpperCase().slice(0, 8);
    return getMachineFingerprint();
  }, [machine]);

  const refresh = () => setRegistry(loadRegistry());

  const generate = async () => {
    setBusy(true);
    const lic = await generateSerial({
      machineCode: computedCode,
      customer: customer.trim(),
      expiresAt: expires ? new Date(expires).getTime() : undefined,
    });
    upsertRegistry({
      id: lic.id,
      serial: lic.serial,
      machineCode: lic.machineCode,
      customer: lic.customer,
      createdAt: lic.createdAt,
      expiresAt: lic.expiresAt,
    });
    setGenerated(lic);
    refresh();
    setBusy(false);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const revoke = (id: string) => {
    upsertRegistry({ ...(registry.find((r) => r.id === id) as ConsumedRecord), revoked: true });
    refresh();
  };

  const reset = (id: string) => {
    const rec = registry.find((r) => r.id === id);
    if (!rec) return;
    upsertRegistry({ ...rec, activatedAt: undefined, revoked: false });
    refresh();
  };

  const remove = (id: string) => {
    saveRegistry(registry.filter((r) => r.id !== id));
    refresh();
  };

  const exportCsv = () => {
    const rows = [
      ['serial', 'machineCode', 'customer', 'createdAt', 'expiresAt', 'activatedAt', 'revoked'],
      ...registry.map((r) => [
        r.serial,
        r.machineCode,
        r.customer ?? '',
        new Date(r.createdAt).toISOString(),
        r.expiresAt ? new Date(r.expiresAt).toISOString() : 'LIFETIME',
        r.activatedAt ? new Date(r.activatedAt).toISOString() : '',
        r.revoked ? 'YES' : 'NO',
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SmartPrint-Licenses-${Date.now()}.csv`;
    a.click();
  };

  const filtered = registry.filter(
    (r) =>
      !query ||
      r.serial.includes(query.toUpperCase()) ||
      (r.customer ?? '').includes(query) ||
      r.machineCode.includes(query.toUpperCase())
  );

  /* -------- بوابة بسيطة لحماية الصفحة -------- */
  if (!unlocked) {
    return (
      <div className="min-h-screen hdr-grad flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 text-center animate-pop-in">
          <div className="flex justify-center mb-3">
            <BrandLogo height={64} />
          </div>
          <h1 className="font-black text-gray-900 text-lg">لوحة تفعيل المطوّر</h1>
          <p className="text-[11px] text-gray-500 mt-1 mb-4">
            صفحة خاصة — تُستخدم لتوليد سيريالات التفعيل فقط
          </p>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && pin === '1234' && setUnlocked(true)}
              placeholder="رمز الدخول"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl pe-9 ps-3 py-2.5 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
            />
          </div>
          <button
            onClick={() => setUnlocked(pin === '1234')}
            className="btn-pop w-full mt-3 py-2.5 rounded-xl text-sm font-bold text-white btn-primary-grad"
          >
            دخول
          </button>
          {pin && pin !== '1234' && (
            <p className="text-[10px] text-red-600 mt-2 font-bold">رمز غير صحيح</p>
          )}
          <p className="text-[9px] text-gray-400 mt-3 font-mono">DEMO PIN: 1234</p>
          <button onClick={onExit} className="mt-3 text-[11px] text-gray-500 hover:underline">
            العودة للبرنامج
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* هيدر */}
      <header className="sect-hdr px-4 py-3">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo height={44} compact glow />
            <div>
              <h1 className="text-white font-black text-sm">لوحة تفعيل المطوّر</h1>
              <p className="text-[11px] text-white/60">
                {LICENSE_PRODUCT} · توليد وإدارة سيريالات التفعيل (مدى الحياة)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40 flex items-center gap-1">
              <Unlock className="w-3 h-3" />
              صفحة خاصة
            </span>
            <button
              onClick={onExit}
              className="btn-pop px-3 py-1.5 rounded-lg bg-white text-[var(--t-primary-ink)] text-[11px] font-bold"
            >
              ← العودة للبرنامج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* المولّد */}
        <section className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="sect-hdr px-3.5 py-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-white relative z-10" />
              <h2 className="text-white font-bold text-xs relative z-10">توليد سيريال جديد</h2>
            </div>

            <div className="p-3.5 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <MonitorSmartphone className="w-3 h-3" />
                  كود الجهاز أو المعرّف (8 خانات)
                </label>
                <input
                  value={machine}
                  onChange={(e) => setMachine(e.target.value.toUpperCase())}
                  placeholder="AB12CD34 — أو اتركه فارغاً لجهازك الحالي"
                  dir="ltr"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-2 text-[11px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
                />
                <p className="text-[9px] text-gray-400 mt-1 font-mono truncate" dir="ltr">
                  المستخدم: {computedCode}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  اسم العميل (اختياري)
                </label>
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="مثال: مكتبة النور — شبين الكوم"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-2 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  تاريخ الانتهاء (اتركه فارغاً = مدى الحياة)
                </label>
                <input
                  type="date"
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-2 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
                />
              </div>

              <button
                onClick={generate}
                disabled={busy}
                className="btn-pop btn-shine w-full py-2.5 rounded-xl text-xs font-black text-white btn-primary-grad shadow flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {busy ? 'جارٍ التوليد...' : 'توليد السيريال'}
              </button>
            </div>
          </div>

          {/* النتيجة */}
          {generated && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pop-in">
              <div className="sect-hdr px-3.5 py-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-white relative z-10" />
                <h2 className="text-white font-bold text-xs relative z-10">السيريال الجديد</h2>
              </div>
              <div className="p-3.5">
                <div className="p-3 rounded-xl bg-slate-900 text-center mb-2">
                  <div className="text-[9px] text-white/50 mb-1">سيريال التفعيل</div>
                  <div className="text-base font-black font-mono tracking-[0.12em] text-emerald-300 break-all" dir="ltr">
                    {generated.serial}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-2">
                  <div className="p-1.5 rounded-lg bg-gray-50">
                    <span className="text-gray-400 block">الجهاز</span>
                    <span className="font-mono font-bold text-gray-800">{generated.machineCode}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-gray-50">
                    <span className="text-gray-400 block">الصلاحية</span>
                    <span className="font-bold text-gray-800">
                      {generated.expiresAt
                        ? new Date(generated.expiresAt).toLocaleDateString('ar-EG')
                        : 'مدى الحياة'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() =>
                      copy(
                        `SMART PRINT — سيريال التفعيل\n${generated.serial}\nكود الجهاز: ${generated.machineCode}\nالصلاحية: ${
                          generated.expiresAt ? 'حتى ' + new Date(generated.expiresAt).toLocaleDateString('ar-EG') : 'مدى الحياة'
                        }\nتحياتي م / وائل الجمال — 01222355769`
                      )
                    }
                    className="btn-pop flex-1 py-2 rounded-lg text-[11px] font-bold text-white btn-primary-grad flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'تم النسخ' : 'نسخ الرسالة'}
                  </button>
                  <a
                    href={`https://wa.me/201222355769?text=${encodeURIComponent(
                      `SMART PRINT — سيريال التفعيل\n${generated.serial}\nكود الجهاز: ${generated.machineCode}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-pop px-3 py-2 rounded-lg text-[11px] font-bold text-white bg-[#25D366]"
                  >
                    واتساب
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* السجل */}
        <section className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="sect-hdr px-3.5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 relative z-10">
                <ShieldCheck className="w-4 h-4 text-white" />
                <h2 className="text-white font-bold text-xs">
                  سجل السيريالات ({registry.length})
                </h2>
              </div>
              <div className="flex items-center gap-1.5 relative z-10">
                <button
                  onClick={exportCsv}
                  className="btn-pop px-2 py-1 rounded-md bg-white/15 text-white text-[10px] font-bold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  CSV
                </button>
                <button
                  onClick={refresh}
                  className="btn-pop px-2 py-1 rounded-md bg-white/15 text-white text-[10px] font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  تحديث
                </button>
              </div>
            </div>

            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="بحث بالسيريال أو العميل أو كود الجهاز..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pe-8 ps-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-[var(--t-primary)]"
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {filtered.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <KeyRound className="w-8 h-8 mx-auto mb-2 stroke-1 text-gray-300" />
                  <p className="text-xs font-bold text-gray-600">لا توجد سيريالات بعد</p>
                  <p className="text-[10px] mt-1">ولّد سيريالاً جديداً من اللوحة المجاورة</p>
                </div>
              )}
              {filtered.map((r) => {
                const used = !!r.activatedAt;
                return (
                  <div key={r.id} className="p-2.5 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-black text-gray-900 truncate" dir="ltr">
                          {r.serial}
                        </div>
                        <div className="text-[10px] text-gray-500 flex flex-wrap items-center gap-x-2">
                          <span className="font-mono">{r.machineCode}</span>
                          {r.customer && <span>· {r.customer}</span>}
                          <span>· {new Date(r.createdAt).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded ${
                          r.revoked
                            ? 'bg-red-100 text-red-700'
                            : used
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {r.revoked ? 'مُلغى' : used ? 'مُستخدم' : 'متاح'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copy(r.serial)}
                        className="btn-pop px-2 py-0.5 rounded bg-gray-100 text-[9px] font-bold text-gray-600 hover:bg-gray-200 flex items-center gap-0.5"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        نسخ
                      </button>
                      {!r.revoked ? (
                        <button
                          onClick={() => revoke(r.id)}
                          className="btn-pop px-2 py-0.5 rounded bg-amber-50 text-[9px] font-bold text-amber-700 hover:bg-amber-100 flex items-center gap-0.5"
                        >
                          <Ban className="w-2.5 h-2.5" />
                          إلغاء
                        </button>
                      ) : (
                        <button
                          onClick={() => reset(r.id)}
                          className="btn-pop px-2 py-0.5 rounded bg-emerald-50 text-[9px] font-bold text-emerald-700 hover:bg-emerald-100 flex items-center gap-0.5"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          إعادة تنشيط
                        </button>
                      )}
                      {used && !r.revoked && (
                        <button
                          onClick={() => reset(r.id)}
                          className="btn-pop px-2 py-0.5 rounded bg-primary-soft text-[9px] font-bold text-[var(--t-primary-ink)] flex items-center gap-0.5"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          إتاحة للاستخدام
                        </button>
                      )}
                      <button
                        onClick={() => remove(r.id)}
                        className="btn-pop ms-auto px-2 py-0.5 rounded bg-red-50 text-[9px] font-bold text-red-600 hover:bg-red-100 flex items-center gap-0.5"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-900 leading-relaxed">
              <strong>للإنتاج:</strong> هذا السجل محفوظ حالياً في متصفحك (localStorage). لنشر الصفحة
              للعملاء، اربط السجل بخادم (Supabase/Google Sheets) عبر الـ API حتى يتمكن البرنامج من
              التحقق من السيريال أونلاين مرة واحدة عند التفعيل.
            </p>
          </div>
        </section>
      </main>

      <footer className="sect-hdr px-4 py-2.5 text-center">
        <span className="relative z-10 text-[11px] text-white/70">
          تصميم وتنفيذ م / وائل الجمال — 01222355769
        </span>
      </footer>
    </div>
  );
};
