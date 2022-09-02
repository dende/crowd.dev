import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import SettingsService from '../../services/settingsService'

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberAttributesDestroy)

    await SettingsService.removeMemberAttributes(req.query.names, req)

    const payload = true

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}