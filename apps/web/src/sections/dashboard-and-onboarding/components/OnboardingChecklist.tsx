import { X } from 'lucide-react';
import { TaskCard, type OnboardingTask } from './TaskCard';

export interface OnboardingProgress {
  totalTasks: number;
  completedTasks: number;
  requiredTasks: number;
  requiredCompleted: number;
  tasks: OnboardingTask[];
}

export interface OnboardingChecklistProps {
  progress: OnboardingProgress;
  onTaskClick: (taskId: string) => void;
  onDismiss?: () => void;
}

export function OnboardingChecklist({
  progress,
  onTaskClick,
  onDismiss,
}: OnboardingChecklistProps) {
  const percentComplete = Math.round(
    (progress.completedTasks / progress.totalTasks) * 100
  );
  const requiredComplete = progress.requiredCompleted >= progress.requiredTasks;

  // Group tasks by category
  const tasksByCategory = progress.tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, OnboardingTask[]>);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            Getting Started
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Complete these steps to unlock all features
          </p>
        </div>
        {requiredComplete && onDismiss && (
          <button
            onClick={onDismiss}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Dismiss checklist"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {progress.completedTasks} of {progress.totalTasks} completed
          </span>
          <span className="font-semibold text-lime-600 dark:text-lime-400">
            {percentComplete}%
          </span>
        </div>
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-lime-500 to-lime-600 dark:from-lime-600 dark:to-lime-700 rounded-full transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Tasks by Category */}
      <div className="space-y-6">
        {Object.entries(tasksByCategory).map(([category, tasks]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={onTaskClick} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {requiredComplete && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            Great job! You've completed all required tasks.
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            You can now access all platform features.
          </p>
        </div>
      )}
    </div>
  );
}
