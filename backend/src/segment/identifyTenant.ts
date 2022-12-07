import { SEGMENT_CONFIG, API_CONFIG } from '../config'
import setPosthogTenantProperties from '../feature-flags/setTenantProperties'

export default async function identifyTenant(req) {
  if (SEGMENT_CONFIG.writeKey) {
    const Analytics = require('analytics-node')
    const analytics = new Analytics(SEGMENT_CONFIG.writeKey)

    if (API_CONFIG.edition === 'crowd-hosted') {
      analytics.group({
        userId: req.currentUser.id,
        groupId: req.currentTenant.id,
        traits: {
          name: req.currentTenant.name,
        },
      })
    } else if (API_CONFIG.edition === 'community') {
      if (!req.currentUser.email.includes('crowd.dev')) {
        analytics.group({
          userId: req.currentUser.id,
          groupId: req.currentTenant.id,
          traits: {
            createdAt: req.currentTenant.createdAt,
          },
        })
      }
    }
  }

  setPosthogTenantProperties(req.currentTenant, req.posthog, req.database)
}
