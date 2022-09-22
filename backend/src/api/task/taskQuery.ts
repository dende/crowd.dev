import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import TaskService from '../../services/taskService'
import track from '../../segment/track'

// /**
//  * POST /tenant/{tenantId}/task
//  * @summary Create or update an task
//  * @tag Activities
//  * @security Bearer
//  * @description Create or update an task. Existence is checked by sourceId and tenantId.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {TaskUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Task} 200.application/json
//  * @responseExample {TaskUpsert} 200.application/json.Task
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.taskRead)

    const payload = await new TaskService(req).query(req.body)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Tasks Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}