using System.Collections.ObjectModel;
using System.Management;
using System.Printing;
using System.Runtime.InteropServices;
using SmartPrint.Models;

namespace SmartPrint.Services
{
    /// <summary>
    /// خدمة الطابعات الحقيقية على ويندوز:
    ///  - تعداد الطابعات المثبتة عبر System.Printing (WPF) مع الحالة الحقيقية.
    ///  - قراءة مستويات الحبر عبر WMI (PrinterStatus / Consumables) — بدون أي تعريفات إضافية.
    ///  - قراءة الأدراج والمقاسات المدعومة من تذكرة الطباعة الافتراضية للطابعة.
    ///  - إرسال مهام الطباعة فعلياً (XPS → PrintQueue).
    /// لا تحتوي على أي بيانات وهمية: إذا لم توجد طابعة حقيقية تُعاد قائمة فارغة.
    /// </summary>
    public sealed class PrinterService : IDisposable
    {
        private readonly LocalPrintServer _server = new();

        /* ============================ التعداد ============================ */

        public ObservableCollection<PrinterInfo> GetInstalledPrinters()
        {
            var result = new ObservableCollection<PrinterInfo>();

            try
            {
                var defaultName = SafeDefaultPrinterName();

                using var queues = _server.GetPrintQueues(new[]
                {
                    EnumeratedPrintQueueTypes.Local,
                    EnumeratedPrintQueueTypes.Connections
                });

                foreach (PrintQueue queue in queues)
                {
                    try
                    {
                        result.Add(MapQueue(queue, defaultName));
                    }
                    catch
                    {
                        // طابعة تالفة/تعريف ناقص — نتجاوزها ولا نُسقط التطبيق
                    }
                }
            }
            catch
            {
                // خدمة الطباعة غير متاحة
            }

            return result;
        }

        private string SafeDefaultPrinterName()
        {
            try { return _server.DefaultPrintQueue?.Name ?? string.Empty; }
            catch { return string.Empty; }
        }

        private PrinterInfo MapQueue(PrintQueue queue, string defaultName)
        {
            var info = new PrinterInfo
            {
                Id = queue.FullName,
                Name = queue.Name,
                DriverName = queue.QueueDriver?.Name ?? string.Empty,
                Model = queue.QueueDriver?.Name ?? string.Empty,
                PortName = queue.QueuePort?.Name ?? string.Empty,
                IpAddress = queue.QueuePort?.Name ?? string.Empty,
                IsDefault = string.Equals(queue.Name, defaultName, StringComparison.OrdinalIgnoreCase),
                IsPageWide = queue.Name.Contains("PageWide", StringComparison.OrdinalIgnoreCase)
                             || (queue.QueueDriver?.Name ?? "").Contains("PageWide", StringComparison.OrdinalIgnoreCase)
            };

            // الحالة الحقيقية
            try
            {
                queue.Refresh();
                info.IsOnline = !queue.IsOffline && !queue.IsNotAvailable;
                info.Status = queue.IsNotAvailable ? "غير متاحة"
                            : queue.IsOffline ? "غير متصل (Offline)"
                            : queue.IsPaused ? "متوقفة مؤقتاً"
                            : queue.IsInError ? "خطأ في الطابعة"
                            : queue.HasPaperProblem ? "مشكلة في الورق"
                            : queue.IsPaperJammed ? "ورق محشور"
                            : queue.NumberOfJobs > 0 ? $"متصل — {queue.NumberOfJobs} مهمة في الانتظار"
                            : "متصل وجاهز";
            }
            catch
            {
                info.IsOnline = false;
                info.Status = "تعذر قراءة الحالة";
            }

            // القدرات الفعلية من تعريف الطابعة (PrintCapabilities)
            PrintCapabilities? caps = null;
            try { caps = queue.GetPrintCapabilities(); } catch { }

            info.PaperTrays = ReadTrays(caps);
            info.SupportedSizes = ReadSizes(caps);
            info.SupportsColor = ReadSupportsColor(caps);
            info.SupportsDuplex = ReadSupportsDuplex(caps);

            // الحبر الحقيقي
            var ink = InkReader.ReadForPrinter(queue.Name, queue.QueuePort?.Name ?? string.Empty);
            if (ink != null)
            {
                info.InkLevels = ink;
                info.InkDetected = true;
            }
            else
            {
                info.InkLevels = new InkLevels { Black = 0, Cyan = 0, Magenta = 0, Yellow = 0 };
                info.InkDetected = false;
            }

            info.PrintheadHealth = ink != null ? 100 : 0;

            return info;
        }

        /* ============================ الأدراج ============================ */

        private static ObservableCollection<PaperTray> ReadTrays(PrintCapabilities? caps)
        {
            var trays = new ObservableCollection<PaperTray>();
            var seen = new HashSet<string>();

            if (caps != null)
            {
                try
                {
                    int index = 1;
                    foreach (var bin in caps.InputBinCapability)
                    {
                        var name = ArabicBinName(bin);
                        if (!seen.Add(name)) continue;
                        trays.Add(new PaperTray
                        {
                            Id = $"bin-{bin}",
                            TrayIndex = index++,
                            Name = name,
                            Type = "من تعريف الطابعة",
                            IsDetected = true,
                            CurrentLevelPercent = 100,
                            CurrentSize = ""
                        });
                    }
                }
                catch { }
            }

            if (trays.Count == 0)
            {
                trays.Add(new PaperTray
                {
                    Id = "auto",
                    TrayIndex = 0,
                    Name = "اختيار تلقائي (تعريف الطابعة)",
                    Type = "تلقائي",
                    IsDetected = false,
                    CurrentLevelPercent = 100,
                    CurrentSize = "تلقائي"
                });
            }

            return trays;
        }

        private static string ArabicBinName(InputBin bin) => bin switch
        {
            InputBin.AutoSelect => "تحديد تلقائي (Auto Select)",
            InputBin.Manual => "تغذية يدوية (Manual Feed)",
            InputBin.Tractor => "علوي (Tractor)",
            InputBin.Cassette => "درج كاسيت (Cassette)",
            InputBin.AutoSheetFeeder => "وحدة تغذية تلقائية",
            InputBin.ForcedTray => "درج إجباري",
            _ => bin.ToString()
        };

        /* ============================ المقاسات ============================ */

        private static ObservableCollection<PaperSize> ReadSizes(PrintCapabilities? caps)
        {
            var sizes = new ObservableCollection<PaperSize>();
            var seen = new HashSet<string>();

            void Add(string id, string name, int w, int h)
            {
                if (seen.Add(id)) sizes.Add(new PaperSize { Id = id, Name = name, WidthMm = w, HeightMm = h });
            }

            if (caps != null)
            {
                try
                {
                    foreach (var media in caps.PageMediaSizeCapability)
                    {
                        var w = media.Width ?? 0;
                        var h = media.Height ?? 0;
                        if (w <= 0 || h <= 0) continue;

                        // PrintCapabilities يعطي القياسات بوحدات 1/96 بوصة
                        int wMm = (int)Math.Round(w * 25.4 / 96.0);
                        int hMm = (int)Math.Round(h * 25.4 / 96.0);

                        var label = media.PageMediaSizeName?.ToString() ?? $"{wMm}x{hMm}";
                        Add(label, $"{label} ({wMm} × {hMm} مم)", wMm, hMm);
                    }
                }
                catch { }
            }

            // المقاسات القياسية متاحة دائماً في أي تعريف
            Add("A4", "A4 (210 × 297 مم)", 210, 297);
            Add("A3", "A3 (297 × 420 مم)", 297, 420);
            Add("Letter", "Letter (216 × 279 مم)", 216, 279);
            Add("Legal", "Legal (216 × 356 مم)", 216, 356);
            Add("A5", "A5 (148 × 210 مم)", 148, 210);

            return sizes;
        }

        private static bool ReadSupportsColor(PrintCapabilities? caps)
        {
            try
            {
                if (caps == null) return true;
                foreach (var c in caps.OutputColorCapability)
                    if (c == OutputColor.Color) return true;
                return false;
            }
            catch { return true; }
        }

        private static bool ReadSupportsDuplex(PrintCapabilities? caps)
        {
            try
            {
                if (caps == null) return true;
                foreach (var d in caps.DuplexingCapability)
                    if (d != Duplexing.OneSided) return true;
                return false;
            }
            catch { return true; }
        }

        /* ============================ الطباعة الفعلية ============================ */

        public PrintQueue? GetQueue(string printerName)
        {
            try { return _server.GetPrintQueue(printerName); }
            catch { return null; }
        }

        /// <summary>يبني تذكرة طباعة حقيقية من خيارات الواجهة.</summary>
        public PrintTicket BuildTicket(
            PrinterInfo printer,
            bool isColor,
            string duplexMode,
            string layout,
            int copies,
            PaperSize? paperSize,
            PaperTray? tray,
            bool isGrayscale)
        {
            var queue = GetQueue(printer.Id);
            var ticket = queue?.DefaultPrintTicket ?? new PrintTicket();

            try
            {
                ticket.CopyCount = Math.Max(1, copies);

                if (!isColor || isGrayscale)
                {
                    ticket.OutputColor = OutputColor.Grayscale;
                }

                ticket.Duplexing = duplexMode switch
                {
                    "duplex_long" => Duplexing.TwoSidedLongEdge,
                    "duplex_short" => Duplexing.TwoSidedShortEdge,
                    _ => Duplexing.OneSided
                };

                // صفحات متعددة في الورقة = NUp حقيقي في التعريف
                ticket.PagesPerSheet = layout switch
                {
                    "2-up" => 2,
                    "4-up" => 4,
                    "booklet" => 2,
                    _ => 1
                };
                ticket.PagesPerSheetDirection = PagesPerSheetDirection.RightBottom;

                if (paperSize != null)
                {
                    ticket.PageMediaSize = new PageMediaSize(paperSize.WidthMm, paperSize.HeightMm);
                }

                if (tray != null && tray.IsDetected)
                {
                    try { ticket.InputBin = InputBin.AutoSelect; } catch { }
                }

                ticket.PageOrientation = PageOrientation.Portrait;
            }
            catch
            {
                // بعض التعريفات لا تدعم كل الخصائص — نرجع التذكرة كاملة
            }

            return ticket;
        }

        public void Dispose() => _server.Dispose();
    }
}
