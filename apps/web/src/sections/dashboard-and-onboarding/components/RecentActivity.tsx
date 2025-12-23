import {
  Calendar,
  CheckCircle2,
  MessageSquare,
  Star,
  UserPlus,
  TrendingUp,
  Award,
  Briefcase,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type:
    | 'booking_completed'
    | 'review_received'
    | 'message_received'
    | 'profile_view'
    | 'xp_earned'
    | 'booking_scheduled'
    | 'technician_hired'
    | 'milestone_reached';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    rating?: number;
    xp?: number;
    amount?: number;
  };
}

export interface RecentActivityProps {
  activities: ActivityItem[];
  onActivityClick?: (activity: ActivityItem) => void;
}

export function RecentActivity({ activities, onActivityClick }: RecentActivityProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'booking_completed':
        return { Icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/20' };
      case 'review_received':
        return { Icon: Star, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' };
      case 'message_received':
        return { Icon: MessageSquare, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20' };
      case 'xp_earned':
        return { Icon: Award, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/20' };
      case 'booking_scheduled':
        return { Icon: Calendar, color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-50 dark:bg-lime-950/20' };
      case 'technician_hired':
        return { Icon: UserPlus, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' };
      case 'milestone_reached':
        return { Icon: TrendingUp, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/20' };
      case 'profile_view':
      default:
        return { Icon: Briefcase, color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-800/50' };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Recent Activity
      </h2>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No recent activity yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const { Icon, color, bg } = getActivityIcon(activity.type);
            const isClickable = !!onActivityClick;

            return (
              <button
                key={activity.id}
                onClick={() => isClickable && onActivityClick(activity)}
                disabled={!isClickable}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  isClickable
                    ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <div className={`flex-shrink-0 p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-0.5">
                    {activity.title}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {activity.description}
                  </p>
                  {activity.metadata && (
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      {activity.metadata.rating !== undefined && (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {activity.metadata.rating}/5 stars
                        </span>
                      )}
                      {activity.metadata.xp !== undefined && (
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          +{activity.metadata.xp} XP
                        </span>
                      )}
                      {activity.metadata.amount !== undefined && (
                        <span className="text-lime-600 dark:text-lime-400 font-medium">
                          ${activity.metadata.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-500">
                  {formatTimestamp(activity.timestamp)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
