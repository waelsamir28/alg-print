using System.IO;
using System.Printing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Xps.Packaging;
using SmartPrint.Models;
using Brushes = System.Windows.Media.Brushes;
using Image = System.Windows.Controls.Image;
using Size = System.Windows.Size;

namespace SmartPrint.Services
{
    public class PrintResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// محرك الطباعة الحقيقي على ويندوز.
    ///
    /// الطريقة: كل ملف يُحوَّل إلى صفحات FixedDocument (عبر PDFium للـ PDF،
    /// ومحلل الصور للصور، وDocX للوورد) ثم تُكتب كـ XPS وتُسلَّم إلى
    /// PrintQueue.CreateXpsDocumentWriter — وهو المسار الرسمي لويندوز.
    /// لا توجد أي محاكاة: أخطاء الطابعة الحقيقية تُرجَع كما هي.
    /// </summary>
    public sealed class PrintEngineService
    {
        private readonly PrinterService _printerService = new();

        public int CalculateTotalSheets(int totalPages, string layout, bool isDuplex)
        {
            int pagesPerSheet = layout switch
            {
                "2-up" => 2,
                "4-up" => 4,
                "booklet" => 2,
                _ => 1
            };
            int sheets = (int)Math.Ceiling((double)Math.Max(0, totalPages) / pagesPerSheet);
            if (isDuplex) sheets = (int)Math.Ceiling(sheets / 2.0);
            return Math.Max(0, sheets);
        }

        /* ===================== الطباعة ===================== */

        public PrintResult PrintFiles(
            PrinterInfo printer,
            PaperTray? tray,
            PaperSize? paperSize,
            List<PrintJobItem> jobs,
            bool isColor,
            string duplexMode,
            string layout,
            int copies,
            Action<string>? progress = null)
        {
            if (jobs.Count == 0)
                return new PrintResult { Success = false, Message = "لا توجد ملفات للطباعة." };

            try
            {
                using var server = new LocalPrintServer();
                using var queue = server.GetPrintQueue(printer.Id);

                queue.Refresh();
                if (queue.IsOffline)
                    return new PrintResult { Success = false, Message = $"الطابعة «{printer.Name}» غير متصلة." };

                var ticket = _printerService.BuildTicket(
                    printer, isColor, duplexMode, layout, copies, paperSize, tray, !isColor);

                var writer = PrintQueue.CreateXpsDocumentWriter(queue);
                int ok = 0;
                var errors = new List<string>();

                int index = 0;
                foreach (var job in jobs)
                {
                    index++;
                    progress?.Invoke($"({index}/{jobs.Count}) {job.FileName}");

                    try
                    {
                        if (!File.Exists(job.FilePath)) { errors.Add($"{job.FileName}: الملف غير موجود"); continue; }

                        var doc = BuildFixedDocument(job, layout, paperSize, !isColor);
                        if (doc == null || doc.Pages.Count == 0)
                        {
                            errors.Add($"{job.FileName}: صيغة غير مدعومة");
                            continue;
                        }

                        // كل مهمة تُرسل منفصلة باسم الملف لتظهر في طابور ويندوز
                        queue.CurrentJobSettings.Description = job.FileName;
                        writer.Write(doc.DocumentPaginator, ticket);
                        ok++;
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"{job.FileName}: {ex.Message}");
                    }
                }

                return new PrintResult
                {
                    Success = ok > 0,
                    Message = ok > 0
                        ? $"تم إرسال {ok} من {jobs.Count} ملف إلى «{printer.Name}».\n" +
                          $"النسخ: {copies} · التخطيط: {LayoutName(layout)} · {(duplexMode == "simplex" ? "وجه واحد" : "وش وضهر")}" +
                          (errors.Count > 0 ? $"\n\nتحذيرات:\n• {string.Join("\n• ", errors)}" : "")
                        : $"فشل الإرسال:\n• {string.Join("\n• ", errors)}"
                };
            }
            catch (Exception ex)
            {
                return new PrintResult { Success = false, Message = $"تعذر الوصول للطابعة: {ex.Message}" };
            }
        }

        /// <summary>طباعة صورة ممسوحة (التصوير الفوري).</summary>
        public PrintResult PrintBitmap(PrinterInfo printer, BitmapSource bitmap, int copies, PaperSize? paperSize)
        {
            try
            {
                using var server = new LocalPrintServer();
                using var queue = server.GetPrintQueue(printer.Id);
                queue.Refresh();
                if (queue.IsOffline)
                    return new PrintResult { Success = false, Message = "الطابعة غير متصلة." };

                var ticket = queue.DefaultPrintTicket ?? new PrintTicket();
                ticket.CopyCount = Math.Max(1, copies);

                double w = (paperSize?.WidthMm ?? 210) * 96.0 / 25.4;
                double h = (paperSize?.HeightMm ?? 297) * 96.0 / 25.4;

                try
                {
                    if (paperSize != null)
                        ticket.PageMediaSize = new PageMediaSize(
                            paperSize.WidthMm * 96.0 / 25.4,
                            paperSize.HeightMm * 96.0 / 25.4);
                }
                catch { }

                var doc = BuildSheet(new List<BitmapSource> { bitmap }, "1-up", w, h);

                var writer = PrintQueue.CreateXpsDocumentWriter(queue);
                queue.CurrentJobSettings.Description = "SMART PRINT — تصوير فوري";
                writer.Write(doc.DocumentPaginator, ticket);

                return new PrintResult { Success = true, Message = $"تم إرسال {copies} نسخة إلى «{printer.Name}»." };
            }
            catch (Exception ex)
            {
                return new PrintResult { Success = false, Message = $"تعذر الطباعة: {ex.Message}" };
            }
        }

        /* ===================== بناء المستند ===================== */

        public FixedDocument? BuildFixedDocument(PrintJobItem job, string layout, PaperSize? size, bool grayscale)
        {
            var ext = Path.GetExtension(job.FilePath).ToLowerInvariant();
            double w = (size?.WidthMm ?? 210) * 96.0 / 25.4;
            double h = (size?.HeightMm ?? 297) * 96.0 / 25.4;

            if (ext is ".jpg" or ".jpeg" or ".png" or ".bmp" or ".tif" or ".tiff" or ".gif")
            {
                var img = LoadBitmap(job.FilePath);
                if (img == null) return null;
                return BuildSheet(new List<BitmapSource> { grayscale ? PdfPageRenderer.ToGrayscale(img) : img }, layout, w, h);
            }

            if (ext == ".pdf")
            {
                var pages = PdfPageRenderer.RenderAll(job.FilePath, 150, 300);
                if (pages.Count == 0) return null;
                if (grayscale) pages = pages.Select(PdfPageRenderer.ToGrayscale).ToList();
                return BuildSheet(pages, layout, w, h);
            }

            if (ext == ".xps")
            {
                try
                {
                    using var xps = new XpsDocument(job.FilePath, FileAccess.Read);
                    var seq = xps.GetFixedDocumentSequence();
                    if (seq == null) return null;

                    // تسلسل XPS → نعيد بناء الصفحات كـ FixedDocument
                    var rebuilt = new FixedDocument();
                    foreach (var docRef in seq.References)
                    {
                        var doc = docRef.GetDocument(false);
                        if (doc == null) continue;
                        foreach (var pageContent in doc.Pages)
                        {
                            var fp = pageContent.GetPageRoot(false);
                            if (fp != null)
                            {
                                var pc = new PageContent();
                                ((IAddChild)pc).AddChild(fp);
                                rebuilt.Pages.Add(pc);
                            }
                        }
                    }
                    return rebuilt.Pages.Count > 0 ? rebuilt : null;
                }
                catch { return null; }
            }

            // .docx
            var converter = new DocumentConverterService();
            return converter.BuildWordDocument(job.FilePath, size, grayscale);
        }

        /// <summary>يرصف عدة صور في ورقة واحدة حسب التخطيط (1-up / 2-up / 4-up / booklet).</summary>
        private FixedDocument BuildSheet(List<BitmapSource> pages, string layout, double sheetW, double sheetH)
        {
            var doc = new FixedDocument();
            doc.DocumentPaginator.PageSize = new Size(sheetW, sheetH);

            int perSheet = layout switch { "2-up" => 2, "4-up" => 4, "booklet" => 2, _ => 1 };

            for (int i = 0; i < pages.Count; i += perSheet)
            {
                var page = new FixedPage { Width = sheetW, Height = sheetH };
                var bg = new System.Windows.Shapes.Rectangle
                {
                    Width = sheetW,
                    Height = sheetH,
                    Fill = Brushes.White
                };
                FixedPage.SetLeft(bg, 0);
                FixedPage.SetTop(bg, 0);
                page.Children.Add(bg);

                for (int slot = 0; slot < perSheet && i + slot < pages.Count; slot++)
                {
                    double slotW = perSheet == 1 ? sheetW : perSheet == 2 ? sheetW / 2 : sheetW / 2;
                    double slotH = perSheet == 4 ? sheetH / 2 : sheetH;
                    double x = perSheet == 1 ? 0 : (slot % 2) * slotW;
                    double y = perSheet == 4 && slot >= 2 ? slotH : 0;

                    var img = new Image
                    {
                        Source = pages[i + slot],
                        Stretch = Stretch.Uniform,
                        Width = slotW,
                        Height = slotH
                    };
                    FixedPage.SetLeft(img, x);
                    FixedPage.SetTop(img, y);
                    page.Children.Add(img);
                }

                var content = new PageContent();
                ((IAddChild)content).AddChild(page);
                doc.Pages.Add(content);
            }

            return doc;
        }

        private static BitmapSource? LoadBitmap(string path)
        {
            try
            {
                var bmp = new BitmapImage();
                bmp.BeginInit();
                bmp.CacheOption = BitmapCacheOption.OnLoad;
                bmp.UriSource = new Uri(path);
                bmp.EndInit();
                bmp.Freeze();
                return bmp;
            }
            catch { return null; }
        }

        public static string LayoutName(string layout) => layout switch
        {
            "2-up" => "صفحتين في الورقة",
            "4-up" => "4 صفحات في الورقة",
            "booklet" => "كتيب مطوي",
            _ => "صفحة واحدة"
        };

        /// <summary>ترتيب صفحات الكتيب (Saddle-Stitch).</summary>
        public List<Tuple<int, int>> CalculateBookletSignatures(int totalPages)
        {
            int padded = (int)Math.Ceiling(totalPages / 4.0) * 4;
            var signatures = new List<Tuple<int, int>>();
            int left = padded;
            int right = 1;
            while (right < left)
            {
                signatures.Add(new Tuple<int, int>(left, right));
                left--; right++;
                signatures.Add(new Tuple<int, int>(right, left));
                right++; left--;
            }
            return signatures;
        }
    }
}
