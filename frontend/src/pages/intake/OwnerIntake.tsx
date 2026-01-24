import { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useBusinessTypeProfile, useTenant } from '../../context/TenantContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { api } from '../../lib/api';
import { getChamberQuestionsForPlatformRole } from '../../intake/chamberQuestionBank';

type ChangeReadiness = 'low' | 'medium' | 'high';

interface OwnerIntakeForm {
  // Section A-D: existing fields
  top_priorities: string;
  biggest_frustration: string;
  ideal_state: string;
  workflow_stuck: string;
  team_bottlenecks: string;
  owner_bottlenecks: string;
  systems_struggles: string;
  communication_breakdown: string;
  manual_firefighting: string;
  growth_barriers: string;
  volume_breaking_point: string;
  ai_opportunities: string;
  // Section E: enriched profile
  role_label: string;
  department_key: 'owner';
  display_name: string;
  preferred_reference: string;
  top_3_issues: string[];
  top_3_goals_next_90_days: string[];
  if_nothing_else_changes_but_X_this_was_worth_it: string;
  primary_kpis: string[];
  kpi_baselines: Record<string, string>;
  non_goals: string[];
  do_not_automate: string[];
  change_readiness: ChangeReadiness;
  weekly_capacity_for_implementation_hours: number;
  biggest_risk_if_we_push_too_fast: string;
  // Chamber metadata/answers (safe even for non-Chamber tenants)
  chamberRole?: string;
  chamber_exec_membership_pressure?: string;
  chamber_exec_board_engagement?: string;
}

export default function OwnerIntake() {
  const { logout, user } = useAuth();
  const profile = useBusinessTypeProfile();
  const { businessType } = useTenant();
  const isChamber = businessType === 'chamber';
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { refresh: refreshOnboarding } = useOnboarding();

  const { chamberRole, questions: chamberQuestions } = isChamber
    ? getChamberQuestionsForPlatformRole('owner')
    : { chamberRole: null, questions: [] };

  const [formData, setFormData] = useState<OwnerIntakeForm>({
    // Section A: Strategic Clarity
    top_priorities: '',
    biggest_frustration: '',
    ideal_state: '',
    // Section B: Team & Workflow
    workflow_stuck: '',
    team_bottlenecks: '',
    owner_bottlenecks: '',
    // Section C: Systems & Communication
    systems_struggles: '',
    communication_breakdown: '',
    manual_firefighting: '',
    // Section D: Growth & Capacity
    growth_barriers: '',
    volume_breaking_point: '',
    ai_opportunities: '',
    // Section E: Enriched Profile
    role_label: 'Owner',
    department_key: 'owner',
    display_name: user?.name || '',
    preferred_reference: user?.name || '',
    top_3_issues: ['', '', ''],
    top_3_goals_next_90_days: ['', '', ''],
    if_nothing_else_changes_but_X_this_was_worth_it: '',
    primary_kpis: ['', '', ''],
    kpi_baselines: {},
    non_goals: ['', ''],
    do_not_automate: ['', ''],
    change_readiness: 'medium',
    weekly_capacity_for_implementation_hours: 0,
    biggest_risk_if_we_push_too_fast: '',
    chamberRole: undefined,
    chamber_exec_membership_pressure: '',
    chamber_exec_board_engagement: '',
  });

  const { data: intakeData } = useQuery({
    queryKey: ['my-intake'],
    queryFn: () => api.getMyIntake(),
  });

  const coachingFeedback = intakeData?.intake?.coachingFeedback || {};

  // Load existing intake data into form when editing
  useEffect(() => {
    if (intakeData?.intake && isEditing) {
      const existingAnswers = (intakeData.intake as any).answers || {};
      setFormData(prev => {
        const merged = { ...prev, ...existingAnswers } as OwnerIntakeForm;
        // Ensure arrays have expected length (backward compat with old intakes)
        merged.top_3_issues = (merged.top_3_issues || ['', '', '']).slice(0, 3);
        if (merged.top_3_issues.length < 3) {
          merged.top_3_issues = [...merged.top_3_issues, ...Array(3 - merged.top_3_issues.length).fill('')];
        }
        merged.top_3_goals_next_90_days = (merged.top_3_goals_next_90_days || ['', '', '']).slice(0, 3);
        if (merged.top_3_goals_next_90_days.length < 3) {
          merged.top_3_goals_next_90_days = [...merged.top_3_goals_next_90_days, ...Array(3 - merged.top_3_goals_next_90_days.length).fill('')];
        }
        merged.primary_kpis = (merged.primary_kpis || ['', '', '']).slice(0, 3);
        if (merged.primary_kpis.length < 3) {
          merged.primary_kpis = [...merged.primary_kpis, ...Array(3 - merged.primary_kpis.length).fill('')];
        }
        merged.non_goals = (merged.non_goals || ['', '']).slice(0, 2);
        merged.do_not_automate = (merged.do_not_automate || ['', '']).slice(0, 2);
        merged.kpi_baselines = merged.kpi_baselines || {};
        return merged;
      });
    }
  }, [intakeData, isEditing]);

  const submitMutation = useMutation({
    mutationFn: api.submitIntake,
    onSuccess: async () => {
      // Refresh onboarding state and invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['owner-intakes'] }),
        queryClient.invalidateQueries({ queryKey: ['my-intake'] }),
        refreshOnboarding(),
      ]);
      if (!intakeData?.intake) {
        setSubmitted(true); // first-time completion
      } else {
        setIsEditing(false); // editing existing
      }
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: OwnerIntakeForm = {
      ...formData,
      chamberRole: isChamber && chamberRole ? chamberRole : formData.chamberRole,
    };
    submitMutation.mutate({ role: 'owner', answers: payload });
  };

  const handleChange = <K extends keyof OwnerIntakeForm>(
    field: K,
    value: OwnerIntakeForm[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderValue = (value: any) => {
    if (Array.isArray(value)) {
      const filtered = value.filter(Boolean);
      return filtered.length ? filtered.map(v => `• ${v}`).join('\n') : '—';
    }
    if (value && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value || '—';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{profile.roleLabels.owner} Assessment</h1>
            <p className="text-sm text-slate-400">{profile.intakeCopy.ownerIntro}</p>
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
        {submitted ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Strategic Assessment Complete
            </h2>
            <p className="text-slate-400 mb-6">
              Thank you for completing your strategic assessment. Your responses provide the
              foundation for building your team's AI roadmap.
            </p>
            <button
              onClick={() => setLocation('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : intakeData?.intake && !isEditing ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Your Submitted Assessment</h2>
                <p className="text-sm text-slate-400">
                  Submitted {new Date(intakeData.intake.createdAt as any).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-medium rounded-full">
                  Complete
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Edit Responses
                </button>
              </div>
            </div>
            <div className="space-y-6">
              {Object.entries((intakeData.intake as any).answers || {}).map(([key, value]) => (
                <div key={key} className="border-t border-slate-800 pt-4">
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-slate-200 whitespace-pre-wrap">
                    {renderValue(value)}
                  </div>
                  <ConsultantFeedback feedback={coachingFeedback[key]} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg border border-slate-800 p-8 space-y-8">
            {/* Section A: Strategic Clarity */}
            <div className="border-b border-slate-700 pb-4">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Section A: Strategic Clarity</h3>
              <p className="text-sm text-slate-400">3 questions • ~5 minutes</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                1. What are your top 3 priorities for the next 6–12 months?
              </label>
              <textarea
                value={formData.top_priorities}
                onChange={(e) => handleChange('top_priorities', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="List your most important business priorities..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.top_priorities} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                2. What currently feels most frustrating or limiting about the business?
              </label>
              <textarea
                value={formData.biggest_frustration}
                onChange={(e) => handleChange('biggest_frustration', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Be specific about what holds you back..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.biggest_frustration} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                3. If the business ran "the way it should," what would be different?
              </label>
              <textarea
                value={formData.ideal_state}
                onChange={(e) => handleChange('ideal_state', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe your ideal operational state..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.ideal_state} />
            </div>

            {/* Section B: Team & Workflow */}
            <div className="border-b border-slate-700 pb-4 pt-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Section B: Team & Workflow Health</h3>
              <p className="text-sm text-slate-400">3 questions • ~4 minutes</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                4. Where does work get stuck or slow down? (handoffs, waiting, approvals, unclear ownership)
              </label>
              <textarea
                value={formData.workflow_stuck}
                onChange={(e) => handleChange('workflow_stuck', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe where things get stuck..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.workflow_stuck} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                5. Which roles or people are currently overloaded or bottlenecked?
              </label>
              <textarea
                value={formData.team_bottlenecks}
                onChange={(e) => handleChange('team_bottlenecks', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Who's stretched too thin?..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.team_bottlenecks} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                6. What tasks or decisions still fall on you that *shouldn't*?
              </label>
              <textarea
                value={formData.owner_bottlenecks}
                onChange={(e) => handleChange('owner_bottlenecks', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Where do you personally become the bottleneck?..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.owner_bottlenecks} />
            </div>

            {/* Section C: Systems & Communication */}
            <div className="border-b border-slate-700 pb-4 pt-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Section C: Systems & Communication</h3>
              <p className="text-sm text-slate-400">3 questions • ~4 minutes</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                7. Which systems (CRM, email, tasks, etc.) does your team struggle to use consistently?
              </label>
              <textarea
                value={formData.systems_struggles}
                onChange={(e) => handleChange('systems_struggles', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="What tools aren't working?..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.systems_struggles} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                8. Where does communication break down—with clients or internally?
              </label>
              <textarea
                value={formData.communication_breakdown}
                onChange={(e) => handleChange('communication_breakdown', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Where do messages get missed or lost?..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.communication_breakdown} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                9. What part of your workflow is overly manual or feels like constant firefighting?
              </label>
              <textarea
                value={formData.manual_firefighting}
                onChange={(e) => handleChange('manual_firefighting', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="What takes too much manual effort?..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.manual_firefighting} />
            </div>

            {/* Section D: Growth & Capacity */}
            <div className="border-b border-slate-700 pb-4 pt-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Section D: Growth & Capacity</h3>
              <p className="text-sm text-slate-400">3 questions • ~3 minutes</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                10. What's your biggest barrier to predictable growth?
              </label>
              <textarea
                value={formData.growth_barriers}
                onChange={(e) => handleChange('growth_barriers', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="What prevents consistent scaling?..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.growth_barriers} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                11. If lead volume doubled tomorrow, what would break first?
              </label>
              <textarea
                value={formData.volume_breaking_point}
                onChange={(e) => handleChange('volume_breaking_point', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="What's your most fragile point?..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.volume_breaking_point} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                12. Where do you believe AI or automation could most help right now?
              </label>
              <textarea
                value={formData.ai_opportunities}
                onChange={(e) => handleChange('ai_opportunities', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Where do you see the biggest opportunity?..."
                required
              />
              <ConsultantFeedback feedback={coachingFeedback.ai_opportunities} />
            </div>

            {/* Section E: Profile, Goals & Metrics */}
            <div className="border-b border-slate-700 pb-4 pt-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Section E: How We Talk About You & Measure Success
              </h3>
              <p className="text-sm text-slate-400">3–5 questions • ~3 minutes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  What should we call you in the roadmap & sessions?
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => handleChange('display_name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Roberta"
                />
                <ConsultantFeedback feedback={coachingFeedback.display_name} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  How should we refer to your role?
                </label>
                <input
                  type="text"
                  value={formData.role_label}
                  onChange={(e) => handleChange('role_label', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Owner, Founder & CEO"
                />
                <ConsultantFeedback feedback={coachingFeedback.role_label} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                What are the top 3 issues you want this roadmap to help you solve?
              </label>
              <div className="space-y-2">
                {formData.top_3_issues.map((val, idx) => (
                  <div key={idx}>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => {
                        const next = [...formData.top_3_issues];
                        next[idx] = e.target.value;
                        setFormData(prev => ({ ...prev, top_3_issues: next }));
                      }}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={idx === 0 ? 'Issue #1 (most important)' : `Issue #${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
              <ConsultantFeedback feedback={coachingFeedback.top_3_issues} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                If nothing else changes but <span className="italic">this one thing</span>, this whole project was worth it:
              </label>
              <input
                type="text"
                value={formData.if_nothing_else_changes_but_X_this_was_worth_it}
                onChange={(e) => handleChange('if_nothing_else_changes_but_X_this_was_worth_it', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Finish the sentence in your own words..."
              />
              <ConsultantFeedback feedback={coachingFeedback.if_nothing_else_changes_but_X_this_was_worth_it} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                What 2–3 metrics matter most to you personally?
              </label>
              <div className="space-y-2">
                {formData.primary_kpis.map((val, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => {
                        const next = [...formData.primary_kpis];
                        next[idx] = e.target.value;
                        setFormData(prev => ({ ...prev, primary_kpis: next }));
                      }}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={idx === 0 ? 'e.g. Lead response time' : 'Another KPI you actually care about'}
                    />
                    <input
                      type="text"
                      value={formData.kpi_baselines[val] || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          kpi_baselines: {
                            ...prev.kpi_baselines,
                            [val || `kpi_${idx}`]: e.target.value,
                          },
                        }));
                      }}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Current baseline (e.g. ~4 hours, 12/mo, etc.)"
                    />
                  </div>
                ))}
              </div>
              <ConsultantFeedback feedback={coachingFeedback.primary_kpis} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Realistically, how many hours per week can you or your team give to implementation?
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={formData.weekly_capacity_for_implementation_hours}
                  onChange={(e) =>
                    handleChange('weekly_capacity_for_implementation_hours', Number(e.target.value || 0))
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 3–5 hours/week"
                />
                <ConsultantFeedback feedback={coachingFeedback.weekly_capacity_for_implementation_hours} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Change readiness
                </label>
                <select
                  value={formData.change_readiness}
                  onChange={(e) => handleChange('change_readiness', e.target.value as ChangeReadiness)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low – go slow & gentle</option>
                  <option value="medium">Medium – steady pace</option>
                  <option value="high">High – we're ready to move</option>
                </select>
                <ConsultantFeedback feedback={coachingFeedback.change_readiness} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                What's the biggest risk if we push too fast with change?
              </label>
              <textarea
                value={formData.biggest_risk_if_we_push_too_fast}
                onChange={(e) => handleChange('biggest_risk_if_we_push_too_fast', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Be honest — where could this go sideways?"
              />
              <ConsultantFeedback feedback={coachingFeedback.biggest_risk_if_we_push_too_fast} />
            </div>

            {isChamber && chamberQuestions.length > 0 && (
              <div className="border-t border-slate-700 pt-6 mt-4">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  Chamber-Specific Questions (Executive View)
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  These help us tune your roadmap for membership, programs, and community impact.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      {chamberQuestions[0]?.label}
                    </label>
                    <textarea
                      value={formData.chamber_exec_membership_pressure || ''}
                      onChange={(e) =>
                        handleChange('chamber_exec_membership_pressure', e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <ConsultantFeedback feedback={coachingFeedback.chamber_exec_membership_pressure} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      {chamberQuestions[1]?.label}
                    </label>
                    <textarea
                      value={formData.chamber_exec_board_engagement || ''}
                      onChange={(e) =>
                        handleChange('chamber_exec_board_engagement', e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <ConsultantFeedback feedback={coachingFeedback.chamber_exec_board_engagement} />
                  </div>
                </div>
              </div>
            )}

            {submitMutation.isError && (
              <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
                Failed to submit form. Please try again.
              </div>
            )}

            <div className="flex gap-4">
              {intakeData?.intake && isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitMutation.isPending ? 'Saving...' : (intakeData?.intake ? 'Update Assessment' : 'Complete Strategic Assessment')}
              </button>
            </div>
          </form>
        )}
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
