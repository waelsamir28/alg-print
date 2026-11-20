import React, { useState } from 'react';
import {
  Code2,
  Download,
  Copy,
  Check,
  FileCode,
  FolderTree,
  X,
  Search,
  Terminal,
  Sparkles
} from 'lucide-react';
import JSZip from 'jszip';
import { CSHARP_PROJECT_FILES, SourceCodeFile } from '../data/csharpSourceCode';

interface CodeExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExplorerModal: React.FC<CodeExplorerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<SourceCodeFile>(CSHARP_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = ['all', 'Project & CI', 'XAML Views', 'ViewModels', 'Services', 'Models', 'Documentation'];

  const filteredFiles = CSHARP_PROJECT_FILES.filter((file) => {
    const matchesSearch =
      file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.includes(searchQuery);
    const matchesCategory = activeCategory === 'all' || file.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all source code files into the zip
      CSHARP_PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Generate the zip blob and trigger download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'SmartPrint_WPF_Net8_SourceCode.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="sect-hdr px-4 sm:px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/12 border border-white/25 flex items-center justify-center shadow-lg">
              <Code2 className="w-6 h-6 text-[var(--t-accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight font-sans">
                  مستكشف كود C# .NET 8 WPF - SMART PRINT
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-white/12 border border-white/25 text-white/85 rounded">
                  Windows 11 Native Architecture
                </span>
              </div>
              <p className="text-xs text-white/60">
                مشروع كامل مفصول مع حزم NuGet المجانية بدون أوفيس وملف GitHub Actions لإنتاج ملف exe واحد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            {/* Download Solution ZIP button */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-70"
            >
              <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
              <span>{isZipping ? 'جاري تجهيز الحزمة...' : 'تحميل المشروع كاملاً (.ZIP)'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-gray-700 ml-1">التصنيف:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {cat === 'all' ? 'كافة الملفات (الكل)' : cat}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5" />
            <input
              type="text"
              placeholder="بحث في اسم الملف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pr-8 pl-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Main Body: File Tree (Right) + Code View (Left) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Tree Panel */}
          <div className="w-full md:w-80 bg-gray-50 border-l border-gray-200 flex flex-col overflow-y-auto shrink-0 p-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2 px-1">
              <div className="flex items-center gap-1">
                <FolderTree className="w-4 h-4 text-blue-600" />
                <span>شجرة ملفات المشروع ({filteredFiles.length})</span>
              </div>
              <span className="text-[11px] text-gray-400">.NET 8.0</span>
            </div>

            <div className="space-y-1">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-right p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'hover:bg-gray-200/70 text-gray-700'
                    }`}
                  >
                    <FileCode
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isSelected ? 'text-white' : 'text-blue-600'
                      }`}
                    />
                    <div className="flex-1 truncate">
                      <div className="font-mono text-[11px] truncate tracking-tight">{file.path}</div>
                      <div
                        className={`text-[10px] truncate mt-0.5 ${
                          isSelected ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {file.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick build instructions box */}
            <div className="mt-auto pt-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  <span>أمر البناء السريع:</span>
                </div>
                <code className="block bg-gray-900 text-emerald-400 p-2 rounded text-[10px] font-mono text-left dir-ltr select-all">
                  dotnet publish -c Release -r win-x64 --self-contained
                </code>
              </div>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
            {/* Code toolbar */}
            <div className="bg-gray-950 px-4 py-2.5 border-b border-gray-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-400">{selectedFile.path}</span>
                <span className="text-[11px] text-gray-400 hidden sm:inline">
                  — {selectedFile.description}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-800 text-gray-300 rounded uppercase">
                  {selectedFile.language}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-300" />
                      <span>نسخ الكود</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Content View */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-left dir-ltr selection:bg-blue-600 selection:text-white">
              <pre className="text-gray-200">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 border-t border-gray-200 p-3 px-4 flex flex-wrap items-center justify-between text-xs text-gray-600 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              جميع الحزم المستخدمة (DocX, PdfSharpCore, QuestPDF, WIA) مجانية 100% ومستقلة بدون أوفيس.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-mono">Workflow: .github/workflows/build.yml</span>
          </div>
        </div>
      </div>
    </div>
  );
};
