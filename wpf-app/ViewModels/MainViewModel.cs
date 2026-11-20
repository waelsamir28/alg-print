using System.Collections.ObjectModel;
using System.IO;
using System.Windows;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Win32;
using SmartPrint.Models;
using SmartPrint.Services;
using Application = System.Windows.Application;
using MessageBox = System.Windows.MessageBox;
using OpenFileDialog = Microsoft.Win32.OpenFileDialog;
using SaveFileDialog = Microsoft.Win32.SaveFileDialog;

namespace SmartPrint.ViewModels
{
    public partial class MainViewModel : ObservableObject, IDisposable
    {
        private readonly PrinterService _printerService = new();
        private readonly WiaScannerService _scannerService = new();
        private readonly DocumentConverterService _converterService = new();
        private readonly PrintEngineService _printEngineService = new();
        private readonly LicenseService _license = new();
        private readonly DispatcherTimer _statusTimer;

        /* ==================== الترخيص ==================== */
        public bool IsActivated => _license.IsActivated;
        public int TrialDaysLeft => _license.DaysLeft;
        public string MachineCode => _license.MachineCode;
        public bool CanUseApp => _license.CanUseApp;

        [ObservableProperty] private string _licenseBannerText = string.Empty;
        [ObservableProperty] private bool _isLicenseBannerVisible;
        [ObservableProperty] private string _serialInput = string.Empty;
        [ObservableProperty] private string _licenseMessage = string.Empty;

        /* ==================== التنقل ==================== */
        [ObservableProperty] private bool _isPrintTabSelected = true;
        [ObservableProperty] private bool _isScannerTabSelected;

        partial void OnIsPrintTabSelectedChanged(bool value)
        {
            if (value) IsScannerTabSelected = false;
        }

        partial void OnIsScannerTabSelectedChanged(bool value)
        {
            if (value) IsPrintTabSelected = false;
        }

        /* ==================== الملفات ==================== */
        public ObservableCollection<PrintJobItem> PrintJobsList { get; } = new();
        [ObservableProperty] private PrintJobItem? _selectedJob;

        /* ==================== الطابعات الحقيقية ==================== */
        public ObservableCollection<PrinterInfo> InstalledPrinters { get; } = new();
        [ObservableProperty] private PrinterInfo? _selectedPrinter;
        [ObservableProperty] private PaperTray? _selectedTray;
        [ObservableProperty] private PaperSize? _selectedPaperSize;

        /* ==================== خيارات الطباعة ==================== */
        [ObservableProperty] private bool _isColorMode = true;
        [ObservableProperty] private bool _isGrayscaleMode;
        [ObservableProperty] private string _selectedDuplexMode = "simplex";
        [ObservableProperty] private string _selectedLayout = "1-up";
        [ObservableProperty] private int _copiesCount = 1;
        [ObservableProperty] private string _pageRangeText = "الكل";
        [ObservableProperty] private string _customPageRange = string.Empty;

        /// <summary>خيارات معروضة بالعربية مع القيمة الفعلية.</summary>
        public record Choice(string Key, string Value);

        public List<Choice> LayoutChoices { get; } = new()
        {
            new("1-up", "صفحة واحدة في الورقة"),
            new("2-up", "صفحتين في الورقة"),
            new("4-up", "4 صفحات في الورقة"),
            new("booklet", "كتيب مطوي (Booklet)")
        };

        public List<Choice> DuplexChoices { get; } = new()
        {
            new("simplex", "وجه واحد"),
            new("duplex_long", "وش وضهر (قلب طويل)"),
            new("duplex_short", "وش وضهر (قلب قصير)")
        };

        public List<Choice> ScanSourceChoices { get; } = new()
        {
            new("flatbed", "الزجاجي (Flatbed)"),
            new("adf", "وحدة التغذية التلقائية (ADF)")
        };

        public List<Choice> ScanColorChoices { get; } = new()
        {
            new("color", "ملون"),
            new("gray", "رمادي"),
            new("bw", "أبيض وأسود")
        };

        /* ===== النسخ كنص — يمنع انهيار التحويل عند تفريغ الحقل ===== */

        private string _copiesText = "1";
        public string CopiesText
        {
            get => _copiesText;
            set
            {
                if (!Set(ref _copiesText, value)) return;
                CopiesCount = int.TryParse(value, out var n) && n > 0 ? Math.Min(999, n) : 1;
            }
        }

        private string _copyCopiesText = "1";
        public string CopyCopiesText
        {
            get => _copyCopiesText;
            set
            {
                if (!Set(ref _copyCopiesText, value)) return;
                CopyCopiesCount = int.TryParse(value, out var n) && n > 0 ? Math.Min(999, n) : 1;
            }
        }

        /* ==================== المعاينة ==================== */
        [ObservableProperty] private BitmapSource? _currentPreviewBitmap;
        [ObservableProperty] private string _currentSheetIndicator = "ورقة 0 من 0";
        [ObservableProperty] private int _currentSheetIndex;
        [ObservableProperty] private double _previewZoom = 1.0;
        [ObservableProperty] private int _previewRotation;
        [ObservableProperty] private bool _isPreviewBackSide;
        [ObservableProperty] private string _printJobSummaryText = "لم يتم إضافة ملفات — أضف ملفات للبدء";

        /* ==================== الاسكانر الحقيقي ==================== */
        public ObservableCollection<ScannerDevice> InstalledScanners { get; } = new();
        [ObservableProperty] private ScannerDevice? _selectedScanner;
        [ObservableProperty] private string _scanSource = "flatbed";
        public ObservableCollection<int> DpiOptions { get; } = new() { 150, 200, 300, 400, 600 };
        [ObservableProperty] private int _selectedDpi = 300;
        [ObservableProperty] private string _scanColorMode = "color";
        [ObservableProperty] private int _copyCopiesCount = 1;
        [ObservableProperty] private BitmapSource? _currentScannedImage;
        [ObservableProperty] private string _scannedPagesSummary = "لم يتم مسح أي صفحة بعد";

        /* ==================== الحالة العامة ==================== */
        [ObservableProperty] private bool _isBusy;
        [ObservableProperty] private string _busyText = string.Empty;
        [ObservableProperty] private string _statusMessage = "جاهز";

        public MainViewModel()
        {
            // ترخيص
            _license.Initialize();
            UpdateLicenseBanner();

            LoadPrinters();
            LoadScanners();

            // تحديث دوري لحالة الطابعات والحبر (كل 30 ثانية)
            _statusTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(30) };
            _statusTimer.Tick += (_, _) => RefreshPrinterStatus();
            _statusTimer.Start();

            UpdatePreview();
        }

        /* ==================== الترخيص ==================== */

        private void UpdateLicenseBanner()
        {
            if (_license.IsActivated)
            {
                IsLicenseBannerVisible = false;
                LicenseBannerText = "النسخة الكاملة مُفعّلة — مدى الحياة";
            }
            else if (_license.DaysLeft > 0)
            {
                IsLicenseBannerVisible = _license.DaysLeft <= 5;
                LicenseBannerText = $"فترة تجريبية — متبقي {_license.DaysLeft} من {LicenseService.TrialDays} يوماً. كود الجهاز: {_license.MachineCode}";
            }
            else
            {
                IsLicenseBannerVisible = true;
                LicenseBannerText = $"انتهت الفترة التجريبية — كود الجهاز: {_license.MachineCode}";
            }
        }

        [RelayCommand]
        private void ActivateLicense()
        {
            var res = _license.Activate(SerialInput);
            LicenseMessage = res.message;

            if (res.ok)
            {
                SerialInput = string.Empty;
                OnPropertyChanged(nameof(IsActivated));
                OnPropertyChanged(nameof(CanUseApp));
                UpdateLicenseBanner();
                MessageBox.Show(res.message + "\n\nتحياتي م / وائل الجمال",
                    "SMART PRINT — تم التفعيل", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        [RelayCommand]
        private void CopyMachineCode()
        {
            try
            {
                Clipboard.SetText(_license.MachineCode);
                StatusMessage = "تم نسخ كود الجهاز";
            }
            catch { }
        }

        [RelayCommand]
        private void ContactDeveloper()
        {
            var text = Uri.EscapeDataString(
                $"السلام عليكم م/ وائل، أرغب في تفعيل برنامج SMART PRINT.\nكود الجهاز: {_license.MachineCode}");
            try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(
                $"https://wa.me/201222355769?text={text}") { UseShellExecute = true }); }
            catch { }
        }

        /* ==================== تحميل الطابعات والاسكانرات ==================== */

        private void LoadPrinters()
        {
            InstalledPrinters.Clear();

            foreach (var p in _printerService.GetInstalledPrinters())
                InstalledPrinters.Add(p);

            if (InstalledPrinters.Count == 0)
            {
                StatusMessage = "لم يتم العثور على أي طابعة مثبتة على هذا الجهاز.";
                PrintJobSummaryText = "لا توجد طابعات — ثبّت طابعة من إعدادات ويندوز";
                return;
            }

            SelectedPrinter = InstalledPrinters.FirstOrDefault(p => p.IsDefault)
                              ?? InstalledPrinters.FirstOrDefault(p => p.IsOnline)
                              ?? InstalledPrinters[0];

            StatusMessage = $"تم العثور على {InstalledPrinters.Count} طابعة";
        }

        partial void OnSelectedPrinterChanged(PrinterInfo? value)
        {
            if (value == null) return;

            SelectedTray = value.PaperTrays.FirstOrDefault(t => t.CurrentSize == "A4")
                           ?? value.PaperTrays.FirstOrDefault();
            SelectedPaperSize = value.SupportedSizes.FirstOrDefault(s => s.Id == "A4")
                                ?? value.SupportedSizes.FirstOrDefault();

            if (!value.SupportsColor) IsColorMode = false;
            StatusMessage = $"{value.Name} — {value.Status}";
        }

        private void LoadScanners()
        {
            InstalledScanners.Clear();

            foreach (var s in _scannerService.GetConnectedScanners())
                InstalledScanners.Add(s);

            SelectedScanner = InstalledScanners.FirstOrDefault();

            if (InstalledScanners.Count == 0)
                ScannedPagesSummary = "لم يتم العثور على اسكانر — وصّل الجهاز وشغّله";
        }

        [RelayCommand]
        private void RefreshDevices()
        {
            LoadPrinters();
            LoadScanners();
            StatusMessage = "تم تحديث قائمة الأجهزة";
        }

        private void RefreshPrinterStatus()
        {
            if (InstalledPrinters.Count == 0) return;

            foreach (var old in InstalledPrinters.ToList())
            {
                var fresh = _printerService.GetInstalledPrinters()
                    .FirstOrDefault(p => p.Id == old.Id);

                if (fresh == null) continue;

                old.Status = fresh.Status;
                old.IsOnline = fresh.IsOnline;

                if (fresh.InkDetected)
                {
                    old.InkLevels.Black = fresh.InkLevels.Black;
                    old.InkLevels.Cyan = fresh.InkLevels.Cyan;
                    old.InkLevels.Magenta = fresh.InkLevels.Magenta;
                    old.InkLevels.Yellow = fresh.InkLevels.Yellow;
                    old.InkDetected = true;
                }
            }
        }

        /* ==================== إدارة الملفات ==================== */

        [RelayCommand]
        private void AddFiles()
        {
            var dlg = new OpenFileDialog
            {
                Multiselect = true,
                Filter = "كل الملفات المدعومة|*.pdf;*.docx;*.jpg;*.jpeg;*.png;*.bmp;*.tif;*.tiff;*.txt|" +
                         "ملفات PDF (*.pdf)|*.pdf|" +
                         "ملفات Word (*.docx)|*.docx|" +
                         "صور (*.jpg;*.png;*.bmp;*.tif)|*.jpg;*.jpeg;*.png;*.bmp;*.tif;*.tiff|" +
                         "كل الملفات (*.*)|*.*"
            };

            if (dlg.ShowDialog() == true)
                ProcessDroppedFiles(dlg.FileNames);
        }

        [RelayCommand]
        private void AddFolder()
        {
            var dlg = new System.Windows.Forms.FolderBrowserDialog
            {
                Description = "اختر مجلد المستندات"
            };

            if (dlg.ShowDialog() != System.Windows.Forms.DialogResult.OK) return;

            var supported = new[] { ".pdf", ".docx", ".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".txt" };
            var files = Directory.GetFiles(dlg.SelectedPath)
                .Where(f => supported.Contains(Path.GetExtension(f).ToLowerInvariant()))
                .ToArray();

            if (files.Length == 0)
            {
                MessageBox.Show("لا توجد ملفات مدعومة في هذا المجلد.", "SMART PRINT",
                    MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            ProcessDroppedFiles(files);
        }

        public void ProcessDroppedFiles(string[] filePaths)
        {
            foreach (var path in filePaths)
            {
                if (!File.Exists(path)) continue;
                if (PrintJobsList.Any(j => string.Equals(j.FilePath, path, StringComparison.OrdinalIgnoreCase)))
                    continue;

                var info = new FileInfo(path);
                var ext = Path.GetExtension(path).ToLowerInvariant();

                PrintJobsList.Add(new PrintJobItem
                {
                    FilePath = path,
                    FileName = info.Name,
                    DocumentType = ext.TrimStart('.').ToUpperInvariant(),
                    FileSizeFormatted = FormatSize(info.Length),
                    PageCount = _converterService.EstimatePageCount(path),
                    Status = "جاهز"
                });
            }

            SelectedJob ??= PrintJobsList.FirstOrDefault();
            UpdatePreview();
            StatusMessage = $"عدد الملفات: {PrintJobsList.Count}";
        }

        private static string FormatSize(long bytes) => bytes switch
        {
            < 1024 => $"{bytes} B",
            < 1024 * 1024 => $"{bytes / 1024.0:F1} KB",
            _ => $"{bytes / (1024.0 * 1024.0):F2} MB"
        };

        [RelayCommand] private void MoveUp()
        {
            if (SelectedJob == null) return;
            int i = PrintJobsList.IndexOf(SelectedJob);
            if (i > 0) PrintJobsList.Move(i, i - 1);
            UpdatePreview();
        }

        [RelayCommand] private void MoveDown()
        {
            if (SelectedJob == null) return;
            int i = PrintJobsList.IndexOf(SelectedJob);
            if (i >= 0 && i < PrintJobsList.Count - 1) PrintJobsList.Move(i, i + 1);
            UpdatePreview();
        }

        [RelayCommand] private void DeleteSelected()
        {
            if (SelectedJob == null) return;
            PrintJobsList.Remove(SelectedJob);
            SelectedJob = PrintJobsList.FirstOrDefault();
            UpdatePreview();
        }

        [RelayCommand] private void ClearAll()
        {
            PrintJobsList.Clear();
            SelectedJob = null;
            UpdatePreview();
        }

        /* ==================== الاختصارات ==================== */

        [RelayCommand] private void ApplyEcoPreset()
        {
            IsColorMode = false;
            IsGrayscaleMode = true;
            SelectedDuplexMode = "duplex_long";
            SelectedLayout = "2-up";
            UpdatePreview();
            StatusMessage = "وضع التوفير: أبيض وأسود + وش وضهر + صفحتين في الورقة";
        }

        [RelayCommand] private void ApplyBookletPreset()
        {
            SelectedDuplexMode = "duplex_short";
            SelectedLayout = "booklet";
            UpdatePreview();
            StatusMessage = "وضع الكتيب: ترتيب الصفحات للطي والتدبيس";
        }

        [RelayCommand] private void ApplyHighQualityPreset()
        {
            IsColorMode = true;
            IsGrayscaleMode = false;
            SelectedDuplexMode = "simplex";
            SelectedLayout = "1-up";
            UpdatePreview();
            StatusMessage = "جودة فائقة: ألوان كاملة + صفحة واحدة";
        }

        /* ==================== المعاينة ==================== */

        [RelayCommand] private void ZoomIn() => PreviewZoom = Math.Min(3.0, PreviewZoom + 0.2);
        [RelayCommand] private void ZoomOut() => PreviewZoom = Math.Max(0.5, PreviewZoom - 0.2);
        [RelayCommand] private void Rotate() => PreviewRotation = (PreviewRotation + 90) % 360;
        [RelayCommand] private void FlipDuplex() => IsPreviewBackSide = !IsPreviewBackSide;

        [RelayCommand]
        private void NextPage()
        {
            int total = TotalSheets();
            if (CurrentSheetIndex < total - 1) CurrentSheetIndex++;
            UpdatePreview();
        }

        [RelayCommand]
        private void PrevPage()
        {
            if (CurrentSheetIndex > 0) CurrentSheetIndex--;
            UpdatePreview();
        }

        private int TotalSheets()
        {
            int totalPages = PrintJobsList.Sum(j => j.PageCount);
            return Math.Max(1, _printEngineService.CalculateTotalSheets(
                totalPages, SelectedLayout, SelectedDuplexMode != "simplex"));
        }

        private void UpdatePreview()
        {
            int totalPages = PrintJobsList.Sum(j => j.PageCount);
            int sheets = TotalSheets();

            CurrentSheetIndicator = sheets > 0 ? $"ورقة {Math.Min(CurrentSheetIndex + 1, sheets)} من {sheets}" : "لا توجد صفحات";

            PrintJobSummaryText = PrintJobsList.Count == 0
                ? "لم يتم إضافة ملفات — أضف ملفات للبدء"
                : $"إجمالي: {PrintJobsList.Count} ملف ({totalPages} صفحة / {sheets} ورقة)";

            try
            {
                CurrentPreviewBitmap = _converterService.GeneratePreviewBitmap(
                    SelectedJob, CurrentSheetIndex, SelectedLayout, IsGrayscaleMode, IsPreviewBackSide);
            }
            catch (Exception ex)
            {
                CurrentPreviewBitmap = null;
                StatusMessage = $"تعذر عرض المعاينة: {ex.Message}";
            }
        }

        partial void OnSelectedJobChanged(PrintJobItem? value)
        {
            CurrentSheetIndex = 0;
            UpdatePreview();
        }

        partial void OnSelectedLayoutChanged(string value) => UpdatePreview();
        partial void OnIsGrayscaleModeChanged(bool value) => UpdatePreview();

        /* ==================== الطباعة الحقيقية ==================== */

        [RelayCommand]
        private async Task StartPrintingAsync()
        {
            if (!_license.CanUseApp)
            {
                MessageBox.Show(
                    "انتهت الفترة التجريبية. فعّل البرنامج للمتابعة.\n\n" +
                    $"كود الجهاز: {_license.MachineCode}\n\nتواصل: 01222355769",
                    "SMART PRINT — الترخيص", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            if (SelectedPrinter == null)
            {
                MessageBox.Show("لم يتم العثور على طابعة. تأكد من تثبيت طابعة في ويندوز.",
                    "تنبيه", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            if (PrintJobsList.Count == 0)
            {
                MessageBox.Show("أضف ملفات أولاً للطباعة.", "تنبيه",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            if (!SelectedPrinter.IsOnline)
            {
                var proceed = MessageBox.Show(
                    $"الطابعة «{SelectedPrinter.Name}» غير متصلة.\nهل تريد الإرسال على أي حال؟",
                    "الطابعة غير متصلة", MessageBoxButton.YesNo, MessageBoxImage.Question);
                if (proceed != MessageBoxResult.Yes) return;
            }

            IsBusy = true;
            BusyText = "جارٍ تجهيز الملفات وإرسالها للطابعة...";
            StatusMessage = "جارٍ الطباعة...";

            var jobs = PrintJobsList.ToList();
            var printer = SelectedPrinter;
            var tray = SelectedTray;
            var size = SelectedPaperSize;
            var color = IsColorMode && !IsGrayscaleMode;
            var duplex = SelectedDuplexMode;
            var layout = SelectedLayout;
            var copies = Math.Max(1, CopiesCount);

            PrintResult result;
            try
            {
                result = await Task.Run(() => _printEngineService.PrintFiles(
                    printer, tray, size, jobs, color, duplex, layout, copies,
                    msg => Application.Current?.Dispatcher.Invoke(() => BusyText = msg)));
            }
            catch (Exception ex)
            {
                result = new PrintResult { Success = false, Message = $"خطأ غير متوقع: {ex.Message}" };
            }

            IsBusy = false;
            BusyText = string.Empty;
            StatusMessage = result.Success ? "تم الإرسال للطابعة" : "فشلت الطباعة";

            MessageBox.Show(result.Message,
                result.Success ? "SMART PRINT — تم الإرسال" : "SMART PRINT — خطأ",
                MessageBoxButton.OK,
                result.Success ? MessageBoxImage.Information : MessageBoxImage.Error);
        }

        /* ==================== الاسكانر الحقيقي ==================== */

        [RelayCommand]
        private async Task QuickPreviewScanAsync()
        {
            if (SelectedScanner == null)
            {
                MessageBox.Show("لم يتم العثور على اسكانر. وصّل الجهاز وشغّله ثم اضغط تحديث.",
                    "تنبيه", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            IsBusy = true;
            BusyText = "جارٍ المسح السريع...";

            var scanner = SelectedScanner;
            var source = ScanSource;
            var colorMode = ScanColorMode;

            BitmapSource? img = null;
            string error = string.Empty;

            try
            {
                await Task.Run(() =>
                {
                    img = _scannerService.ScanSinglePage(scanner, source, 150, colorMode, out error);
                });
            }
            catch (Exception ex) { error = ex.Message; }

            IsBusy = false;
            BusyText = string.Empty;

            if (img == null)
            {
                MessageBox.Show(error, "فشل المسح", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            CurrentScannedImage = img;
            ScannedPagesSummary = "تمت المعاينة السريعة";
            StatusMessage = "تم المسح بنجاح";
        }

        [RelayCommand]
        private async Task ScanToMultiPagePdfAsync()
        {
            if (SelectedScanner == null)
            {
                MessageBox.Show("لم يتم العثور على اسكانر.", "تنبيه",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var dlg = new SaveFileDialog
            {
                Filter = "ملف PDF (*.pdf)|*.pdf",
                FileName = $"مسح-{DateTime.Now:yyyy-MM-dd-HHmm}.pdf"
            };
            if (dlg.ShowDialog() != true) return;

            IsBusy = true;
            BusyText = "جارٍ المسح والحفظ...";

            var scanner = SelectedScanner;
            var source = ScanSource;
            var dpi = SelectedDpi;
            var colorMode = ScanColorMode;
            var path = dlg.FileName;

            int count = 0;
            string error = string.Empty;

            try
            {
                await Task.Run(() =>
                {
                    count = _scannerService.ScanToPdf(scanner, source, dpi, colorMode, path, 50, out error);
                });
            }
            catch (Exception ex) { error = ex.Message; }

            IsBusy = false;
            BusyText = string.Empty;

            if (count > 0)
            {
                ScannedPagesSummary = $"تم مسح {count} صفحة وحفظها PDF";
                var addToPrint = MessageBox.Show(
                    $"تم حفظ {count} صفحة في:\n{path}\n\nهل تريد إضافتها لقائمة الطباعة؟",
                    "تم المسح", MessageBoxButton.YesNo, MessageBoxImage.Information);

                if (addToPrint == MessageBoxResult.Yes) ProcessDroppedFiles(new[] { path });
            }
            else
            {
                MessageBox.Show(error, "فشل المسح", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        [RelayCommand]
        private async Task ScanToJpgAsync()
        {
            if (SelectedScanner == null)
            {
                MessageBox.Show("لم يتم العثور على اسكانر.", "تنبيه",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var dlg = new SaveFileDialog
            {
                Filter = "صورة JPG (*.jpg)|*.jpg",
                FileName = $"مسح-{DateTime.Now:yyyy-MM-dd-HHmm}.jpg"
            };
            if (dlg.ShowDialog() != true) return;

            IsBusy = true;
            BusyText = "جارٍ المسح...";

            var scanner = SelectedScanner;
            var source = ScanSource;
            var dpi = SelectedDpi;
            var colorMode = ScanColorMode;
            var path = dlg.FileName;

            bool ok = false;
            string error = string.Empty;

            try
            {
                await Task.Run(() => { ok = _scannerService.ScanToImage(scanner, source, dpi, colorMode, path, out error); });
            }
            catch (Exception ex) { error = ex.Message; }

            IsBusy = false;
            BusyText = string.Empty;

            if (ok)
            {
                ScannedPagesSummary = "تم حفظ الصورة";
                MessageBox.Show($"تم حفظ الصورة في:\n{path}", "تم الحفظ",
                    MessageBoxButton.OK, MessageBoxImage.Information);
            }
            else
            {
                MessageBox.Show(error, "فشل المسح", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        [RelayCommand]
        private async Task InstantCopyAsync()
        {
            if (SelectedScanner == null || SelectedPrinter == null)
            {
                MessageBox.Show("تأكد من توصيل الاسكانر والطابعة.", "تنبيه",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            IsBusy = true;
            BusyText = "جارٍ المسح والطباعة الفورية...";

            var scanner = SelectedScanner;
            var printer = SelectedPrinter;
            var source = ScanSource;
            var colorMode = ScanColorMode;
            var copies = Math.Max(1, CopyCopiesCount);
            var size = SelectedPaperSize;

            BitmapSource? img = null;
            string error = string.Empty;
            PrintResult? result = null;

            try
            {
                await Task.Run(() =>
                {
                    img = _scannerService.ScanSinglePage(scanner, source, 300, colorMode, out error);
                    if (img != null)
                        result = _printEngineService.PrintBitmap(printer, img, copies, size);
                });
            }
            catch (Exception ex) { error = ex.Message; }

            IsBusy = false;
            BusyText = string.Empty;

            if (img != null) CurrentScannedImage = img;

            if (img == null)
            {
                MessageBox.Show(error, "فشل التصوير الفوري", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            ScannedPagesSummary = "تم التصوير الفوري";
            MessageBox.Show(result?.Message ?? "تم المسح، وتعذر إرسال الطباعة.",
                "SMART PRINT — التصوير الفوري", MessageBoxButton.OK,
                result?.Success == true ? MessageBoxImage.Information : MessageBoxImage.Warning);
        }

        /* ==================== تنظيف ==================== */

        public void Dispose()
        {
            _statusTimer.Stop();
            _printerService.Dispose();
        }
    }
}
