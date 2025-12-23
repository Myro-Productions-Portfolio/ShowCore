import { Dashboard } from './components';
import type {
  User,
  OnboardingProgress,
  DashboardStats,
  ActivityItem,
} from './components';

// Sample data for preview
const sampleUser: User = {
  id: 'user_1',
  name: 'Jordan Martinez',
  email: 'jordan@example.com',
  role: 'technician',
  avatarUrl: 'https://i.pravatar.cc/150?img=33',
};

const sampleOnboardingProgress: OnboardingProgress = {
  totalTasks: 10,
  completedTasks: 6,
  requiredTasks: 6,
  requiredCompleted: 4,
  tasks: [
    {
      id: 'task_1',
      title: 'Complete Your Profile',
      description: 'Add your photo, bio, and contact information',
      status: 'complete',
      category: 'Profile Setup',
      xpReward: 50,
    },
    {
      id: 'task_2',
      title: 'Add Your Skills',
      description: 'List your technical skills and specializations',
      status: 'complete',
      category: 'Profile Setup',
      xpReward: 50,
    },
    {
      id: 'task_3',
      title: 'Upload Certifications',
      description: 'Upload your professional certifications and credentials',
      status: 'in_progress',
      category: 'Profile Setup',
      xpReward: 100,
    },
    {
      id: 'task_4',
      title: 'Verify Your Email',
      description: 'Click the link in your email to verify your account',
      status: 'complete',
      category: 'Account Verification',
      xpReward: 25,
    },
    {
      id: 'task_5',
      title: 'Verify Your Phone',
      description: 'Enter the code sent to your phone number',
      status: 'complete',
      category: 'Account Verification',
      xpReward: 25,
    },
    {
      id: 'task_6',
      title: 'Complete Background Check',
      description: 'Submit required documents for background verification',
      status: 'incomplete',
      category: 'Account Verification',
      xpReward: 150,
    },
    {
      id: 'task_7',
      title: 'Set Your Availability',
      description: "Let clients know when you're available for work",
      status: 'complete',
      category: 'Getting Started',
      xpReward: 30,
    },
    {
      id: 'task_8',
      title: 'Add Portfolio Work',
      description: 'Showcase your previous projects and experiences',
      status: 'complete',
      category: 'Getting Started',
      xpReward: 75,
    },
    {
      id: 'task_9',
      title: 'Connect Your Calendar',
      description: 'Sync your calendar to manage bookings automatically',
      status: 'incomplete',
      category: 'Getting Started',
      xpReward: 50,
    },
    {
      id: 'task_10',
      title: 'Complete Your First Booking',
      description: 'Accept and complete your first job on the platform',
      status: 'incomplete',
      category: 'Getting Started',
      xpReward: 200,
    },
  ],
};

const sampleStats: DashboardStats = {
  totalBookings: 12,
  completedBookings: 10,
  averageRating: 4.8,
  totalEarnings: 8450,
};

const sampleActivity: ActivityItem[] = [
  {
    id: 'activity_1',
    type: 'booking_completed',
    title: 'Booking Completed',
    description: 'Corporate Conference - Downtown Convention Center',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    metadata: {
      amount: 1200,
    },
  },
  {
    id: 'activity_2',
    type: 'review_received',
    title: 'New Review Received',
    description: 'Sarah Johnson left you a 5-star review',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    metadata: {
      rating: 5,
    },
  },
  {
    id: 'activity_3',
    type: 'xp_earned',
    title: 'XP Earned',
    description: 'Completed "Upload Certifications" task',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    metadata: {
      xp: 100,
    },
  },
  {
    id: 'activity_4',
    type: 'booking_scheduled',
    title: 'New Booking Scheduled',
    description: 'Music Festival - Main Stage Setup',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    metadata: {
      amount: 2500,
    },
  },
  {
    id: 'activity_5',
    type: 'message_received',
    title: 'New Message',
    description: 'Tech Pro Events sent you a message about an upcoming gig',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 'activity_6',
    type: 'profile_view',
    title: 'Profile Viewed',
    description: 'Your profile was viewed by Summit Productions',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
  },
  {
    id: 'activity_7',
    type: 'milestone_reached',
    title: 'Milestone Reached',
    description: 'You completed your 10th booking!',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    metadata: {
      xp: 250,
    },
  },
];

export default function DashboardView() {
  const handleTaskClick = (taskId: string) => {
    console.log('Task clicked:', taskId);
    // In real implementation, this would navigate to the task completion page
  };

  const handleDismissOnboarding = () => {
    console.log('Onboarding dismissed');
    // In real implementation, this would hide the onboarding checklist
  };

  const handleActivityClick = (activity: ActivityItem) => {
    console.log('Activity clicked:', activity);
    // In real implementation, this would navigate to the activity detail
  };

  return (
    <Dashboard
      user={sampleUser}
      onboardingProgress={sampleOnboardingProgress}
      stats={sampleStats}
      recentActivity={sampleActivity}
      onTaskClick={handleTaskClick}
      onDismissOnboarding={handleDismissOnboarding}
      onActivityClick={handleActivityClick}
    />
  );
}
