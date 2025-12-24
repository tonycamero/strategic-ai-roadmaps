import { FileText, Download } from 'lucide-react';

interface DocumentCardProps {
  title: string;
  category: string;
  date: Date | string;
  onClick?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function DocumentCard({
  title,
  category,
  date,
  onClick,
  onDownload,
  className = '',
}: DocumentCardProps) {
  const formatDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      diagnostic: 'bg-purple-900/40 text-purple-200 border-purple-600/60',
      roadmap: 'bg-sky-900/40 text-sky-200 border-sky-600/60',
      sop_output: 'bg-emerald-900/40 text-emerald-200 border-emerald-600/60',
      report: 'bg-amber-900/40 text-amber-200 border-amber-600/60',
    };
    return colors[cat] || 'bg-slate-700 text-slate-300 border-slate-600';
  };

  return (
    <div
      className={`group border border-slate-800 rounded-lg p-3 bg-slate-950/60 hover:bg-slate-900/40 hover:border-slate-700 transition ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <FileText className="h-5 w-5 text-slate-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-slate-100 mb-1 line-clamp-1">{title}</h4>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getCategoryColor(
                category
              )}`}
            >
              {category.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-500">{formatDate(date)}</span>
          </div>
        </div>

        {onDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="flex-shrink-0 p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition opacity-0 group-hover:opacity-100"
            aria-label="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
