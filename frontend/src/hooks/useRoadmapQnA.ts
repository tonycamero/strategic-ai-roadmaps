import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

interface AskQuestionParams {
  question: string;
  sectionKey?: string;
  currentSection?: {
    slug: string;
    title: string;
    content: string;
  };
}

export function useRoadmapQnA(defaultSectionKey?: string) {
  return useMutation({
    mutationFn: ({ question, sectionKey, currentSection }: AskQuestionParams) =>
      api.askRoadmapQuestion({
        question,
        sectionKey: sectionKey || defaultSectionKey,
        currentSection,
      }),
  });
}
