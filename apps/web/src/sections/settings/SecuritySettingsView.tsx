import data from './data.json'
import { SecuritySettings } from './components'
import type { SecuritySettings as SecuritySettingsType } from './types'

export default function SecuritySettingsView() {
  return (
    <SecuritySettings
      securitySettings={data.securitySettings as SecuritySettingsType}
      onChangePassword={async (passwordData) => {
        console.log('Change password:', passwordData)
      }}
      onEnable2FA={async (method) => {
        console.log('Enable 2FA with method:', method)
      }}
      onDisable2FA={async () => {
        console.log('Disable 2FA')
      }}
      onRevokeSession={async (sessionId) => {
        console.log('Revoke session:', sessionId)
      }}
      isLoading={false}
      error={null}
    />
  )
}
