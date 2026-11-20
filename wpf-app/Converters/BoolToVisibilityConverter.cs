using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace SmartPrint.Converters
{
    /// <summary>يحوّل true/false إلى Visible/Collapsed.</summary>
    public sealed class BoolToVisibilityConverter : IValueConverter
    {
        public bool Invert { get; set; }

        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            bool flag = value is bool b && b;
            if (Invert) flag = !flag;
            return flag ? Visibility.Visible : Visibility.Collapsed;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            var visible = value is Visibility v && v == Visibility.Visible;
            return Invert ? !visible : visible;
        }
    }
}
