import { useNavigate } from 'react-router-dom'
import { Dashboard } from '@/sections/dashboard-and-onboarding/components'
import type { ActivityItem } from '@/sections/dashboard-and-onboarding/components/RecentActivity'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import dashboardData from '@/sections/dashboard-and-onboarding/data.json'

export function DashboardPage() {
  const navigate = useNavigate()
  const [userRole] = useLocalStorage<'technician' | 'company'>('showcore_settings_role', 'technician')
  
  // Get user data from localStorage (this would normally come from auth context)
  const [userData] = useLocalStorage('showcore_user', {
    id: 'user_1',
    name: userRole === 'technician' ? 'Sarah' : 'David',
    email: userRole === 'technician' ? 'sarah@example.com' : 'david@example.com',
    role: userRole,
    avatarUrl: userRole === 'technician' 
      ? 'https://i.pravatar.cc/150?img=5' 
      : 'https://i.pravatar.cc/150?img=12'
  })

  // Select appropriate data based on user role
  const rawOnboardingProgress = userRole === 'technician' 
    ? dashboardData.technicianOnboardingProgress 
    : dashboardData.companyOnboardingProgress
    
  const stats = userRole === 'technician' 
    ? dashboardData.technicianStats 
    : dashboardData.companyStats
    
  const rawActivity = userRole === 'technician' 
    ? dashboardData.technicianActivity 
    : dashboardData.companyActivity

  // Transform onboarding progress to match expected interface
  const onboardingProgress = {
    ...rawOnboardingProgress,
    requiredTasks: rawOnboardingProgress.requiredTotal,
    tasks: rawOnboardingProgress.tasks.map(task => ({
      ...task,
      status: mapTaskStatus(task.status)
    }))
  }

  // Map task status from data to component expected values
  function mapTaskStatus(status: string): 'incomplete' | 'in_progress' | 'complete' {
    const statusMap: Record<string, 'incomplete' | 'in_progress' | 'complete'> = {
      'completed': 'complete',
      'in-progress': 'in_progress',
      'pending': 'incomplete',
      'skipped': 'incomplete'
    }
    return statusMap[status] || 'incomplete'
  }

  // Transform activity data to match expected ActivityItem interface
  const recentActivity: ActivityItem[] = rawActivity.map(activity => ({
    id: activity.id,
    type: mapActivityType(activity.type),
    title: activity.title,
    description: activity.description,
    timestamp: activity.timestamp,
    metadata: extractMetadata(activity)
  }))

  // Map activity types from data to component expected types
  function mapActivityType(type: string): ActivityItem['type'] {
    const typeMap: Record<string, ActivityItem['type']> = {
      'booking-confirmed': 'booking_scheduled',
      'booking-completed': 'booking_completed',
      'message-received': 'message_received',
      'review-received': 'review_received',
      'show-proof-approved': 'xp_earned',
      'xp-earned': 'xp_earned',
      'payment-received': 'milestone_reached',
      'application-received': 'technician_hired',
      'payment-sent': 'milestone_reached'
    }
    return typeMap[type] || 'profile_view'
  }

  // Extract metadata from activity
  function extractMetadata(activity: any) {
    const metadata: ActivityItem['metadata'] = {}
    
    if (activity.metadata?.rating) {
      metadata.rating = activity.metadata.rating
    }
    if (activity.metadata?.xpEarned) {
      metadata.xp = activity.metadata.xpEarned
    }
    if (activity.metadata?.amount) {
      metadata.amount = activity.metadata.amount
    }
    
    return Object.keys(metadata).length > 0 ? metadata : undefined
  }

  const handleTaskClick = (taskId: string) => {
    // Find the task to get its action URL
    const task = onboardingProgress.tasks.find(t => t.id === taskId)
    if (!task?.actionUrl) return

    // Handle specific navigation requirements based on task type
    if (task.title.toLowerCase().includes('complete') && task.title.toLowerCase().includes('profile')) {
      // complete-profile → navigate('/settings')
      navigate('/settings')
    } else if (task.title.toLowerCase().includes('verify') || task.title.toLowerCase().includes('insurance')) {
      // verify-id → navigate('/settings?section=security')
      navigate('/settings?section=security')
    } else if (task.title.toLowerCase().includes('payout') || task.actionUrl.includes('/payment')) {
      // add-payout → navigate('/settings?section=payment')
      navigate('/settings?section=payment')
    } else {
      // Default: use the task's actionUrl
      navigate(task.actionUrl)
    }
  }

  const handleActivityClick = (activity: ActivityItem) => {
    // For now, just navigate to a relevant page based on activity type
    switch (activity.type) {
      case 'booking_completed':
      case 'booking_scheduled':
        navigate('/bookings')
        break
      case 'message_received':
        navigate('/messages')
        break
      case 'review_received':
        navigate('/reviews')
        break
      case 'xp_earned':
        navigate('/show-proof')
        break
      default:
        navigate('/dashboard')
    }
  }

  const handleDismissOnboarding = () => {
    // This would normally update the backend, for now just log
    console.log('Onboarding dismissed')
  }

  return (
    <Dashboard
      user={userData}
      onboardingProgress={onboardingProgress}
      stats={stats}
      recentActivity={recentActivity}
      onTaskClick={handleTaskClick}
      onDismissOnboarding={handleDismissOnboarding}
      onActivityClick={handleActivityClick}
    />
  )
}
