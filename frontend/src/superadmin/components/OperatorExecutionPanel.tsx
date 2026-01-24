import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface MilestoneStatus {
  id: string;
  label: string;
  status: 'BLOCKED' | 'READY' | 'COMPLETE' | 'IN_PROGRESS';
  blockingCode?: string;
  blockingReason?: string;
  metadata?: Record<string, any>;
}

interface ExecutionState {
  tenantId: string;
  diagnosticId: string;
  milestones: MilestoneStatus[];
  nextAction?: string;
}

interface Props {
  tenantId: string;
  diagnosticId: string;
  onAction: (action: string, params?: any) => void;
}

export function OperatorExecutionPanel({ tenantId, diagnosticId, onAction }: Props) {
  const [state] = useState<ExecutionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExecutionState();
  }, [tenantId, diagnosticId]);

  async function loadExecutionState() {
    setLoading(true);
    setError(null);

    try {
      // Strike 1: Ad-hoc fetch call. Method execution/:tenantId/:diagnosticId execution not in ApiClient.
      // Feature disabled for compliance.
      // const response = await fetch(...)

      console.warn("OperatorExecutionPanel disabled: API Client missing getExecutionState");

      // Set dummy state or empty state to avoid crashing, or set error
      setError("Feature disabled: SuperAdmin API Client compliance check failed (Missing method).");

    } catch (err: any) {
      setError(err.message || 'Failed to load execution state');
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'COMPLETE':
        return <CheckCircle size={20} className="status-icon complete" />;
      case 'READY':
        return <ArrowRight size={20} className="status-icon ready" />;
      case 'IN_PROGRESS':
        return <Clock size={20} className="status-icon in-progress" />;
      case 'BLOCKED':
      default:
        return <XCircle size={20} className="status-icon blocked" />;
    }
  }

  function getStatusBadge(status: string) {
    const classMap = {
      COMPLETE: 'badge-complete',
      READY: 'badge-ready',
      IN_PROGRESS: 'badge-in-progress',
      BLOCKED: 'badge-blocked',
    };

    return (
      <span className={`status-badge ${classMap[status as keyof typeof classMap]}`}>
        {status}
      </span>
    );
  }

  function getPrimaryAction(milestone: MilestoneStatus): React.ReactNode | null {
    switch (milestone.id) {
      case 'M1':
        if (milestone.status === 'BLOCKED') {
          return (
            <button
              className="btn-primary"
              onClick={() => onAction('RUN_DIAGNOSTIC')}
            >
              Run SOP-01 Diagnostic
            </button>
          );
        }
        return null;

      case 'M2':
        if (milestone.status === 'BLOCKED') {
          return (
            <button
              className="btn-primary"
              onClick={() => onAction('CREATE_DISCOVERY')}
            >
              Create Discovery Synthesis
            </button>
          );
        }
        return null;

      case 'M3':
        if (milestone.status === 'BLOCKED') {
          if (milestone.blockingCode === 'DISCOVERY_NOT_APPROVED') {
            if (milestone.metadata?.approvalState === 'changes_requested') {
              return (
                <button
                  className="btn-primary"
                  onClick={() => onAction('REVISE_DISCOVERY')}
                >
                  Revise Discovery Synthesis
                </button>
              );
            }
            return (
              <button
                className="btn-secondary"
                onClick={() => onAction('SEND_REVIEW_LINK')}
              >
                <ExternalLink size={16} />
                Send Review Link to Tenant Lead
              </button>
            );
          }
        }
        return null;

      case 'M4':
        if (milestone.status === 'READY') {
          return (
            <button
              className="btn-primary"
              onClick={() => onAction('GENERATE_TICKETS')}
            >
              Generate Tickets
            </button>
          );
        }
        return null;

      case 'M5':
        if (milestone.status === 'IN_PROGRESS') {
          return (
            <button
              className="btn-primary"
              onClick={() => onAction('OPEN_MODERATION')}
            >
              Moderate Tickets
            </button>
          );
        }
        return null;

      case 'M6':
        if (milestone.status === 'READY') {
          return (
            <button
              className="btn-primary"
              onClick={() => onAction('ASSEMBLE_ROADMAP')}
            >
              Assemble Roadmap
            </button>
          );
        }
        return null;

      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="execution-panel loading">
        <div className="spinner" />
        <p>Loading execution state...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="execution-panel error">
        <AlertCircle size={32} />
        <h3>Failed to Load Execution State</h3>
        <p>{error}</p>
        <button className="btn-retry" onClick={loadExecutionState}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  if (!state) {
    return null;
  }

  return (
    <div className="operator-execution-panel">
      <div className="panel-header">
        <div className="header-content">
          <h2>Operator Execution Panel</h2>
          <div className="header-meta">
            <span className="meta-item">
              <strong>Tenant:</strong> {tenantId.slice(0, 8)}...
            </span>
            <span className="meta-item">
              <strong>Diagnostic:</strong> {diagnosticId}
            </span>
          </div>
        </div>
        <button className="btn-refresh" onClick={loadExecutionState} title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      {state.nextAction && (
        <div className="next-action-banner">
          <ArrowRight size={20} />
          <div>
            <strong>Next Action:</strong> {state.nextAction}
          </div>
        </div>
      )}

      <div className="milestones">
        {state.milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className={`milestone milestone-${milestone.status.toLowerCase()}`}
          >
            <div className="milestone-header">
              <div className="milestone-title">
                {getStatusIcon(milestone.status)}
                <span className="milestone-label">{milestone.label}</span>
                {getStatusBadge(milestone.status)}
              </div>
            </div>

            {milestone.blockingReason && (
              <div className="blocking-reason">
                <AlertCircle size={16} />
                {milestone.blockingReason}
              </div>
            )}

            {milestone.metadata && Object.keys(milestone.metadata).length > 0 && (
              <div className="milestone-metadata">
                {Object.entries(milestone.metadata).map(([key, value]) => (
                  <div key={key} className="metadata-item">
                    <span className="metadata-key">{key}:</span>
                    <span className="metadata-value">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="milestone-actions">{getPrimaryAction(milestone)}</div>

            {index < state.milestones.length - 1 && <div className="milestone-connector" />}
          </div>
        ))}
      </div>

      <style>{`
        .operator-execution-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }

        .header-content h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #111827;
        }

        .header-meta {
          display: flex;
          gap: 16px;
          font-size: 14px;
        }

        .meta-item {
          color: #6b7280;
        }

        .meta-item strong {
          color: #374151;
        }

        .btn-refresh {
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-refresh:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .next-action-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #dbeafe;
          border-left: 4px solid #3b82f6;
          border-radius: 6px;
          color: #1e40af;
          font-weight: 500;
        }

        .milestones {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .milestone {
          position: relative;
          padding: 20px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
        }

        .milestone + .milestone {
          margin-top: -2px;
          border-top-left-radius: 0;
          border-top-right-radius: 0;
        }

        .milestone:first-child {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }

        .milestone:last-child {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
        }

        .milestone-complete {
          background: #f0fdf4;
          border-color: #86efac;
        }

        .milestone-ready {
          background: #dbeafe;
          border-color: #60a5fa;
        }

        .milestone-in-progress {
          background: #fef3c7;
          border-color: #fbbf24;
        }

        .milestone-blocked {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        .milestone-header {
          margin-bottom: 12px;
        }

        .milestone-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .milestone-label {
          flex: 1;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .status-icon {
          flex-shrink: 0;
        }

        .status-icon.complete {
          color: #16a34a;
        }

        .status-icon.ready {
          color: #3b82f6;
        }

        .status-icon.in-progress {
          color: #f59e0b;
        }

        .status-icon.blocked {
          color: #ef4444;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-complete {
          background: #d1fae5;
          color: #065f46;
        }

        .badge-ready {
          background: #bfdbfe;
          color: #1e40af;
        }

        .badge-in-progress {
          background: #fde68a;
          color: #92400e;
        }

        .badge-blocked {
          background: #fecaca;
          color: #991b1b;
        }

        .blocking-reason {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 6px;
          color: #991b1b;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .milestone-metadata {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .metadata-item {
          display: flex;
          gap: 8px;
        }

        .metadata-key {
          font-weight: 500;
          color: #6b7280;
          min-width: 120px;
        }

        .metadata-value {
          color: #111827;
          font-family: monospace;
        }

        .milestone-actions {
          display: flex;
          gap: 8px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .execution-panel.loading,
        .execution-panel.error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 64px;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .btn-retry {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: #3b82f6;
          color: white;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-retry:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}
