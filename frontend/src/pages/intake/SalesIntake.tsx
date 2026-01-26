import { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useBusinessTypeProfile, useTenant } from '../../context/TenantContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { api } from '../../lib/api';
import { getChamberQuestionsForPlatformRole } from '../../intake/chamberQuestionBank';

export default function SalesIntake() {
  const { logout } = useAuth();
  const profile = useBusinessTypeProfile();
  const { businessType } = useTenant();
  const isChamber = businessType === 'chamber';
  const [, setLocation] = useLocation();
  const [isUpdate, setIsUpdate] = useState(false);
  const queryClient = useQueryClient();
  const { refresh: refreshOnboarding } = useOnboarding();

  const { chamberRole, questions: chamberQuestions } = isChamber
    ? getChamberQuestionsForPlatformRole('sales')
    : { chamberRole: null, questions: [] };

  const [formData, setFormData] = useState({
    sales_process: '',
    lead_generation: '',
    crm_tools: '',
    conversion_challenges: '',
    customer_insights: '',
    automation_opportunities: '',
    chamberRole: '',
    ce_partnerships: '',
    ce_community_gaps: '',
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

    // Clean payload: Remove chamber fields if not chamber
    const cleanAnswers = { ...formData } as any;
    if (!isChamber) {
      delete cleanAnswers.chamberRole;
      delete cleanAnswers.ce_partnerships;
      delete cleanAnswers.ce_community_gaps;
    }

    const payload = {
      ...cleanAnswers,
      chamberRole: isChamber && chamberRole ? chamberRole : cleanAnswers.chamberRole,
    };
    submitMutation.mutate({ role: 'sales', answers: payload });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{profile.roleLabels.sales} Intake</h1>
            <p className="text-sm text-slate-400">{profile.intakeCopy.salesIntro}</p>
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
            // Chamber-specific questions: Membership Development
            <>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Membership Acquisition Process
                </label>
                <textarea
                  value={formData.sales_process}
                  onChange={(e) => handleChange('sales_process', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your membership acquisition process from first contact to activation..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.sales_process} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Member Acquisition Channels
                </label>
                <textarea
                  value={formData.lead_generation}
                  onChange={(e) => handleChange('lead_generation', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What are your primary member acquisition channels (events, referrals, cold outreach, digital, partners)?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.lead_generation} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  New Member Drop-off Points
                </label>
                <textarea
                  value={formData.conversion_challenges}
                  onChange={(e) => handleChange('conversion_challenges', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Where do new members drop off or go quiet in the first 90 days?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.conversion_challenges} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Member Tracking Tools
                </label>
                <textarea
                  value={formData.crm_tools}
                  onChange={(e) => handleChange('crm_tools', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What tools do you use to track member activity and engagement?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.crm_tools} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Renewals & Sponsorship Challenges
                </label>
                <textarea
                  value={formData.customer_insights}
                  onChange={(e) => handleChange('customer_insights', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What are your biggest challenges with renewals and sponsorships?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.customer_insights} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Automation Opportunities
                </label>
                <textarea
                  value={formData.automation_opportunities}
                  onChange={(e) => handleChange('automation_opportunities', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Where would you most like to apply automation (welcome journeys, renewal reminders, sponsor follow-up, reporting)?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.automation_opportunities} />
              </div>
            </>
          ) : (
            // Default questions: Sales
            <>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Current Sales Process
                </label>
                <textarea
                  value={formData.sales_process}
                  onChange={(e) => handleChange('sales_process', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your current sales process from lead to close..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.sales_process} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Lead Generation Channels
                </label>
                <textarea
                  value={formData.lead_generation}
                  onChange={(e) => handleChange('lead_generation', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What are your primary lead generation channels and their effectiveness?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.lead_generation} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  CRM & Sales Tools
                </label>
                <textarea
                  value={formData.crm_tools}
                  onChange={(e) => handleChange('crm_tools', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What CRM and sales tools does your team currently use?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.crm_tools} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Conversion Challenges
                </label>
                <textarea
                  value={formData.conversion_challenges}
                  onChange={(e) => handleChange('conversion_challenges', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="What are your biggest challenges in converting leads to customers?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.conversion_challenges} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Customer Insights & Data
                </label>
                <textarea
                  value={formData.customer_insights}
                  onChange={(e) => handleChange('customer_insights', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="How do you currently gather and use customer insights? What data do you wish you had?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.customer_insights} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Automation Opportunities
                </label>
                <textarea
                  value={formData.automation_opportunities}
                  onChange={(e) => handleChange('automation_opportunities', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Where do you see the biggest opportunities for AI or automation in your sales process?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.automation_opportunities} />
              </div>
            </>
          )}

          {isChamber && chamberQuestions.length > 0 && (
            <div className="border-t border-slate-700 pt-6 mt-4 space-y-4">
              <h3 className="text-lg font-semibold text-slate-100">
                Chamber-Specific Questions (Community & Sponsorship)
              </h3>
              <p className="text-sm text-slate-400">
                These help us understand your community partnerships and sponsorship engine.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  {chamberQuestions[0]?.label}
                </label>
                <textarea
                  value={formData.ce_partnerships}
                  onChange={(e) => handleChange('ce_partnerships', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <ConsultantFeedback feedback={coachingFeedback.ce_partnerships} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  {chamberQuestions[1]?.label}
                </label>
                <textarea
                  value={formData.ce_community_gaps}
                  onChange={(e) => handleChange('ce_community_gaps', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <ConsultantFeedback feedback={coachingFeedback.ce_community_gaps} />
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
