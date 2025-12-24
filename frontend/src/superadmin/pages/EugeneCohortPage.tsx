import { useEffect, useMemo, useState } from 'react';
import { superadminApi, FirmDetailResponseV2 } from '../api';
import { SuperAdminFirmRow } from '../types';
import { FirmDrawer } from '../components/FirmDrawer';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';

const EUGENE_COHORT = 'EUGENE_Q1_2026';

type StatusColumn =
  | 'prospect'
  | 'engaged'
  | 'qualified'
  | 'pilot_candidate'
  | 'pilot_active'
  | 'no_fit';

const STATUS_CONFIG: Record<
  StatusColumn,
  { label: string; color: string; description: string }
> = {
  prospect: {
    label: 'Prospect',
    color: 'bg-slate-700',
    description: 'Invited / not yet engaged',
  },
  engaged: {
    label: 'Engaged',
    color: 'bg-blue-700',
    description: 'Call done / activity started',
  },
  qualified: {
    label: 'Qualified',
    color: 'bg-green-700',
    description: 'Good fit, intake underway',
  },
  pilot_candidate: {
    label: 'Pilot Candidate',
    color: 'bg-yellow-700',
    description: 'Shortlisted for the 10',
  },
  pilot_active: {
    label: 'Pilot Active',
    color: 'bg-purple-700',
    description: 'Locked in the 10',
  },
  no_fit: {
    label: 'No Fit',
    color: 'bg-red-700',
    description: 'Released',
  },
};

export default function EugeneCohortPage() {
  const [firms, setFirms] = useState<SuperAdminFirmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFirm, setSelectedFirm] = useState<SuperAdminFirmRow | null>(
    null
  );
  const [firmDetail, setFirmDetail] = useState<FirmDetailResponseV2 | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Avoid accidental drags when trying to click
      activationConstraint: { distance: 5 },
    })
  );

  useEffect(() => {
    loadCohort();
  }, []);

  async function loadCohort() {
    try {
      const res = await fetch(`/api/superadmin/firms?cohortLabel=${EUGENE_COHORT}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setFirms(data.firms);
    } catch (err) {
      console.error('Failed to load cohort:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(tenantId: string, newStatus: StatusColumn) {
    // Check if trying to add 11th pilot_active
    if (newStatus === 'pilot_active') {
      const activeCount = firms.filter((f) => f.status === 'pilot_active').length;
      if (activeCount >= 10 && !firms.find((f) => f.tenantId === tenantId && f.status === 'pilot_active')) {
        if (
          !confirm(
            'You already have 10 pilot_active firms. Switch another out or proceed anyway?'
          )
        ) {
          return;
        }
      }
    }

    try {
      await superadminApi.updateTenant(tenantId, { status: newStatus });
      setFirms((prev) =>
        prev.map((f) => (f.tenantId === tenantId ? { ...f, status: newStatus } : f))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function handleFirmClick(firm: SuperAdminFirmRow) {
    setSelectedFirm(firm);
    setLoadingDetail(true);
    setFirmDetail(null);
    try {
      const detail = await superadminApi.getFirmDetailV2(firm.tenantId);
      setFirmDetail(detail);
    } catch (err) {
      console.error('Failed to load firm detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  }

  const counts = useMemo(() => {
    const total = firms.length;
    const engaged = firms.filter((f) => f.status !== 'prospect').length;
    const shortlisted = firms.filter((f) => f.status === 'pilot_candidate').length;
    const active = firms.filter((f) => f.status === 'pilot_active').length;
    return { total, engaged, shortlisted, active };
  }, [firms]);

  const firmsByStatus = useMemo(() => {
    const groups: Record<StatusColumn, SuperAdminFirmRow[]> = {
      prospect: [],
      engaged: [],
      qualified: [],
      pilot_candidate: [],
      pilot_active: [],
      no_fit: [],
    };
    firms.forEach((firm) => {
      const status = firm.status as StatusColumn;
      if (groups[status]) {
        groups[status].push(firm);
      }
    });
    return groups;
  }, [firms]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const tenantId = String(active.id);
    const newStatus = over.id as StatusColumn;

    const firm = firms.find((f) => f.tenantId === tenantId);
    if (!firm) return;

    const currentStatus = firm.status as StatusColumn;
    if (currentStatus === newStatus) return;

    void handleStatusChange(tenantId, newStatus);
  }

  if (loading) return <div className="text-slate-400">Loading cohort…</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Eugene – Q1 2026 Cohort Pipeline
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {counts.total} selected firms → target 10 pilot clients
        </p>
        <div className="flex gap-3 mt-4">
          <CohortStat label="Total" value={counts.total} />
          <CohortStat label="Engaged" value={counts.engaged} />
          <CohortStat label="Shortlisted" value={counts.shortlisted} />
          <CohortStat
            label="Pilot Active"
            value={counts.active}
            highlight={counts.active === 10}
          />
        </div>
      </header>

      {/* Firm Detail Drawer */}
      <FirmDrawer
        open={!!selectedFirm}
        onClose={() => {
          setSelectedFirm(null);
          setFirmDetail(null);
        }}
        detail={firmDetail}
        loading={loadingDetail}
        onStatusChange={(tenantId, newStatus) => handleStatusChange(tenantId, newStatus)}
      />

      {/* Kanban Columns + Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-6 gap-3">
          {(Object.keys(STATUS_CONFIG) as StatusColumn[]).map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              config={STATUS_CONFIG[status]}
              firms={firmsByStatus[status]}
              onStatusChange={handleStatusChange}
              onFirmClick={handleFirmClick}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function CohortStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border rounded-lg px-4 py-2.5 ${
        highlight ? 'border-green-500 bg-green-900/20' : 'border-slate-800'
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-400 font-medium">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function KanbanColumn({
  status,
  config,
  firms,
  onStatusChange,
  onFirmClick,
}: {
  status: StatusColumn;
  config: { label: string; color: string; description: string };
  firms: SuperAdminFirmRow[];
  onStatusChange: (tenantId: string, newStatus: StatusColumn) => void;
  onFirmClick: (firm: SuperAdminFirmRow) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col h-full">
      <div className={`${config.color} text-white px-3 py-2.5 rounded-t-xl`}>
        <div className="text-sm font-semibold">
          {config.label}
        </div>
        <div className="text-xs opacity-90 mt-0.5">
          ({firms.length})
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`border-x border-b rounded-b-xl p-3 space-y-2.5 min-h-[500px] transition-colors ${
          isOver
            ? 'border-blue-500 bg-slate-900/60'
            : 'border-slate-800 bg-slate-950/30'
        }`}
      >
        <div className="text-[10px] text-slate-500 mb-3">{config.description}</div>
        {firms.map((firm) => (
          <FirmCard
            key={firm.tenantId}
            firm={firm}
            status={status}
            onStatusChange={(newStatus) => onStatusChange(firm.tenantId, newStatus)}
            onFirmClick={() => onFirmClick(firm)}
          />
        ))}
      </div>
    </div>
  );
}

function FirmCard({
  firm,
  status,
  onStatusChange: _onStatusChange,
  onFirmClick,
}: {
  firm: SuperAdminFirmRow;
  status: StatusColumn;
  onStatusChange: (newStatus: StatusColumn) => void;
  onFirmClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: firm.tenantId,
    data: {
      tenantId: firm.tenantId,
      status,
    },
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: 'grab',
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={onFirmClick}
      className="w-full text-left border border-slate-700 rounded-lg px-3 py-2.5 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 transition-all"
      {...listeners}
      {...attributes}
    >
      <div className="font-medium text-sm text-slate-100 leading-tight">
        {firm.name}
      </div>
      {firm.intakeCount > 0 && (
        <div className="mt-1.5 text-[10px] text-slate-500">
          {firm.intakeCount} intake{firm.intakeCount !== 1 ? 's' : ''}
          {firm.roadmapCount > 0 && ` • ${firm.roadmapCount} roadmap${firm.roadmapCount !== 1 ? 's' : ''}`}
        </div>
      )}
    </button>
  );
}

