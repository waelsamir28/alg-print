using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace SmartPrint.Services
{
    /// <summary>
    /// ترخيص SMART PRINT — أوفلاين 100%:
    ///  - تجربة 15 يوماً من أول تشغيل.
    ///  - سيريال موقَّع HMAC-SHA256 مربوط بكود الجهاز.
    ///  - صيغة السيريال: SPRD-XXXX ×7 (28 خانة) — مطابقة تماماً لمولّد الويب.
    ///  - ملفات الترخيص محمية بـ DPAPI (لا يمكن تعديلها يدوياً).
    /// </summary>
    public sealed class LicenseService
    {
        public const int TrialDays = 15;

        private static readonly string[] Keys =
        {
            "WAEL-ELGAMAL-SMARTPRINT-2026-®-KEY",
            "SMARTPRINT-2026-SLOT-B-GAMAL-9F3C7A21",
            "SMARTPRINT-2026-SLOT-C-NILE-4D8B55E0",
        };

        private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        private const int SlotXor = 0x5A;
        private static readonly DateTime Epoch = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        private static readonly string DataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SmartPrint");

        private static readonly string TrialFile = Path.Combine(DataDir, "trial.dat");
        private static readonly string LicenseFile = Path.Combine(DataDir, "license.dat");
        private static readonly string ClockFile = Path.Combine(DataDir, "clock.dat");

        public bool IsActivated { get; private set; }
        public int DaysLeft { get; private set; } = TrialDays;
        public string Serial { get; private set; } = string.Empty;
        public string MachineCode { get; private set; } = string.Empty;

        public bool IsTrialExpired => !IsActivated && DaysLeft <= 0;
        public bool CanUseApp => IsActivated || DaysLeft > 0;

        /* ==================== التهيئة ==================== */

        public void Initialize()
        {
            Directory.CreateDirectory(DataDir);
            MachineCode = ComputeMachineCode8();

            DaysLeft = ComputeDaysLeft();
            LoadStoredLicense();
        }

        private int ComputeDaysLeft()
        {
            DateTime first;
            if (!File.Exists(TrialFile))
            {
                first = DateTime.UtcNow;
                File.WriteAllText(TrialFile, Protect(first.ToString("O")));
            }
            else
            {
                var raw = Unprotect(File.ReadAllText(TrialFile));
                if (!DateTime.TryParse(raw, null,
                        System.Globalization.DateTimeStyles.RoundtripKind, out first))
                {
                    first = DateTime.UtcNow;
                    File.WriteAllText(TrialFile, Protect(first.ToString("O")));
                }
            }

            // حماية من إرجاع ساعة النظام (high-water mark)
            var now = DateTime.UtcNow;
            if (File.Exists(ClockFile))
            {
                var rawClock = Unprotect(File.ReadAllText(ClockFile));
                if (DateTime.TryParse(rawClock, null,
                        System.Globalization.DateTimeStyles.RoundtripKind, out var last))
                {
                    if (now < last) now = last; // الساعة رُجّعت للخلف
                    else File.WriteAllText(ClockFile, Protect(now.ToString("O")));
                }
            }
            else
            {
                File.WriteAllText(ClockFile, Protect(now.ToString("O")));
            }

            var elapsed = (now - first).TotalDays;
            return Math.Max(0, TrialDays - (int)elapsed);
        }

        private void LoadStoredLicense()
        {
            try
            {
                if (!File.Exists(LicenseFile)) return;

                var serial = Unprotect(File.ReadAllText(LicenseFile)).Trim().ToUpperInvariant();
                if (string.IsNullOrEmpty(serial)) return;

                var check = Validate(serial);
                if (check.ok)
                {
                    IsActivated = true;
                    Serial = serial;
                }
            }
            catch { }
        }

        /* ==================== التحقق ==================== */

        public (bool ok, string message) Activate(string serialInput)
        {
            var serial = (serialInput ?? string.Empty).Trim().ToUpperInvariant().Replace(" ", "");

            var result = Validate(serial);
            if (!result.ok) return result;

            try
            {
                File.WriteAllText(LicenseFile, Protect(serial));
                IsActivated = true;
                Serial = serial;
                return (true, "تم تفعيل النسخة الكاملة مدى الحياة — يعمل بدون إنترنت.");
            }
            catch (Exception ex)
            {
                return (false, $"تعذر حفظ الترخيص: {ex.Message}");
            }
        }

        public (bool ok, string message) Validate(string serial, string? machineCode8 = null)
        {
            serial = (serial ?? string.Empty).Trim().ToUpperInvariant().Replace(" ", "");

            var m = System.Text.RegularExpressions.Regex.Match(serial,
                @"^SPRD-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$");

            if (!m.Success)
                return (false, "صيغة السيريال غير صحيحة — يجب أن يكون 7 مجموعات (SPRD-XXXX ×7).");

            var groups = string.Concat(Enumerable.Range(1, 7).Select(i => m.Groups[i].Value));
            var slotStr = groups.Substring(0, 3);
            var codeField = groups.Substring(3, 8);
            var expStr = groups.Substring(11, 4);
            var issueStr = groups.Substring(15, 3);
            var sigStr = groups.Substring(18, 10);

            int slot = (int)((((Base32Decode(slotStr) - SlotXor) % 32) + 32) % 32);
            uint expDays = Base32Decode(expStr);
            uint issueDays = Base32Decode(issueStr);

            if (expDays == uint.MaxValue || issueDays == uint.MaxValue)
                return (false, "السيريال يحتوي حروفاً غير صالحة.");

            bool universal = codeField == "AAAAAAAA";
            var mine = machineCode8 ?? MachineCode;
            if (string.IsNullOrEmpty(mine)) mine = ComputeMachineCode8();

            if (!universal && !mine.StartsWith(codeField, StringComparison.Ordinal))
                return (false, "هذا السيريال صادر لجهاز آخر — أرسل كود جهازك للمطوّر.");

            bool sigOk = false;
            foreach (int len in new[] { 8, 4, 0 })
            {
                var candidate = codeField.Substring(0, len).PadRight(8, 'A');
                var payload = $"{candidate}|{expDays}|{issueDays}";
                if (Signature(payload, slot) == sigStr) { sigOk = true; break; }
            }

            if (!sigOk)
                return (false, "السيريال غير صحيح أو تم تعديل حرف منه.");

            if (expDays > 0)
            {
                var expiry = Epoch.AddDays(expDays);
                if (expiry < DateTime.UtcNow)
                    return (false, "انتهت صلاحية هذا السيريال — تواصل مع المطوّر للتجديد.");
            }

            return (true, "سيريال صالح");
        }

        /* ==================== بصمة الجهاز ==================== */

        public static string ComputeMachineCode8()
        {
            var raw = $"{Environment.MachineName}|{Environment.OSVersion}|{Environment.ProcessorCount}";
            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
            var hex = Convert.ToHexString(hash);
            return Base32Encode(Fnv1a("mc8|" + hex.Substring(0, 16)), 8);
        }

        /* ==================== أدوات التشفير ==================== */

        private static uint Fnv1a(string s, uint seed = 0x811C9DC5)
        {
            uint h = seed;
            foreach (char c in s) { h ^= c; h = unchecked(h * 0x01000193u); }
            return h;
        }

        private static string Base32Encode(uint num, int len)
        {
            var sb = new StringBuilder(len);
            uint n = num;
            for (int i = 0; i < len; i++) { sb.Append(Alphabet[(int)(n % 32)]); n /= 32; }
            return sb.ToString();
        }

        private static uint Base32Decode(string str)
        {
            uint n = 0, mul = 1;
            foreach (char ch in str)
            {
                int idx = Alphabet.IndexOf(ch);
                if (idx < 0) return uint.MaxValue;
                n += (uint)idx * mul;
                mul *= 32;
            }
            return n;
        }

        private static string Signature(string payload, int slot)
        {
            var key = Keys[Math.Clamp(slot, 0, Keys.Length - 1)];
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var bytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));

            var first16 = new byte[16];
            Array.Copy(bytes, first16, 16);
            uint sigNum = Fnv1a(Encoding.Latin1.GetString(first16), Fnv1a(payload));
            return Base32Encode(sigNum, 10);
        }

        private static string Protect(string plain)
        {
            var bytes = ProtectedData.Protect(
                Encoding.UTF8.GetBytes(plain), null, DataProtectionScope.CurrentUser);
            return Convert.ToBase64String(bytes);
        }

        private static string Unprotect(string cipher)
        {
            try
            {
                var bytes = ProtectedData.Unprotect(
                    Convert.FromBase64String(cipher), null, DataProtectionScope.CurrentUser);
                return Encoding.UTF8.GetString(bytes);
            }
            catch { return string.Empty; }
        }
    }
}
