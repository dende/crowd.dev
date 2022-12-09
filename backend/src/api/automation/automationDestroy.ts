import PermissionChecker from '../../services/user/permissionChecker'
import Permissions from '../../security/permissions'
import AutomationService from '../../services/automationService'
import track from '../../segment/track'
import identifyTenant from '../../segment/identifyTenant'
import { timeout } from '../../utils/timing'

/**
 * DELETE /tenant/{tenantId}/automation/{automationId}
 * @summary Destroy an automation
 * @tag Automations
 * @security Bearer
 * @description Destroys an existing automation in the tenant.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} automationId - Automation ID that you want to update
 * @response 204 - Ok - No content
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.automationDestroy)
  await new AutomationService(req).destroy(req.params.automationId)

  track('Automation Destroyed', { id: req.params.automationId }, { ...req })
  identifyTenant(req)

  // wait a small window for posthog
  // to process the queue message before returing back
  await timeout(100)

  await req.responseHandler.success(req, res, true, 204)
}
