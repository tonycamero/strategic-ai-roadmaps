import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  Edit3,
} from 'lucide-react';

interface SelectedInventoryItem {
  inventoryId: string;
  tier: 'core' | 'recommended' | 'advanced';
  sprint: 30 | 60 | 90;
  notes?: string;
}

interface DiscoverySynthesis {
  tenantId: string;
  diagnosticId: string;
  synthesizedSystems: string[];
  selectedInventory: SelectedInventoryItem[];
  exclusions: string[];
  operatorNotes: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

interface DiscoveryNote {
  id: string;
  tenantId: string;
  diagnosticId: string;
  notes: string;
  synthesisJson: DiscoverySynthesis;
  approvalState: 'pending' | 'approved' | 'changes_requested';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  tenantId: string;
  onApprove?: () => void;
  onRequestChanges?: () => void;
}

export function DiscoveryReviewPage({ tenantId, onApprove, onRequestChanges }: Props) {
  const [discoveryNote, setDiscoveryNote] = useState<DiscoveryNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  useEffect(() => {
    loadDiscoveryNote();
  }, [tenantId]);

  async function loadDiscoveryNote() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/discovery/${tenantId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No discovery synthesis found for this tenant');
        }
        throw new Error(`Failed to load discovery: ${response.statusText}`);
      }

      const data = await response.json();
      setDiscoveryNote(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load discovery synthesis');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!discoveryNote) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/discovery/${tenantId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          diagnosticId: discoveryNote.diagnosticId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve: ${response.statusText}`);
      }

      await loadDiscoveryNote();
      onApprove?.();
    } catch (err: any) {
      setError(err.message || 'Failed to approve discovery synthesis');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRequestChanges() {
    if (!discoveryNote || !changeReason.trim()) {
      setError('Please provide a reason for requesting changes');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/discovery/${tenantId}/request-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          diagnosticId: discoveryNote.diagnosticId,
          reason: changeReason,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to request changes: ${response.statusText}`);
      }

      setShowChangeRequestModal(false);
      setChangeReason('');
      await loadDiscoveryNote();
      onRequestChanges?.();
    } catch (err: any) {
      setError(err.message || 'Failed to request changes');
    } finally {
      setActionLoading(false);
    }
  }

  function getApprovalBadge(state: string) {
    const config = {
      pending: { label: 'Pending Review', className: 'badge-pending', icon: AlertCircle },
      approved: { label: 'Approved', className: 'badge-approved', icon: CheckCircle },
      changes_requested: {
        label: 'Changes Requested',
        className: 'badge-changes',
        icon: XCircle,
      },
    };

    const { label, className, icon: Icon } = config[state as keyof typeof config] || config.pending;

    return (
      <span className={`approval-badge ${className}`}>
        <Icon size={16} />
        {label}
      </span>
    );
  }

  function getTierBadge(tier: string) {
    const classMap = {
      core: 'tier-core',
      recommended: 'tier-recommended',
      advanced: 'tier-advanced',
    };

    return <span className={`tier-badge ${classMap[tier as keyof typeof classMap]}`}>{tier}</span>;
  }

  if (loading) {
    return (
      <div className="discovery-review-page loading">
        <div className="spinner" />
        <p>Loading discovery synthesis...</p>
      </div>
    );
  }

  if (error && !discoveryNote) {
    return (
      <div className="discovery-review-page error">
        <AlertCircle size={32} />
        <h3>Failed to Load Discovery</h3>
        <p>{error}</p>
        <button className="btn-retry" onClick={loadDiscoveryNote}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  if (!discoveryNote) {
    return (
      <div className="discovery-review-page empty">
        <MessageSquare size={48} />
        <h3>No Discovery Synthesis</h3>
        <p>No discovery synthesis has been created for this tenant yet.</p>
      </div>
    );
  }

  const synthesis = discoveryNote.synthesisJson;
  const canTakeAction = discoveryNote.approvalState !== 'approved';

  return (
    <div className="discovery-review-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Discovery Synthesis Review</h1>
          <p className="header-subtitle">
            Review and approve the discovery synthesis before ticket generation
          </p>
        </div>
        <button className="btn-refresh" onClick={loadDiscoveryNote} title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="approval-status-card">
        <div className="status-header">
          <h3>Approval Status</h3>
          {getApprovalBadge(discoveryNote.approvalState)}
        </div>

        {discoveryNote.approvalState === 'changes_requested' && discoveryNote.rejectionReason && (
          <div className="rejection-reason">
            <MessageSquare size={16} />
            <div>
              <strong>Reason for Changes:</strong>
              <p>{discoveryNote.rejectionReason}</p>
            </div>
          </div>
        )}

        {discoveryNote.approvalState === 'approved' && (
          <div className="approval-info">
            <CheckCircle size={16} />
            <div>
              <strong>Approved</strong>
              {discoveryNote.approvedAt && (
                <p>on {new Date(discoveryNote.approvedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        <div className="meta-info">
          <div className="meta-item">
            <span className="meta-label">Diagnostic ID:</span>
            <span className="meta-value">{discoveryNote.diagnosticId}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Version:</span>
            <span className="meta-value">v{discoveryNote.version}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Confidence:</span>
            <span className="meta-value">{synthesis.confidenceLevel}</span>
          </div>
        </div>
      </div>

      <div className="synthesis-content">
        <div className="content-section">
          <h3>Operator Notes</h3>
          <div className="notes-box">{synthesis.operatorNotes || 'No notes provided'}</div>
        </div>

        <div className="content-section">
          <h3>Selected Inventory ({synthesis.selectedInventory.length} items)</h3>
          <div className="inventory-grid">
            {synthesis.selectedInventory.map((item) => (
              <div key={item.inventoryId} className="inventory-card">
                <div className="card-header">
                  <span className="inventory-id">{item.inventoryId}</span>
                  <div className="card-badges">
                    {getTierBadge(item.tier)}
                    <span className="sprint-badge">{item.sprint}d</span>
                  </div>
                </div>
                {item.notes && <div className="item-notes">{item.notes}</div>}
              </div>
            ))}
          </div>
        </div>

        {synthesis.synthesizedSystems.length > 0 && (
          <div className="content-section">
            <h3>Synthesized Systems</h3>
            <div className="systems-list">
              {synthesis.synthesizedSystems.map((system, idx) => (
                <div key={idx} className="system-item">
                  {system}
                </div>
              ))}
            </div>
          </div>
        )}

        {synthesis.exclusions.length > 0 && (
          <div className="content-section">
            <h3>Exclusions</h3>
            <div className="exclusions-list">
              {synthesis.exclusions.map((exclusion, idx) => (
                <div key={idx} className="exclusion-item">
                  {exclusion}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {canTakeAction && (
        <div className="action-bar">
          <button
            className="btn-request-changes"
            onClick={() => setShowChangeRequestModal(true)}
            disabled={actionLoading}
          >
            <Edit3 size={18} />
            Request Changes
          </button>
          <button
            className="btn-approve"
            onClick={handleApprove}
            disabled={actionLoading}
          >
            <ThumbsUp size={18} />
            {actionLoading ? 'Approving...' : 'Approve Synthesis'}
          </button>
        </div>
      )}

      {showChangeRequestModal && (
        <div className="modal-overlay" onClick={() => setShowChangeRequestModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Request Changes</h3>
            <p>Please provide a reason for requesting changes to this discovery synthesis.</p>
            <textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Describe what needs to be changed..."
              rows={6}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowChangeRequestModal(false);
                  setChangeReason('');
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleRequestChanges}
                disabled={actionLoading || !changeReason.trim()}
              >
                {actionLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .discovery-review-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .page-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          color: #111827;
        }

        .header-subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
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
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 6px;
          font-weight: 500;
        }

        .approval-status-card {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .status-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .approval-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
        }

        .badge-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .badge-approved {
          background: #d1fae5;
          color: #065f46;
        }

        .badge-changes {
          background: #fee2e2;
          color: #991b1b;
        }

        .rejection-reason,
        .approval-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .rejection-reason {
          background: #fef2f2;
        }

        .approval-info {
          background: #f0fdf4;
        }

        .meta-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meta-value {
          font-weight: 500;
          color: #111827;
        }

        .synthesis-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .content-section {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .content-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .notes-box {
          padding: 16px;
          background: #f9fafb;
          border-radius: 6px;
          white-space: pre-wrap;
          line-height: 1.6;
        }

        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;
        }

        .inventory-card {
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #f9fafb;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .inventory-id {
          font-family: monospace;
          font-size: 13px;
          color: #6b7280;
        }

        .card-badges {
          display: flex;
          gap: 6px;
        }

        .tier-badge,
        .sprint-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .tier-core {
          background: #dbeafe;
          color: #1e40af;
        }

        .tier-recommended {
          background: #d1fae5;
          color: #065f46;
        }

        .tier-advanced {
          background: #fef3c7;
          color: #92400e;
        }

        .sprint-badge {
          background: #e5e7eb;
          color: #374151;
        }

        .item-notes {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
        }

        .systems-list,
        .exclusions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .system-item,
        .exclusion-item {
          padding: 10px 12px;
          background: #f9fafb;
          border-left: 3px solid #3b82f6;
          border-radius: 4px;
        }

        .action-bar {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .btn-request-changes,
        .btn-approve {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-request-changes {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-request-changes:hover:not(:disabled) {
          background: #d1d5db;
        }

        .btn-approve {
          background: #10b981;
          color: white;
        }

        .btn-approve:hover:not(:disabled) {
          background: #059669;
        }

        .btn-approve:disabled,
        .btn-request-changes:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          width: 90%;
          max-width: 500px;
          padding: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .modal h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
        }

        .modal p {
          margin: 0 0 16px 0;
          color: #6b7280;
        }

        .modal textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 16px;
        }

        .modal textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-cancel,
        .btn-submit {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #d1d5db;
        }

        .btn-submit {
          background: #3b82f6;
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-submit:disabled,
        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .discovery-review-page.loading,
        .discovery-review-page.error,
        .discovery-review-page.empty {
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
