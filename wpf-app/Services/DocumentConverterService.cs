using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Markup;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using SmartPrint.Models;
using Xceed.Words.NET;
using Brushes = System.Windows.Media.Brushes;
using Color = System.Windows.Media.Color;
using FlowDirection = System.Windows.FlowDirection;
using Pen = System.Windows.Media.Pen;
using Point = System.Windows.Point;

namespace SmartPrint.Services
{
    /// <summary>
    /// تحويل المستندات ومعاينتها:
    ///  - عدد الصفحات الحقيقي: PDF عبر PDFium، Word عبر DocX، الصور = 1.
    ///  - معاينة حقيقية: أول صفحة من الملف نفسه (PDF/صورة) وليس رسماً متخيلاً.
    ///  - تحويل Word إلى صفحات FixedDocument للطباعة.
    /// </summary>
    public class DocumentConverterService
    {
        public int EstimatePageCount(string filePath)
        {
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            switch (ext)
            {
                case ".pdf":
                    return PdfPageRenderer.PageCount(filePath) is int n and > 0 ? n : 1;

                case ".docx":
                    try
                    {
                        using var doc = DocX.Load(filePath);
                        int paragraphs = doc.Paragraphs.Count;
                        int tables = doc.Tables.Count;
                        return Math.Max(1, (int)Math.Ceiling((paragraphs + tables * 6) / 14.0));
                    }
                    catch { return 1; }

                case ".jpg":
                case ".jpeg":
                case ".png":
                case ".bmp":
                case ".tif":
                case ".tiff":
                    return 1;

                case ".txt":
                    try { return Math.Max(1, File.ReadAllLines(filePath).Length / 45 + 1); }
                    catch { return 1; }

                default:
                    return 1;
            }
        }

        /* ==================== المعاينة الحقيقية ==================== */

        /// <summary>يرجع معاينة الصفحة المطلوبة من الملف — من محتواه الفعلي.</summary>
        public BitmapSource? GeneratePreviewBitmap(
            PrintJobItem? job, int sheetIndex, string layout, bool isGrayscale, bool isBackSide)
        {
            int sheetW = 800;
            int sheetH = 1131;

            if (job == null || !File.Exists(job.FilePath))
                return RenderPlaceholder(sheetW, sheetH, "لا يوجد ملف محدد", "");

            var ext = Path.GetExtension(job.FilePath).ToLowerInvariant();

            try
            {
                if (ext == ".pdf")
                {
                    var page = PdfPageRenderer.RenderPage(
                        File.ReadAllBytes(job.FilePath),
                        Math.Max(0, sheetIndex), 110);

                    if (page == null) return RenderPlaceholder(sheetW, sheetH, job.FileName, "تعذر قراءة PDF");
                    return ComposeSheet(new List<BitmapSource> { page }, sheetW, sheetH, isGrayscale, false);
                }

                if (ext is ".jpg" or ".jpeg" or ".png" or ".bmp" or ".tif" or ".tiff")
                {
                    var bmp = new BitmapImage();
                    bmp.BeginInit();
                    bmp.CacheOption = BitmapCacheOption.OnLoad;
                    bmp.UriSource = new Uri(job.FilePath);
                    bmp.EndInit();
                    bmp.Freeze();
                    return ComposeSheet(new List<BitmapSource> { bmp }, sheetW, sheetH, isGrayscale, false);
                }

                if (ext == ".docx")
                {
                    var doc = BuildWordDocument(job.FilePath, null, isGrayscale);
                    if (doc != null && doc.Pages.Count > 0)
                    {
                        var page = doc.Pages[Math.Min(sheetIndex, doc.Pages.Count - 1)];
                        return RenderFixedPageToBitmap(page, sheetW, sheetH);
                    }
                }
            }
            catch { }

            return RenderPlaceholder(sheetW, sheetH,
                job.FileName,
                $"{job.DocumentType} · {job.PageCount} صفحة · {job.FileSizeFormatted}");
        }

        private BitmapSource ComposeSheet(
            List<BitmapSource> pages, int sheetW, int sheetH, bool grayscale, bool _unusedRotate)
        {
            var visual = new DrawingVisual();
            using (var dc = visual.RenderOpen())
            {
                dc.DrawRectangle(Brushes.White, null, new Rect(0, 0, sheetW, sheetH));
                dc.DrawRectangle(null, new Pen(new SolidColorBrush(Color.FromRgb(226, 232, 240)), 2),
                    new Rect(1, 1, sheetW - 2, sheetH - 2));

                if (pages.Count > 0)
                {
                    var src = grayscale ? PdfPageRenderer.ToGrayscale(pages[0]) : pages[0];
                    double scale = Math.Min((sheetW - 40.0) / src.PixelWidth, (sheetH - 40.0) / src.PixelHeight);
                    double w = src.PixelWidth * scale;
                    double h = src.PixelHeight * scale;
                    dc.DrawImage(src, new Rect((sheetW - w) / 2, (sheetH - h) / 2, w, h));
                }
            }

            var target = new RenderTargetBitmap(sheetW, sheetH, 96, 96, PixelFormats.Pbgra32);
            target.Render(visual);
            target.Freeze();
            return target;
        }

        private BitmapSource RenderFixedPageToBitmap(PageContent page, int w, int h)
        {
            var visual = new DrawingVisual();
            using (var dc = visual.RenderOpen())
            {
                dc.DrawRectangle(Brushes.White, null, new Rect(0, 0, w, h));
                var fixedPage = page.Child as FixedPage;
                if (fixedPage != null)
                {
                    var brush = new VisualBrush(fixedPage) { Stretch = Stretch.Uniform };
                    dc.DrawRectangle(brush, null, new Rect(10, 10, w - 20, h - 20));
                }
            }
            var target = new RenderTargetBitmap(w, h, 96, 96, PixelFormats.Pbgra32);
            target.Render(visual);
            target.Freeze();
            return target;
        }

        private BitmapSource RenderPlaceholder(int w, int h, string title, string subtitle)
        {
            var visual = new DrawingVisual();
            using (var dc = visual.RenderOpen())
            {
                dc.DrawRectangle(Brushes.White, null, new Rect(0, 0, w, h));
                dc.DrawRectangle(null, new Pen(new SolidColorBrush(Color.FromRgb(226, 232, 240)), 2),
                    new Rect(1, 1, w - 2, h - 2));

                var titleText = new FormattedText(title,
                    System.Globalization.CultureInfo.GetCultureInfo("ar-EG"),
                    FlowDirection.RightToLeft,
                    new Typeface("Segoe UI"), 20, Brushes.Gray, 1.0);
                dc.DrawText(titleText, new Point(40, 60));

                if (!string.IsNullOrEmpty(subtitle))
                {
                    var sub = new FormattedText(subtitle,
                        System.Globalization.CultureInfo.GetCultureInfo("ar-EG"),
                        FlowDirection.RightToLeft,
                        new Typeface("Segoe UI"), 13, Brushes.LightGray, 1.0);
                    dc.DrawText(sub, new Point(40, 95));
                }
            }
            var target = new RenderTargetBitmap(w, h, 96, 96, PixelFormats.Pbgra32);
            target.Render(visual);
            target.Freeze();
            return target;
        }

        /* ==================== Word → صفحات ==================== */

        /// <summary>يبني مستنداً قابلاً للطباعة من ملف .docx (بدون Microsoft Office).</summary>
        public FixedDocument? BuildWordDocument(string docxPath, PaperSize? size, bool grayscale)
        {
            try
            {
                using var doc = DocX.Load(docxPath);

                double w = (size?.WidthMm ?? 210) * 96.0 / 25.4;
                double h = (size?.HeightMm ?? 297) * 96.0 / 25.4;
                const double margin = 60;

                var fixedDoc = new FixedDocument();
                fixedDoc.DocumentPaginator.PageSize = new Size(w, h);

                // نبني Paragraphs كثنائي من WPF ثم نقسّمها على صفحات
                var paragraphs = doc.Paragraphs
                    .Select(p => p.Text?.TrimEnd() ?? string.Empty)
                    .ToList();

                if (paragraphs.Count == 0) return null;

                double lineHeight = 24;
                int linesPerPage = Math.Max(1, (int)((h - margin * 2) / lineHeight));

                var wrapped = new List<string>();
                foreach (var p in paragraphs)
                {
                    if (string.IsNullOrWhiteSpace(p)) { wrapped.Add(string.Empty); continue; }
                    // تقسيم النص الطويل إلى أسطر بحد أقصى للعرض
                    var words = p.Split(' ');
                    var line = string.Empty;
                    foreach (var word in words)
                    {
                        if ((line + " " + word).Length > 85)
                        {
                            wrapped.Add(line.Trim());
                            line = word;
                        }
                        else
                        {
                            line = string.IsNullOrEmpty(line) ? word : line + " " + word;
                        }
                    }
                    if (!string.IsNullOrEmpty(line)) wrapped.Add(line.Trim());
                    wrapped.Add(string.Empty);
                }


                for (int i = 0; i < wrapped.Count; i += linesPerPage)
                {
                    var page = new FixedPage { Width = w, Height = h };
                    var bg = new System.Windows.Shapes.Rectangle { Width = w, Height = h, Fill = Brushes.White };
                    FixedPage.SetLeft(bg, 0);
                    FixedPage.SetTop(bg, 0);
                    page.Children.Add(bg);
                    double y = margin;

                    for (int j = i; j < Math.Min(i + linesPerPage, wrapped.Count); j++)
                    {
                        var text = new TextBlock
                        {
                            Text = wrapped[j],
                            FontFamily = new FontFamily("Segoe UI, Tahoma, Arial"),
                            FontSize = 13,
                            Foreground = Brushes.Black,
                            Width = w - margin * 2,
                            TextWrapping = TextWrapping.Wrap,
                            FlowDirection = FlowDirection.RightToLeft,
                            TextAlignment = TextAlignment.Right
                        };
                        FixedPage.SetLeft(text, margin);
                        FixedPage.SetTop(text, y);
                        page.Children.Add(text);
                        y += lineHeight;
                    }

                    var content = new PageContent();
                    ((IAddChild)content).AddChild(page);
                    fixedDoc.Pages.Add(content);
                }

                return fixedDoc.Pages.Count > 0 ? fixedDoc : null;
            }
            catch
            {
                return null;
            }
        }
    }
}
