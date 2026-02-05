export interface NormalizedIntakeContext {
  tenantId: string;

  roles: {
    owner: Record<string, string | null>;
    ops: Record<string, string | null>;
    sales: Record<string, string | null>;
    delivery: Record<string, string | null>;
  };

  matrixView: Array<{
    theme: string;
    owner?: string | null;
    ops?: string | null;
    sales?: string | null;
    delivery?: string | null;
  }>;

  contradictions: string[];
  missingData: string[];
  chokePoints: string[];
  clarifications?: Array<{
    questionId: string;
    originalResponse: string;
    clarificationPrompt: string;
    clarificationResponse: string | null;
    status: string;
  }>;
}

export interface RawIntakeAnswers {
  owner?: Record<string, any>;
  ops?: Record<string, any>;
  sales?: Record<string, any>;
  delivery?: Record<string, any>;
}
