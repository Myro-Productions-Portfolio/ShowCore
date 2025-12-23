export interface WelcomeBannerProps {
  userName: string;
  avatarUrl?: string;
  progressPercent: number;
  isComplete: boolean;
}

export function WelcomeBanner({
  userName,
  avatarUrl,
  progressPercent,
  isComplete,
}: WelcomeBannerProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getProgressMessage = () => {
    if (isComplete) {
      return "You're all set up and ready to go!";
    }
    if (progressPercent >= 75) {
      return "Almost there! Just a few more steps.";
    }
    if (progressPercent >= 50) {
      return "You're making great progress!";
    }
    if (progressPercent >= 25) {
      return "Keep going! You're on the right track.";
    }
    return "Let's get your account set up.";
  };

  return (
    <div className="bg-gradient-to-br from-lime-500 via-lime-600 to-lime-700 dark:from-lime-600 dark:via-lime-700 dark:to-lime-800 rounded-xl p-6 sm:p-8 text-white shadow-lg">
      <div className="flex items-start gap-4">
        {avatarUrl && (
          <div className="flex-shrink-0">
            <img
              src={avatarUrl}
              alt={userName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white/30 object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {getGreeting()}, {userName}!
          </h1>
          <p className="text-lime-50 text-base sm:text-lg">
            {getProgressMessage()}
          </p>
          {!isComplete && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-lime-100">Account setup</span>
                <span className="font-semibold">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-lime-800/40 dark:bg-lime-900/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
