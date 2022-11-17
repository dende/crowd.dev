import { DISCORD_CONFIG, API_CONFIG, DISCORD_CONFIG } from '../../../config/index'
import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res, _next) => {
  new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

  const params = new Map<string, string>()

  params.set(
    'state',
    Buffer.from(
      JSON.stringify({
        tenantId: req.params.tenantId,
        redirectUrl: req.query.redirectUrl,
        crowdToken: req.query.crowdToken,
      }),
    ).toString('base64url'),
  )

  params.set('client_id', encodeURIComponent(DISCORD_CONFIG.clientId))
  params.set('scope', encodeURIComponent('bot,messages.read'))
  params.set('permissions', '10')
  params.set('response_type', 'code')
  params.set('redirect_uri', encodeURIComponent(`${API_CONFIG.url}/discord/callback`))

  const query = [...params].map((e) => `${e[0]}=${e[1]}`).join('&')

  res.redirect(`https://discord.com/oauth2/authorize?${query}`)
}
