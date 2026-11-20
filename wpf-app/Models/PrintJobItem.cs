using System.IO;

namespace SmartPrint.Models
{
    public class PrintJobItem : ObservableModel
    {
        private string _status = "جاهز";

        public string FilePath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string DocumentType { get; set; } = "PDF";
        public string FileSizeFormatted { get; set; } = "0 MB";
        public int PageCount { get; set; } = 1;
        public string Status { get => _status; set => Set(ref _status, value); }
        public bool IsSelected { get; set; }

        public string PagesText => $"{PageCount} صفحة";

        public override string ToString() => FileName;
    }
}
