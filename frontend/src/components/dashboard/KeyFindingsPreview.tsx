interface Finding {
  domain: string;
  text: string;
}

interface KeyFindingsPreviewProps {
  findings: Finding[];
}

export function KeyFindingsPreview({ findings }: KeyFindingsPreviewProps) {
  // Take first 3 findings
  const displayFindings = findings.slice(0, 3);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-100 mb-4">Key Findings</h3>

      <div className="space-y-3">
        {displayFindings.map((finding, idx) => (
          <div key={idx} className="border-l-2 border-blue-500 pl-3">
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="font-medium text-slate-100">{finding.domain}:</span>{' '}
              {finding.text}
            </p>
          </div>
        ))}

        {displayFindings.length === 0 && (
          <p className="text-sm text-slate-500 italic">
            Key findings will appear once intakes are complete
          </p>
        )}
      </div>
    </div>
  );
}
