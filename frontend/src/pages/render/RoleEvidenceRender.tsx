// frontend/src/pages/render/RoleEvidenceRender.tsx

import { useMemo } from "react";
import {
  RoleEvidenceCard,
  type RoleEvidenceCardProps,
} from "../../components/webinar/RoleEvidenceCard";

export const RoleEvidenceRender = () => {
  const props = useMemo<RoleEvidenceCardProps | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const payload = params.get("payload");
    if (!payload) return null;

    try {
      const json = atob(payload);
      return JSON.parse(json) as RoleEvidenceCardProps;
    } catch (e) {
      console.error("Failed to parse payload", e);
      return null;
    }
  }, []);

  if (!props) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-slate-200 text-sm">Invalid payload.</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen flex items-start justify-start p-4">
      {/* Fixed width ensures consistent screenshot dimensions. */}
      <div data-testid="role-evidence-card" style={{ width: 400 }}>
        <RoleEvidenceCard {...props} />
      </div>
    </div>
  );
};

export default RoleEvidenceRender;
