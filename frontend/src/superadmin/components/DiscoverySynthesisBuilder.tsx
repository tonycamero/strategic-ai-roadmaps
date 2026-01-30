import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface InventoryItem {
    inventoryId: string;
    title: string;
    description?: string;
    category?: string;
}

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

interface Props {
    tenantId: string;
    diagnosticId: string;
    existingSynthesis?: DiscoverySynthesis;
    onSave: (synthesis: DiscoverySynthesis) => Promise<void>;
    onCancel: () => void;
}

export function DiscoverySynthesisBuilder({
    tenantId,
    diagnosticId,
    existingSynthesis,
    onSave,
    onCancel,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<SelectedInventoryItem[]>(
        existingSynthesis?.selectedInventory || []
    );
    const [synthesizedSystems] = useState<string[]>(
        existingSynthesis?.synthesizedSystems || []
    );
    const [exclusions] = useState<string[]>(
        existingSynthesis?.exclusions || []
    );
    const [operatorNotes, setOperatorNotes] = useState(
        existingSynthesis?.operatorNotes || ''
    );
    const [confidenceLevel, setConfidenceLevel] = useState<'high' | 'medium' | 'low'>(
        existingSynthesis?.confidenceLevel || 'medium'
    );
    const [availableInventory, setAvailableInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load canonical inventory
    useEffect(() => {
        loadInventory();
    }, []);

    async function loadInventory() {
        setLoading(true);
        try {
            // TODO: Replace with actual API call
            // For now, using mock data
            const mockInventory: InventoryItem[] = [
                { inventoryId: 'INV-001', title: 'Lead Response Automation', category: 'CRM' },
                { inventoryId: 'INV-002', title: 'Email Drip Campaigns', category: 'Marketing' },
                { inventoryId: 'INV-003', title: 'Pipeline Health Dashboard', category: 'Analytics' },
                { inventoryId: 'INV-004', title: 'Client Onboarding Workflow', category: 'Operations' },
                { inventoryId: 'INV-005', title: 'Document Management System', category: 'Operations' },
                { inventoryId: 'INV-006', title: 'Team Performance Tracking', category: 'Analytics' },
                { inventoryId: 'INV-007', title: 'Automated Follow-up Sequences', category: 'CRM' },
                { inventoryId: 'INV-008', title: 'Social Media Integration', category: 'Marketing' },
                { inventoryId: 'INV-009', title: 'Referral Tracking System', category: 'CRM' },
                { inventoryId: 'INV-010', title: 'Commission Calculator', category: 'Finance' },
                { inventoryId: 'INV-011', title: 'Client Portal', category: 'Operations' },
                { inventoryId: 'INV-012', title: 'Transaction Coordinator Tools', category: 'Operations' },
                { inventoryId: 'INV-013', title: 'Market Analysis Reports', category: 'Analytics' },
                { inventoryId: 'INV-014', title: 'Listing Presentation Builder', category: 'Marketing' },
                { inventoryId: 'INV-015', title: 'Open House Management', category: 'Operations' },
            ];
            setAvailableInventory(mockInventory);
        } catch (err: any) {
            setError(err.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }

    const filteredInventory = availableInventory.filter(
        (item) =>
            !selectedItems.some((s) => s.inventoryId === item.inventoryId) &&
            (searchQuery === '' ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    function addItem(inventoryId: string) {
        setSelectedItems([
            ...selectedItems,
            {
                inventoryId,
                tier: 'recommended',
                sprint: 30,
                notes: '',
            },
        ]);
    }

    function removeItem(inventoryId: string) {
        setSelectedItems(selectedItems.filter((item) => item.inventoryId !== inventoryId));
    }

    function updateItem(inventoryId: string, updates: Partial<SelectedInventoryItem>) {
        setSelectedItems(
            selectedItems.map((item) =>
                item.inventoryId === inventoryId ? { ...item, ...updates } : item
            )
        );
    }

    async function handleSave() {
        if (selectedItems.length < 12) {
            setError('Minimum 12 inventory items required');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const synthesis: DiscoverySynthesis = {
                tenantId,
                diagnosticId,
                synthesizedSystems,
                selectedInventory: selectedItems,
                exclusions,
                operatorNotes,
                confidenceLevel,
            };

            await onSave(synthesis);
        } catch (err: any) {
            setError(err.message || 'Failed to save synthesis');
        } finally {
            setSaving(false);
        }
    }

    const isValid = selectedItems.length >= 12;

    return (
        <div className="discovery-synthesis-builder">
            <div className="builder-header">
                <h2>Discovery Synthesis Builder</h2>
                <div className="header-meta">
                    <span className="diagnostic-id">Diagnostic: {diagnosticId}</span>
                    <span className={`item-count ${isValid ? 'valid' : 'invalid'}`}>
                        {selectedItems.length} / 12 items
                        {isValid ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    </span>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="builder-content">
                {/* Inventory Picker */}
                <div className="inventory-picker">
                    <h3>Available Inventory</h3>
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="inventory-list">
                        {loading ? (
                            <div className="loading">Loading inventory...</div>
                        ) : filteredInventory.length === 0 ? (
                            <div className="empty">No inventory items found</div>
                        ) : (
                            filteredInventory.map((item) => (
                                <div key={item.inventoryId} className="inventory-item">
                                    <div className="item-info">
                                        <div className="item-title">{item.title}</div>
                                        {item.category && <div className="item-category">{item.category}</div>}
                                    </div>
                                    <button
                                        className="btn-add"
                                        onClick={() => addItem(item.inventoryId)}
                                        title="Add to synthesis"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Selected Items */}
                <div className="selected-items">
                    <h3>Selected Inventory ({selectedItems.length})</h3>

                    {selectedItems.length === 0 ? (
                        <div className="empty">No items selected yet. Add at least 12 items.</div>
                    ) : (
                        <div className="selected-list">
                            {selectedItems.map((item) => {
                                const inventoryItem = availableInventory.find(
                                    (i) => i.inventoryId === item.inventoryId
                                );
                                return (
                                    <div key={item.inventoryId} className="selected-item">
                                        <div className="item-header">
                                            <div className="item-title">
                                                {inventoryItem?.title || item.inventoryId}
                                            </div>
                                            <button
                                                className="btn-remove"
                                                onClick={() => removeItem(item.inventoryId)}
                                                title="Remove"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="item-controls">
                                            <div className="control-group">
                                                <label>Tier</label>
                                                <select
                                                    value={item.tier}
                                                    onChange={(e) =>
                                                        updateItem(item.inventoryId, {
                                                            tier: e.target.value as 'core' | 'recommended' | 'advanced',
                                                        })
                                                    }
                                                >
                                                    <option value="core">Core</option>
                                                    <option value="recommended">Recommended</option>
                                                    <option value="advanced">Advanced</option>
                                                </select>
                                            </div>

                                            <div className="control-group">
                                                <label>Sprint</label>
                                                <select
                                                    value={item.sprint}
                                                    onChange={(e) =>
                                                        updateItem(item.inventoryId, {
                                                            sprint: parseInt(e.target.value) as 30 | 60 | 90,
                                                        })
                                                    }
                                                >
                                                    <option value="30">30 days</option>
                                                    <option value="60">60 days</option>
                                                    <option value="90">90 days</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="control-group">
                                            <label>Notes (optional)</label>
                                            <textarea
                                                value={item.notes || ''}
                                                onChange={(e) =>
                                                    updateItem(item.inventoryId, { notes: e.target.value })
                                                }
                                                placeholder="Add context or rationale..."
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Global Settings */}
            <div className="global-settings">
                <div className="control-group">
                    <label>Operator Notes</label>
                    <textarea
                        value={operatorNotes}
                        onChange={(e) => setOperatorNotes(e.target.value)}
                        placeholder="Overall synthesis notes, context, concerns..."
                        rows={4}
                    />
                </div>

                <div className="control-group">
                    <label>Confidence Level</label>
                    <select
                        value={confidenceLevel}
                        onChange={(e) =>
                            setConfidenceLevel(e.target.value as 'high' | 'medium' | 'low')
                        }
                    >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {/* Actions */}
            <div className="builder-actions">
                <button className="btn-cancel" onClick={onCancel} disabled={saving}>
                    Cancel
                </button>
                <button
                    className="btn-save"
                    onClick={handleSave}
                    disabled={!isValid || saving}
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Discovery Synthesis'}
                </button>
            </div>

            <style>{`
        .discovery-synthesis-builder {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .builder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }

        .builder-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #111827;
        }

        .header-meta {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .diagnostic-id {
          font-size: 14px;
          color: #6b7280;
          font-family: monospace;
        }

        .item-count {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
        }

        .item-count.valid {
          background: #d1fae5;
          color: #065f46;
        }

        .item-count.invalid {
          background: #fee2e2;
          color: #991b1b;
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

        .builder-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .inventory-picker,
        .selected-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .inventory-picker h3,
        .selected-items h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
        }

        .inventory-list,
        .selected-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 500px;
          overflow-y: auto;
        }

        .inventory-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          transition: all 0.2s;
        }

        .inventory-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }

        .item-info {
          flex: 1;
        }

        .item-title {
          font-weight: 500;
          color: #111827;
          margin-bottom: 4px;
        }

        .item-category {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-add,
        .btn-remove {
          padding: 6px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add {
          background: #3b82f6;
          color: white;
        }

        .btn-add:hover {
          background: #2563eb;
        }

        .btn-remove {
          background: #ef4444;
          color: white;
        }

        .btn-remove:hover {
          background: #dc2626;
        }

        .selected-item {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #f9fafb;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .item-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .control-group label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .control-group select,
        .control-group textarea {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .control-group select:focus,
        .control-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .global-settings {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .builder-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          border-top: 2px solid #e5e7eb;
        }

        .btn-cancel,
        .btn-save {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-cancel {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #d1d5db;
        }

        .btn-save {
          background: #3b82f6;
          color: white;
        }

        .btn-save:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-save:disabled,
        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading,
        .empty {
          padding: 32px;
          text-align: center;
          color: #6b7280;
        }
      `}</style>
        </div>
    );
}
