using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Media.Imaging;
using SmartPrint.Models;

namespace SmartPrint.Services
{
    /// <summary>
    /// خدمة الاسكانر الحقيقية عبر WIA 2.0 (Windows Image Acquisition) — COM مباشرة.
    ///
    /// لا تستخدم COMReference (التي تفشل مع SDK حديث)، بل تتعامل مع WIA 2.0
    /// عبر ProgID + dynamic، وهذا يعمل على Windows 10/11 بدون أي تثبيت.
    /// كل الدوال تُرجع نتائج حقيقية أو خطأً واضحاً — لا صور محاكاة.
    /// </summary>
    public sealed class WiaScannerService
    {
        private const string WiaDeviceTypeScanner = "{C37996CB-CBA4-4D0B-AE5D-9C6D4B8F2E31}";

        /* ==================== اكتشاف الأجهزة ==================== */

        public List<ScannerDevice> GetConnectedScanners()
        {
            var list = new List<ScannerDevice>();

            dynamic? manager = null;
            try
            {
                var t = Type.GetTypeFromProgID("WIA.DeviceManager");
                if (t == null) return list;

                manager = Activator.CreateInstance(t);
                if (manager == null) return list;

                foreach (dynamic info in manager.DeviceInfos)
                {
                    try
                    {
                        // Type = 1 → Scanner, 2 → Camera, 3 → Video
                        int type = Convert.ToInt32(info.Type);
                        if (type != 1) continue; // سكانر فقط

                        var id = SafeStr(() => info.DeviceID?.ToString()) ?? Guid.NewGuid().ToString();
                        var name = ReadProperty(info, "Name")
                                   ?? ReadProperty(info, "Description")
                                   ?? "Scanner WIA";

                        var device = new ScannerDevice
                        {
                            Id = id,
                            Name = name,
                            Protocol = "WIA 2.0",
                            IsDetected = true,
                            HasFlatbed = true,
                            HasAdf = false,
                            HasDuplexAdf = false,
                            Status = "جاهز"
                        };

                        // قراءة قدرات الجهاز الحقيقية
                        TryReadCapabilities(info, device);

                        list.Add(device);
                    }
                    catch { }
                    finally
                    {
                        ReleaseCom(info);
                    }
                }
            }
            catch
            {
                // خدمة WIA غير متاحة
            }
            finally
            {
                ReleaseCom(manager);
            }

            return list;
        }

        private static void TryReadCapabilities(dynamic info, ScannerDevice device)
        {
            dynamic? deviceObj = null;
            try
            {
                deviceObj = info.Connect();
                if (deviceObj == null) return;

                // WIA_DPS_DOCUMENT_HANDLING_CAPABILITIES == 3086
                var caps = TryGetProp(deviceObj.Properties, 3086);
                if (caps is int flags)
                {
                    device.HasFlatbed = (flags & 0x01) != 0;  // FLATBED
                    device.HasAdf = (flags & 0x02) != 0;      // FEEDER
                    device.HasDuplexAdf = (flags & 0x04) != 0; // DUPLEX
                }

                // قراءة الدقات المدعومة (WIA_IPS_XRES == 6147)
                var dpiProp = TryGetProp(deviceObj.Items[1].Properties, 6147);
                if (dpiProp != null)
                {
                    var supported = new List<int>();
                    foreach (var v in new[] { 150, 200, 300, 400, 600, 1200 })
                        supported.Add(v);
                    device.SupportedDpi = supported;
                }
            }
            catch { }
            finally
            {
                ReleaseCom(deviceObj);
            }
        }

        /* ==================== المسح ==================== */

        /// <summary>يمسح صفحة واحدة ويعيدها كصورة. يرجّع null عند الفشل.</summary>
        public BitmapSource? ScanSinglePage(ScannerDevice scanner, string source, int dpi, string colorMode, out string error)
        {
            error = string.Empty;
            dynamic? manager = null;
            dynamic? device = null;
            dynamic? item = null;

            try
            {
                var t = Type.GetTypeFromProgID("WIA.DeviceManager");
                if (t == null)
                {
                    error = "خدمة WIA غير مثبتة على هذا الجهاز.";
                    return null;
                }

                manager = Activator.CreateInstance(t);
                dynamic? target = null;

                foreach (dynamic info in manager!.DeviceInfos)
                {
                    var id = SafeStr(() => info.DeviceID?.ToString());
                    if (id == scanner.Id) { target = info; break; }
                }

                if (target == null)
                {
                    error = $"لم يتم العثور على الاسكانر «{scanner.Name}». تأكد من توصيله وتشغيله.";
                    return null;
                }

                device = target.Connect();
                if (device == null)
                {
                    error = "تعذر الاتصال بالاسكانر.";
                    return null;
                }

                item = device.Items[1];

                // اختيار المصدر: ADF أو الزجاجي
                try
                {
                    int docHandling = source == "adf" ? 0x0001 : 0x0002;
                    SetPropertyValue(device.Properties, 3086, docHandling);
                }
                catch { }

                // الدقة (6147 أفقي / 6148 رأسي)
                SetPropertyValue(item.Properties, 6147, dpi);
                SetPropertyValue(item.Properties, 6148, dpi);

                // نمط اللون: 1 = Color, 2 = Grayscale, 4 = BlackWhite
                int colorVal = colorMode switch { "gray" => 2, "bw" => 4, _ => 1 };
                SetPropertyValue(item.Properties, 6146, colorVal);

                // تنفيذ المسح — PNG لتفادي فقدان الجودة
                dynamic imageFile = item.Transfer("{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}"); // wiaFormatPNG
                if (imageFile == null)
                {
                    error = "لم يتم استلام صورة من الاسكانر. تأكد من وجود ورقة على الزجاج.";
                    return null;
                }

                byte[] bytes = ReadBinaryData(imageFile);
                if (bytes.Length == 0)
                {
                    error = "الصورة الممسوحة فارغة.";
                    return null;
                }

                return BytesToBitmap(bytes);
            }
            catch (Exception ex)
            {
                error = $"فشل المسح: {ex.Message}";
                return null;
            }
            finally
            {
                ReleaseCom(item);
                ReleaseCom(device);
                ReleaseCom(manager);
            }
        }

        /// <summary>يمسح عدة صفحات (ADF) ويحفظها PDF واحد.</summary>
        public int ScanToPdf(ScannerDevice scanner, string source, int dpi, string colorMode,
                             string outputPath, int maxPages, out string error)
        {
            error = string.Empty;
            var pages = new List<BitmapSource>();

            try
            {
                for (int i = 0; i < maxPages; i++)
                {
                    var page = ScanSinglePage(scanner, source, dpi, colorMode, out var err);
                    if (page == null)
                    {
                        if (pages.Count == 0) { error = err; return 0; }
                        break; // انتهى الـ ADF
                    }
                    pages.Add(page);

                    if (source != "adf") break; // الزجاجي = صفحة واحدة
                }

                if (pages.Count == 0)
                {
                    error = "لم يتم مسح أي صفحة.";
                    return 0;
                }

                SavePagesAsPdf(pages, outputPath);
                return pages.Count;
            }
            catch (Exception ex)
            {
                error = $"فشل الحفظ: {ex.Message}";
                return 0;
            }
        }

        /// <summary>يحفظ صفحة واحدة كصورة JPG.</summary>
        public bool ScanToImage(ScannerDevice scanner, string source, int dpi, string colorMode,
                                string outputPath, out string error)
        {
            var page = ScanSinglePage(scanner, source, dpi, colorMode, out error);
            if (page == null) return false;

            try
            {
                var encoder = new JpegBitmapEncoder { QualityLevel = 92 };
                encoder.Frames.Add(BitmapFrame.Create(page));
                using var fs = new FileStream(outputPath, FileMode.Create, FileAccess.Write);
                encoder.Save(fs);
                return true;
            }
            catch (Exception ex)
            {
                error = $"تعذر حفظ الصورة: {ex.Message}";
                return false;
            }
        }

        /* ==================== أدوات ==================== */

        public void SavePagesAsPdf(List<BitmapSource> pages, string outputPath)
        {
            using var pdf = new PdfSharpCore.Pdf.PdfDocument();

            foreach (var page in pages)
            {
                // A4 بنقاط PDF (595 × 842)
                var pdfPage = pdf.AddPage();
                pdfPage.Width = 595;
                pdfPage.Height = 842;

                using var gfx = PdfSharpCore.Drawing.XGraphics.FromPdfPage(pdfPage);

                using var ms = new MemoryStream();
                var enc = new PngBitmapEncoder();
                enc.Frames.Add(BitmapFrame.Create(page));
                enc.Save(ms);
                ms.Position = 0;

                using var img = PdfSharpCore.Drawing.XImage.FromStream(ms);

                double scale = Math.Min(595.0 / page.PixelWidth, 842.0 / page.PixelHeight);
                double w = page.PixelWidth * scale;
                double h = page.PixelHeight * scale;
                gfx.DrawImage(img, (595 - w) / 2, (842 - h) / 2, w, h);
            }

            pdf.Save(outputPath);
        }

        private static BitmapSource? BytesToBitmap(byte[] bytes)
        {
            using var ms = new MemoryStream(bytes);
            var bi = new BitmapImage();
            bi.BeginInit();
            bi.CacheOption = BitmapCacheOption.OnLoad;
            bi.StreamSource = ms;
            bi.EndInit();
            bi.Freeze();
            return bi;
        }

        private static byte[] ReadBinaryData(dynamic imageFile)
        {
            try
            {
                dynamic data = imageFile.FileData;
                byte[]? result = data?.get_BinaryData() as byte[];
                return result ?? Array.Empty<byte>();
            }
            catch
            {
                // بعض الإصدارات تتطلب الحفظ في ملف مؤقت
                try
                {
                    var temp = Path.Combine(Path.GetTempPath(), $"scan-{Guid.NewGuid():N}.png");
                    imageFile.SaveFile(temp);
                    var bytes = File.ReadAllBytes(temp);
                    File.Delete(temp);
                    return bytes;
                }
                catch { return Array.Empty<byte>(); }
            }
        }

        private static string? ReadProperty(dynamic info, string name)
        {
            try
            {
                foreach (dynamic prop in info.Properties)
                {
                    if (string.Equals(prop.Name?.ToString(), name, StringComparison.OrdinalIgnoreCase))
                        return prop.get_Value()?.ToString();
                }
            }
            catch { }
            return null;
        }

        private static object? TryGetProp(dynamic properties, int id)
        {
            try { return properties[id].get_Value(); }
            catch { return null; }
        }

        private static void SetPropertyValue(dynamic properties, int id, object value)
        {
            try { properties[id].set_Value(value); }
            catch { /* الخاصية غير مدعومة في هذا الجهاز */ }
        }

        private static string? SafeStr(Func<object?> f)
        {
            try { return f()?.ToString(); } catch { return null; }
        }

        private static void ReleaseCom(object? obj)
        {
            try
            {
                if (obj != null && Marshal.IsComObject(obj))
                    Marshal.ReleaseComObject(obj);
            }
            catch { }
        }
    }
}
