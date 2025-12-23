import data from './data.json'
import type { AdminPortalSampleData } from './types'
import { AdminLayout, PlatformAnalytics } from './components'

const typedData = data as unknown as AdminPortalSampleData

export default function AnalyticsView() {
  return (
    <AdminLayout
      currentAdmin={typedData.currentAdmin}
      navigation={typedData.adminNavigation}
      quickActions={typedData.quickActions}
      activeNavItem="analytics"
      alertCount={typedData.dashboardAlerts.filter((a: any) => a.actionRequired).length}
      onSearch={(query) => console.log('Search:', query)}
      onNavItemClick={(navId) => console.log('Navigate to:', navId)}
      onQuickAction={(actionId) => console.log('Quick action:', actionId)}
      onLogout={() => console.log('Logout')}
    >
      <PlatformAnalytics
        analytics={typedData.platformAnalytics}
        dateRange={{ start: '2024-11-20', end: '2024-12-20' }}
        onChangeDateRange={(range) => console.log('Change date range:', range)}
        onExportData={(dataType) => console.log('Export data:', dataType)}
      />
    </AdminLayout>
  )
}
