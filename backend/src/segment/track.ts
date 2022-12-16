import { createServiceChildLogger } from '../utils/logging'
import { SEGMENT_CONFIG, API_CONFIG, IS_TEST_ENV } from '../config'
import getTenatUser from './trackHelper'
import { Edition } from '../types/common'

const log = createServiceChildLogger('segment')

export default function identify(
  event,
  properties,
  options: any,
  userId: any = false,
  timestamp: any = false,
) {
  log.info('Starting track', {event, isTestEnv: IS_TEST_ENV, segmentConfig: SEGMENT_CONFIG, apiConfig: API_CONFIG})
  if (
    !IS_TEST_ENV &&
    SEGMENT_CONFIG.writeKey &&
    // This is only for events in the hosted version. Self-hosted has less telemetry.
    API_CONFIG.edition === Edition.CROWD_HOSTED
  ) {
    log.info('In the IF', {event})
    const Analytics = require('analytics-node')
    const analytics = new Analytics(SEGMENT_CONFIG.writeKey)

    const { userIdOut, tenantIdOut } = getTenatUser(userId, options)

    const payload = {
      userId: userIdOut,
      event,
      properties,
      context: {
        groupId: tenantIdOut,
      },
      ...(timestamp && { timestamp }),
    }

    log.info('Payload', {payload})

    try {
      analytics.track(payload)
    } catch (error) {
      log.error(error, { payload }, 'ERROR: Could not send the following payload to Segment')
    }
  }
}
