import data from './data.json'
import type { AdminPortalSampleData } from './types'
import { AdminLayout, DisputeResolution } from './components'

const typedData = data as unknown as AdminPortalSampleData

export default function DisputeResolutionView() {
  return (
    <AdminLayout
      currentAdmin={typedData.currentAdmin}
      navigation={typedData.adminNavigation}
      quickActions={typedData.quickActions}
      activeNavItem="disputes"
      alertCount={typedData.dashboardAlerts.filter((a: any) => a.actionRequired).length}
      onSearch={(query) => console.log('Search:', query)}
      onNavItemClick={(navId) => console.log('Navigate to:', navId)}
      onQuickAction={(actionId) => console.log('Quick action:', actionId)}
      onLogout={() => console.log('Logout')}
    >
      <DisputeResolution
        disputes={typedData.sampleDisputes}
        onViewDispute={(disputeId) => console.log('View dispute:', disputeId)}
        onAssignToSelf={async (disputeId) => console.log('Assign to self:', disputeId)}
        onSendMessage={async (disputeId, message, isInternal) => console.log('Send message:', disputeId, message, isInternal)}
        onResolveDispute={async (disputeId, resolution) => console.log('Resolve dispute:', disputeId, resolution)}
        onEscalate={async (disputeId, reason) => console.log('Escalate dispute:', disputeId, reason)}
      />
    </AdminLayout>
  )
}
