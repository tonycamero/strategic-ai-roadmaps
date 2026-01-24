import { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useBusinessTypeProfile, useTenant } from '../../context/TenantContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { api } from '../../lib/api';
import { getChamberQuestionsForPlatformRole } from '../../intake/chamberQuestionBank';

export default function OpsIntake() {
  const { logout } = useAuth();
  const profile = useBusinessTypeProfile();
  const { businessType } = useTenant();
  const isChamber = businessType === 'chamber';
  const [, setLocation] = useLocation();
  const [isUpdate, setIsUpdate] = useState(false);
  const queryClient = useQueryClient();
  const { refresh: refreshOnboarding } = useOnboarding();

  const { chamberRole, questions: chamberQuestions } = isChamber
    ? getChamberQuestionsForPlatformRole('ops')
    : { chamberRole: null, questions: [] };

  const [formData, setFormData] = useState({
    current_systems: '',
    tech_stack: '',
    automation_level: '',
    pain_points: '',
    data_quality: '',
    integration_challenges: '',
    chamberRole: '',
    md_member_retention: '',
    md_member_value: '',
  });

  const { data: intakeData } = useQuery({
    queryKey: ['my-intake'],
    queryFn: () => api.getMyIntake(),
  });

const coachingFeedback = (intakeData as any)?.intake?.coachingFeedback ?? {};
  useEffect(() => {
    if (intakeData?.intake) {
      setIsUpdate(true);
      setFormData(prev => ({
        ...prev,
        ...((intakeData.intake?.answers || {}) as any),
      }));
    }
  }, [intakeData]);

  const submitMutation = useMutation({
    mutationFn: api.submitIntake,
    onSuccess: async () => {
      // Refresh intake state
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-intake'] }),
        refreshOnboarding(),
      ]);
      // Redirect to role-aware dashboard
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1500);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      chamberRole: isChamber && chamberRole ? chamberRole : formData.chamberRole,
    };
    submitMutation.mutate({ role: 'ops', answers: payload });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{profile.roleLabels.ops} Intake</h1>
            <p className="text-sm text-slate-400">{profile.intakeCopy.opsIntro}</p>
          </div>
          <button
            onClick={() => {
              logout();
              setLocation('/');
            }}
            className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg border border-slate-800 p-8 space-y-6">
          {isUpdate && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-300">
                ℹ️ You've already submitted this form. You can update your responses anytime.
              </p>
            </div>
          )}

          {submitMutation.isSuccess && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-300">
                ✅ Form {isUpdate ? 'updated' : 'submitted'} successfully!
              </p>
            </div>
          )}

          {isChamber ? (
            // Chamber-specific questions: Operations / Administration
            <>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Current Systems & Tools
                </label>
                <textarea
                  value={formData.current_systems}
                  onChange={(e) => handleChange('current_systems', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the systems and tools you use to coordinate membership, events, and executive operations..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.current_systems} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Technology Stack & Data Systems
                </label>
                <textarea
                  value={formData.tech_stack}
                  onChange={(e) => handleChange('tech_stack', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="List your tech stack (GHL, spreadsheets, email tools, accounting systems, etc.)..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.tech_stack} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Automation Level
                </label>
                <select
                  value={formData.automation_level}
                  onChange={(e) => handleChange('automation_level', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select automation level...</option>
                  <option value="minimal">Minimal - Mostly manual processes</option>
                  <option value="basic">Basic - Some automation in place</option>
                  <option value="moderate">Moderate - Many processes automated</option>
                  <option value="advanced">Advanced - Highly automated operations</option>
                </select>
                <ConsultantFeedback feedback={coachingFeedback.automation_level} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Administrative Pain Points
                </label>
                <textarea
                  value={formData.pain_points}
                  onChange={(e) => handleChange('pain_points', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="What manual admin work steals time from members and sponsors? Where is coordination between membership, events, and executive most difficult?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.pain_points} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Data Quality & Board Reporting
                </label>
                <textarea
                  value={formData.data_quality}
                  onChange={(e) => handleChange('data_quality', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="How fragmented is your data across systems? How difficult is it to produce board reports and KPIs?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.data_quality} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Integration & Data Flow Issues
                </label>
                <textarea
                  value={formData.integration_challenges}
                  onChange={(e) => handleChange('integration_challenges', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What data fragmentation exists across GHL, spreadsheets, email, and accounting? What breaks or gets duplicated?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.integration_challenges} />
              </div>
            </>
          ) : (
            // Default questions: Operations
            <>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Current Systems & Tools
                </label>
                <textarea
                  value={formData.current_systems}
                  onChange={(e) => handleChange('current_systems', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the current systems, tools, and platforms your operations team uses daily..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.current_systems} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Technology Stack
                </label>
                <textarea
                  value={formData.tech_stack}
                  onChange={(e) => handleChange('tech_stack', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="List your tech stack (CRM, ERP, databases, cloud platforms, etc.)..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.tech_stack} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Automation Level
                </label>
                <select
                  value={formData.automation_level}
                  onChange={(e) => handleChange('automation_level', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select automation level...</option>
                  <option value="minimal">Minimal - Mostly manual processes</option>
                  <option value="basic">Basic - Some automation in place</option>
                  <option value="moderate">Moderate - Many processes automated</option>
                  <option value="advanced">Advanced - Highly automated operations</option>
                </select>
                <ConsultantFeedback feedback={coachingFeedback.automation_level} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Operational Pain Points
                </label>
                <textarea
                  value={formData.pain_points}
                  onChange={(e) => handleChange('pain_points', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="What are your biggest operational challenges? Where do you spend the most time on repetitive tasks?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.pain_points} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Data Quality & Accessibility
                </label>
                <textarea
                  value={formData.data_quality}
                  onChange={(e) => handleChange('data_quality', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="How would you rate your data quality, organization, and accessibility?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.data_quality} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Integration Challenges
                </label>
                <textarea
                  value={formData.integration_challenges}
                  onChange={(e) => handleChange('integration_challenges', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What integration or data flow issues exist between your systems?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.integration_challenges} />
              </div>
            </>
          )}

          {isChamber && chamberQuestions.length > 0 && (
            <div className="border-t border-slate-700 pt-6 mt-4 space-y-4">
              <h3 className="text-lg font-semibold text-slate-100">
                Chamber-Specific Questions (Membership Operations)
              </h3>
              <p className="text-sm text-slate-400">
                These help us understand your membership acquisition, retention, and communication engine.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  {chamberQuestions[0]?.label}
                </label>
                <textarea
                  value={formData.md_member_retention}
                  onChange={(e) => handleChange('md_member_retention', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <ConsultantFeedback feedback={coachingFeedback.md_member_retention} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  {chamberQuestions[1]?.label}
                </label>
                <textarea
                  value={formData.md_member_value}
                  onChange={(e) => handleChange('md_member_value', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <ConsultantFeedback feedback={coachingFeedback.md_member_value} />
              </div>
            </div>
          )}

          {submitMutation.isError && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
              Failed to submit form. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitMutation.isPending ? (isUpdate ? 'Updating...' : 'Submitting...') : (isUpdate ? 'Update Intake Form' : 'Submit Intake Form')}
          </button>
        </form>
      </div>
    </div>
  );
}

function ConsultantFeedback({ feedback }: { feedback?: { comment: string; isFlagged: boolean } }) {
  if (!feedback || (!feedback.comment && !feedback.isFlagged)) return null;

  return (
    <div className={`mt-2 p-3 rounded-lg border text-sm transition-all ${feedback.isFlagged ? 'bg-red-900/10 border-red-800/50 ring-1 ring-red-500/20' : 'bg-slate-800/40 border-slate-800'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Consultant Coaching
          </span>
        </div>
        {feedback.isFlagged && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="w-1 h-1 rounded-full bg-red-400 animate-ping" />
            <span className="text-[9px] font-bold uppercase tracking-tight text-red-400">
              Needs Revision
            </span>
          </div>
        )}
      </div>
      {feedback.comment && (
        <p className="text-slate-300 italic leading-relaxed pl-3 border-l border-slate-700/50">
          "{feedback.comment}"
        </p>
      )}
    </div>
  );
}
