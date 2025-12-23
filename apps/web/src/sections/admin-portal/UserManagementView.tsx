import data from './data.json'
import type { AdminPortalSampleData } from './types'
import { AdminLayout, UserManagement } from './components'

const typedData = data as unknown as AdminPortalSampleData

export default function UserManagementView() {
  const allUsers = [...typedData.sampleTechnicians, ...typedData.sampleCompanies]

  return (
    <AdminLayout
      currentAdmin={typedData.currentAdmin}
      navigation={typedData.adminNavigation}
      quickActions={typedData.quickActions}
      activeNavItem="users"
      alertCount={typedData.dashboardAlerts.filter((a: any) => a.actionRequired).length}
      onSearch={(query) => console.log('Search:', query)}
      onNavItemClick={(navId) => console.log('Navigate to:', navId)}
      onQuickAction={(actionId) => console.log('Quick action:', actionId)}
      onLogout={() => console.log('Logout')}
    >
      <UserManagement
        users={allUsers}
        filters={{}}
        onSearch={(query) => console.log('Search users:', query)}
        onFilter={(filters) => console.log('Filter users:', filters)}
        onViewUser={(userId) => console.log('View user:', userId)}
        onSuspendUser={async (userId, reason, duration) => console.log('Suspend user:', userId, reason, duration)}
        onUnsuspendUser={async (userId) => console.log('Unsuspend user:', userId)}
        onVerifyCredentials={async (userId) => console.log('Verify credentials:', userId)}
        onAddNote={async (userId, note, category) => console.log('Add note:', userId, note, category)}
      />
    </AdminLayout>
  )
}
