using System.Collections.ObjectModel;
using System.Management;
using SmartPrint.Models;

namespace SmartPrint.Services
{
    /// <summary>
    /// قراءة مستويات الحبر الحقيقية من ويندوز عبر WMI.
    ///
    /// ويندوز يوفّرها في مساحة الاسم Root\WMI لكل طابعة تُبلّغ عن الاستهلاكيات
    /// (HP PageWide / LaserJet / InkJet الحديثة تدعمها). لا تحتاج أي SDK خاص.
    /// إن لم تكن الطابعة مُبلّغة (طابعة PDF، تعريف عام) نرجع null — ولا نلفّق أرقاماً.
    /// </summary>
    public static class InkReader
    {
        /// <summary>يقرأ الحبر لطابعة بالاسم. يرجع null إذا لم تتوفر بيانات حقيقية.</summary>
        public static InkLevels? ReadForPrinter(string printerName, string portName)
        {
            // 1) محاولة WMI القياسي (Win32_Printer) — بعض التعريفات تُبلّغ عن الحبر هنا
            var fromPrinter = ReadFromWin32Printer(printerName);
            if (fromPrinter != null) return fromPrinter;

            // 2) محاولة WMI الاستهلاكيات (Root\WMI :: PrinterConsumable)
            var fromConsumables = ReadFromConsumables(printerName);
            if (fromConsumables != null) return fromConsumables;

            return null;
        }

        /* -------------------- المصدر 1: Win32_Printer -------------------- */
        private static InkLevels? ReadFromWin32Printer(string printerName)
        {
            try
            {
                var safeName = printerName.Replace("'", "''");
                using var searcher = new ManagementObjectSearcher(
                    $"SELECT * FROM Win32_Printer WHERE Name = '{safeName}'");

                foreach (ManagementObject obj in searcher.Get())
                {
                    // بعض الطابعات تُبلّغ عن الحبر في خاصية مخصصة (DetectedErrorState / StatusInfo)
                    // والحبر الحقيقي عبر GetPrinterData — نحاول قراءة الخصائص المعروفة
                    var levels = TryReadPrinterData(printerName);
                    obj.Dispose();
                    if (levels != null) return levels;
                }
            }
            catch { }
            return null;
        }

        /* -------------------- المصدر 2: Root\WMI PrinterConsumable -------------------- */
        private static InkLevels? ReadFromConsumables(string printerName)
        {
            int black = -1, cyan = -1, magenta = -1, yellow = -1;

            try
            {
                using var searcher = new ManagementObjectSearcher(
                    new ManagementScope(@"\\.\Root\WMI"),
                    new ObjectQuery("SELECT * FROM PrinterConsumable"));

                foreach (ManagementObject obj in searcher.Get())
                {
                    var deviceId = obj["DeviceId"]?.ToString() ?? string.Empty;
                    if (!deviceId.Contains(printerName, StringComparison.OrdinalIgnoreCase))
                    {
                        obj.Dispose();
                        continue;
                    }

                    var name = (obj["Name"]?.ToString() ?? string.Empty).ToUpperInvariant();
                    var level = ToPercent(obj["Level"]);
                    if (level < 0) { obj.Dispose(); continue; }

                    if (name.Contains("BLACK") || name.Contains("أسود") || name.Contains("K")) black = level;
                    else if (name.Contains("CYAN") || name.Contains("سماوي")) cyan = level;
                    else if (name.Contains("MAGENTA") || name.Contains("أرجواني")) magenta = level;
                    else if (name.Contains("YELLOW") || name.Contains("أصفر")) yellow = level;

                    obj.Dispose();
                }
            }
            catch { return null; }

            if (black < 0 && cyan < 0 && magenta < 0 && yellow < 0) return null;

            return new InkLevels
            {
                Black = Math.Max(0, black),
                Cyan = Math.Max(0, cyan),
                Magenta = Math.Max(0, magenta),
                Yellow = Math.Max(0, yellow)
            };
        }

        /* -------------------- المصدر 3: GetPrinterData (P/Invoke) -------------------- */
        [System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError = true, CharSet = System.Runtime.InteropServices.CharSet.Unicode)]
        private static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

        [System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError = true)]
        private static extern bool ClosePrinter(IntPtr hPrinter);

        [System.Runtime.InteropServices.DllImport("winspool.drv", SetLastError = true, CharSet = System.Runtime.InteropServices.CharSet.Unicode)]
        private static extern bool GetPrinterData(
            IntPtr hPrinter, string pValueName, out uint pType,
            byte[] pData, uint nSize, out uint pcbNeeded);

        /// <summary>
        /// كثير من طابعات HP تُخزّن نسبة الحبر في PrinterData باسم "HP_InkStatus"
        /// أو "StatusMonitors". نقرأها إن وُجدت.
        /// </summary>
        private static InkLevels? TryReadPrinterData(string printerName)
        {
            IntPtr handle = IntPtr.Zero;
            try
            {
                if (!OpenPrinter(printerName, out handle, IntPtr.Zero)) return null;

                // بعض الطابعات تُبلّغ عن مستويات الحبر في سجل واحد 4 بايتات (K,C,M,Y)
                foreach (var key in new[] { "PrinterData", "Consumables", "HP_InkLevels" })
                {
                    var buffer = new byte[16];
                    if (GetPrinterData(handle, key, out _, buffer, (uint)buffer.Length, out var needed)
                        && needed >= 4 && needed <= buffer.Length)
                    {
                        // الترتيب الشائع: K, C, M, Y
                        if (buffer[0] <= 100 && buffer[1] <= 100 && buffer[2] <= 100 && buffer[3] <= 100)
                        {
                            return new InkLevels
                            {
                                Black = buffer[0],
                                Cyan = buffer[1],
                                Magenta = buffer[2],
                                Yellow = buffer[3]
                            };
                        }
                    }
                }
            }
            catch { }
            finally
            {
                if (handle != IntPtr.Zero) ClosePrinter(handle);
            }
            return null;
        }

        private static int ToPercent(object? value)
        {
            if (value == null) return -1;
            try
            {
                var d = Convert.ToDouble(value);
                if (double.IsNaN(d)) return -1;
                // بعض التعريفات تُرجع 0..1 وأخرى 0..100
                if (d >= 0 && d <= 1.0001) d *= 100;
                return (int)Math.Round(Math.Clamp(d, 0, 100));
            }
            catch { return -1; }
        }

        /// <summary>قائمة الطابعات الحقيقية بأسماء فقط (للاستخدام السريع).</summary>
        public static ObservableCollection<string> GetPrinterNames()
        {
            var list = new ObservableCollection<string>();
            try
            {
                using var searcher = new ManagementObjectSearcher("SELECT Name FROM Win32_Printer");
                foreach (ManagementObject obj in searcher.Get())
                {
                    var n = obj["Name"]?.ToString();
                    if (!string.IsNullOrWhiteSpace(n)) list.Add(n!);
                    obj.Dispose();
                }
            }
            catch { }
            return list;
        }
    }
}
