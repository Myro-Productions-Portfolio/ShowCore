import data from './data.json'
import type { AdminPortalSampleData } from './types'
import { AdminLayout, SystemHealth } from './components'

const typedData = data as unknown as AdminPortalSampleData

export default function SystemHealthView() {
  return (
    <AdminLayout
      currentAdmin={typedData.currentAdmin}
      navigation={typedData.adminNavigation}
      quickActions={typedData.quickActions}
      activeNavItem="system-health"
      alertCount={typedData.dashboardAlerts.filter((a: any) => a.actionRequired).length}
      onSearch={(query) => console.log('Search:', query)}
      onNavItemClick={(navId) => console.log('Navigate to:', navId)}
      onQuickAction={(actionId) => console.log('Quick action:', actionId)}
      onLogout={() => console.log('Logout')}
    >
      <SystemHealth
        systemHealth={typedData.systemHealth}
        alerts={typedData.systemAlerts}
        errorLogs={[]}
        performanceMetrics={typedData.performanceMetrics}
        integrations={typedData.integrations}
        onRefresh={() => console.log('Refresh system health')}
        onResolveAlert={async (alertId) => console.log('Resolve alert:', alertId)}
      />
    </AdminLayout>
  )
}
