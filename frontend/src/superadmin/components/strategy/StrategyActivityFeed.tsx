import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { superadminApi } from '../../api';

interface ActivityItem {
    id: string;
    actor: string;
    action: string;
    target: string;
    tenantId: string | null;
    timestamp: Date;
    type: string;
}

export function StrategyActivityFeed() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setLocation] = useLocation();

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const data = await superadminApi.getActivityFeed();
                setActivities(data.activities);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch activity feed:', error);
                setLoading(false);
            }
        };

        fetchActivities();

        // Poll every 30 seconds for updates
        const interval = setInterval(fetchActivities, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleActivityClick = (activity: ActivityItem) => {
        if (!activity.tenantId) return;

        // Navigate based on activity type
        switch (activity.type) {
            case 'intake':
                setLocation(`/superadmin/execute/firms/${activity.tenantId}`);
                break;
            case 'diagnostic':
                setLocation(`/superadmin/execute/firms/${activity.tenantId}#diagnostic`);
                break;
            case 'roadmap':
                setLocation(`/superadmin/execute/firms/${activity.tenantId}`);
                break;
            default:
                setLocation(`/superadmin/execute/firms/${activity.tenantId}`);
        }
    };

    const formatRelativeTime = (timestamp: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="border border-slate-800 rounded-2xl bg-slate-950/60 p-4 h-full flex flex-col">
            <div className="mb-3">
                <h2 className="text-sm font-semibold text-slate-100">
                    Recent Activity
                </h2>
                <p className="text-xs text-slate-400">
                    Cross-tenant system events
                </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5">
                {loading ? (
                    <div className="text-xs text-slate-500 py-4 text-center">
                        Loading activity...
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4 text-center">
                        No recent activity
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div
                            key={activity.id}
                            onClick={() => handleActivityClick(activity)}
                            className={`py-2 px-2 text-xs border-b border-slate-800/50 last:border-0 transition-colors ${activity.tenantId ? 'cursor-pointer hover:bg-slate-900/50 rounded' : ''
                                }`}
                        >
                            <div className="flex items-start gap-1.5">
                                <div className="flex-1 min-w-0">
                                    <span className="text-slate-100 font-medium">{activity.actor}</span>
                                    {' '}
                                    <span className="text-slate-300">{activity.action}</span>
                                    {' — '}
                                    <span className="text-slate-400">{activity.target}</span>
                                </div>
                                <span className="text-slate-500 text-[10px] whitespace-nowrap">
                                    {formatRelativeTime(activity.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
