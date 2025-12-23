import data from './data.json'
import type { AdminPortalSampleData } from './types'
import { AdminLayout, AdminDashboard } from './components'

const typedData = data as unknown as AdminPortalSampleData

export default function DashboardView() {
  return (
    <AdminLayout
      currentAdmin={typedData.currentAdmin}
      navigation={typedData.adminNavigation}
      quickActions={typedData.quickActions}
      activeNavItem="dashboard"
      alertCount={typedData.dashboardAlerts.filter((a: any) => a.actionRequired).length}
      onSearch={(query) => console.log('Search:', query)}
      onNavItemClick={(navId) => console.log('Navigate to:', navId)}
      onQuickAction={(actionId) => console.log('Quick action:', actionId)}
      onLogout={() => console.log('Logout')}
    >
      <AdminDashboard
        metrics={typedData.dashboardMetrics}
        alerts={typedData.dashboardAlerts}
        recentActivity={typedData.recentActivity}
        onDismissAlert={(alertId) => console.log('Dismiss alert:', alertId)}
        onViewAlert={(alert) => console.log('View alert:', alert)}
      />
    </AdminLayout>
  )
}
