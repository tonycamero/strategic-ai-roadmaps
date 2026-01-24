import { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useBusinessTypeProfile, useTenant } from '../../context/TenantContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { api } from '../../lib/api';
import { getChamberQuestionsForPlatformRole } from '../../intake/chamberQuestionBank';

export default function DeliveryIntake() {
  const { logout } = useAuth();
  const profile = useBusinessTypeProfile();
  const { businessType } = useTenant();
  const isChamber = businessType === 'chamber';
  const [, setLocation] = useLocation();
  const [isUpdate, setIsUpdate] = useState(false);
  const queryClient = useQueryClient();
  const { refresh: refreshOnboarding } = useOnboarding();

  const { chamberRole, questions: chamberQuestions } = isChamber
    ? getChamberQuestionsForPlatformRole('delivery')
    : { chamberRole: null, questions: [] };

  const [formData, setFormData] = useState({
    delivery_process: '',
    project_management: '',
    team_size: '',
    bottlenecks: '',
    quality_metrics: '',
    client_feedback: '',
    chamberRole: '',
    pe_event_bottlenecks: '',
    pe_sponsorships: '',
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
    submitMutation.mutate({ role: 'delivery', answers: payload });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{profile.roleLabels.delivery} Intake</h1>
            <p className="text-sm text-slate-400">{profile.intakeCopy.deliveryIntro}</p>
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
            // Chamber-specific questions: Programs & Events
            <>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Core Event Types
                </label>
                <textarea
                  value={formData.delivery_process}
                  onChange={(e) => handleChange('delivery_process', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your core event types (monthly mixers, annual conference, ribbon cuttings, training, etc.)..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.delivery_process} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Event Planning & Management
                </label>
                <textarea
                  value={formData.project_management}
                  onChange={(e) => handleChange('project_management', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="How do you currently manage event planning (tools, workflows, templates)?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.project_management} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Event Bottlenecks
                </label>
                <textarea
                  value={formData.bottlenecks}
                  onChange={(e) => handleChange('bottlenecks', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Where do events get bottlenecked (promotion, registrations, check-in, follow-up)?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.bottlenecks} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Event Success Tracking
                </label>
                <textarea
                  value={formData.quality_metrics}
                  onChange={(e) => handleChange('quality_metrics', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="How do you track event success (attendance vs capacity, member mix, sponsor outcomes)?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.quality_metrics} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Post-Event Feedback
                </label>
                <textarea
                  value={formData.client_feedback}
                  onChange={(e) => handleChange('client_feedback', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="How do you collect and use post-event feedback?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.client_feedback} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Automation Opportunities
                </label>
                <textarea
                  value={formData.team_size}
                  onChange={(e) => handleChange('team_size', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Where would automation help most in your event + programs pipeline?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.team_size} />
              </div>
            </>
          ) : (
            // Default questions: Delivery
            <>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Delivery Process
                </label>
                <textarea
                  value={formData.delivery_process}
                  onChange={(e) => handleChange('delivery_process', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your current delivery/fulfillment process from onboarding to completion..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.delivery_process} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Project Management Tools
                </label>
                <textarea
                  value={formData.project_management}
                  onChange={(e) => handleChange('project_management', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What project management and collaboration tools does your team use?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.project_management} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Team Structure & Size
                </label>
                <textarea
                  value={formData.team_size}
                  onChange={(e) => handleChange('team_size', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Describe your delivery team size, roles, and structure..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.team_size} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Bottlenecks & Delays
                </label>
                <textarea
                  value={formData.bottlenecks}
                  onChange={(e) => handleChange('bottlenecks', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="What are the main bottlenecks that cause project delays or resource constraints?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.bottlenecks} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Quality Metrics & KPIs
                </label>
                <textarea
                  value={formData.quality_metrics}
                  onChange={(e) => handleChange('quality_metrics', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="How do you measure delivery quality and success? What are your key metrics?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.quality_metrics} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Client Feedback & Satisfaction
                </label>
                <textarea
                  value={formData.client_feedback}
                  onChange={(e) => handleChange('client_feedback', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="How do you gather client feedback? What do clients most commonly request or complain about?..."
                  required
                />
                <ConsultantFeedback feedback={coachingFeedback.client_feedback} />
              </div>
            </>
          )}

          {isChamber && chamberQuestions.length > 0 && (
            <div className="border-t border-slate-700 pt-6 mt-4 space-y-4">
              <h3 className="text-lg font-semibold text-slate-100">
                Chamber-Specific Questions (Programs & Events)
              </h3>
              <p className="text-sm text-slate-400">
                These help us understand how you design, run, and monetize events.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  {chamberQuestions[0]?.label}
                </label>
                <textarea
                  value={formData.pe_event_bottlenecks}
                  onChange={(e) => handleChange('pe_event_bottlenecks', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <ConsultantFeedback feedback={coachingFeedback.pe_event_bottlenecks} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  {chamberQuestions[1]?.label}
                </label>
                <textarea
                  value={formData.pe_sponsorships}
                  onChange={(e) => handleChange('pe_sponsorships', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <ConsultantFeedback feedback={coachingFeedback.pe_sponsorships} />
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
