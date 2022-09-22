import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import ActivityService from '../../services/activityService'
import track from '../../segment/track'

// /**
//  * POST /tenant/{tenantId}/activity
//  * @summary Create or update an activity
//  * @tag Activities
//  * @security Bearer
//  * @description Create or update an activity. Existence is checked by sourceId and tenantId.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {ActivityUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Activity} 200.application/json
//  * @responseExample {ActivityUpsert} 200.application/json.Activity
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.activityRead)

    const payload = await new ActivityService(req).query(req.body)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Activities Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}