import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import OrganizationService from '../../services/organizationService'

// /**
//  * PUT /tenant/{tenantId}/organization/{id}
//  * @summary Update an organization
//  * @organization Organizations
//  * @security Bearer
//  * @description Update a organization given an ID.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @pathParam {string} id - The ID of the organization
//  * @bodyContent {OrganizationNoId} application/json
//  * @response 200 - Ok
//  * @responseContent {Organization} 200.application/json
//  * @responseExample {Organization} 200.application/json.Organization
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.organizationEdit)

    const payload = await new OrganizationService(req).update(req.params.id, req.body.data)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
