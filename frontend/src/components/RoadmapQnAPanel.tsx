import React, { useState } from 'react';
import { useRoadmapQnA } from '../hooks/useRoadmapQnA';

interface RoadmapQnAPanelProps {
  sectionKey?: string;
  className?: string;
}

export const RoadmapQnAPanel: React.FC<RoadmapQnAPanelProps> = ({ sectionKey, className = '' }) => {
  const [question, setQuestion] = useState('');
  const { mutate: askQuestion, data, isPending, error } = useRoadmapQnA(sectionKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      askQuestion({ question: question.trim() });
    }
  };

  return (
    <div className={`roadmap-qna-panel flex flex-col ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask me anything about this roadmap, sprints, tickets, ROI, or your capacity..."
          rows={3}
          className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-500"
          disabled={isPending}
        />
        
        <button
          type="submit"
          disabled={isPending || !question.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isPending ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-md text-red-300 text-sm">
          Error: {error instanceof Error ? error.message : 'Something went wrong'}
        </div>
      )}

      {data && (
        <div className="mt-4 p-4 bg-slate-900 border border-slate-700 rounded-md flex-1 overflow-y-auto">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Answer:</h4>
          <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
            {data.answer}
          </div>
        </div>
      )}
    </div>
  );
};
