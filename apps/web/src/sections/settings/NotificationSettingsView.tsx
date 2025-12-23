import data from './data.json'
import { NotificationSettings } from './components'

export default function NotificationSettingsView() {
  return (
    <NotificationSettings
      preferences={data.notificationPreferences}
      onUpdatePreferences={async (preferences) => {
        console.log('Update notification preferences:', preferences)
      }}
      isLoading={false}
      error={null}
    />
  )
}
