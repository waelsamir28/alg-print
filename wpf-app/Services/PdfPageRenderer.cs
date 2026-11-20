using System.IO;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Docnet.Core;
using Docnet.Core.Models;

namespace SmartPrint.Services
{
    /// <summary>
    /// يرسم صفحات PDF الحقيقية إلى صور عبر PDFium (المحرك الذي يستخدمه Chrome).
    /// يعمل بدون Adobe ولا Ghostscript ولا أي تثبيت خارجي.
    /// يدعم العربية لأن PDFium يرسم النصوص والخطوط المضمّنة كما هي في الملف.
    /// </summary>
    public static class PdfPageRenderer
    {
        /// <summary>عدد صفحات ملف PDF الحقيقي (0 إذا كان الملف تالفاً).</summary>
        public static int PageCount(string pdfPath)
        {
            try
            {
                var bytes = File.ReadAllBytes(pdfPath);
                using var doc = DocLib.Instance.GetDocReader(bytes, new PageDimensions(1.0));
                return doc.GetPageCount();
            }
            catch
            {
                return 0;
            }
        }

        /// <summary>يرسم صفحة واحدة (0-based) إلى BitmapSource بدقة dpi.</summary>
        public static BitmapSource? RenderPage(byte[] pdfBytes, int pageIndex, int dpi = 150)
        {
            try
            {
                // PDFium يعمل بمقياس نسبي: 1.0 ≈ 72 DPI، لذا dpi/72
                double scale = Math.Clamp(dpi / 72.0, 0.5, 4.0);

                using var doc = DocLib.Instance.GetDocReader(pdfBytes, new PageDimensions(scale));
                if (pageIndex < 0 || pageIndex >= doc.GetPageCount()) return null;

                using var page = doc.GetPageReader(pageIndex);
                int w = page.GetPageWidth();
                int h = page.GetPageHeight();
                if (w <= 0 || h <= 0) return null;

                var bgra = page.GetImage(); // BGRA32
                var bmp = BitmapSource.Create(
                    w, h, dpi, dpi,
                    PixelFormats.Bgra32, null, bgra, w * 4);
                bmp.Freeze();
                return bmp;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>يرسم كل الصفحات (بحد أقصى للذاكرة).</summary>
        public static List<BitmapSource> RenderAll(string pdfPath, int dpi = 150, int maxPages = 100)
        {
            var list = new List<BitmapSource>();
            try
            {
                var bytes = File.ReadAllBytes(pdfPath);
                using var doc = DocLib.Instance.GetDocReader(bytes, new PageDimensions(Math.Clamp(dpi / 72.0, 0.5, 4.0)));
                int count = Math.Min(doc.GetPageCount(), maxPages);

                for (int i = 0; i < count; i++)
                {
                    using var page = doc.GetPageReader(i);
                    int w = page.GetPageWidth();
                    int h = page.GetPageHeight();
                    if (w <= 0 || h <= 0) continue;

                    var bgra = page.GetImage();
                    var bmp = BitmapSource.Create(w, h, dpi, dpi, PixelFormats.Bgra32, null, bgra, w * 4);
                    bmp.Freeze();
                    list.Add(bmp);
                }
            }
            catch { }
            return list;
        }

        /// <summary>يحوّل صورة إلى تدرّج رمادي (لوضع التوفير).</summary>
        public static BitmapSource ToGrayscale(BitmapSource source)
        {
            var gray = new FormatConvertedBitmap();
            gray.BeginInit();
            gray.Source = source;
            gray.DestinationFormat = PixelFormats.Gray8;
            gray.EndInit();
            gray.Freeze();
            return gray;
        }
    }
}
