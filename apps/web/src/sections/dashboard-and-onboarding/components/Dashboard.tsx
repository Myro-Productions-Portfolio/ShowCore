import { WelcomeBanner } from './WelcomeBanner';
import {
  OnboardingChecklist,
  type OnboardingChecklistProps,
} from './OnboardingChecklist';
import { QuickStats, type QuickStatsProps } from './QuickStats';
import { RecentActivity, type RecentActivityProps } from './RecentActivity';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'technician' | 'company';
  avatarUrl?: string;
}

export interface DashboardProps {
  user: User;
  onboardingProgress: OnboardingChecklistProps['progress'];
  stats: QuickStatsProps['stats'];
  recentActivity: RecentActivityProps['activities'];
  onTaskClick: (taskId: string) => void;
  onDismissOnboarding?: () => void;
  onActivityClick?: (activity: RecentActivityProps['activities'][0]) => void;
}

export function Dashboard({
  user,
  onboardingProgress,
  stats,
  recentActivity,
  onTaskClick,
  onDismissOnboarding,
  onActivityClick,
}: DashboardProps) {
  const progressPercent = Math.round(
    (onboardingProgress.completedTasks / onboardingProgress.totalTasks) * 100
  );
  const isOnboardingComplete =
    onboardingProgress.requiredCompleted >= onboardingProgress.requiredTasks;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome Banner */}
          <WelcomeBanner
            userName={user.name}
            avatarUrl={user.avatarUrl}
            progressPercent={progressPercent}
            isComplete={isOnboardingComplete}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Onboarding Checklist */}
              {!isOnboardingComplete && (
                <OnboardingChecklist
                  progress={onboardingProgress}
                  onTaskClick={onTaskClick}
                  onDismiss={onDismissOnboarding}
                />
              )}

              {/* Quick Stats */}
              <QuickStats stats={stats} userRole={user.role} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <RecentActivity
                activities={recentActivity}
                onActivityClick={onActivityClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
