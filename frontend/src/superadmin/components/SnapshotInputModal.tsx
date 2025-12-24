import { useState } from 'react';

interface FormData {
  label: string;
  lead_response_minutes: string;
  lead_to_appt_rate: string;
  close_rate: string;
  crm_adoption_rate: string;
  weekly_ops_hours: string;
  nps: string;
  notes: string;
}

export function SnapshotInputModal({
  tenantId,
  onClose,
  onSuccess,
}: {
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<FormData>({
    label: '',
    lead_response_minutes: '',
    lead_to_appt_rate: '',
    close_rate: '',
    crm_adoption_rate: '',
    weekly_ops_hours: '',
    nps: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validateAndParse(): { metrics: any; errors: Record<string, string> } | null {
    const newErrors: Record<string, string> = {};
    const metrics: any = {};

    // Label validation
    if (!formData.label) {
      newErrors.label = 'Label is required';
    } else if (!['baseline', '30d', '60d', '90d', 'custom'].includes(formData.label)) {
      newErrors.label = 'Label must be baseline, 30d, 60d, 90d, or custom';
    }

    // Parse and validate each metric field
    function parseField(field: keyof FormData, name: string, min?: number, max?: number) {
      const val = formData[field].trim();
      if (!val) return; // Optional field

      // Handle percentage (remove % sign)
      const cleaned = val.replace('%', '').trim();
      const parsed = parseFloat(cleaned);

      if (isNaN(parsed)) {
        newErrors[field] = `${name} must be a number`;
      } else if (min !== undefined && parsed < min) {
        newErrors[field] = `${name} must be at least ${min}`;
      } else if (max !== undefined && parsed > max) {
        newErrors[field] = `${name} must be at most ${max}`;
      } else {
        // Map form field names to API field names
        const apiFieldName = field as string;
        metrics[apiFieldName] = parsed;
      }
    }

    parseField('lead_response_minutes', 'Lead Response Time', 0);
    parseField('lead_to_appt_rate', 'Lead-to-Appt Rate', 0, 100);
    parseField('close_rate', 'Close Rate', 0, 100);
    parseField('crm_adoption_rate', 'CRM Adoption Rate', 0, 100);
    parseField('weekly_ops_hours', 'Weekly Ops Hours', 0);
    parseField('nps', 'NPS', -100, 100);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return null;
    }

    return { metrics, errors: {} };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const validated = validateAndParse();
    if (!validated) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = formData.label === 'baseline' 
        ? `/api/superadmin/firms/${tenantId}/metrics/baseline`
        : `/api/superadmin/firms/${tenantId}/metrics/snapshot`;

      const body = formData.label === 'baseline'
        ? { metrics: validated.metrics, source: 'manual' }
        : { label: formData.label, metrics: validated.metrics, source: 'manual' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to create snapshot');
      }

      onSuccess();
    } catch (err: any) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-100">Add Metrics Snapshot</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Snapshot Label <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select label...</option>
              <option value="baseline">Baseline</option>
              <option value="30d">30 Days</option>
              <option value="60d">60 Days</option>
              <option value="90d">90 Days</option>
              <option value="custom">Custom</option>
            </select>
            {errors.label && <div className="text-xs text-red-400 mt-1">{errors.label}</div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Lead Response Time */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Lead Response Time (minutes)
              </label>
              <input
                type="text"
                value={formData.lead_response_minutes}
                onChange={(e) => setFormData({ ...formData, lead_response_minutes: e.target.value })}
                placeholder="e.g. 45"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.lead_response_minutes && <div className="text-xs text-red-400 mt-1">{errors.lead_response_minutes}</div>}
            </div>

            {/* Lead-to-Appt Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Lead-to-Appointment Rate (%)
              </label>
              <input
                type="text"
                value={formData.lead_to_appt_rate}
                onChange={(e) => setFormData({ ...formData, lead_to_appt_rate: e.target.value })}
                placeholder="e.g. 35% or 35"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.lead_to_appt_rate && <div className="text-xs text-red-400 mt-1">{errors.lead_to_appt_rate}</div>}
            </div>

            {/* Close Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Close Rate (%)
              </label>
              <input
                type="text"
                value={formData.close_rate}
                onChange={(e) => setFormData({ ...formData, close_rate: e.target.value })}
                placeholder="e.g. 25% or 25"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.close_rate && <div className="text-xs text-red-400 mt-1">{errors.close_rate}</div>}
            </div>

            {/* CRM Adoption Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                CRM Adoption Rate (%)
              </label>
              <input
                type="text"
                value={formData.crm_adoption_rate}
                onChange={(e) => setFormData({ ...formData, crm_adoption_rate: e.target.value })}
                placeholder="e.g. 80% or 80"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.crm_adoption_rate && <div className="text-xs text-red-400 mt-1">{errors.crm_adoption_rate}</div>}
            </div>

            {/* Weekly Ops Hours */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Weekly Operations Hours
              </label>
              <input
                type="text"
                value={formData.weekly_ops_hours}
                onChange={(e) => setFormData({ ...formData, weekly_ops_hours: e.target.value })}
                placeholder="e.g. 40"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.weekly_ops_hours && <div className="text-xs text-red-400 mt-1">{errors.weekly_ops_hours}</div>}
            </div>

            {/* NPS */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                NPS Score (-100 to 100)
              </label>
              <input
                type="text"
                value={formData.nps}
                onChange={(e) => setFormData({ ...formData, nps: e.target.value })}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.nps && <div className="text-xs text-red-400 mt-1">{errors.nps}</div>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional context..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-400">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Snapshot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
