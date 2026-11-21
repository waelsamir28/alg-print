using System.Windows;
using SmartPrint.ViewModels;
using DataFormats = System.Windows.DataFormats;
using DragDropEffects = System.Windows.DragDropEffects;
using DragEventArgs = System.Windows.DragEventArgs;
using MessageBox = System.Windows.MessageBox;

namespace SmartPrint
{
    public partial class MainWindow : Window
    {
        private MainViewModel ViewModel => (MainViewModel)DataContext;

        public MainWindow()
        {
            InitializeComponent();
        }

        /* ==================== السحب والإفلات ==================== */

        private void OnWindowDragOver(object sender, DragEventArgs e)
        {
            e.Effects = e.Data.GetDataPresent(DataFormats.FileDrop)
                ? DragDropEffects.Copy
                : DragDropEffects.None;
            e.Handled = true;
        }

        private void OnWindowDrop(object sender, DragEventArgs e)
        {
            try
            {
                if (!e.Data.GetDataPresent(DataFormats.FileDrop)) return;

                if (e.Data.GetData(DataFormats.FileDrop) is not string[] paths) return;

                // لو أُسقط مجلد، نقرأ ملفاته المدعومة
                var files = new List<string>();
                foreach (var path in paths)
                {
                    if (System.IO.Directory.Exists(path))
                    {
                        var allowed = new[] { ".pdf", ".docx", ".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".txt" };
                        files.AddRange(System.IO.Directory
                            .GetFiles(path)
                            .Where(f => allowed.Contains(System.IO.Path.GetExtension(f).ToLowerInvariant())));
                    }
                    else if (System.IO.File.Exists(path))
                    {
                        files.Add(path);
                    }
                }

                if (files.Count > 0)
                {
                    ViewModel.ProcessDroppedFiles(files.ToArray());
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"تعذر إضافة الملفات: {ex.Message}", "SMART PRINT",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        /* ==================== الإغلاق ==================== */

        private void OnWindowClosing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            try { ViewModel.Dispose(); } catch { }
        }

        private void OnMinimizeClick(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;
        private void OnMaximizeClick(object sender, RoutedEventArgs e) =>
            WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
        private void OnCloseClick(object sender, RoutedEventArgs e) => Close();
    }
}
