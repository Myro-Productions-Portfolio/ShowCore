import { Circle, CheckCircle2, Loader2, ChevronRight, Award } from 'lucide-react';

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  status: 'incomplete' | 'in_progress' | 'complete';
  xpReward?: number;
  category: string;
}

export interface TaskCardProps {
  task: OnboardingTask;
  onClick: (taskId: string) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-lime-600 dark:text-lime-400 animate-spin" />;
      case 'incomplete':
      default:
        return <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />;
    }
  };

  const isClickable = task.status !== 'complete';

  return (
    <button
      onClick={() => isClickable && onClick(task.id)}
      disabled={!isClickable}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        task.status === 'complete'
          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 opacity-75'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-lime-300 dark:hover:border-lime-700 hover:shadow-md'
      } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className={`font-semibold text-sm sm:text-base ${
                task.status === 'complete'
                  ? 'text-zinc-600 dark:text-zinc-400 line-through'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {task.title}
            </h3>
            {isClickable && (
              <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            )}
          </div>
          <p
            className={`text-xs sm:text-sm ${
              task.status === 'complete'
                ? 'text-zinc-500 dark:text-zinc-500'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {task.description}
          </p>
          {task.xpReward && task.status !== 'complete' && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded">
              <Award className="w-3 h-3" />
              +{task.xpReward} XP
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
