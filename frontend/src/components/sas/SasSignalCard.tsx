import React from 'react';

interface Anchor {
  artifact?: string;
  quote?: string;
  location?: string;
  [key: string]: any;
}

interface SasSignalProps {
  id: string;
  type: string;
  content: string;
  anchors: Anchor | Anchor[];
  created_at: string | Date;
}

export const SasSignalCard: React.FC<SasSignalProps> = ({ type, content, anchors }) => {
  const anchorList = Array.isArray(anchors) ? anchors : [anchors];

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 uppercase">
          {type}
        </span>
      </div>
      
      <p className="text-gray-900 mb-4 whitespace-pre-wrap">{content}</p>

      {anchorList.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Evidence</h4>
          {anchorList.map((anchor, idx) => (
            <div key={idx} className="mb-2 last:mb-0 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-700">Artifact:</span>
                <span className="text-gray-600">{anchor.artifact || 'Unknown'}</span>
                {anchor.location && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600 truncate">{anchor.location}</span>
                  </>
                )}
              </div>
              {anchor.quote && (
                <blockquote className="pl-3 border-l-2 border-gray-200 italic text-gray-600">
                  "{anchor.quote}"
                </blockquote>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
