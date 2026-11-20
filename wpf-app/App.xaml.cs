using System.Globalization;
using System.Threading;
using System.Windows;
using System.Windows.Markup;
using System.Windows.Threading;
using Application = System.Windows.Application;
using MessageBox = System.Windows.MessageBox;

namespace SmartPrint
{
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            // العربية كلغة واجهة
            var arabicCulture = new CultureInfo("ar-EG");
            Thread.CurrentThread.CurrentCulture = arabicCulture;
            Thread.CurrentThread.CurrentUICulture = arabicCulture;
            CultureInfo.DefaultThreadCurrentCulture = arabicCulture;
            CultureInfo.DefaultThreadCurrentUICulture = arabicCulture;

            FrameworkElement.LanguageProperty.OverrideMetadata(
                typeof(FrameworkElement),
                new FrameworkPropertyMetadata(XmlLanguage.GetLanguage(arabicCulture.IetfLanguageTag)));

            // التقاط أي خطأ غير متوقع بدل إغلاق البرنامج فجأة
            DispatcherUnhandledException += OnUnhandledException;
            AppDomain.CurrentDomain.UnhandledException += (_, args) =>
            {
                var ex = args.ExceptionObject as Exception;
                MessageBox.Show(
                    $"حدث خطأ غير متوقع:\n\n{ex?.Message}\n\nإذا تكرر، تواصل مع المطور: 01222355769",
                    "SMART PRINT", MessageBoxButton.OK, MessageBoxImage.Error);
            };

            base.OnStartup(e);
        }

        private void OnUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
        {
            MessageBox.Show(
                $"حدث خطأ:\n\n{e.Exception.Message}\n\nإذا تكرر، تواصل مع المطور: 01222355769",
                "SMART PRINT", MessageBoxButton.OK, MessageBoxImage.Warning);

            // لا نغلق البرنامج — نكمل العمل
            e.Handled = true;
        }
    }
}
