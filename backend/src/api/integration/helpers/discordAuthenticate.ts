import { DISCORD_CONFIG, API_CONFIG } from '../../../config/index'
import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res, _) => {
  try {
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
    params.set('scope', encodeURIComponent('bot guilds messages.read'))
    params.set('response_type', 'code')
    params.set('redirect_uri', encodeURIComponent(`${API_CONFIG.url}/discord/callback`))

    const query = [...params].map((e) => `${e[0]}=${e[1]}`).join('&')

    console.log(`https://discord.com/oauth2/authorize?${query}`)

    res.redirect(`https://discord.com/oauth2/authorize?${query}`)
  } catch (err) {
    req.log.error(err, 'Error while processing Discord OAuth2 authentication request!')
    let redirectUrl: string = req.query.redirectUrl
    if (!redirectUrl) {
      redirectUrl = API_CONFIG.frontendUrl
    } else if (redirectUrl.includes('?')) {
      redirectUrl = `${redirectUrl}&error=discordauth`
    } else {
      redirectUrl = `${redirectUrl}?error=discordauth`
    }

    res.redirect(redirectUrl)
  }
}
