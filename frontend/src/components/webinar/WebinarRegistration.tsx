/**
 * Webinar Registration Form
 * Captures webinar participant details
 */

import { useState, FormEvent } from 'react';
import { webinarApi } from './webinarApi';

interface WebinarRegistrationProps {
    onSuccess: () => void;
}

export function WebinarRegistration({ onSuccess }: WebinarRegistrationProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        role: '',
        teamSize: '',
        currentCrm: '',
        bottleneck: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await webinarApi.registerForWebinar({
                name: formData.name,
                email: formData.email,
                company: formData.company,
                role: formData.role || undefined,
                teamSize: formData.teamSize ? parseInt(formData.teamSize) : undefined,
                currentCrm: formData.currentCrm || undefined,
                bottleneck: formData.bottleneck || undefined,
                source: 'webinar_page',
            });

            if (result.ok) {
                setShowSuccess(true);
                setTimeout(() => {
                    onSuccess();
                }, 3000);
            } else {
                setError(result.message || 'Registration failed');
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-2xl">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">You're Registered!</h3>
                    <p className="text-slate-400 mb-4">
                        We'll send the updated password to your email shortly.
                    </p>
                    <p className="text-sm text-slate-500">
                        Redirecting to diagnostic...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Register for Webinar</h2>
            <p className="text-slate-400 mb-6">
                Get access to our exclusive team health diagnostic
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Name *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email *
                    </label>
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="john@company.com"
                    />
                </div>

                {/* Company */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Company *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Acme Inc."
                    />
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Your Role
                    </label>
                    <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Founder, CEO, Operations Manager..."
                    />
                </div>

                {/* Team Size */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Team Size
                    </label>
                    <input
                        type="number"
                        value={formData.teamSize}
                        onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10"
                    />
                </div>

                {/* Current CRM */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Current CRM/System
                    </label>
                    <input
                        type="text"
                        value={formData.currentCrm}
                        onChange={(e) => setFormData({ ...formData, currentCrm: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Salesforce, HubSpot, GoHighLevel..."
                    />
                </div>

                {/* Bottleneck */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Biggest Operational Bottleneck
                    </label>
                    <textarea
                        value={formData.bottleneck}
                        onChange={(e) => setFormData({ ...formData, bottleneck: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your main challenge..."
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                    {isSubmitting ? 'Registering...' : 'Register'}
                </button>
            </form>
        </div>
    );
}
