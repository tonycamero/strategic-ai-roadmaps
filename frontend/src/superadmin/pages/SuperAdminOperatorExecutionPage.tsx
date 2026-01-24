import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { OperatorExecutionPanel } from '../components/OperatorExecutionPanel';
import { DiscoverySynthesisBuilder } from '../components/DiscoverySynthesisBuilder';

export default function SuperAdminOperatorExecutionPage() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute<{ tenantId: string; diagnosticId: string }>(
        '/superadmin/execute/:tenantId/:diagnosticId'
    );

    const [showBuilder, setShowBuilder] = useState(false);

    if (!params?.tenantId || !params?.diagnosticId) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Invalid Route</h2>
                    <p>Missing tenantId or diagnosticId</p>
                </div>
            </div>
        );
    }

    const { tenantId, diagnosticId } = params;

    async function handleAction(action: string, actionParams?: any) {
        console.log('[OperatorExecutionPage] Action:', action, actionParams);

        switch (action) {
            case 'CREATE_DISCOVERY':
            case 'REVISE_DISCOVERY':
                setShowBuilder(true);
                break;

            case 'SEND_REVIEW_LINK':
                // Copy tenant review link to clipboard
                const reviewLink = `${window.location.origin}/tenant/discovery-review`;
                navigator.clipboard.writeText(reviewLink);
                alert(`Review link copied to clipboard:\n${reviewLink}`);
                break;

            case 'GENERATE_TICKETS':
                await generateTickets();
                break;

            case 'OPEN_MODERATION':
                setLocation(`/superadmin/tickets/${tenantId}/${diagnosticId}`);
                break;

            case 'ASSEMBLE_ROADMAP':
                await assembleRoadmap();
                break;

            case 'RUN_DIAGNOSTIC':
                await runDiagnostic();
                break;

            default:
                console.warn('[OperatorExecutionPage] Unknown action:', action);
        }
    }

    async function runDiagnostic() {
        try {
            const response = await fetch(`/api/superadmin/firms/${tenantId}/generate-sop01`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to run diagnostic');
            }

            alert('Diagnostic started successfully');
            window.location.reload();
        } catch (error: any) {
            alert(`Failed to run diagnostic: ${error.message}`);
        }
    }

    async function generateTickets() {
        try {
            const response = await fetch(`/api/superadmin/tickets/generate/${tenantId}/${diagnosticId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate tickets');
            }

            alert('Tickets generated successfully');
            window.location.reload();
        } catch (error: any) {
            alert(`Failed to generate tickets: ${error.message}`);
        }
    }

    async function assembleRoadmap() {
        try {
            const response = await fetch(`/api/superadmin/firms/${tenantId}/assemble-roadmap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to assemble roadmap');
            }

            alert('Roadmap assembled successfully');
            window.location.reload();
        } catch (error: any) {
            alert(`Failed to assemble roadmap: ${error.message}`);
        }
    }

    async function handleSaveDiscovery(synthesis: any) {
        try {
            const response = await fetch(`/api/discovery/${tenantId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    diagnosticId,
                    notes: synthesis.operatorNotes,
                    synthesis,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save discovery synthesis');
            }

            setShowBuilder(false);
            alert('Discovery synthesis saved successfully');
            window.location.reload();
        } catch (error: any) {
            throw new Error(`Failed to save: ${error.message}`);
        }
    }

    if (showBuilder) {
        return (
            <div className="h-screen overflow-auto bg-slate-50">
                <DiscoverySynthesisBuilder
                    tenantId={tenantId}
                    diagnosticId={diagnosticId}
                    onSave={handleSaveDiscovery}
                    onCancel={() => setShowBuilder(false)}
                />
            </div>
        );
    }

    return (
        <div className="h-screen overflow-auto bg-slate-50">
            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <button
                        onClick={() => setLocation(`/superadmin/execute/firms/${tenantId}`)}
                        className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
                    >
                        ← Back to Firm Detail
                    </button>
                </div>

                <OperatorExecutionPanel
                    tenantId={tenantId}
                    diagnosticId={diagnosticId}
                    onAction={handleAction}
                />
            </div>
        </div>
    );
}
