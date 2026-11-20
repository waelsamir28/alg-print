using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace SmartPrint.Models
{
    /// <summary>أساس للإشعارات — يسمح بتحديث الواجهة عند تغيّر قيم الحبر/الحالة.</summary>
    public abstract class ObservableModel : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        protected void Raise([CallerMemberName] string? name = null)
            => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

        protected bool Set<T>(ref T field, T value, [CallerMemberName] string? name = null)
        {
            if (EqualityComparer<T>.Default.Equals(field, value)) return false;
            field = value;
            Raise(name);
            return true;
        }
    }

    public class PaperTray : ObservableModel
    {
        private string _name = string.Empty;
        private string _type = string.Empty;
        private int _level = 100;

        public string Id { get; set; } = string.Empty;
        public string Name { get => _name; set => Set(ref _name, value); }
        public string Type { get => _type; set => Set(ref _type, value); }
        public string Capacity { get; set; } = "500 ورقة";
        public int CurrentLevelPercent { get => _level; set => Set(ref _level, value); }
        public string CurrentSize { get; set; } = "A4";

        /// <summary>رقم الدرج الحقيقي في الطابعة (1..n) — يُستخدم في PrintTicket.</summary>
        public int TrayIndex { get; set; }

        /// <summary>هل هذا درج حقيقي متاح فعلاً في الطابعة (وليس افتراضياً)؟</summary>
        public bool IsDetected { get; set; }

        public string LevelText => $"{CurrentLevelPercent}%";

        public override string ToString() => Name;
    }

    public class PaperSize : ObservableModel
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int WidthMm { get; set; }
        public int HeightMm { get; set; }

        public override string ToString() => Name;
    }

    public class InkLevels : ObservableModel
    {
        private int _black = 100, _cyan = 100, _magenta = 100, _yellow = 100;
        public int Black { get => _black; set => Set(ref _black, value); }
        public int Cyan { get => _cyan; set => Set(ref _cyan, value); }
        public int Magenta { get => _magenta; set => Set(ref _magenta, value); }
        public int Yellow { get => _yellow; set => Set(ref _yellow, value); }
    }

    public class PrinterInfo : ObservableModel
    {
        private string _status = "غير معروف";
        private bool _isOnline;
        private bool _isDefault;
        private InkLevels _ink = new();
        private int _printhead = 100;
        private ObservableCollection<PaperTray> _trays = new();
        private ObservableCollection<PaperSize> _sizes = new();

        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string PortName { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public string Status { get => _status; set => Set(ref _status, value); }
        public bool IsOnline { get => _isOnline; set => Set(ref _isOnline, value); }
        public bool IsDefault { get => _isDefault; set => Set(ref _isDefault, value); }
        public bool IsPageWide { get; set; }
        public int MaxSpeedPpm { get; set; }
        public bool SupportsColor { get; set; } = true;
        public bool SupportsDuplex { get; set; } = true;
        public ObservableCollection<PaperTray> PaperTrays { get => _trays; set => Set(ref _trays, value); }
        public ObservableCollection<PaperSize> SupportedSizes { get => _sizes; set => Set(ref _sizes, value); }
        public InkLevels InkLevels { get => _ink; set => Set(ref _ink, value); }
        public int PrintheadHealth { get => _printhead; set => Set(ref _printhead, value); }

        /// <summary>هل الحبر مقروء من الطابعة فعلاً أم تقديري؟</summary>
        public bool InkDetected { get; set; }

        public string InkStatusText => InkDetected ? "مستوى الحبر الحقيقي" : "الحبر غير متاح لهذا التعريف";

        public string DisplayName => IsDefault ? $"{Name}  (الافتراضية)" : Name;

        public override string ToString() => DisplayName;
    }

    public class ScannerDevice : ObservableModel
    {
        private string _status = "جاهز";
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Protocol { get; set; } = "WIA 2.0";
        public bool HasAdf { get; set; }
        public bool HasDuplexAdf { get; set; }
        public bool HasFlatbed { get; set; } = true;
        public bool IsDetected { get; set; }
        public List<int> SupportedDpi { get; set; } = new() { 150, 300, 600 };
        public string Status { get => _status; set => Set(ref _status, value); }

        public string SourceText => HasAdf && HasFlatbed ? "زجاجي + ADF" : HasAdf ? "ADF فقط" : "زجاجي فقط";

        public override string ToString() => Name;
    }
}
