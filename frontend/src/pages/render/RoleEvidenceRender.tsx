import React, { useMemo } from 'react';

import { RoleEvidenceCard, RoleEvidenceCardProps } from '../../components/webinar/RoleEvidenceCard';

export const RoleEvidenceRender = () => {
    const props = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const payload = params.get('payload');

        if (!payload) return null;
        try {
            const json = atob(payload);
            return JSON.parse(json) as RoleEvidenceCardProps;
        } catch (e) {
            console.error('Failed to parse payload', e);
            return null;
        }
    }, []);

    if (!props) return <div className="text-white p-4">Invalid Payload</div>;

    return (
        <div className="bg-slate-950 min-h-screen flex items-start justify-start p-4">
            {/* 
        Fixed width ensures consistent screenshot dimensions.
        400px matches roughly the card width on desktop grid.
      */}
            <div
                data-testid="role-evidence-card"
                style={{ width: '400px' }}
            >
                <RoleEvidenceCard {...props} />
            </div>
        </div>
    );
};

export default RoleEvidenceRender;
