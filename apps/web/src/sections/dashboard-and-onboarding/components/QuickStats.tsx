import {
  Briefcase,
  TrendingUp,
  Star,
  DollarSign,
  Users,
  Calendar,
  Award,
} from 'lucide-react';

export interface DashboardStats {
  // Technician stats
  totalBookings?: number;
  completedBookings?: number;
  averageRating?: number;
  totalEarnings?: number;
  // Company stats
  totalHires?: number;
  activeProjects?: number;
  totalSpent?: number;
  savedTechnicians?: number;
}

interface StatItem {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bgColor: string;
  suffix?: string;
}

export interface QuickStatsProps {
  stats: DashboardStats;
  userRole: 'technician' | 'company';
}

export function QuickStats({ stats, userRole }: QuickStatsProps) {
  const technicianStats: StatItem[] = [
    {
      label: 'Total Bookings',
      value: stats.totalBookings ?? 0,
      icon: Briefcase,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      label: 'Completed',
      value: stats.completedBookings ?? 0,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      label: 'Average Rating',
      value: stats.averageRating ? stats.averageRating.toFixed(1) : '0.0',
      icon: Star,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      suffix: '/5',
    },
    {
      label: 'Total Earnings',
      value: stats.totalEarnings
        ? `$${stats.totalEarnings.toLocaleString()}`
        : '$0',
      icon: DollarSign,
      color: 'text-lime-600 dark:text-lime-400',
      bgColor: 'bg-lime-50 dark:bg-lime-950/20',
    },
  ];

  const companyStats: StatItem[] = [
    {
      label: 'Total Hires',
      value: stats.totalHires ?? 0,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects ?? 0,
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      label: 'Saved Technicians',
      value: stats.savedTechnicians ?? 0,
      icon: Award,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    },
    {
      label: 'Total Spent',
      value: stats.totalSpent ? `$${stats.totalSpent.toLocaleString()}` : '$0',
      icon: DollarSign,
      color: 'text-lime-600 dark:text-lime-400',
      bgColor: 'bg-lime-50 dark:bg-lime-950/20',
    },
  ];

  const displayStats = userRole === 'technician' ? technicianStats : companyStats;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Quick Stats
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
            >
              <div className={`flex-shrink-0 p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-0.5">
                  {stat.label}
                </p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-0.5">
                      {stat.suffix}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
