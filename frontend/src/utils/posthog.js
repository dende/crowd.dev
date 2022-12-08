import posthog from 'posthog-js'
import config from '@/config'
import { store } from '@/store'

export const featureFlags = {
  eagleEye: 'eagle-eye',
  communityCenterPro: 'community-help-center-pro',
  organizations: 'organizations',
  automations: 'automations'
}

export const isFeatureEnabled = (flag) => {
  if (config.isCommunityVersion) {
    return true
  }

  posthog.reloadFeatureFlags()

  const tenant = store.getters['auth/currentTenant']

  posthog.group('tenant', tenant.id)

  try {
    return posthog.isFeatureEnabled(flag)
  } catch (e) {
    console.error(e)
    return false
  }
}
