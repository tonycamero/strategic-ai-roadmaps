interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OrgChartProps {
  owner: User;
  teamMembers: User[];
}

export function OrgChart({ owner, teamMembers }: OrgChartProps) {
  const roleColors: Record<string, string> = {
    owner: 'bg-blue-500',
    superadmin: 'bg-purple-500',
    ops: 'bg-green-500',
    sales: 'bg-yellow-500',
    delivery: 'bg-orange-500',
    staff: 'bg-gray-500',
  };

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    superadmin: 'SuperAdmin',
    ops: 'Operations',
    sales: 'Sales',
    delivery: 'Delivery',
    staff: 'Staff',
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Owner at top */}
      <div className="flex flex-col items-center">
        <OrgNode
          name={owner.name}
          email={owner.email}
          role={owner.role}
          color={roleColors[owner.role] || 'bg-gray-500'}
          label={roleLabels[owner.role] || owner.role}
        />
      </div>

      {/* Connecting line */}
      {teamMembers.length > 0 && (
        <div className="w-px h-8 bg-slate-700"></div>
      )}

      {/* Team members */}
      {teamMembers.length > 0 && (
        <div className="flex items-start gap-6">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex flex-col items-center">
              {/* Connecting line from top */}
              <div className="w-px h-4 bg-slate-700"></div>
              <OrgNode
                name={member.name}
                email={member.email}
                role={member.role}
                color={roleColors[member.role] || 'bg-gray-500'}
                label={roleLabels[member.role] || member.role}
              />
            </div>
          ))}
        </div>
      )}

      {teamMembers.length === 0 && (
        <div className="text-slate-500 text-sm italic">No team members yet</div>
      )}
    </div>
  );
}

function OrgNode({
  name,
  email,
  role: _role,
  color,
  label,
}: {
  name: string;
  email: string;
  role: string;
  color: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar circle with role color */}
      <div
        className={`w-16 h-16 rounded-full ${color} flex items-center justify-center text-white font-bold text-xl border-4 border-slate-800`}
      >
        {name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)}
      </div>

      {/* Name and details */}
      <div className="text-center">
        <div className="font-medium text-slate-200">{name}</div>
        <div className="text-xs text-slate-400">{email}</div>
        <div className="mt-1">
          <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
