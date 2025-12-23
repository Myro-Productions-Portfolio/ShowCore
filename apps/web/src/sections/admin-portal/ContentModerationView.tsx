import data from './data.json'
import type { AdminPortalSampleData } from './types'
import { AdminLayout, ContentModeration } from './components'

const typedData = data as unknown as AdminPortalSampleData

export default function ContentModerationView() {
  return (
    <AdminLayout
      currentAdmin={typedData.currentAdmin}
      navigation={typedData.adminNavigation}
      quickActions={typedData.quickActions}
      activeNavItem="moderation"
      alertCount={typedData.dashboardAlerts.filter((a: any) => a.actionRequired).length}
      onSearch={(query) => console.log('Search:', query)}
      onNavItemClick={(navId) => console.log('Navigate to:', navId)}
      onQuickAction={(actionId) => console.log('Quick action:', actionId)}
      onLogout={() => console.log('Logout')}
    >
      <ContentModeration
        flaggedContent={typedData.flaggedContent}
        onReview={async (contentId, action, notes) => console.log('Review content:', contentId, action, notes)}
        onDismiss={async (contentId, reason) => console.log('Dismiss content:', contentId, reason)}
      />
    </AdminLayout>
  )
}
